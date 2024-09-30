Hooks.once('ready', async () => {
    game.settings.register("reava", "enabled", {
        name: "Turn on Reactive Avatars?",
        hint: "Enabling this allows you to use your custom reactive avatar.",
        scope: "client",
        config: true,
        default: false,
        type: Boolean
    })

    game.settings.register("reava", "avatarImages", {
        scope: "client",
        config: false,
        default: {
            active: game.user.avatar,
            inactive: game.user.avatar,
            muted: game.user.avatar,
            deafened: game.user.avatar
        },
        render: false,
        type: Object
    })

    game.settings.registerMenu("reava", "avatarImages", {
        name: "Reactive Avatar Image Files",
        label: "Configure Reactive Avatars",
        hint: "Change your speaking, silent, deafened and muted avatars.",
        icon: "fa-solid fa-user",
        scope: "client",
        config: true,
        default: false,
        type: ReavaConfig
    })
})

Hooks.once('ready', async () => {
    const onToggleBroadcast = function(broadcast) {
        game.webrtc.client._toggleBroadcast(broadcast); //the original onChange function
        Hooks.callAll('toggleBroadcast', broadcast);
    };
    game.webrtc.client._toggleBroadcast = game.webrtc.client.toggleBroadcast
    game.webrtc.client.toggleBroadcast = onToggleBroadcast
})

function isMuted(avSettings) {
    return avSettings.client.users[game.userId].muted
}

function isDeafened(avSettings) {
    return avSettings.client.muteAll
}

Hooks.on('toggleBroadcast', (broadcast) => {
    if (!game.settings.get('reava', 'enabled')) { return }
    const avSettings = game.webrtc.client.settings
    if (isDeafened(avSettings) || isMuted(avSettings)) { return }
    if (broadcast) {
        game.user.update({avatar: game.settings.get('reava', 'avatarImages').active})
    } else {
        game.user.update({avatar: game.settings.get('reava', 'avatarImages').inactive})
    }
})

Hooks.on('rtcSettingsChanged', (avSettings, diff) => {
    if (!game.settings.get('reava', 'enabled')) { return }
    if (isDeafened(avSettings)) {
        game.user.update({avatar: game.settings.get('reava', 'avatarImages').deafened})
        return
    }
    if (isMuted(avSettings)) {
        game.user.update({avatar: game.settings.get('reava', 'avatarImages').muted})
        return
    }
    game.user.update({avatar: game.settings.get('reava', 'avatarImages').inactive})
})



class ReavaConfig extends FormApplication {
    constructor(object={}, options={}) {
        object = foundry.utils.mergeObject(game.settings.get("reava", "avatarImages"), object, {inplace: false});
        super(object, options);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
          popOut: true,
          width: 600,
          template: "modules/reava/templates/reava-config.hbs",
          id: 'reava-config',
          title: 'Configure Reactive Avatars',
          closeOnSubmit: false,
          submitOnClose: true,
          submitOnChange: false,
        });
    }

    getData() {
        // Send data to the template
        return {
            active: this.object.active,
            inactive: this.object.inactive,
            muted: this.object.muted,
            deafened: this.object.deafened
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
    
    async _updateObject(event, formData) {
        game.settings.set("reava", "avatarImages", {
            active: formData.active,
            inactive: formData.inactive,
            muted: formData.muted,
            deafened: formData.deafened
        })
        if (!game.settings.get('reava', 'enabled')) { return }
        game.user.update({avatar: formData.inactive})
        console.log(formData);
    }
}