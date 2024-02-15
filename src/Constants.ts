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

  public static readonly FONT = FONT;

  public static readonly CHARACTER_WIDTH = CHARACTER_WIDTH;

  public static UI_MARGIN = 50;

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