import { DOM, Node, Rectangle } from 'phet-lib/scenery';
import { IntentionalAny } from '../types';
import _ from 'lodash';
import { Emitter } from 'phet-lib/axon';

export default class CustomDOMNode extends Node {
  public readonly layoutEmitter: Emitter = new Emitter();
  private readonly layoutElement: HTMLElement;

  public readonly parentElement: HTMLElement;

  public constructor( providedOptions?: IntentionalAny ) {

    const options = _.merge( {

      // Dimensions of the scrollable parent, dictating how much space it will take up and its size
      // before scrolling is necessary
      domWidth: '850px',
      domHeight: '500px'
    }, providedOptions );

    super( providedOptions );

    // The bounds of the DOM element are behaving oddly. This rectangle will surround the element
    // for correct mouse/touch areas and layout for positioning in scenery
    const layoutRectangle = new Rectangle( 0, 0, 0, 0, { fill: 'rgba(255,255,255,0.0)' } );
    this.addChild( layoutRectangle );

    // A parent with dimensions for scenery - this is necessary for layout to work (display attribute is
    // particularly important)
    this.layoutElement = document.createElement( 'div' );
    this.layoutElement.style.display = 'inline-block';
    this.layoutElement.style.height = options.domHeight;
    this.layoutElement.style.width = options.domWidth;

    const parentNode = new DOM( this.layoutElement );
    layoutRectangle.addChild( parentNode );

    // Add children to this Node
    this.parentElement = document.createElement( 'div' );
    this.layoutElement.appendChild( this.parentElement );

    // Scenery doesn't set the correct touch areas for the element - manually update them when the DOM element resizes
    const resizeObserver = new ResizeObserver( entries => {
      const entry = entries[ 0 ];
      const { width, height } = entry.contentRect;
      layoutRectangle.setRect( 0, 0, width, height );
      this.layoutEmitter.emit();
    } );
    resizeObserver.observe( this.parentElement );
  }

  public setDOMWidth( width: number ): void {
    this.layoutElement.style.width = `${width}px`;
  }

  public setDOMHeight( height: number ): void {
    this.layoutElement.style.height = `${height}px`;
  }
}