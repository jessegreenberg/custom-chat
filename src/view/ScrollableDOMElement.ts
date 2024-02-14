import { Emitter } from 'phet-lib/axon';
import { DOM, Node, Rectangle } from 'phet-lib/scenery';
import { IntentionalAny } from '../types.js';
import _ from 'lodash';

export default class ScrollableDOMElement extends Node {
  public readonly layoutEmitter: Emitter = new Emitter();

  // A reference to a parent DOM element - when you create DOM Nodes, add them to this one.
  public readonly parentElement: HTMLElement;

  private readonly layoutElement: HTMLElement;

  constructor( providedOptions?: IntentionalAny ) {

    const options = _.merge( {

      // Dimensions of the scrollable parent, dictating how much space it will take up and its size
      // before scrolling is necessary
      width: '850px',
      height: '500px'
    }, providedOptions );

    super();

    // The bounds of the DOM element are behaving oddly. This rectangle will surround the element
    // for correct mouse/touch areas and layout for positioning in scenery
    const layoutRectangle = new Rectangle( 0, 0, 0, 0, { fill: 'rgba(255,255,255,0.0)' } );
    this.addChild( layoutRectangle );

    // A parent with dimensions for scenery - this is necessary for layout to work (display attribute is
    // particularly important)
    this.layoutElement = document.createElement( 'div' );
    this.layoutElement.style.display = 'inline-block';
    this.layoutElement.style.height = options.height;
    this.layoutElement.style.width = options.width;

    const parentNode = new DOM( this.layoutElement );
    layoutRectangle.addChild( parentNode );

    // A parent for content so we can get free scrollbars
    this.parentElement = document.createElement( 'div' );
    this.parentElement.className = 'scrollable';
    this.parentElement.style.height = '100%';
    this.parentElement.style.overflowY = 'auto';
    this.parentElement.style.scrollbarGutter = 'stable';
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

  /**
   * Scroll to the bottom of the parent element.
   */
  public scrollToBottom(): void {
    this.parentElement.scrollTop = this.parentElement.scrollHeight;
  }

  /**
   * Updates the scroll height - the amount of vertical space this will take up.
   */
  public setScrollHeight( height: number ): void {
    this.parentElement.style.height = height + 'px';
  }
}