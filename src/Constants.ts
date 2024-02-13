import { Font } from 'phet-lib/scenery';

export default class Constants {
  public static readonly DEFAULT_STEP_BUTTON_TOUCH_AREA_DILATION: number = 5;
  public static readonly DEFAULT_BUTTON_RADIUS: number = 15;
  public static readonly DEFAULT_STEP_BUTTON_RADIUS: number = 15;

  public static readonly BACKGROUND_COLOR: string = '#171717';
  public static readonly BACKGROUND_COLOR_DARKER: string = '#0d0d0d';

  public static readonly TEXT_COLOR: string = '#f9f9f9';

  public static readonly FONT = new Font( {
    family: 'sans-serif',
    size: 25,
  } );
}