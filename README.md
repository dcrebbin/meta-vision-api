# Meta Vision

### Meta Glasses Vision API Implementation

This is a hacky way to integrate GPT4 Vision into the Meta Rayban Smart Glasses using voice commands.

Hey Meta send a photo to my food log: [Video Demo](https://www.youtube.com/watch?v=PiEDrcLCmew)

Video Monitoring
![](/video-example.png)

Requirements:

a) [Meta Rayban Smart Glasses](https://about.fb.com/news/2023/09/new-ray-ban-meta-smart-glasses/)

b) [OpenAi/Perplexity/Claude Api Key](https://platform.openai.com/)

c) Alternative Facebook/Messenger account

d) Chromium based browser

## Hey Meta Send a Photo to **\_\_\_\_\_**

Before we setup our chrome extension we're going to trick the Meta Glasses into allowing us to send a message to (nearly) any name e.g: "Hey Meta send a message to ChatGPT".

### Tricking Meta

1. Create a messenger group chat with 2 other facebook accounts (the minimum amount allowed to create a group chat)

![](/tutorial/create-a-chat.png)

2. Remove the account you're not going to use
   ![](/tutorial/remove-member.png)

3. Change the name of the chat
   ![](/tutorial/change-chat-name.png)

4. Update the group chat photo (for a legit feel)
   ![](/tutorial/change-photo.png)

5. Set a nickname for your alt bot account
   ![](/tutorial/edit-nickname.png)

6. Go to the Meta view app within the communications section
   ![](/tutorial/communications.jpeg)

7. Go to Messenger and disconnect then reconnect your messenger account
   ![](/tutorial/disconnect.jpeg)

I believe this step resyncs all your latest chats and friends which then allows that Meta Glasses to become aware of your newly created group chat to allow for voice commands!

### Chat Monitoring

1. On your alt account head to messenger.com or facebook.com/messages then open your newly created group chat

2. Ensure the input (ChatGPT) matches the name of your group chat then start monitoring the chat
   ![](/tutorial/chat-monitoring.png)

3. With each new message request it will send it to your chosen provider (ChatGPT, Perplexity) and then respond to you with the output

4. It will then generate an audio clip of that output using OpenAI and send it back to you

#### Examples

All chats can be done via voice commands "Hey Meta send a message to \_\_\_" or by simply messaging the group chat.

a) Asking ChatGPT to give translations (will split the audio to maintain the Chinese accent when speaking Chinese)

![](/tutorial/chatgpt.jpeg)

b) Asking Perplexity about topical events

![](/tutorial/perplexity.jpeg)

### Video Monitoring

TODO

by [Devon Crebbin](https://github.com/dcrebbin)

Please reach out if there are any issues or feature requests :)

Hopefully the Meta Reality Labs team will provide an SDK in the future so these types of integrations can be ✨productionised✨
