import { DOM, Font, KeyboardUtils, Node, Rectangle, SceneryEvent } from 'phet-lib/scenery';
import { Emitter } from 'phet-lib/axon';
import { IntentionalAny } from '../types.js';
import _ from 'lodash';

// The type for the DOM element, sets how it handles values or renders characters
export type TextInputType = 'text' | 'string' | 'password';

class TextInput extends Node {

  public readonly domInputType: string;
  public valueSubmittedEmitter: Emitter<string[]>;
  public readonly valueChangedEmitter: Emitter<string[]>;
  public readonly layoutChangeEmitter = new Emitter();
  public readonly domElement: HTMLInputElement | HTMLTextAreaElement;
  private readonly disposeTextInput: () => void;

  public constructor( options?: IntentionalAny ) {

    options = _.merge( {

      // If true, this will be a text area instead
      multiline: false,

      // How many rows this text area should use.
      // Note: I don't have cols here because width seems more accurate for layout.
      // TODO: Consider setting height directly instead of rows.
      rows: 1,

      backgroundColor: 'white',
      color: 'black',

      // Sets the type on the DOM element, changing how characters are rendered or received.
      domInputType: 'text', // 'text' | 'number' | 'password'

      // If true, only letter characters can be used/typed
      onlyLetters: false,

      // IF true, you cannot edit the text input, but you shoudl still be able to select text within it
      readonly: false,

      hideOutline: false,

      // The number of characers to display, controlling the width of the element.
      // Since this is the number of characters, the size will be dependent on the
      // font and the width.
      width: null,

      // A string to put in the text element to prompt the user of the content, and
      // describe what this input element is for. When there is a non-empty value
      // the placeholder is hidden.
      placeholder: null,

      // Font for the text content. Changing the size of the font will change the
      // size of the overall element.
      font: new Font( { size: 16 } ),

      // An initial value for the component. If you provide this, the placeholder won't
      // be seen until the the value is cleared.
      initialText: ''
    }, options );

    super( options );

    // The bounds of the DOM element are behaving oddly. This rectangle will surround the element
    // for correct mouse/touch areas and layout for positioning in scenery
    const layoutRectangle = new Rectangle( 0, 0, 0, 0, { fill: 'rgba(255,255,255,0.5)' } );
    this.addChild( layoutRectangle );

    this.domInputType = options.domInputType;

    // When a new text value is submitted, emit this event to indicate a saved change.
    this.valueSubmittedEmitter = new Emitter( { parameters: [ { valueType: 'string' } ] } );
    this.valueChangedEmitter = new Emitter( { parameters: [ { valueType: 'string' } ] } );

    let domElement: HTMLInputElement | HTMLTextAreaElement;
    if ( options.multiline ) {
      domElement = document.createElement( 'textarea' );
      domElement.rows = options.rows;
      domElement.style.resize = 'none';
    }
    else {
      domElement = document.createElement( 'input' );
      domElement.type = options.domInputType;

      if ( options.width ) {
        domElement.size = options.width;
      }

      domElement.style.appearance = 'textfield';
    }

    layoutRectangle.addChild( new DOM( domElement ) );
    domElement.value = options.initialText;

    if ( options.onlyLetters ) {
      domElement.onkeydown = event => {
        return /[a-z]/i.test( event.key );
      };
    }

    // styling
    domElement.style.fontSize = options.font.size;
    domElement.style.fontFamily = options.font.family;
    domElement.style.margin = '0px';
    if ( options.readonly ) {
      domElement.readOnly = true;
    }
    domElement.style.backgroundColor = options.backgroundColor;
    domElement.style.color = options.color;

    if ( options.placeholder ) {
      domElement.placeholder = options.placeholder;
    }

    if ( options.hideOutline ) {
      domElement.style.border = 'none';
      domElement.style.outline = 'none';
    }

    // Emit events whenever the value of the component changes
    const boundHandleInput = this.handleInputEvent.bind( this );
    domElement.addEventListener( 'input', boundHandleInput );

    // Scenery doesn't set the correct touch areas for the element - manually update them when the DOM element resizes
    const resizeObserver = new ResizeObserver( entries => {
      const entry = entries[ 0 ];
      const { width, height } = entry.contentRect;
      layoutRectangle.setRect( 0, 0, width, height );
      this.layoutChangeEmitter.emit();
    } );
    resizeObserver.observe( domElement );

    // input listener
    this.addInputListener( {
      down: ( event: SceneryEvent ) => {


        // by focusing the DOM element, we can edit the text directly getting features like
        // edit cursor
        // text addition/deletion
        // text selection
        // copy/paste
        // line wrap, extension beyond background
        // text scrolling
        // all for free!
        // But only do this if we don't already have focus, otherwise we'll lose the selection
        if ( document.activeElement !== domElement ) {
          domElement.focus();
        }
        else {

          // otherwise, forward the event with the correct global point to the DOM element so that the cursor is placed
          // at the desired location
          const globalPoint = event.pointer.point;
          const domEvent = new MouseEvent( 'mousedown', {
            clientX: globalPoint.x,
            clientY: globalPoint.y,
            bubbles: true,
            cancelable: true
          } );
          domElement.dispatchEvent( domEvent );
        }
      }
    } );

    domElement.addEventListener( 'keydown', event => {

      // @ts-ignore - Unclear why code is not available
      if ( event.code === KeyboardUtils.KEY_ENTER && !event.shiftKey ) {
        event.preventDefault();
        this.valueSubmittedEmitter.emit( domElement.value );
        domElement.blur();

        // clear the value after submission
        this.setValue( '' );
      }
    } );

    this.domElement = domElement;

    this.disposeTextInput = () => {
      domElement.removeEventListener( 'input', boundHandleInput );
      resizeObserver.disconnect();

      // detaches all client listeners
      this.valueChangedEmitter.dispose();
      this.valueSubmittedEmitter.dispose();
    };
  }

  public dispose(): void {
    this.disposeTextInput();
  }

  public setValue( value: string ): void {
    this.domElement.value = value;
  }

  /**
   * Notifies listeners when there is an input event.
   */
  private handleInputEvent(): void {
    this.valueChangedEmitter.emit( this.getElementValue() );
  }

  public setWidth( width: number ): void {
    this.domElement.style.width = width + 'px';
  }

  /**
   * If this is meant for numbers, convert the value to number since the DOM element will use a string.
   */
  public getElementValue(): string {
    return this.domElement.value;
  }
}

export default TextInput;