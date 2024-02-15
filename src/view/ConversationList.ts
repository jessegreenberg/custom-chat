import ScrollableDOMElement from './ScrollableDOMElement.ts';
import ChatModel from '../model/ChatModel.ts';
import Constants from '../Constants.ts';
import Conversation from '../model/Conversation.ts';
import StyledButton from './StyledButton.ts';

export default class ConversationList extends ScrollableDOMElement {

  public constructor( model: ChatModel ) {
    super( {
      width: '225px'
    } );

    this.parentElement.style.textAlign = 'center';

    const conversationButton = new StyledButton( {
      label: 'New Conversation',
      width: '190px',
      onclick: () => {
        model.createNewConversation();
      }
    } );
    const newConversationButton = conversationButton.domElement;

    this.parentElement.appendChild( newConversationButton );

    const separator = document.createElement( 'hr' );
    separator.style.backgroundColor = Constants.TEXT_COLOR;
    this.parentElement.appendChild( separator );

    // Just to order the conversations
    const conversationParent = document.createElement( 'div' );
    this.parentElement.appendChild( conversationParent );

    const addConversation = ( conversation: Conversation ) => {
      const buttonElement = new StyledButton( {
        label: conversation.nameProperty.value,
        width: '190px',
        onclick: () => {
          model.activateConversation( conversation );
        }
      } );

      const nameListener = ( name: string ) => {
        buttonElement.domElement.textContent = name;
        buttonElement.domElement.title = name;
      };
      conversation.nameProperty.link( nameListener );

      // Add the button to the front of the conversation parent
      conversationParent.insertBefore( buttonElement.domElement, conversationParent.firstChild );

      // Makes the button look selected for the selected conversation.
      const activeConversationListener = ( activeConversation: Conversation | null ) => {
        if ( activeConversation === conversation ) {
          buttonElement.domElement.style.border = `1px solid ${Constants.TEXT_COLOR}`;
        }
        else {
          buttonElement.domElement.style.border = 'none';
        }
      }
      model.activeConversationProperty.link( activeConversationListener );

      const removalListener = ( removedConversation: Conversation ) => {
        if ( conversation === removedConversation ) {
          conversationParent.removeChild( buttonElement.domElement );
          model.conversations.removeItemRemovedListener( removalListener );
          model.activeConversationProperty.unlink( activeConversationListener );
          conversation.nameProperty.unlink( nameListener );
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