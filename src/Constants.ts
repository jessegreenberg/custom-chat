import { Font, Text } from 'phet-lib/scenery';

const FONT = new Font( {
  family: 'sans-serif',
  size: 16
} );

// Width of a single character in the font, for layout purposes
const dummyText = new Text( 'A', { font: FONT } );
const CHARACTER_WIDTH = dummyText.width;

export default class Constants {

  public static readonly BACKGROUND_COLOR: string = '#171717';
  public static readonly BACKGROUND_COLOR_DARKER: string = '#0d0d0d';
  public static readonly BACKGROUND_COLOR_LIGHTER: string = '#2b2b2b';
  public static readonly BACKGROUND_COLOR_OVER: string = '#3b3b3b';

  public static readonly DISABLED_COLOR: string = '#A0A0A0';

  public static readonly TEXT_COLOR: string = '#f9f9f9';
  public static readonly TEXT_COLOR_DARKER: string = '#c0c0c0';

  public static readonly CODE_COLOR: string = '#c0c0c0';

  public static readonly SCROLLBAR_TRACK_COLOR: string = '#171717';
  public static readonly SCROLLBAR_THUMB_COLOR: string = '#555555';
  public static readonly SCROLLBAR_THUMB_COLOR_OVER: string = '#c0c0c0';
  public static readonly SCROLLBAR_THUMB_COLOR_DOWN: string = '#555';


  public static readonly FONT = FONT;

  public static readonly CHARACTER_WIDTH = CHARACTER_WIDTH;

  public static UI_MARGIN = 25;

  public static readonly TITLE_FONT = new Font( {
    family: 'sans-serif',
    size: 24
  } );

  public static readonly TEXT_INPUT_OPTIONS = {
    font: Constants.FONT,
    multiline: true,
    backgroundColor: Constants.BACKGROUND_COLOR,
    color: Constants.TEXT_COLOR
  }
}

// assign constants the css style so that they can be used in the css file
document.documentElement.style.setProperty( '--code-color', Constants.CODE_COLOR );
document.documentElement.style.setProperty( '--scrollbar-thumb-color', Constants.SCROLLBAR_THUMB_COLOR );
document.documentElement.style.setProperty( '--scrollbar-thumb-color-over', Constants.SCROLLBAR_THUMB_COLOR_OVER );
document.documentElement.style.setProperty( '--scrollbar-thumb-color-down', Constants.SCROLLBAR_THUMB_COLOR_DOWN );
document.documentElement.style.setProperty( '--scrollbar-track-color', Constants.SCROLLBAR_TRACK_COLOR );