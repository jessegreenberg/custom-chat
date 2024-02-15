import { Node, Path } from 'phet-lib/scenery';
import { Shape } from 'phet-lib/kite';
import Constants from '../Constants.ts';
import { IntentionalAny } from '../types';

export default class LoadingIcon extends Node {
  private elapsedTime = 0;

  private readonly loadingNode: Path;
  private readonly darkLoadingNode: Path;

  public constructor( providedOptions?: IntentionalAny ) {
    super( providedOptions );

    const fullRadius = 15; // radius of the full icon
    const circleRadius = 3; // radius of each inner circle

    const loadingShape = new Shape();
    for ( let i = 0; i < 8; i++ ) {
      const x = fullRadius * Math.cos( i * Math.PI / 4 );
      const y = fullRadius * Math.sin( i * Math.PI / 4 );
      loadingShape.moveTo( x, y );
      loadingShape.circle( x, y, circleRadius );
    }

    this.loadingNode = new Path( loadingShape, {
      fill: Constants.TEXT_COLOR
    } );
    this.addChild( this.loadingNode );

    this.darkLoadingNode = new Path( loadingShape, {
      fill: Constants.BACKGROUND_COLOR,
      scale: 0.9
    } );
    this.addChild( this.darkLoadingNode );
  }

  step( dt: number ): void {
    this.elapsedTime += dt;

    // Rotate the loading icon by the elapsed time
    this.loadingNode.rotation = this.elapsedTime * 0.6;
  }
}