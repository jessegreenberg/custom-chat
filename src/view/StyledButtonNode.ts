import CustomDOMNode from './CustomDOMNode.ts';
import StyledButton from './StyledButton.ts';
import Constants from '../Constants.ts';
import _ from 'lodash';
import { Node } from 'phet-lib/scenery';

export default class StyledButtonNode extends Node {
  public constructor( providedOptions: any ) {
    const options = _.merge( {
      label: 'Button',
      fontSize: Constants.FONT.size,
      fontFamily: Constants.FONT.family,
      width: '150px',
      height: '30px',

      // @ts-ignore - because the event is unused
      onclick: ( event: Event ) => {}
    }, providedOptions );

    super( options );

    const customDOMNode = new CustomDOMNode( {
      domWidth: options.width,
      domHeight: options.height
    } );
    const styledButton = new StyledButton( {
      label: options.label,
      fontSize: options.fontSize,
      fontFamily: options.fontFamily,
      width: options.width,
      height: options.height,
      onclick: options.onclick
    } );

    customDOMNode.parentElement.appendChild( styledButton.domElement );
    this.addChild( customDOMNode );
  }
}