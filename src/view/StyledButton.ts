import { IntentionalAny } from '../types.js';
import Constants from '../Constants.ts';
import _ from 'lodash';


export default class StyledButton {
  public readonly domElement: HTMLButtonElement;

  public constructor( providedOptions?: IntentionalAny ) {

    const options = _.merge( {
      label: 'Button',
      fontSize: Constants.FONT.size,
      fontFamily: Constants.FONT.family,
      color: Constants.TEXT_COLOR,
      backgroundColor: Constants.BACKGROUND_COLOR_LIGHTER,
      width: '150px',
      height: '30px',

      onclick: () => {}
    }, providedOptions );

    // A label that indicates who wrote the message
    this.domElement = document.createElement( 'button' );
    this.domElement.textContent = options.label;
    this.domElement.style.fontSize = options.fontSize;
    this.domElement.style.fontFamily = options.fontFamily;
    this.domElement.style.backgroundColor = options.backgroundColor;
    this.domElement.style.color = options.color;
    this.domElement.style.width = options.width;
    this.domElement.style.height = options.height;
    this.domElement.style.textOverflow = 'ellipsis';
    this.domElement.style.overflow = 'hidden';
    this.domElement.style.whiteSpace = 'nowrap';
    this.domElement.style.paddingTop = '5px';
    this.domElement.style.paddingBottom = '5px';
    this.domElement.style.marginTop = '2px';
    this.domElement.style.marginBottom = '2px';
    this.domElement.style.cursor = 'pointer';

    // make it brighter when hovered over
    this.domElement.addEventListener( 'mouseenter', () => {
      this.domElement.style.backgroundColor = Constants.BACKGROUND_COLOR_OVER;
    } );
    this.domElement.addEventListener( 'mouseleave', () => {
      this.domElement.style.backgroundColor = options.backgroundColor;
    } );

    this.domElement.onclick = options.onclick;

    // make the button look flat
    this.domElement.style.border = 'none';
    this.domElement.style.outline = 'none';
    this.domElement.style.borderRadius = '3px';
  }
}