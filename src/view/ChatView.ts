import { Node, Text } from 'phet-lib/scenery';
import ChatModel from '../model/ChatModel.ts';
import Constants from '../Constants.ts';
import TextInput from './TextInput.ts';
import MessageListView from './MessageListView.ts';

export default class ChatView extends Node {

  private readonly welcomeText: Text;
  private readonly chatInput: TextInput;
  private readonly messageListView: MessageListView;

  private availableWidth = 0;
  private availableHeight = 0;

  // A subtree of Nodes that contains DOM elements that are expected to be added to a secondary DOM display.
  // DO NOT add this layer as a child of this view. But it is contained within this view element for
  // layout and organization purposes.
  public readonly domLayer: Node = new Node();

  constructor( model: ChatModel ) {
    super();

    this.welcomeText = new Text( 'How can I help you?', {
      font: Constants.TITLE_FONT,
      fill: Constants.TEXT_COLOR
    } );
    this.addChild( this.welcomeText );

    // Uses DOM for text input
    this.chatInput = new TextInput( {
      placeholder: 'Message...',
      multiline: true,
      rows: 3,
      backgroundColor: Constants.BACKGROUND_COLOR,
      color: Constants.TEXT_COLOR,

      font: Constants.FONT
    } );
    this.domLayer.addChild( this.chatInput );

    this.chatInput.layoutChangeEmitter.addListener( () => {
      this.layout( this.availableWidth, this.availableHeight );
    } );

    this.chatInput.valueSubmittedEmitter.addListener( ( value: string ) => {
      model.sendMessage( value );
    } );

    model.messages.lengthProperty.link( ( length: number ) => {
      if ( length > 0 ) {
        this.welcomeText.visible = false;

        // relayout the view
        this.layout( this.availableWidth, this.availableHeight );
      }
    } );

    // Uses DOM so that the text is selectable.
    this.messageListView = new MessageListView( model );
    this.domLayer.addChild( this.messageListView );

    this.messageListView.layoutEmitter.addListener( () => {
      this.layout( this.availableWidth, this.availableHeight );
    } );
  }

  layout( width: number, height: number ): void {
    this.availableWidth = width;
    this.availableHeight = height;

    this.welcomeText.centerX = width / 2;
    this.welcomeText.centerY = height / 2;

    this.chatInput.centerX = width / 2;
    this.chatInput.bottom = height - 50;

    this.messageListView.centerX = width / 2;
    this.messageListView.top = 50;
  }

  step( dt: number ): void {

    // update the view based on the model
  }
}