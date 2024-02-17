import { IntentionalAny } from '../types';
import StyledButton from './StyledButton.ts';
import CustomDOMNode from './CustomDOMNode.ts';
import ChatModel from '../model/ChatModel.ts';
import _ from 'lodash';

export default class EditConversationControls extends CustomDOMNode {
  private readonly deleteConversationButton: StyledButton;
  public readonly settingsButton: StyledButton;

  public constructor( model: ChatModel, providedOptions?: IntentionalAny ) {

    const options = _.merge( {
      domWidth: '180px',
      domHeight: '30px'
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

    this.settingsButton = new StyledButton( {
      label: '⚙️',
      width: '50px',
      height: '50px',
      fontSize: '20px',

      onclick: ( event: Event ) => {

        // stop the event here, we don't want the click to reach the window (and immediately hide the settings dialog)
        event.stopPropagation();
        model.settingsVisibleProperty.value = true;
      }
    } );
    this.parentElement.appendChild( this.settingsButton.domElement );

    // use flex display to center the buttons
    this.parentElement.style.display = 'flex';
    this.parentElement.style.justifyContent = 'center';
    this.parentElement.style.alignItems = 'center';
    this.parentElement.style.flexDirection = 'column';
  }
}