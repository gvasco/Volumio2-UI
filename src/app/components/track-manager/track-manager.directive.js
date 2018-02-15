class TrackManagerDirective {
  constructor(themeManager, $log) {
    'ngInject';

    let directive = {
      restrict: 'E',
      templateUrl: themeManager.getHtmlPath('track-manager', 'components/track-manager'),
      scope: {
        type: '@'
      },
      link: linkFunc,
      controller: TrackManagerController,
      controllerAs: 'trackManager',
      bindToController: true
    };
    return directive;

    function linkFunc(scope, el, attr, trackManagerController) {
      let
        mouseupListener = () => {
          $log.debug('up', trackManagerController.playerService.seekPercent);
          trackManagerController.playerService.seek = trackManagerController.playerService.seekPercent;
        },
        mousedownListener = () => {
          $log.debug('down');
          trackManagerController.playerService.stopSeek();
        },
        trackManagerHandler;
      if (trackManagerController.type === 'slider') {
        setTimeout(() => {
          trackManagerHandler = el.find('.slider-handle')[0];
          if (trackManagerHandler) {
            trackManagerHandler.addEventListener('mousedown', mousedownListener, true);
            trackManagerHandler.addEventListener('mouseup', mouseupListener, true);
          }
        });
      } else if (trackManagerController.type === 'knob') {}

      scope.$on('$destroy', () => {
        if (trackManagerController.matchMediaHandler) {
          trackManagerController.matchMediaHandler();
          $log.debug('destroyedMatchmedia');
        }
        if (trackManagerHandler && trackManagerController.type === 'slider') {
          trackManagerHandler.removeEventListener('mousedown', mousedownListener, true);
          trackManagerHandler.removeEventListener('mouseup', mouseupListener, true);
        }
      });
    }
  }
}

class TrackManagerController {
  constructor(
      $element, playerService, $timeout, modalService, matchmedia, socketService, $scope, themeManager,
      matchmediaService, $log, uiSettingsService) {
    'ngInject';
    this.playerService = playerService;
    this.modalService = modalService;
    this.socketService = socketService;
    this.matchmediaService = matchmediaService;
    this.themeManager = themeManager;
    this.$timeout = $timeout;
    this.uiSettingsService = uiSettingsService;
    this.$scope = $scope;
    this.$log = $log;

    this.initWatchers();
  }

  initWatchers() {
    this.$scope.$watch(() => {
      return this.playerService.state && this.playerService.state.albumart;
    }, (newVal) => {
      if (this.matchmediaService.isPhone) {
        let albumArtUrl = `url('${this.playerService.getAlbumart(newVal)}')`;
        this.backgroundAlbumArtStyle = {
          'background-image': albumArtUrl
        };
      } else {
        this.backgroundAlbumArtStyle = {};
      }
    });

    this.$scope.$watch(() => this.matchmediaService.isPhone, (newVal) => {
      console.info(this.matchmediaService.isPhone);
      if (this.matchmediaService.isPhone) {
        let albumart = this.playerService.state && this.playerService.state.albumart;
        if (albumart) {
          let albumArtUrl = `url('${this.playerService.getAlbumart(albumart)}')`;
          this.backgroundAlbumArtStyle = {
            'background-image': albumArtUrl
          };
        }
      } else {
        this.backgroundAlbumArtStyle = {};
      }
      this._initKnob(this.matchmediaService.isPhone);
    });
  }

  _initKnob(isPhone) {
    if (this.type !== 'knob') {
      return;
    }
    this.knobOptions = {
      min: 0,
      max: 1001,
      fgColor: this.themeManager.getCssValue('color'),
      bgColor: this.themeManager.getCssValue('backgroundColor'),
      width: 210,
      height: 210,
      displayInput: false,
      step: 1,
      angleOffset: 0,
      angleArc: 360,
      thickness: ((isPhone) ?
          this.uiSettingsService.uiSettings.knobThicknessMobile :
          this.uiSettingsService.uiSettings.knobThicknessDesktop) || 0.2
    };

    this.onChange = (value) => {
      this.$timeout.cancel(this.timeoutHandler);
      this.timeoutHandler = this.$timeout(() => {
        this.$log.debug('track manager', value);
        this.playerService.stopSeek();
        this.playerService.seek = value;
      }, 200, false);
    };
  }
}

export default TrackManagerDirective;
