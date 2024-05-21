import StyledButtonNode from './StyledButtonNode.ts';
import { Node, Text } from 'phet-lib/scenery';
import { Property } from 'phet-lib/axon';

export default class UploadImageButton extends Node {

  // A base64 encoded value of the uploaded image. Will be included in the prompt if sent.
  public readonly uploadValueProperty = new Property<string>( '' );

  public constructor() {
    const uploadButton = new StyledButtonNode( {
      label: '🖼', // an upload icon,
      fontSize: '40px',
      width: '75px',
      height: '75px',

      onclick: () => {

        // let the user select a file
        const fileInput = document.createElement( 'input' );
        fileInput.type = 'file';
        fileInput.accept = 'image/*';

        // clear the selected file when the user cancels the file selection
        fileInput.addEventListener( 'cancel', () => {
          this.uploadValueProperty.value = '';
        } );

        // when the user selects a file, upload it
        fileInput.addEventListener( 'change', () => {
          const file = fileInput.files && fileInput.files[ 0 ];
          if ( file ) {
            const reader = new FileReader();
            reader.onload = ( event: ProgressEvent<FileReader> ) => {
              if ( event.target && typeof event.target.result === 'string' ) {
                this.uploadValueProperty.value = event.target.result.split( ',' )[ 1 ];
              }
            };
            reader.readAsDataURL( file );
          }
          else {
            this.uploadValueProperty.value = '';
          }
        } );

        fileInput.click();
      }
    } );

    // A check mark icon that indicates that there is an uploaded file
    const uploadIcon = new Text( '✓', {
      font: 'bold 30px Arial',
      fill: 'green',
      centerX: 0,
      centerY: 0
    } );

    super();

    this.children = [ uploadButton, uploadIcon ];

    uploadIcon.rightBottom = uploadButton.rightBottom.minusXY( 1, 1 );

    this.uploadValueProperty.link( value => {
      uploadIcon.visible = value !== '';
    } );
  }
}