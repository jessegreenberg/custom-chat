import { Text, VBox } from 'phet-lib/scenery';
import ChatModel from '../model/ChatModel.ts';
import Message from '../model/Message.ts';
import Constants from '../Constants.ts';
import { Emitter } from 'phet-lib/axon';
import TextInput from './TextInput.ts';
import _ from 'lodash';
import DOMText from './DOMText.ts';

export default class MessageListView extends VBox {
  public readonly layoutEmitter: Emitter = new Emitter();

  constructor( model: ChatModel ) {
    super( {
      align: 'left',
      spacing: 10
    } );

    model.messages.addItemAddedListener( ( message: Message ) => {
      const label = new Text( message.source === 'user' ? 'You:' : 'Bot:', {
        font: Constants.FONT,
        fill: Constants.TEXT_COLOR
      } );

      // const messageNode = new TextInput( _.merge( {}, Constants.TEXT_INPUT_OPTIONS, {
      //   initialText: message.string,
      //   readonly: true,
      //   rows: message.source === 'user' ? 3 : 3,
      //   hideOutline: true
      // } ) );

      const messageNode = new DOMText( message.string, {
        font: Constants.FONT,
        fill: Constants.TEXT_COLOR
      } );

      const labelledMessage = new VBox( {
        children: [ label, messageNode ],
        align: 'left',
        spacing: 5,

        // Using DOM Nodes, layout doesn't settle until the next frame, so
        visible: false
      } );

      const layoutListener = () => {

        // There was some DOM layout, we are probably ready to display the message
        labelledMessage.visible = true;
        this.layoutEmitter.emit();
      };
      messageNode.layoutChangeEmitter.addListener( layoutListener );

      // Remote the message and layout listener when this message is removed from the model
      model.messages.addItemRemovedListener( removedMessage => {
        if ( removedMessage === message ) {
          messageNode.layoutChangeEmitter.removeListener( layoutListener );
          this.removeChild( labelledMessage );
        }
      } );

      this.addChild( labelledMessage );
    } );
  }
}