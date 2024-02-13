import { VBox } from 'phet-lib/scenery';
import ChatModel from '../model/ChatModel.ts';
import Message from '../model/Message.ts';
import Constants from '../Constants.ts';
import { Emitter } from 'phet-lib/axon';
import TextInput from './TextInput.ts';

export default class MessageListView extends VBox {

  public layoutEmitter: Emitter = new Emitter();

  constructor( model: ChatModel ) {
    super( {
      spacing: 10,
      align: 'left'
    } );

    model.messages.addItemAddedListener( ( message: Message ) => {

      const rows = message.source === 'user' ? 3 : 10;

      // Add a new message to the list
      const messageNode = new TextInput( {
        initialText: message.string,
        font: Constants.FONT,
        readonly: true,
        multiline: true,
        rows: rows,
        backgroundColor: Constants.BACKGROUND_COLOR,
        color: Constants.TEXT_COLOR,
        hideOutline: true
      } );

      messageNode.layoutChangeEmitter.addListener( () => {
        this.layoutEmitter.emit();
      } );

      this.addChild( messageNode );
    } );
  }
}