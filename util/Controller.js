const {
	MessageEmbed,
	MessageActionRow,
	MessageButton,
  } = require("discord.js");
const load = require("lodash");
const pms = require("pretty-ms");

/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 * @param {import("discord.js").ButtonInteraction} interaction
 */
module.exports = async (client, interaction) => {
	let guild = client.guilds.cache.get(interaction.customId.split(":")[1]);
	let property = interaction.customId.split(":")[2];
	let player = client.manager.get(guild.id);

	if (!player) {
		await interaction.reply({
			embeds: [
				client.Embed("❌ | **There is no player to control in this server.**"),
			],
		});
		setTimeout(() => {
			interaction.deleteReply();
		}, 5000);
		return;
	}
	if (!interaction.member.voice.channel) {
		const joinEmbed = new MessageEmbed()
			.setColor(client.config.embedColor)
			.setDescription(
				"❌ | **You must be in a voice channel to use this action!**",
			);
		return interaction.reply({ embeds: [joinEmbed], ephemeral: true });
	}

	if (
		interaction.guild.me.voice.channel &&
		!interaction.guild.me.voice.channel.equals(interaction.member.voice.channel)
	) {
		const sameEmbed = new MessageEmbed()
			.setColor(client.config.embedColor)
			.setDescription(
				"❌ | **You must be in the same voice channel as me to use this action!**",
			);
		return await interaction.reply({ embeds: [sameEmbed], ephemeral: true });
	}

	if (property === "Queue") {
		if (!player.queue.size || player.queue.size === 0) {
			let song = player.queue.current;
			const queueEmbed = new MessageEmbed()
				.setColor(client.config.embedColor)
				.setDescription(`**♪ | Now playing:** [${ song.title }](${ song.uri })`)
				.addFields(
					{
						name: "Duration",
						value: song.isStream
							? `\`LIVE\``
							: `\`${ pms(player.position, { colonNotation: true }) } / ${ pms(
								player.queue.current.duration,
								{ colonNotation: true },
							) }\``,
						inline: true,
					},
					{
						name: "Volume",
						value: `\`${ player.volume }\``,
						inline: true,
					},
					{
						name: "Total Tracks",
						value: `\`${ player.queue.totalSize - 1 }\``,
						colonNotation: true,
						inline: true,
					},
				);
			await interaction.reply({
				embeds: [queueEmbed],
				ephemeral: true
			});
		} else {
			let queueDuration = player.queue.duration.valueOf()
			if (player.queue.current.isStream) {
				queueDuration -= player.queue.current.duration
			}
			for (let i = 0; i < player.queue.length; i++) {
				if (player.queue[i].isStream) {
					queueDuration -= player.queue[i].duration
				}
			}
			
			const mapping = player.queue.map(
				(t, i) => `\` ${ ++i } \` [${ t.title }](${ t.uri }) [${ t.requester }]`,
			);
			
			const chunk = load.chunk(mapping, 10);
			const pages = chunk.map((s) => s.join("\n"));
			let page = 0;

			if (player.queue.size < 11 || player.queue.totalSize < 11) {
				let song = player.queue.current;
				const embedTwo = new MessageEmbed()
					.setColor(client.config.embedColor)
					.setDescription(
						`**♪ | Now playing:** [${ song.title }](${ song.uri }) [${ player.queue.current.requester }]\n\n**Queued Tracks**\n${ pages[page] }`,
					)
					.addFields(
						{
							name: "Track Duration",
							value: song.isStream
								? `\`LIVE\``
								: `\`${ pms(player.position, { colonNotation: true }) } / ${ pms(
									player.queue.current.duration,
									{ colonNotation: true },
								) }\``,
							inline: true,
						},
						{
							name: "Total Tracks Duration",
							value: `\`${ pms(queueDuration, {
								colonNotation: true,
							}) }\``,
							inline: true,
						},
						{
							name: "Total Tracks",
							value: `\`${ player.queue.totalSize - 1 }\``,
							colonNotation: true,
							inline: true,
						},
					)
					.setFooter({
						text: `Page ${ page + 1 }/${ pages.length }`,
					});
				await interaction
					.reply({
						embeds: [embedTwo],
						ephemeral: true
					})
					.catch(() => {
					});
			} else {
				let song = player.queue.current;
				const embedThree = new MessageEmbed()
					.setColor(client.config.embedColor)
					.setDescription(
						`**♪ | Now playing:** [${ song.title }](${ song.uri }) [${ player.queue.current.requester }]\n\n**Queued Tracks**\n${ pages[page] }`,
					)
					.addFields(
						{
							name: "Track Duration",
							value: song.isStream
								? `\`LIVE\``
								: `\`${ pms(player.position, { colonNotation: true }) } / ${ pms(
									player.queue.current.duration,
									{ colonNotation: true },
								) }\``,
							inline: true,
						},
						{
							name: "Total Tracks Duration",
							value: `\`${ pms(queueDuration, {
								colonNotation: true,
							}) }\``,
							inline: true,
						},
						{
							name: "Total Tracks",
							value: `\`${ player.queue.totalSize - 1 }\``,
							colonNotation: true,
							inline: true,
						},
					)
					.setFooter({
						text: `Page ${ page + 1 }/${ pages.length }`,
					});
				
				const buttonOne = new MessageButton()
					.setCustomId("queue_cmd_but_1_app")
					.setEmoji("⏭️")
					.setStyle("PRIMARY");
				const buttonTwo = new MessageButton()
					.setCustomId("queue_cmd_but_2_app")
					.setEmoji("⏮️")
					.setStyle("PRIMARY");
				
				await interaction
					.reply({
						embeds: [embedThree],
						components: [
							new MessageActionRow().addComponents([buttonTwo, buttonOne]),
						],
						ephemeral: true
					})
					.catch(() => {
					});
				
				const collector = interaction.channel.createMessageComponentCollector({
					filter: (b) => {
						if (b.user.id === interaction.user.id) {
							return true;
						} else {
							return b
								.reply({
									content: `Only **${ interaction.user.tag }** can use this button.`,
									ephemeral: true,
								})
								.catch(() => {
								});
						}
					},
					time: 60000 * 5,
					idle: 30e3,
				});
				
				collector.on("collect", async (button) => {
					if (button.customId === "queue_cmd_but_1_app") {
						await button.deferUpdate().catch(() => {
						});
						page = page + 1 < pages.length? ++page : 0;
						
						const embedFour = new MessageEmbed()
							.setColor(client.config.embedColor)
							.setDescription(
								`**♪ | Now playing:** [${ song.title }](${ song.uri }) [${ player.queue.current.requester }]\n\n**Queued Tracks**\n${ pages[page] }`,
							)
							.addFields(
								{
									name: "Track Duration",
									value: song.isStream
										? `\`LIVE\``
										: `\`${ pms(player.position, { colonNotation: true }) } / ${ pms(
											player.queue.current.duration,
											{ colonNotation: true },
										) }\``,
									inline: true,
								},
								{
									name: "Total Tracks Duration",
									value: `\`${ pms(queueDuration, {
										colonNotation: true,
									}) }\``,
									inline: true,
								},
								{
									name: "Total Tracks",
									value: `\`${ player.queue.totalSize - 1 }\``,
									colonNotation: true,
									inline: true,
								},
							)
							.setFooter({
								text: `Page ${ page + 1 }/${ pages.length }`,
							});
						
						await interaction.editReply({
							embeds: [embedFour],
							components: [
								new MessageActionRow().addComponents([buttonTwo, buttonOne]),
							],
							ephemeral: true
						});
					} else if (button.customId === "queue_cmd_but_2_app") {
						await button.deferUpdate().catch(() => {
						});
						page = page > 0? --page : pages.length - 1;
						
						const embedFive = new MessageEmbed()
							.setColor(client.config.embedColor)
							.setDescription(
								`**♪ | Now playing:** [${ song.title }](${ song.uri }) [${ player.queue.current.requester }]\n\n**Queued Tracks**\n${ pages[page] }`,
							)
							.addFields(
								{
									name: "Track Duration",
									value: song.isStream
										? `\`LIVE\``
										: `\`${ pms(player.position, { colonNotation: true }) } / ${ pms(
											player.queue.current.duration,
											{ colonNotation: true },
										) }\``,
									inline: true,
								},
								{
									name: "Total Tracks Duration",
									value: `\`${ pms(queueDuration, {
										colonNotation: true,
									}) }\``,
									inline: true,
								},
								{
									name: "Total Tracks",
									value: `\`${ player.queue.totalSize - 1 }\``,
									colonNotation: true,
									inline: true,
								},
							)
							.setFooter({
								text: `Page ${ page + 1 }/${ pages.length }`,
							});
						
						await interaction
							.editReply({
								embeds: [embedFive],
								components: [
									new MessageActionRow().addComponents([buttonTwo, buttonOne]),
								],
								ephemeral: true
							})
							.catch(() => {
							});
					} else {
						return;
					}
				});
			}
		}
		return;
	}

	if (property === "Stop") {
		player.queue.clear();
		player.stop();
		player.set("autoQueue", false);
		client.warn(`Player: ${ player.options.guild } | Successfully stopped the player`);
		const msg = await interaction.channel.send({
			embeds: [
				client.Embed(
					"⏹️ | **Successfully stopped the player**",
				),
			],
		});
		setTimeout(() => {
			msg.delete();
		}, 5000);

		interaction.update({
			components: [client.createController(player.options.guild, player), client.createQueueController(player.options.guild)],
		});
		return;
	}

	// if theres no previous song, return an error.
	if (property === "Replay") {
		const previousSong = player.queue.previous;
		const currentSong = player.queue.current;
		const nextSong = player.queue[0]
        if (!player.queue.previous ||
            player.queue.previous === player.queue.current ||
            player.queue.previous === player.queue[0]) {
            
           return interaction.reply({
                        ephemeral: true,
			embeds: [
				new MessageEmbed()
					.setColor("RED")
					.setDescription(`There is no previous song played.`),
			],
		});
    }
		if (previousSong !== currentSong && previousSong !== nextSong) {
			player.queue.splice(0, 0, currentSong)
			player.play(previousSong);
			return interaction.deferUpdate();
		}
	}

	if (property === "PlayAndPause") {
		if (!player || (!player.playing && player.queue.totalSize === 0)) {
			const msg = await interaction.channel.send({
                               ephemeral: true,
				embeds: [
					new MessageEmbed()
						.setColor("RED")
						.setDescription("There is no song playing right now."),
				],
			});
			setTimeout(() => {
				msg.delete();
			}, 5000);
			return interaction.deferUpdate();
		} else {

			if (player.paused) {
				player.pause(false);
			} else {
				player.pause(true);
			}
			client.warn(`Player: ${ player.options.guild } | Successfully ${ player.paused? "paused" : "resumed" } the player`);

			return interaction.update({
				components: [client.createController(player.options.guild, player), client.createQueueController(player.options.guild)],
			});
		}
	}

	if (property === "Next") {
                const song = player.queue.current;
	        const autoQueue = player.get("autoQueue");
                if (player.queue[0] == undefined && (!autoQueue || autoQueue === false)) {
		return interaction.reply({
                        ephemeral: true,
			embeds: [
				new MessageEmbed()
					.setColor("RED")
					.setDescription(`There is nothing after [${ song.title }](${ song.uri }) in the queue.`),
			],
		})} else player.stop();
		return interaction.deferUpdate
    }

	if (property === "Loop") {
		if (player.trackRepeat) {
			player.setTrackRepeat(false);
			player.setQueueRepeat(true);
		} else if (player.queueRepeat) {
			player.setQueueRepeat(false);
		} else {
			player.setTrackRepeat(true);
		}
		client.warn(`Player: ${player.options.guild} | Successfully toggled loop ${player.trackRepeat ? "on" : player.queueRepeat ? "queue on" : "off"} the player`);

		interaction.update({
			components: [client.createController(player.options.guild, player), client.createQueueController(player.options.guild)],
		});
		return;
	}

	return interaction.reply({
		ephemeral: true,
		content: "❌ | **Unknown controller option**",
	});
};
