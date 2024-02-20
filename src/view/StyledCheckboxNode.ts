import CustomDOMNode from './CustomDOMNode.ts';
import { Node } from 'phet-lib/scenery';
import Constants from '../Constants.ts';
import _ from 'lodash';

export default class StyledCheckboxNode extends Node {
  public constructor( providedOptions: any ) {

    const options = _.merge( {
      label: 'Checkbox',

      property: null,

      // Extra width for longer labels
      width: '400px',
      height: '30px',

      // @ts-ignore - because the event is unused
      onclick: ( event: Event, checked: boolean ) => {

      }
    }, providedOptions );
    super();

    const customDOMNode = new CustomDOMNode( {
      domWidth: options.width,
      domHeight: options.height
    } );

    const parentElement = document.createElement( 'div' );
    parentElement.style.display = 'inline-block';

    const checkboxElement = document.createElement( 'input' );
    checkboxElement.setAttribute( 'type', 'checkbox' );
    checkboxElement.id = Math.random().toString();

    parentElement.addEventListener( 'click', event => {
      options.onclick( event, checkboxElement.checked );
    } );
    parentElement.appendChild( checkboxElement );

    const labelElement = document.createElement( 'label' )
    labelElement.htmlFor = checkboxElement.id;
    labelElement.textContent = options.label;
    labelElement.style.color = Constants.TEXT_COLOR;
    labelElement.style.fontFamily = Constants.FONT.family;
    labelElement.style.fontSize = Constants.FONT.size;
    labelElement.style.paddingLeft = '10px';
    parentElement.appendChild( labelElement );

    customDOMNode.parentElement.appendChild( parentElement );
    this.addChild( customDOMNode );

    if ( options.property ) {
      options.property.link( ( checked: boolean ) => {
        checkboxElement.checked = checked;
      } );
    }
  }
}