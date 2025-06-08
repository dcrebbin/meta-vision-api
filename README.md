# Mai - Meta Glasses API for Messenger

![](/assets/mai-promotional.png)

**This is a browser extension to add custom AI bots to messenger that can be used with the Meta Rayban Smart Glasses or the standalone messenger app.**

## Features:

1. Hey Meta send a photo to my food log: [Video Demo](https://www.youtube.com/watch?v=PiEDrcLCmew)

2. Hey Meta send a message to ChatGPT

3. Video Monitoring: Send screenshots of your video calls to your chosen provider (ChatGPT, Claude etc) and then log the output to the log viewer
   ![](/assets/video-monitoring.png)

### Requirements:

a) [Meta Rayban Smart Glasses](https://about.fb.com/news/2023/09/new-ray-ban-meta-smart-glasses/) (or the standalone messenger app)

b) [OpenAI/Perplexity/Claude etc Api Key](https://platform.openai.com/)

c) Alternative Facebook/Messenger account

### Browser Extension Setup

1. bun install

2. bun run dev:chrome (or brave, firefox)

3. This should build and run the extension and automatically open it

4. Add any api keys you want to use in the extension: the API settings tab has more information on how to get them

5. Sigin into your alt Facebook account and head to [facebook.com/messages/t](https://www.facebook.com/messages/t) and start monitoring the conversation

## Hey Meta Send a Photo/Message to **\_\_\_\_\_**

Before we setup our extension we're going to trick the Meta Glasses into allowing us to send a message to (nearly) any name e.g: "Hey Meta send a message to ChatGPT".

### Tricking Meta

1. Create a messenger group chat with 2 other facebook accounts (the minimum amount allowed to create a group chat)

![](/assets/create-a-chat.png)

2. Remove the account you're not going to use
   ![](/assets/remove-member.png)

3. Change the name of the chat
   ![](/assets/change-chat-name.png)

4. Update the group chat photo (for a legit feel)
   ![](/assets/change-photo.png)

5. Set a nickname for your alt bot account
   ![](/assets/edit-nickname.png)

6. Go to the Meta view app within the communications section
   ![](/assets/communications.jpeg)

7. Go to Messenger and disconnect then reconnect your messenger account
   ![](/assets/disconnect.jpeg)

I believe this step resyncs all your latest chats and friends which then allows that Meta Glasses to become aware of your newly created group chat to allow for voice commands!

### Chat Monitoring

1. On your alt account head to messenger.com or facebook.com/messages then open your newly created group chat

2. Start monitoring the chat

3. With each new message/image request it will send it to your chosen provider (ChatGPT, Claude etc) and then respond to you with the output

4. If enabled: It will then generate an audio clip of that output using OpenAI and send it back to you

#### Examples

All chats can be done via voice commands "Hey Meta send a message to \_\_\_" or by simply messaging the group chat.

#### OpenAI query with Minimax text to speech

![](/assets/messenger-example-1.png)

#### Using Perplexity to answer a question accurately

![](/assets/messenger-example-2.png)

#### Using GPT 4.1 to describe an image

![](/assets/messenger-example-3.png)

by [Devon Crebbin](https://github.com/dcrebbin)

Please reach out if there are any issues or feature requests :)

Hopefully the Meta Reality Labs team will provide an SDK in the future so these types of integrations can be ✨productionised✨

Credits:

[Anime Sky from Vecteezy](https://www.vecteezy.com/vector-art/53757812-an-anime-style-illustration-of-clouds-in-the-sky) is used in the icon
