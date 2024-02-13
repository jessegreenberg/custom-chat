import ScrollableDOMElement from './ScrollableDOMElement.ts';
import ChatModel from '../model/ChatModel.ts';
import Constants from '../Constants.ts';
import Conversation from '../model/Conversation.ts';

export default class ConversationList extends ScrollableDOMElement {

  public constructor( model: ChatModel ) {
    super( {
      width: '180px'
    } );

    this.parentElement.style.textAlign = 'center';

    const newConversationButton = document.createElement( 'button' );
    newConversationButton.textContent = 'New Conversation';
    newConversationButton.style.color = Constants.TEXT_COLOR;
    newConversationButton.style.fontSize = Constants.FONT.size;
    newConversationButton.style.fontFamily = Constants.FONT.family;
    newConversationButton.style.backgroundColor = Constants.BACKGROUND_COLOR_LIGHTER;
    newConversationButton.style.width = '150px';
    newConversationButton.style.cursor = 'pointer';
    newConversationButton.style.paddingBottom = '5px';
    newConversationButton.style.paddingTop = '5px';
    newConversationButton.style.marginTop = '2px';
    newConversationButton.style.marginBottom = '2px';

    newConversationButton.onclick = () => {
      model.createNewConversation();
    };
    this.parentElement.appendChild( newConversationButton );

    const separator = document.createElement( 'hr' );
    separator.style.backgroundColor = Constants.TEXT_COLOR;
    this.parentElement.appendChild( separator );

    // Just to order the conversations
    const conversationParent = document.createElement( 'div' );
    this.parentElement.appendChild( conversationParent );

    const addConversation = ( conversation: Conversation ) => {

      // A label that indicates who wrote the message
      const buttonElement = document.createElement( 'button' );
      buttonElement.textContent = conversation.name;
      buttonElement.style.fontSize = Constants.FONT.size;
      buttonElement.style.fontFamily = Constants.FONT.family;
      buttonElement.style.color = Constants.TEXT_COLOR;
      buttonElement.style.width = '150px';
      buttonElement.style.textOverflow = 'ellipsis';
      buttonElement.style.overflow = 'hidden';
      buttonElement.style.whiteSpace = 'nowrap';
      buttonElement.style.backgroundColor = Constants.BACKGROUND_COLOR_LIGHTER;
      buttonElement.style.color = Constants.TEXT_COLOR;
      buttonElement.style.paddingTop = '5px';
      buttonElement.style.paddingBottom = '5px';
      buttonElement.style.marginTop = '2px';
      buttonElement.style.marginBottom = '2px';
      buttonElement.style.cursor = 'pointer';

      buttonElement.onclick = () => {
        model.activateConversation( conversation );
      };

      // Add the button to the front of the conversation parent
      conversationParent.insertBefore( buttonElement, conversationParent.firstChild );

      const removalListener = ( removedConversation: Conversation ) => {
        if ( conversation === removedConversation ) {
          conversationParent.removeChild( buttonElement );
          model.conversations.removeItemRemovedListener( removalListener );
        }
      };

      model.conversations.addItemRemovedListener( removalListener );
    };

    // Whenever a new conversation is added, add a new button for it and watch for its removal
    model.conversations.addItemAddedListener( ( conversation: Conversation ) => {
      addConversation( conversation );
    } );

    // Add all initial conversations from load
    model.conversations.forEach( addConversation );
  }
}