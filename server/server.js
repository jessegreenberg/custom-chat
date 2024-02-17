import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import OpenAI from 'openai';
import path from 'path';

// configure environment variables
dotenv.config();

const openai = new OpenAI( {
  apiKey: process.env.OPENAI_API_KEY
} );

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use( express.json() );

// CORS Middleware to allow requests from your frontend domain
app.use( ( req, res, next ) => {
  res.header( 'Access-Control-Allow-Origin', '*' ); // Adjust this to your frontend domain
  res.header( 'Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept' );
  next();
} );

// Route to handle requests
app.post( '/api/openai', async ( req, res ) => {
  const previousMessages = req.body.messages; // array of Message objects

  const formattedMessages = previousMessages.map( message => {
    return {

      // roles can be 'user' or 'assistant' or 'system' (for special messages like the first message)
      role: message.source === 'user' ? 'user' : 'assistant',
      content: message.string
    };
  } );

  const leadingMessage = {
    role: 'system',
    content: `You are a professional chat-bot. Please be as helpful, kind, and informative to the user as
    possible. Please keep responses as short as possible, but not shorter than necessary.`
  };
  formattedMessages.unshift( leadingMessage );

  try {
    const completion = await openai.chat.completions.create( {

      // the latest model, OpenAI claims this model has reduced 'laziness'
      model: 'gpt-4-0125-preview',
      // model: 'gpt-4-turbo-preview', // currently points to the same model as 'gpt-4-0125-preview'
      // model: 'gpt-4', // snapshot of gpt-4 from June 2023
      // model: 'gpt-3.5-turbo', // faster, cheaper
      messages: formattedMessages
    } );
    res.json( completion.choices[ 0 ] );
  }
  catch( error ) {
    console.error( 'Error:', error );
    res.status( 500 ).json( { error: 'Something went wrong' } );
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
