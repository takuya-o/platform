// Copyright (c) 2015 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import $ from 'jquery';
import SettingItemMin from 'components/setting_item_min.jsx';
import SettingItemMax from 'components/setting_item_max.jsx';

import UserStore from 'stores/user_store.jsx';

import Client from 'client/web_client.jsx';
import * as AsyncClient from 'utils/async_client.jsx';
import * as Utils from 'utils/utils.jsx';

import EmailNotificationSetting from './email_notification_setting.jsx';
import {FormattedMessage} from 'react-intl';

function getNotificationsStateFromStores() {
    var user = UserStore.getCurrentUser();
    var soundNeeded = !Utils.isBrowserFirefox();

    var sound = 'true';
    if (user.notify_props && user.notify_props.desktop_sound) {
        sound = user.notify_props.desktop_sound;
    }
    var desktop = 'default';
    if (user.notify_props && user.notify_props.desktop) {
        desktop = user.notify_props.desktop;
    }
    var comments = 'never';
    if (user.notify_props && user.notify_props.comments) {
        comments = user.notify_props.comments;
    }
    var enableEmail = 'true';
    if (user.notify_props && user.notify_props.email) {
        enableEmail = user.notify_props.email;
    }
    var push = 'mention';
    if (user.notify_props && user.notify_props.push) {
        push = user.notify_props.push;
    }

    var usernameKey = false;
    var mentionKey = false;
    var customKeys = '';
    var firstNameKey = false;
    var channelKey = false;

    if (user.notify_props) {
        if (user.notify_props.mention_keys) {
            var keys = user.notify_props.mention_keys.split(',');

            if (keys.indexOf(user.username) === -1) {
                usernameKey = false;
            } else {
                usernameKey = true;
                keys.splice(keys.indexOf(user.username), 1);
            }

            if (keys.indexOf('@' + user.username) === -1) {
                mentionKey = false;
            } else {
                mentionKey = true;
                keys.splice(keys.indexOf('@' + user.username), 1);
            }

            customKeys = keys.join(',');
        }

        if (user.notify_props.first_name) {
            firstNameKey = user.notify_props.first_name === 'true';
        }

        if (user.notify_props.channel) {
            channelKey = user.notify_props.channel === 'true';
        }
    }

    return {
        notifyLevel: desktop,
        notifyPushLevel: push,
        enableEmail,
        soundNeeded,
        enableSound: sound,
        usernameKey,
        mentionKey,
        customKeys,
        customKeysChecked: customKeys.length > 0,
        firstNameKey,
        channelKey,
        notifyCommentsLevel: comments
    };
}

import React from 'react';

export default class NotificationsTab extends React.Component {
    constructor(props) {
        super(props);

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.updateSection = this.updateSection.bind(this);
        this.updateState = this.updateState.bind(this);
        this.onListenerChange = this.onListenerChange.bind(this);
        this.handleNotifyRadio = this.handleNotifyRadio.bind(this);
        this.handleEmailRadio = this.handleEmailRadio.bind(this);
        this.handleSoundRadio = this.handleSoundRadio.bind(this);
        this.updateUsernameKey = this.updateUsernameKey.bind(this);
        this.updateMentionKey = this.updateMentionKey.bind(this);
        this.updateFirstNameKey = this.updateFirstNameKey.bind(this);
        this.updateChannelKey = this.updateChannelKey.bind(this);
        this.updateCustomMentionKeys = this.updateCustomMentionKeys.bind(this);
        this.onCustomChange = this.onCustomChange.bind(this);
        this.createPushNotificationSection = this.createPushNotificationSection.bind(this);

        this.state = getNotificationsStateFromStores();
    }

    handleSubmit() {
        var data = {};
        data.user_id = this.props.user.id;
        data.email = this.state.enableEmail;
        data.desktop_sound = this.state.enableSound;
        data.desktop = this.state.notifyLevel;
        data.push = this.state.notifyPushLevel;
        data.comments = this.state.notifyCommentsLevel;

        var mentionKeys = [];
        if (this.state.usernameKey) {
            mentionKeys.push(this.props.user.username);
        }
        if (this.state.mentionKey) {
            mentionKeys.push('@' + this.props.user.username);
        }

        var stringKeys = mentionKeys.join(',');
        if (this.state.customKeys.length > 0 && this.state.customKeysChecked) {
            stringKeys += ',' + this.state.customKeys;
        }

        data.mention_keys = stringKeys;
        data.first_name = this.state.firstNameKey.toString();
        data.channel = this.state.channelKey.toString();

        Client.updateUserNotifyProps(data,
            () => {
                this.props.updateSection('');
                AsyncClient.getMe();
            },
            (err) => {
                this.setState({serverError: err.message});
            }
        );
    }

    handleCancel(e) {
        this.updateState();
        this.props.updateSection('');
        e.preventDefault();
        $('.settings-modal .modal-body').scrollTop(0).perfectScrollbar('update');
    }

    updateSection(section) {
        this.updateState();
        this.props.updateSection(section);
    }

    updateState() {
        const newState = getNotificationsStateFromStores();
        if (!Utils.areObjectsEqual(newState, this.state)) {
            this.setState(newState);
        }
    }

    componentDidMount() {
        UserStore.addChangeListener(this.onListenerChange);
    }

    componentWillUnmount() {
        UserStore.removeChangeListener(this.onListenerChange);
    }

    onListenerChange() {
        this.updateState();
    }

    handleNotifyRadio(notifyLevel) {
        this.setState({notifyLevel});
        this.refs.wrapper.focus();
    }

    handleNotifyCommentsRadio(notifyCommentsLevel) {
        this.setState({notifyCommentsLevel});
        this.refs.wrapper.focus();
    }

    handlePushRadio(notifyPushLevel) {
        this.setState({notifyPushLevel});
        this.refs.wrapper.focus();
    }

    handleEmailRadio(enableEmail) {
        this.setState({enableEmail});
        this.refs.wrapper.focus();
    }

    handleSoundRadio(enableSound) {
        this.setState({enableSound});
        this.refs.wrapper.focus();
    }

    updateUsernameKey(val) {
        this.setState({usernameKey: val});
    }

    updateMentionKey(val) {
        this.setState({mentionKey: val});
    }

    updateFirstNameKey(val) {
        this.setState({firstNameKey: val});
    }

    updateChannelKey(val) {
        this.setState({channelKey: val});
    }

    updateCustomMentionKeys() {
        var checked = this.refs.customcheck.checked;

        if (checked) {
            var text = this.refs.custommentions.value;

            // remove all spaces and split string into individual keys
            this.setState({customKeys: text.replace(/ /g, ''), customKeysChecked: true});
        } else {
            this.setState({customKeys: '', customKeysChecked: false});
        }
    }

    onCustomChange() {
        this.refs.customcheck.checked = true;
        this.updateCustomMentionKeys();
    }

    createPushNotificationSection() {
        var handleUpdateDesktopSection;
        if (this.props.activeSection === 'push') {
            var notifyActive = [false, false, false];
            if (this.state.notifyPushLevel === 'all') {
                notifyActive[0] = true;
            } else if (this.state.notifyPushLevel === 'none') {
                notifyActive[2] = true;
            } else {
                notifyActive[1] = true;
            }

            let inputs = [];
            let extraInfo = null;
            let submit = null;

            if (global.window.mm_config.SendPushNotifications === 'true') {
                inputs.push(
                    <div key='userNotificationLevelOption'>
                        <div className='radio'>
                            <label>
                                <input
                                    type='radio'
                                    name='pushNotificationLevel'
                                    checked={notifyActive[0]}
                                    onChange={this.handlePushRadio.bind(this, 'all')}
                                />
                                <FormattedMessage
                                    id='user.settings.push_notification.allActivity'
                                    defaultMessage='For all activity'
                                />
                            </label>
                            <br/>
                        </div>
                        <div className='radio'>
                            <label>
                                <input
                                    type='radio'
                                    name='pushNotificationLevel'
                                    checked={notifyActive[1]}
                                    onChange={this.handlePushRadio.bind(this, 'mention')}
                                />
                                <FormattedMessage
                                    id='user.settings.push_notification.onlyMentions'
                                    defaultMessage='For mentions and direct messages'
                                />
                            </label>
                            <br/>
                        </div>
                        <div className='radio'>
                            <label>
                                <input
                                    type='radio'
                                    name='pushNotificationLevel'
                                    checked={notifyActive[2]}
                                    onChange={this.handlePushRadio.bind(this, 'none')}
                                />
                                <FormattedMessage
                                    id='user.settings.push_notification.off'
                                    defaultMessage='Off'
                                />
                            </label>
                        </div>
                    </div>
                );

                extraInfo = (
                    <span>
                        <FormattedMessage
                            id='user.settings.push_notification.info'
                            defaultMessage='Notification alerts are pushed to your mobile device when there is activity in Mattermost.'
                        />
                    </span>
                );

                submit = this.handleSubmit;
            } else {
                inputs.push(
                    <div
                        key='oauthEmailInfo'
                        className='padding-top'
                    >
                        <FormattedMessage
                            id='user.settings.push_notification.disabled_long'
                            defaultMessage='Push notifications for mobile devices have been disabled by your System Administrator.'
                        />
                    </div>
                );
            }

            return (
                <SettingItemMax
                    title={Utils.localizeMessage('user.settings.notifications.push', 'Mobile push notifications')}
                    extraInfo={extraInfo}
                    inputs={inputs}
                    submit={submit}
                    server_error={this.state.serverError}
                    updateSection={this.handleCancel}
                />
            );
        }

        let describe = '';
        if (this.state.notifyPushLevel === 'all') {
            describe = (
                <FormattedMessage
                    id='user.settings.push_notification.allActivity'
                    defaultMessage='For all activity'
                />
            );
        } else if (this.state.notifyPushLevel === 'none') {
            describe = (
                <FormattedMessage
                    id='user.settings.push_notification.off'
                    defaultMessage='Off'
                />
            );
        } else if (global.window.mm_config.SendPushNotifications === 'false') {
            describe = (
                <FormattedMessage
                    id='user.settings.push_notification.disabled'
                    defaultMessage='Disabled by system administrator'
                />
            );
        } else {
            describe = (
                <FormattedMessage
                    id='user.settings.push_notification.onlyMentions'
                    defaultMessage='For mentions and direct messages'
                />
            );
        }

        handleUpdateDesktopSection = function updateDesktopSection() {
            this.props.updateSection('push');
        }.bind(this);

        return (
            <SettingItemMin
                title={Utils.localizeMessage('user.settings.notification.push', 'Mobile push notifications')}
                describe={describe}
                updateSection={handleUpdateDesktopSection}
            />
        );
    }

    render() {
        const serverError = this.state.serverError;

        var user = this.props.user;

        var desktopSection;
        var handleUpdateDesktopSection;
        if (this.props.activeSection === 'desktop') {
            var notifyActive = [false, false, false];
            if (this.state.notifyLevel === 'mention') {
                notifyActive[1] = true;
            } else if (this.state.notifyLevel === 'none') {
                notifyActive[2] = true;
            } else {
                notifyActive[0] = true;
            }

            let inputs = [];

            inputs.push(
                <div key='userNotificationLevelOption'>
                    <div className='radio'>
                        <label>
                            <input
                                type='radio'
                                name='desktopNotificationLevel'
                                checked={notifyActive[0]}
                                onChange={this.handleNotifyRadio.bind(this, 'all')}
                            />
                            <FormattedMessage
                                id='user.settings.notification.allActivity'
                                defaultMessage='For all activity'
                            />
                        </label>
                        <br/>
                    </div>
                    <div className='radio'>
                        <label>
                            <input
                                type='radio'
                                name='desktopNotificationLevel'
                                checked={notifyActive[1]}
                                onChange={this.handleNotifyRadio.bind(this, 'mention')}
                            />
                            <FormattedMessage
                                id='user.settings.notifications.onlyMentions'
                                defaultMessage='Only for mentions and direct messages'
                            />
                        </label>
                        <br/>
                    </div>
                    <div className='radio'>
                        <label>
                            <input
                                type='radio'
                                name='desktopNotificationLevel'
                                checked={notifyActive[2]}
                                onChange={this.handleNotifyRadio.bind(this, 'none')}
                            />
                            <FormattedMessage
                                id='user.settings.notifications.never'
                                defaultMessage='Never'
                            />
                        </label>
                    </div>
                </div>
            );

            const extraInfo = (
                <span>
                    <FormattedMessage
                        id='user.settings.notifications.info'
                        defaultMessage='Desktop notifications are available on Firefox, Safari, Chrome, Internet Explorer, and Edge.'
                    />
                </span>
            );

            desktopSection = (
                <SettingItemMax
                    title={Utils.localizeMessage('user.settings.notifications.desktop', 'Send desktop notifications')}
                    extraInfo={extraInfo}
                    inputs={inputs}
                    submit={this.handleSubmit}
                    server_error={serverError}
                    updateSection={this.handleCancel}
                />
            );
        } else {
            let describe = '';
            if (this.state.notifyLevel === 'mention') {
                describe = (
                    <FormattedMessage
                        id='user.settings.notifications.onlyMentions'
                        defaultMessage='Only for mentions and direct messages'
                    />
                );
            } else if (this.state.notifyLevel === 'none') {
                describe = (
                    <FormattedMessage
                        id='user.settings.notifications.never'
                        defaultMessage='Never'
                    />
                );
            } else {
                describe = (
                    <FormattedMessage
                        id='user.settings.notification.allActivity'
                        defaultMessage='For all activity'
                    />
                );
            }

            handleUpdateDesktopSection = function updateDesktopSection() {
                this.props.updateSection('desktop');
            }.bind(this);

            desktopSection = (
                <SettingItemMin
                    title={Utils.localizeMessage('user.settings.notifications.desktop', 'Send desktop notifications')}
                    describe={describe}
                    updateSection={handleUpdateDesktopSection}
                />
            );
        }

        var soundSection;
        var handleUpdateSoundSection;
        if (this.props.activeSection === 'sound' && this.state.soundNeeded) {
            var soundActive = [false, false];
            if (this.state.enableSound === 'false') {
                soundActive[1] = true;
            } else {
                soundActive[0] = true;
            }

            let inputs = [];

            inputs.push(
                <div key='userNotificationSoundOptions'>
                    <div className='radio'>
                        <label>
                            <input
                                type='radio'
                                name='notificationSounds'
                                checked={soundActive[0]}
                                onChange={this.handleSoundRadio.bind(this, 'true')}
                            />
                            <FormattedMessage
                                id='user.settings.notifications.on'
                                defaultMessage='On'
                            />
                        </label>
                        <br/>
                    </div>
                    <div className='radio'>
                        <label>
                            <input
                                type='radio'
                                name='notificationSounds'
                                checked={soundActive[1]}
                                onChange={this.handleSoundRadio.bind(this, 'false')}
                            />
                            <FormattedMessage
                                id='user.settings.notifications.off'
                                defaultMessage='Off'
                            />
                        </label>
                        <br/>
                    </div>
                </div>
            );

            const extraInfo = (
                <span>
                    <FormattedMessage
                        id='user.settings.notifications.sounds_info'
                        defaultMessage='Desktop notifications sounds are available on Firefox, Safari, Chrome, Internet Explorer, and Edge.'
                    />
                </span>
            );

            soundSection = (
                <SettingItemMax
                    title={Utils.localizeMessage('user.settings.notifications.desktopSounds', 'Desktop notification sounds')}
                    extraInfo={extraInfo}
                    inputs={inputs}
                    submit={this.handleSubmit}
                    server_error={serverError}
                    updateSection={this.handleCancel}
                />
            );
        } else {
            let describe = '';
            if (!this.state.soundNeeded) {
                describe = (
                    <FormattedMessage
                        id='user.settings.notification.soundConfig'
                        defaultMessage='Please configure notification sounds in your browser settings'
                    />
                );
            } else if (this.state.enableSound === 'false') {
                describe = (
                    <FormattedMessage
                        id='user.settings.notifications.off'
                        defaultMessage='Off'
                    />
                );
            } else {
                describe = (
                    <FormattedMessage
                        id='user.settings.notifications.on'
                        defaultMessage='On'
                    />
                );
            }

            handleUpdateSoundSection = function updateSoundSection() {
                this.props.updateSection('sound');
            }.bind(this);

            soundSection = (
                <SettingItemMin
                    title={Utils.localizeMessage('user.settings.notifications.desktopSounds', 'Desktop notification sounds')}
                    describe={describe}
                    updateSection={handleUpdateSoundSection}
                    disableOpen={!this.state.soundNeeded}
                />
            );
        }

        var keysSection;
        var handleUpdateKeysSection;
        if (this.props.activeSection === 'keys') {
            let inputs = [];

            let handleUpdateFirstNameKey;
            let handleUpdateUsernameKey;
            let handleUpdateMentionKey;
            let handleUpdateChannelKey;

            if (user.first_name) {
                handleUpdateFirstNameKey = function handleFirstNameKeyChange(e) {
                    this.updateFirstNameKey(e.target.checked);
                }.bind(this);
                inputs.push(
                    <div key='userNotificationFirstNameOption'>
                        <div className='checkbox'>
                            <label>
                                <input
                                    type='checkbox'
                                    checked={this.state.firstNameKey}
                                    onChange={handleUpdateFirstNameKey}
                                />
                                <FormattedMessage
                                    id='user.settings.notifications.sensitiveName'
                                    defaultMessage='Your case sensitive first name "{first_name}"'
                                    values={{
                                        first_name: user.first_name
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                );
            }

            handleUpdateUsernameKey = function handleUsernameKeyChange(e) {
                this.updateUsernameKey(e.target.checked);
            }.bind(this);
            inputs.push(
                <div key='userNotificationUsernameOption'>
                    <div className='checkbox'>
                        <label>
                            <input
                                type='checkbox'
                                checked={this.state.usernameKey}
                                onChange={handleUpdateUsernameKey}
                            />
                            <FormattedMessage
                                id='user.settings.notifications.sensitiveUsername'
                                defaultMessage='Your non-case sensitive username "{username}"'
                                values={{
                                    username: user.username
                                }}
                            />
                        </label>
                    </div>
                </div>
            );

            handleUpdateMentionKey = function handleMentionKeyChange(e) {
                this.updateMentionKey(e.target.checked);
            }.bind(this);
            inputs.push(
                <div key='userNotificationMentionOption'>
                    <div className='checkbox'>
                        <label>
                            <input
                                type='checkbox'
                                checked={this.state.mentionKey}
                                onChange={handleUpdateMentionKey}
                            />
                            <FormattedMessage
                                id='user.settings.notifications.usernameMention'
                                defaultMessage='Your username mentioned "@{username}"'
                                values={{
                                    username: user.username
                                }}
                            />
                        </label>
                    </div>
                </div>
            );

            handleUpdateChannelKey = function handleChannelKeyChange(e) {
                this.updateChannelKey(e.target.checked);
            }.bind(this);
            inputs.push(
                <div key='userNotificationChannelOption'>
                    <div className='checkbox'>
                        <label>
                            <input
                                type='checkbox'
                                checked={this.state.channelKey}
                                onChange={handleUpdateChannelKey}
                            />
                            <FormattedMessage
                                id='user.settings.notifications.channelWide'
                                defaultMessage='Channel-wide mentions "@channel", "@all"'
                            />
                        </label>
                    </div>
                </div>
            );

            inputs.push(
                <div key='userNotificationCustomOption'>
                    <div className='checkbox'>
                        <label>
                            <input
                                ref='customcheck'
                                type='checkbox'
                                checked={this.state.customKeysChecked}
                                onChange={this.updateCustomMentionKeys}
                            />
                            <FormattedMessage
                                id='user.settings.notifications.sensitiveWords'
                                defaultMessage='Other non-case sensitive words, separated by commas:'
                            />
                        </label>
                    </div>
                    <input
                        ref='custommentions'
                        className='form-control mentions-input'
                        type='text'
                        defaultValue={this.state.customKeys}
                        onChange={this.onCustomChange}
                    />
                </div>
            );

            keysSection = (
                <SettingItemMax
                    title={Utils.localizeMessage('user.settings.notifications.wordsTrigger', 'Words that trigger mentions')}
                    inputs={inputs}
                    submit={this.handleSubmit}
                    server_error={serverError}
                    updateSection={this.handleCancel}
                />
            );
        } else {
            let keys = [];
            if (this.state.firstNameKey) {
                keys.push(user.first_name);
            }
            if (this.state.usernameKey) {
                keys.push(user.username);
            }
            if (this.state.mentionKey) {
                keys.push('@' + user.username);
            }

            if (this.state.channelKey) {
                keys.push('@channel');
                keys.push('@all');
            }
            if (this.state.customKeys.length > 0) {
                keys = keys.concat(this.state.customKeys.split(','));
            }

            let describe = '';
            for (var i = 0; i < keys.length; i++) {
                if (keys[i] !== '') {
                    describe += '"' + keys[i] + '", ';
                }
            }

            if (describe.length > 0) {
                describe = describe.substring(0, describe.length - 2);
            } else {
                describe = (
                    <FormattedMessage
                        id='user.settings.notifications.noWords'
                        defaultMessage='No words configured'
                    />
                );
            }

            handleUpdateKeysSection = function updateKeysSection() {
                this.props.updateSection('keys');
            }.bind(this);

            keysSection = (
                <SettingItemMin
                    title={Utils.localizeMessage('user.settings.notifications.wordsTrigger', 'Words that trigger mentions')}
                    describe={describe}
                    updateSection={handleUpdateKeysSection}
                />
            );
        }

        var commentsSection;
        var handleUpdateCommentsSection;
        if (this.props.activeSection === 'comments') {
            var commentsActive = [false, false, false];
            if (this.state.notifyCommentsLevel === 'never') {
                commentsActive[2] = true;
            } else if (this.state.notifyCommentsLevel === 'root') {
                commentsActive[1] = true;
            } else {
                commentsActive[0] = true;
            }

            let inputs = [];

            inputs.push(
                <div key='userNotificationLevelOption'>
                    <div className='radio'>
                        <label>
                            <input
                                type='radio'
                                name='commentsNotificationLevel'
                                checked={commentsActive[0]}
                                onChange={this.handleNotifyCommentsRadio.bind(this, 'any')}
                            />
                            <FormattedMessage
                                id='user.settings.notifications.commentsAny'
                                defaultMessage='Mention any comments in a thread you participated in (This will include both mentions to your root post and any comments after you commented on a post)'
                            />
                        </label>
                        <br/>
                    </div>
                    <div className='radio'>
                        <label>
                            <input
                                type='radio'
                                name='commentsNotificationLevel'
                                checked={commentsActive[1]}
                                onChange={this.handleNotifyCommentsRadio.bind(this, 'root')}
                            />
                            <FormattedMessage
                                id='user.settings.notifications.commentsRoot'
                                defaultMessage='Mention any comments on your post'
                            />
                        </label>
                        <br/>
                    </div>
                    <div className='radio'>
                        <label>
                            <input
                                type='radio'
                                name='commentsNotificationLevel'
                                checked={commentsActive[2]}
                                onChange={this.handleNotifyCommentsRadio.bind(this, 'never')}
                            />
                            <FormattedMessage
                                id='user.settings.notifications.commentsNever'
                                defaultMessage='No mentions for comments'
                            />
                        </label>
                    </div>
                </div>
            );

            const extraInfo = (
                <span>
                    <FormattedMessage
                        id='user.settings.notifications.commentsInfo'
                        defaultMessage='Mode of triggering notifications on posts in comment threads you participated in.'
                    />
                </span>
            );

            commentsSection = (
                <SettingItemMax
                    title={Utils.localizeMessage('user.settings.notifications.comments', 'Comment threads notifications')}
                    extraInfo={extraInfo}
                    inputs={inputs}
                    submit={this.handleSubmit}
                    server_error={serverError}
                    updateSection={this.handleCancel}
                />
            );
        } else {
            let describe = '';
            if (this.state.notifyCommentsLevel === 'never') {
                describe = (
                    <FormattedMessage
                        id='user.settings.notifications.commentsNever'
                        defaultMessage='No mentions for comments'
                    />
                );
            } else if (this.state.notifyCommentsLevel === 'root') {
                describe = (
                    <FormattedMessage
                        id='user.settings.notifications.commentsRoot'
                        defaultMessage='Mention any comments on your post'
                    />
                );
            } else {
                describe = (
                    <FormattedMessage
                        id='user.settings.notifications.commentsAny'
                        defaultMessage='Mention any comments in a thread you participated in (This will include both mentions to your root post and any comments after you commented on a post)'
                    />
                );
            }

            handleUpdateCommentsSection = function updateCommentsSection() {
                this.props.updateSection('comments');
            }.bind(this);

            commentsSection = (
                <SettingItemMin
                    title={Utils.localizeMessage('user.settings.notifications.comments', 'Comment threads notifications')}
                    describe={describe}
                    updateSection={handleUpdateCommentsSection}
                />
            );
        }

        const pushNotificationSection = this.createPushNotificationSection();

        return (
            <div>
                <div className='modal-header'>
                    <button
                        type='button'
                        className='close'
                        data-dismiss='modal'
                        onClick={this.props.closeModal}
                    >
                        <span aria-hidden='true'>{'×'}</span>
                    </button>
                    <h4
                        className='modal-title'
                        ref='title'
                    >
                        <div className='modal-back'>
                            <i
                                className='fa fa-angle-left'
                                onClick={this.props.collapseModal}
                            />
                        </div>
                        <FormattedMessage
                            id='user.settings.notifications.title'
                            defaultMessage='Notification Settings'
                        />
                    </h4>
                </div>
                <div
                    ref='wrapper'
                    className='user-settings'
                >
                    <h3 className='tab-header'>
                        <FormattedMessage
                            id='user.settings.notifications.header'
                            defaultMessage='Notifications'
                        />
                    </h3>
                    <div className='divider-dark first'/>
                    {desktopSection}
                    <div className='divider-light'/>
                    {soundSection}
                    <div className='divider-light'/>
                    <EmailNotificationSetting
                        activeSection={this.props.activeSection}
                        updateSection={this.props.updateSection}
                        enableEmail={this.state.enableEmail}
                        onChange={this.handleEmailRadio}
                        onSubmit={this.handleSubmit}
                        serverError={this.state.serverError}
                    />
                    <div className='divider-light'/>
                    {pushNotificationSection}
                    <div className='divider-light'/>
                    {keysSection}
                    <div className='divider-light'/>
                    {commentsSection}
                    <div className='divider-dark'/>
                </div>
            </div>

        );
    }
}

NotificationsTab.defaultProps = {
    user: null,
    activeSection: '',
    activeTab: ''
};
NotificationsTab.propTypes = {
    user: React.PropTypes.object,
    updateSection: React.PropTypes.func,
    updateTab: React.PropTypes.func,
    activeSection: React.PropTypes.string,
    activeTab: React.PropTypes.string,
    closeModal: React.PropTypes.func.isRequired,
    collapseModal: React.PropTypes.func.isRequired
};
