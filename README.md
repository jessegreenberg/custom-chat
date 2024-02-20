custom-chat
================

A take on ChatGPT with some features that I have wanted for a while. Also testing out using Vite with PhET code.
See https://github.com/phetsims/phet-vite-demo.

Mostly, it includes speech in the web interface, either from SpeechSynthesis or from OpenAI's speech API.

![interface-example](https://github.com/jessegreenberg/custom-chat/blob/main/doc/img.png)

### Quick Start

(1) Clone the repo.

(2) Install dev dependencies:

```sh
cd custom-chat
npm install
```

(3) Create a .env file in the root directory. Add your OpenAI API key to the .env file:

```
OPENAI_API_KEY=your-api-key
```

(4) Run it from a browser:

The following will run a server on your local machine, and you can navigate to the URL:

```sh
npm run dev
```

It will print out the URL to navigate to, e.g. http://localhost:5173/.