import { IntentionalAny } from '../types';
import StyledButton from './StyledButton.ts';
import CustomDOMNode from './CustomDOMNode.ts';
import ChatModel from '../model/ChatModel.ts';
import _ from 'lodash';

export default class EditConversationControls extends CustomDOMNode {
  private readonly deleteConversationButton: StyledButton;
  private readonly renameConversationButton: StyledButton;

  public constructor( model: ChatModel, providedOptions?: IntentionalAny ) {

    const options = _.merge( {
      width: '180px',
      height: '30px'
    }, providedOptions );

    super( options );

    this.deleteConversationButton = new StyledButton( {
      label: 'Delete Conversation',
      width: '180px',
      onclick: () => {
        model.deleteActiveConversation();
      }
    } );
    this.parentElement.appendChild( this.deleteConversationButton.domElement );

    // TODO: To be added.
    // this.renameConversationButton = new StyledButton( {
    //   label: 'Rename Conversation',
    //   width: '180px'
    // } );
    // this.parentElement.appendChild( this.renameConversationButton.domElement );
  }
}