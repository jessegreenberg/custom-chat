import { Node, Rectangle, Text } from 'phet-lib/scenery';
import Constants from '../Constants.ts';
import ChatModel from '../model/ChatModel.ts';
import StyledButtonNode from './StyledButtonNode.ts';
import StyledCheckboxNode from './StyledCheckboxNode.ts';
import StyledSelectNode from './StyledSelectNode.ts';

const PADDING = 10;

export default class SettingsDialog extends Node {
  private readonly backgroundRectangle: Rectangle;
  private readonly closeButtonNode: Node;
  private readonly automaticSpeechCheckbox: Node;
  private readonly useOpenAISpeechCheckbox: Node;
  private readonly modelSelector: StyledSelectNode;
  private readonly fetchModelsButton: StyledButtonNode;

  private readonly settingsHeading: Node;

  private readonly model: ChatModel;

  public constructor( model: ChatModel ) {
    super();
    this.backgroundRectangle = new Rectangle( 0, 0, 0, 0, { fill: Constants.BACKGROUND_COLOR } );
    this.addChild( this.backgroundRectangle );

    this.settingsHeading = new Text( 'Settings', {
      font: Constants.TITLE_FONT,
      fill: Constants.TEXT_COLOR
    } );
    this.addChild( this.settingsHeading );

    this.model = model;

    const closeDOMNode = new StyledButtonNode( {
      label: 'X',
      fontSize: '20px',
      width: '50px',
      height: '50px'
    } );
    this.addChild( closeDOMNode )
    this.closeButtonNode = closeDOMNode;

    // A checkbox for toggling automatic speech
    this.automaticSpeechCheckbox = new StyledCheckboxNode( {
      label: 'Auto-Speak Messages',
      property: model.automaticSpeechEnabledProperty,
      onclick: ( event: Event, checked: boolean ) => {
        event.stopPropagation();
        model.automaticSpeechEnabledProperty.value = checked;

        // save settings when they change
        model.save();
      }
    } );
    this.addChild( this.automaticSpeechCheckbox );

    this.useOpenAISpeechCheckbox = new StyledCheckboxNode( {
      label: 'Use OpenAI Speech (more expensive)',
      property: model.useOpenAISpeechProperty,
      onclick: ( event: Event, checked: boolean ) => {
        event.stopPropagation();
        model.useOpenAISpeechProperty.value = checked;

        // save settings when they change
        model.save();
      }
    } );
    this.addChild( this.useOpenAISpeechCheckbox );

    this.modelSelector = new StyledSelectNode( model.modelProperty, [], {
      label: 'Model:',
      onchange: () => {

        // When a new selection is made, save to local storage
        model.save();
      }
    } );
    this.addChild( this.modelSelector );

    this.fetchModelsButton = new StyledButtonNode( {
      label: 'Fetch Models',
      onclick: ( event: Event ) => {
        event.stopPropagation();
        this.populateModels( true );
      }
    } );
    this.addChild( this.fetchModelsButton )

    this.populateModels();
  }

  private populateModels( refresh = false ): void {

    // This is where we would fetch the models from the server and update the model selector.
    // For now, we are using the DEFAULT_MODELS array defined above.
    this.model.fetchModels( refresh ).then( models => {
      const modelsList = models.map( model => ( { value: model.id, label: model.id } ) );
      this.modelSelector.setOptionsList( modelsList );
    } );
  }

  public resize( width: number, height: number ): void {
    this.backgroundRectangle.setRectWidth( width );
    this.backgroundRectangle.setRectHeight( height );
  }

  public layout(): void {

    this.closeButtonNode.right = this.backgroundRectangle.right - PADDING
    this.closeButtonNode.top = PADDING;

    this.settingsHeading.centerX = this.backgroundRectangle.centerX;
    this.settingsHeading.centerY = this.closeButtonNode.centerY;

    this.automaticSpeechCheckbox.left = PADDING;
    this.automaticSpeechCheckbox.top = this.closeButtonNode.bottom + PADDING;

    this.useOpenAISpeechCheckbox.left = PADDING;
    this.useOpenAISpeechCheckbox.top = this.automaticSpeechCheckbox.bottom + PADDING;

    this.modelSelector.left = PADDING;
    this.modelSelector.top = this.useOpenAISpeechCheckbox.bottom + PADDING;

    this.fetchModelsButton.left = PADDING;
    this.fetchModelsButton.top = this.modelSelector.bottom + PADDING;
  }
}