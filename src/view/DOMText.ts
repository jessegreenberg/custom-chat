import { DOM, Font, Node, Rectangle } from 'phet-lib/scenery';
import { IntentionalAny } from '../types.js';
import _ from 'lodash';
import { Emitter } from 'phet-lib/axon';

export default class DOMText extends Node {

  public readonly layoutChangeEmitter = new Emitter();

  public constructor( string: string, providedOptions: IntentionalAny ) {
    super();

    const options = _.merge( {
      font: new Font( { size: 16 } ),
      fill: 'white'
    }, providedOptions );

    // Create the text element
    const textElement = document.createElement( 'p' );
    textElement.textContent = string;
    textElement.style.fontSize = options.font.size;
    textElement.style.fontFamily = options.font.family;
    textElement.style.margin = '0px';
    textElement.style.color = options.fill;
    textElement.style.display = 'inline-block';

    // The bounds of the DOM element are behaving oddly. This rectangle will surround the element
    // for correct mouse/touch areas and layout for positioning in scenery
    const layoutRectangle = new Rectangle( 0, 0, 0, 0, { fill: 'rgba(255,255,255,0.0)' } );
    this.addChild( layoutRectangle );

    const domNode = new DOM( textElement );
    layoutRectangle.addChild( domNode );

    const resizeObserver = new ResizeObserver( entries => {
      const entry = entries[ 0 ];
      const { width, height } = entry.contentRect;

      layoutRectangle.setRect( 0, 0, width, height );
      this.layoutChangeEmitter.emit();
    } );
    resizeObserver.observe( textElement );
  }
}