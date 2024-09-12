const fetch = require('node-fetch');
const fs = require("fs");
const configJS = require('../config.js');

const config = JSON.parse(fs.readFileSync('config/stacktrace_config.json', 'utf8'));

const enabled = config["enabled"] ?? true;
const logFiles = config["file-logging"] ?? false;

const includeTokenCounts = config["show-tokens"] ?? false;

// stack trace analysis
const devSupportChannel = config["developer-channels"];  // add the dev support channel ID here to let the LLM know when its a dev request

const { getGPTInstance, BASE_PROMPT } = require('./openai_llm.js');
const { extractTextFromImage } = require('./ocr.js');
const API = require('../api.js');
const { EmbedBuilder, MessageAttachment, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, PermissionsBitField } = require('discord.js');

// regex for detecting stack traces and image urls (with resources) in messages and screenshots
const imageUrlRegex = /(https?:\/\/[^\s]+(?:\.(?:jpg|jpeg|png))(?:\?[^\s]*)?)/i;

const stackTraceRegex = /([\t\r!\-\s]*[0-9A-Za-z\s:./\[\]]+\]\:?)?\s([\w\d]+\sissued\sserver\scommand:|null|Could\snot\spass\sevent|Could\snot\sload|Error\soccurred\swhile\senabling|Task\s[#\d]+\sfor|[\w\d.]+[\w\d]:\s[!|]+)?(Caused\sby:)?[\w\d\s-.()?>'/]*((?:\[[0-9A-Za-z\s:./]+\]:)?\s?([\w\d.]+[\w\d]+:[^|]+)?)?(([\t\r!\-\s]*[0-9A-Za-z\s:./\[\]]+ ?\]\:?)?\s?([\t\s]*at\s[\w\d\s\t.()$/\[\]~:?\-<>]+\s?))+/

async function checkForStackTrace(message, sender, channel, msgobj) {
    if (!enabled) return false;

    // check if the message contains a link to a screenshot of a stacktrace
    const imageUrlMatch = message.match(imageUrlRegex);

    if (imageUrlMatch) {
        console.log('Image url detected in message:', message);
        const imageUrl = imageUrlMatch[0];

        message = message.replace(imageUrl, '');

        try {
            const extractedText = await extractTextFromImage(imageUrl);
            console.log('Extracted text from image:', extractedText);

            if (stackTraceRegex.test(extractedText)) {
                console.log('Detected stack trace in image text');
                await handleStackTrace([message, extractedText].join('\n\n'), sender, channel, msgobj);
                return true;
            }
        } catch (error) {
            console.error('Failed to extract text from image URL:', error);
            return true;
        }
    }

    // check attachments for stack traces
    if (msgobj.attachments.size > 0) {
        const attachment = msgobj.attachments.first();
        const fileUrl = attachment.url;

        console.log(`Found attachment:\n${fileUrl}`);

        try {
            const response = await fetch(fileUrl);
            const contentType = response.headers.get('content-type');
            const fileBuffer = await response.buffer();

            console.log("Got filetype from header: ", contentType);

            // read txt files
            if (contentType.includes('text/plain')) {
                console.log("Text File");

                const fileContent = fileBuffer.toString('utf-8');

                console.log(fileContent)

                if (stackTraceRegex.test(fileContent)) {
                    console.log("Detected Stack Trace");
                    await handleStackTrace([message, fileContent].join('\n\n'), sender, channel, msgobj);
                    return true;
                }
            }

            // read image files via OCR
            if (contentType.includes('image')) {
                console.log("Image");

                const extractedText = await extractTextFromImage(fileUrl);

                console.log(extractedText);

                if (stackTraceRegex.test(extractedText)) {
                    console.log("Detected Stack Trace")
                    await handleStackTrace([message, extractedText].join('\n\n'), sender, channel, msgobj);
                    return true;
                }
            }
        } catch (error) {
            console.error('Failed to process attachment:', error);
            // await msgobj.reply("Failed to process the attachment. Please check the console.");
        }
    }

    // check the message itself for a possible stack trace, if none, continue with normal behavior
    if (stackTraceRegex.test(message)) {
        await handleStackTrace(message, sender, channel, msgobj);
        return true;
    }

    return false;
}

async function handleStackTrace(message, sender, channel, msgobj) {
    try {
        const openAIClient = getGPTInstance();

        // count base prompt tokens
        const baseTokens = await openAIClient.countTokens(BASE_PROMPT);
        console.log("Base Prompt Tokens:", baseTokens)

        // log user message before regex
        console.log("Message:", message);

        const groups = message.match(stackTraceRegex);

        // log matches for debugging
        console.log("Matches:", groups);

        if (groups.length <= 0) {
            console.log("No matches found.");
            return;
        }

        // join groups to create the user Prompt
        let prompt = groups.join('\n');

        // append this statement when the channel is the dev-support channel
        if (devSupportChannel.indexOf(msgobj.channel.id) !== -1) {
            prompt = "**A developer is making this request.**\n" + prompt
        }

        // log the final user Prompt
        console.log(prompt);

        // count user Prompt tokens
        const tokens = await openAIClient.countTokens(prompt);
        console.log("Prompt Tokens:", tokens)

        // safety net of 3500 tokens, or ~2625 words/symbols
        if (tokens >= 3500) {
            const embed = new EmbedBuilder()
                .setTitle("Stack Trace Analyzer")
                .setDescription("I detected a stack trace in your message but it is too long for me to process.\nPlease find and paste the exact stack trace you would like me to analyze for you.")

            await msgobj.reply({
                embeds: [embed]
            });
            return;
        }

        // send prompt to open AI, the user Prompt will be appended to the base prompt
        const { model, response } = await openAIClient.analyzeStackTrace(prompt);

        // count response tokens
        const responseTokens = await openAIClient.countTokens(response);
        console.log("Response Tokens:", responseTokens)

        // send the results
        await sendStackTraceResponse(msgobj, response, tokens, responseTokens, baseTokens);
    } catch (error) {
        console.error("Error handling stack trace:", error);
        // await msgobj.reply("An error occurred while processing the stack trace. Please check the console.");
    }
}

async function sendStackTraceResponse(message, analysisResult, tokens, responseTokens, baseTokens) {
    const yesButton = new ButtonBuilder()
        .setCustomId('yes')
        .setLabel('Ok!')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✅');

    const noButton = new ButtonBuilder()
        .setCustomId('no')
        .setLabel('Doesn\'t Help')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❌');

    const actionRow = new ActionRowBuilder()
        .addComponents(yesButton, noButton);

    const embed = new EmbedBuilder()
        .setTitle("Stack Trace Analyzer")
        .setDescription(analysisResult || "I was unable to automatically analyze your stack trace. Somebody will assist you as soon as possible.")
        .setFooter({ text: `This was generated by AI and may not always be accurate.` });

    if (includeTokenCounts) {
        embed.addFields(
            { name: 'Base Prompt Tokens', value: baseTokens.toString() },
            { name: 'Prompt Tokens', value: tokens.toString() },
            { name: 'Response Tokens', value: responseTokens.toString() },
        );
    }

    const replyMessage = await message.reply({
        embeds: [embed],
        components: [actionRow],
    });

    const filter = (interaction) => {
        const memberRoles = interaction.member.roles.cache;
        if (interaction.user.id === message.author.id) {
            return true;
        }
        const staffRoles = configJS.getRoles('staff');
        return memberRoles.some(role => staffRoles.includes(role.id));
    };

    const collector = replyMessage.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 60 * 24, // 24 hours
    });

    collector.on('collect', async (interaction) => {
        if (interaction.customId === 'yes' || interaction.customId === 'no') {
            const userAccepted = interaction.customId === 'yes';

            const memberRoles = interaction.member.roles.cache;
            const staffRoles = configJS.getRoles('staff');
            const isStaff = memberRoles.some(role => staffRoles.includes(role.id));

            const responseEmbed = new EmbedBuilder()
                .setTitle("Stack Trace Analyzer")
                .setDescription(analysisResult || "I was unable to automatically analyze your stack trace. Somebody will assist you as soon as possible.")
                if (includeTokenCounts) {
                    responseEmbed.addFields(
                        { name: 'Base Prompt Tokens', value: baseTokens.toString() },
                        { name: 'Prompt Tokens', value: tokens.toString() },
                        { name: 'Response Tokens', value: responseTokens.toString() },
                    );
                }

            if (userAccepted) {
                if (isStaff) {
                    // keeps the buttons for the user to still use if staff responds first
                    responseEmbed.setFooter({ text: `A staff member accepted this response. ✅` });
                    await interaction.update({ embeds: [responseEmbed], components: [actionRow] });
                } else {
                    // removes buttons
                    responseEmbed.setFooter({ text: `The member accepted this response. ✅` });
                    await interaction.update({ embeds: [responseEmbed], components: [] });
                }
            } else {
                if (isStaff) {
                    responseEmbed.setFooter({ text: `A staff member marked this response as not helpful. ❌` });
                    await interaction.update({ embeds: [responseEmbed], components: [actionRow] });
                } else {
                    responseEmbed.setFooter({ text: `The member marked this response as not helpful. ❌` });
                    await interaction.update({ embeds: [responseEmbed], components: [] });
                }
            }
        }
    });

    // after 24 hours, remove the buttons.
    collector.on('end', async () => {
        if (!collector.ended) {
            const responseEmbed = new EmbedBuilder()
                .setTitle("Stack Trace Analyzer")
                .setDescription(analysisResult || "I was unable to automatically analyze your stack trace. Somebody will assist you as soon as possible.")
                .setFooter({ text: `This was generated by AI and may not always be accurate.` });

                if (includeTokenCounts) {
                    responseEmbed.addFields(
                        { name: 'Base Prompt Tokens', value: baseTokens.toString() },
                        { name: 'Prompt Tokens', value: tokens.toString() },
                        { name: 'Response Tokens', value: responseTokens.toString() },
                    );
                }
            await replyMessage.edit({ embeds: [responseEmbed], components: [] });
        }
    });
}

module.exports = {
    checkForStackTrace,
    logFiles
}

if (enabled) console.log("Enabled Stack Trace Analyzer");
else console.log("Stack Trace Analyzer not active");

API.subscribe("reload", () => {
    config = JSON.parse(fs.readFileSync('../../config/stacktrace_config.json', 'utf8'));
});

