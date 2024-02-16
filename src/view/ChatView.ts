import { Node, Text } from 'phet-lib/scenery';
import ChatModel from '../model/ChatModel.ts';
import Constants from '../Constants.ts';
import TextInput from './TextInput.ts';
import MessageListView from './MessageListView.ts';
import LoadingIcon from './LoadingIcon.ts';
import ConversationList from './ConversationList.ts';
import EditConversationControls from './EditConversationControls.ts';

export default class ChatView extends Node {

  private readonly welcomeText: Text;
  private readonly chatInput: TextInput;
  private readonly messageListView: MessageListView;
  private readonly loadingIcon: LoadingIcon;
  private readonly conversationList: ConversationList;
  private readonly editConversationControls: EditConversationControls;

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
      rows: 6,
      cols: 100,
      backgroundColor: Constants.BACKGROUND_COLOR,
      color: Constants.TEXT_COLOR,
      font: Constants.FONT
    } );
    this.domLayer.addChild( this.chatInput );

    this.loadingIcon = new LoadingIcon( {
      visibleProperty: model.isWaitingForResponseProperty
    } );
    this.addChild( this.loadingIcon );

    this.chatInput.layoutChangeEmitter.addListener( () => {
      this.layout( this.availableWidth, this.availableHeight );
    } );

    // Uses DOM so that the text is selectable.
    this.messageListView = new MessageListView( model );
    this.domLayer.addChild( this.messageListView );

    this.conversationList = new ConversationList( model );
    this.domLayer.addChild( this.conversationList );

    this.editConversationControls = new EditConversationControls( model );
    this.domLayer.addChild( this.editConversationControls );

    this.chatInput.valueSubmittedEmitter.addListener( ( value: string ) => {
      model.sendMessage( value );
    } );

    model.messages.lengthProperty.link( ( length: number ) => {
      this.welcomeText.visible = length === 0;
      if ( length > 0 ) {

        // relayout the view
        this.layout( this.availableWidth, this.availableHeight );
      }
    } );

    model.activeConversationProperty.link( () => {
      this.layout( this.availableWidth, this.availableHeight );
    } );

    // Adjust the layout whenever the DOM elements have a size change.
    const messageListLayoutListener = () => {
      this.layoutWithoutResizing();
    }
    this.messageListView.layoutEmitter.addListener( messageListLayoutListener );
    const conversationListLayoutListener = () => {
      this.layoutWithoutResizing();
    }
    this.conversationList.layoutEmitter.addListener( conversationListLayoutListener );
    const editConversationControlsLayoutListener = () => {
      this.layoutWithoutResizing();
    };
    this.editConversationControls.layoutEmitter.addListener( editConversationControlsLayoutListener );
  }

  /**
   * Reposition components, assuming that they have been resized correctly. Doing both layout and resizing
   * in the same function can cause infinite loops when adjusting layout in response to resizing.
   */
  layoutWithoutResizing(): void {
    const width = this.availableWidth;
    const height = this.availableHeight;

    this.availableWidth = width;
    this.availableHeight = height;

    const chatWidth = width - this.conversationList.width - 3 * Constants.UI_MARGIN;
    const chatCenter = this.conversationList.right + Constants.UI_MARGIN + chatWidth / 2;

    this.chatInput.centerX = chatCenter;
    this.chatInput.bottom = height - Constants.UI_MARGIN;

    this.loadingIcon.centerX = chatCenter;
    this.loadingIcon.bottom = this.chatInput.top - Constants.UI_MARGIN / 2;

    this.welcomeText.centerX = chatCenter;
    this.welcomeText.bottom = this.chatInput.top - Constants.UI_MARGIN;

    this.messageListView.centerX = chatCenter;
    this.messageListView.top = Constants.UI_MARGIN;

    this.conversationList.left = Constants.UI_MARGIN;
    this.conversationList.top = Constants.UI_MARGIN;

    this.conversationList.setScrollHeight( this.chatInput.top - Constants.UI_MARGIN );

    this.editConversationControls.centerX = this.conversationList.centerX;
    this.editConversationControls.centerY = this.chatInput.centerY;
  }


  /**
   * Adjust the sizing of components within the viewport and reposition them.
   */
  layout( width: number, height: number ): void {
    this.availableWidth = width;
    this.availableHeight = height;

    // The width of the chat area - the full width minus the conversation list and some margin on each side
    // of the UI components
    const chatWidth = width - this.conversationList.width - 3 * Constants.UI_MARGIN;
    const chatCenter = this.conversationList.right + Constants.UI_MARGIN + chatWidth / 2;
    this.chatInput.setWidth( chatWidth );

    this.chatInput.centerX = chatCenter;
    this.chatInput.bottom = height - Constants.UI_MARGIN;

    this.messageListView.setLayoutWidth( chatWidth );
    this.messageListView.setScrollHeight( height - this.chatInput.height - this.loadingIcon.height - Constants.UI_MARGIN * 3 );
    this.messageListView.scrollToBottom();

    this.conversationList.setScrollHeight( this.chatInput.top - Constants.UI_MARGIN );

    this.layoutWithoutResizing();
  }

  step( dt: number ): void {
    this.loadingIcon.step( dt );
  }
}