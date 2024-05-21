import './main.css';

// NOTE: Can also use direct imports if you have the PhET repos checked out:
// import { Node, Display, Text, VBox, Font, AlignBox, AnimatedPanZoomListener } from '../../scenery/js/imports.ts';
// import TextPushButton from '../../sun/js/buttons/TextPushButton.ts';
// import platform from '../../phet-core/js/platform.ts';
// import NumberProperty from '../../axon/js/NumberProperty.ts';
// import PatternStringProperty from '../../axon/js/PatternStringProperty.ts';
// import StringProperty from '../../axon/js/StringProperty.ts';
// import Property from '../../axon/js/Property.ts';
// import Bounds2 from '../../dot/js/Bounds2.ts';
import { platform } from 'phet-lib/phet-core';
import { Bounds2 } from 'phet-lib/dot';
import { Property } from 'phet-lib/axon';
import { Display, Node } from 'phet-lib/scenery';
import Constants from './Constants';
import ChatModel from './model/ChatModel.ts';
import ChatView from './view/ChatView.ts';

// @ts-ignore
window.assertions.enableAssert();

// For some reason, this must be added FIRST or else the DOM elements will not receive correct input events
// It seems that the order of adding the DOM elements matters, and the first one added will be the one that
// receives input events and is on top.
const domRootNode = new Node();
const domDisplay = new Display( domRootNode, {
  accessibility: false,

  // So that events can go to the other DOM display (particularly important for Text input and selection)
  listenToOnlyElement: false,
  allowCSSHacks: false
} );
document.body.appendChild( domDisplay.domElement );

const scene = new Node();
const rootNode = new Node( {
  children: [ scene ]
} );

const display = new Display( rootNode, {
  backgroundColor: Constants.BACKGROUND_COLOR,

  // So that events can go to the other DOM display (particularly important for Text input and selection)
  listenToOnlyElement: false,
  allowCSSHacks: false
} );
document.body.appendChild( display.domElement );

const layoutBoundsProperty = new Property( new Bounds2( 0, 0, window.innerWidth, window.innerHeight ) );

// Set up the model and view - the entry point for the application
const model = new ChatModel();
const view = new ChatView( model );
scene.addChild( view );

// @ts-expect-error - for debugging, expose the model to the window
window.chatModel = model;

// load the model (after the view has been fully initialized)
model.load();

// Add DOM specific elements to the DOM display.
domRootNode.children = [ view.domLayer ];

let resizePending = true;
const resize = () => {
  resizePending = false;

  const layoutBounds = new Bounds2( 0, 0, window.innerWidth, window.innerHeight );
  display.setWidthHeight( layoutBounds.width, layoutBounds.height );
  domDisplay.setWidthHeight( layoutBounds.width, layoutBounds.height );
  layoutBoundsProperty.value = layoutBounds;

  if ( platform.mobileSafari ) {
    window.scrollTo( 0, 0 );
  }

  view.layout( layoutBounds.width, layoutBounds.height );
};

const resizeListener = () => { resizePending = true; }
$( window ).resize( resizeListener );
window.addEventListener( 'resize', resizeListener );
window.addEventListener( 'orientationchange', resizeListener );
window.visualViewport && window.visualViewport.addEventListener( 'resize', resizeListener );
resize();

domDisplay.updateOnRequestAnimationFrame();
display.updateOnRequestAnimationFrame( dt => {
  if ( resizePending ) {
    resize();
  }

  model.step( dt );
  view.step( dt );
} );

// "rev" the speech synthesis engine to try and get the first output sounding better
const revListener = () => {
  speechSynthesis.speak( new SpeechSynthesisUtterance( '' ) );
  window.removeEventListener( 'click', revListener );
}
window.addEventListener( 'click', revListener );

// Stop all speech when the window refreshes
window.addEventListener( 'beforeunload', () => {
  speechSynthesis.cancel();
} );