import Constants from '../Constants.ts';
import CustomDOMNode from './CustomDOMNode.ts';
import { Node } from 'phet-lib/scenery';
import { Property } from 'phet-lib/axon';
import _ from 'lodash';

type OptionsValue = {

  // The label displayed to the user
  label: string,

  // The value for the option
  value: string
};

export default class StyledSelectNode extends Node {
  public constructor( valueProperty: Property<string>, optionsList: OptionsValue[], providedOptions?: any ) {

    const options = _.merge( {
      label: 'Select:',
      fontSize: Constants.FONT.size,
      fontFamily: Constants.FONT.family,
      width: '150px',
      height: '30px',

      // @ts-ignore - because the event is unused
      onchange: ( event: Event ) => {}
    }, providedOptions );
    super();

    const customDOMNode = new CustomDOMNode( {
      domWidth: options.width,
      domHeight: options.height
    } );

    const parentElement = document.createElement( 'div' );
    parentElement.style.display = 'inline-block';
    parentElement.style.fontFamily = options.fontFamily;
    parentElement.style.fontSize = options.fontSize;

    const selectElement = document.createElement( 'select' );
    selectElement.id = Math.random().toString();

    const labelElement = document.createElement( 'label' );
    labelElement.textContent = options.label;
    labelElement.style.color = Constants.TEXT_COLOR;
    labelElement.htmlFor = selectElement.id;
    labelElement.style.display = 'inline-block';
    labelElement.style.marginBottom = '5px';

    parentElement.appendChild( labelElement );
    parentElement.appendChild( selectElement );

    optionsList.forEach( option => {
      const optionElement = document.createElement( 'option' );
      optionElement.textContent = option.label;
      optionElement.value = option.value;
      selectElement.appendChild( optionElement );
    } );

    customDOMNode.parentElement.appendChild( parentElement );
    this.addChild( customDOMNode );

    // For use in modals, we want to make sure the event stops on this component.
    parentElement.addEventListener( 'click', event => {
      event.stopPropagation();
    } );

    // Two-way update: when the select element changes, update the Property and when the Property changes, update
    // the select element value.
    selectElement.addEventListener( 'change', event => {
      valueProperty.value = selectElement.value;
      options.onchange( event );

    } );
    valueProperty.link( value => {
      selectElement.value = value;
    } );
  }
}