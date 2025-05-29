import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import OpenAI from 'openai';
import path from 'path';

// configure environment variables
dotenv.config();

const openai = new OpenAI( {
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION
} );

const SYSTEM_MESSAGE = {
  role: 'system',
  content: `You are a professional chat-bot. Please be as helpful, kind, and informative to the user as
  possible. Please keep responses as short as possible, but not shorter than necessary. Surround any code with 3 backticks so it looks nice when formatting.`
};

const INITIAL_CONTEXT_MESSAGE = {
  role: 'system',
  content: 'The following is the first message request from the user. It is then followed by the last 5 messages in ' +
           'the conversation. This is to provide context for the chat-bot to respond to the user.'
};

/**
 * Format a Message into the format expected by the OpenAI API. If image data is included in the message,
 * it is added to the payload.
 * @param message
 * @returns {{role: (string), content: [{text, type: string}]}}
 */
function formatMessage( message ) {
  const content = [
    {
      type: 'text',
      text: message.string
    }
  ];
  if ( message.imageString ) {
    content.push( {
      type: 'image_url',
      'image_url': {
        'url': `data:image/jpeg;base64,${message.imageString}`
      }
    } );
  }
  return {
    role: message.source === 'user' ? 'user' : 'assistant',
    content: content
  };
}

function prepareMessages( previousMessages, model ) {

  // The o1 models do not support 'system' messages, so for that model
  // convert to 'assistant' messages
  if ( model.includes( 'o1' ) ) {
    SYSTEM_MESSAGE.role = 'assistant';
    INITIAL_CONTEXT_MESSAGE.role = 'assistant';
  }

  let formattedMessages = [ SYSTEM_MESSAGE ];

  if ( previousMessages.length > 5 ) {
    formattedMessages.push( INITIAL_CONTEXT_MESSAGE );

    // Include the first message
    formattedMessages.push( formatMessage( previousMessages[ 0 ] ) );

    // Include the last 5 messages
    const recentMessages = previousMessages.slice( -5 );
    recentMessages.forEach( message => {
      formattedMessages.push( formatMessage( message ) );
    } );
  }
  else {
    // Include all messages
    formattedMessages = formattedMessages.concat( previousMessages.map( formatMessage ) );
  }

  return formattedMessages;
}

const app = express();
const port = 3000;

// Middleware to parse JSON bodies - increase the limit  bit to allow for larger messages
// with image data
app.use( express.json( { limit: '10mb' } ) );

// CORS Middleware to allow requests from your frontend domain
app.use( ( req, res, next ) => {
  res.header( 'Access-Control-Allow-Origin', '*' ); // Adjust this to your frontend domain
  res.header( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept' );
  next();
} );

app.post( '/api/openai', async ( req, res ) => {
  const { model, messages: previousMessages } = req.body;

  if ( model === 'gpt-image-1' ) {
    console.log( 'REQUESTING IMAGE' );

    // The last user message should be the prompt for the image
    const lastUserMessage = previousMessages[ previousMessages.length - 1 ];
    const prompt = lastUserMessage.string;

    try {
      const img = await openai.images.generate( {
        model: model,
        prompt: prompt,
        n: 1,

        // 1024x1024, 1536x1024 (landscape), 1024x1536 (portrait), or auto (default value) for gpt-image-1
        size: '1024x1536'
      } );

      const imageBuffer = Buffer.from( img.data[ 0 ].b64_json, 'base64' );

      // Now send the base64 image data back to the client
      const imageBase64 = imageBuffer.toString( 'base64' );

      res.json( {
        imageString: imageBase64,
        contentType: 'image/jpeg',
        message: {
          content: 'Here is the image you requested.'
        }
      } );
    }
    catch( error ) {
      console.error( 'Error:', error );
      res.status( 500 ).json( { error: 'Something went wrong' } );
    }
  }
  else {

    const formattedMessages = prepareMessages( previousMessages, model );

    // For other models, use the chat completion endpoint
    try {
      const completion = await openai.chat.completions.create( {
        model: model,
        messages: formattedMessages
      } );
      res.json( completion.choices[ 0 ] );
    }
    catch( error ) {
      console.error( 'Error:', error );
      res.status( 500 ).json( { error: 'Something went wrong' } );
    }
  }
} );

// Gets the list of available models form OpenAI
app.get( '/api/openai/models', async ( req, res ) => {
  try {
    const models = await openai.models.list();
    res.json( models.data );
  }
  catch( error ) {
    console.error( 'Error:', error );
    res.status( 500 ).json( { error: 'Something went wrong getting models.' } );
  }
} );

app.post( '/api/openai/summarizeTitle', async ( req, res ) => {
  const previousMessages = req.body.messages; // array of Message objects

  const formattedMessages = previousMessages.map( message => {
    return {

      // roles can be 'user' or 'assistant' or 'system' (for special messages like the first message)
      role: message.source === 'user' ? 'user' : 'assistant',
      content: message.string
    };
  } );

  const leadingRequest = {
    role: 'system',
    content: `The following are messages between a user and a chat-bot.`
  };
  formattedMessages.push( leadingRequest );

  const finalRequest = {
    role: 'system',
    content: `Can you please take all of the above messages and give me just an appropriate title for the conversation? Just give the one or two word name for the conversation.`
  };
  formattedMessages.push( finalRequest );

  try {
    const completion = await openai.chat.completions.create( {
      model: 'gpt-3.5-turbo', // faster, cheaper
      messages: formattedMessages
    } );
    res.json( completion.choices[ 0 ] );
  }
  catch( error ) {
    console.error( 'Error:', error );
    res.status( 500 ).json( { error: 'Something went wrong' } );
  }
} );

app.post( '/api/openai/speak', async ( req, res ) => {
  const { text } = req.body;

  const mp3 = await openai.audio.speech.create( {
    model: 'tts-1',
    voice: 'nova',
    input: text,

    // A value from 0.25 to 4. It seems like OpenAI just speeds up the audio,
    // faster values don't sound like a natural human speaking quickly
    speed: 1.0
  } );

  // generate a timestamped name for the file
  const now = new Date();
  const timestamp = now.toISOString().replace( /T/, '_' ).replace( /\..+/, '' ).replace( /:/g, '-' );
  const speechFile = path.resolve( `./saved-speech/${timestamp}.mp3` );

  // save the audio just in case you want to use it later
  const buffer = Buffer.from( await mp3.arrayBuffer() );
  await fs.promises.writeFile( speechFile, buffer );

  // Convert the buffer to a Base64 string to send it in JSON
  const audioBase64 = buffer.toString( 'base64' );
  res.json( { audio: audioBase64, contentType: 'audio/mpeg' } );
} );

app.listen( port, () => {
  console.log( `Server running on port ${port}` );
} );
