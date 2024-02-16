import { Font, Text } from 'phet-lib/scenery';

const FONT = new Font( {
  family: 'sans-serif',
  size: 16
} );

// Width of a single character in the font, for layout purposes
const dummyText = new Text( 'A', { font: FONT } );
const CHARACTER_WIDTH = dummyText.width;

export default class Constants {

  public static readonly BACKGROUND_COLOR: string = '#303030'; // Deep gray, similar to Material-UI dark background
  public static readonly BACKGROUND_COLOR_DARKER: string = '#212121'; // Even deeper gray for contrasted backdrops
  public static readonly BACKGROUND_COLOR_LIGHTER: string = '#424242'; // Lighter gray for cards, dialogs, etc.
  public static readonly BACKGROUND_COLOR_OVER: string = '#616161'; // Slightly lighter for hover and active states

  public static readonly DISABLED_COLOR: string = '#757575'; // Muted gray for disabled text and icons

  public static readonly TEXT_COLOR: string = '#E0E0E0'; // Bright, but not pure white, for main text
  public static readonly TEXT_COLOR_DARKER: string = '#BDBDBD'; // Darker text for secondary information

  public static readonly CODE_COLOR: string = '#80CBC4'; // Soft teal for code, inspired by Material-UI's palette

  public static readonly SCROLLBAR_TRACK_COLOR: string = '#303030'; // Matching the overall background
  public static readonly SCROLLBAR_THUMB_COLOR: string = '#6D6D6D'; // Visible without being distracting
  public static readonly SCROLLBAR_THUMB_COLOR_OVER: string = '#9E9E9E'; // Lighter for indicated interaction
  public static readonly SCROLLBAR_THUMB_COLOR_DOWN: string = '#9E9E9E'; // Consistent with the hover effect

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