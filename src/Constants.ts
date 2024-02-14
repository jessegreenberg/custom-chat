import { Font } from 'phet-lib/scenery';

export default class Constants {

  public static readonly BACKGROUND_COLOR: string = '#171717';
  public static readonly BACKGROUND_COLOR_DARKER: string = '#0d0d0d';
  public static readonly BACKGROUND_COLOR_LIGHTER: string = '#2b2b2b';
  public static readonly BACKGROUND_COLOR_OVER: string = '#3b3b3b';

  public static readonly TEXT_COLOR: string = '#f9f9f9';
  public static readonly TEXT_COLOR_DARKER: string = '#c0c0c0';

  public static readonly FONT = new Font( {
    family: 'sans-serif',
    size: 16,
  } );

  public static readonly TITLE_FONT = new Font( {
    family: 'sans-serif',
    size: 24,
  } );

  public static readonly TEXT_INPUT_OPTIONS = {
    font: Constants.FONT,
    multiline: true,
    backgroundColor: Constants.BACKGROUND_COLOR,
    color: Constants.TEXT_COLOR,
  }
}