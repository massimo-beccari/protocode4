/*
 templates/constraint/index.hbs
 */
App.ConstraintIndexController = Ember.ObjectController.extend(App.Saveable, {
    needs: ['viewControllers'],

    /*
        Return codes:
        0 - Constraint is valid
        1 - Constraint attributes not valid
        2 - UiControl over-constrained on x-axis
        3 - UiControl over-constrained on y-axis
        4 - Constraint put UiControl out of the window, over the top
        5 - Constraint put UiControl out of the window, under the bottom
        6 - Constraint put UiControl out of the window, before the start
        7 - Constraint put UiControl out of the window, after the end
        8 - Constraint conflict with other constraint on bottom
        9 - Constraint conflict with other constraint on top
        10 - Constraint conflict with other constraint on end
        11 - Constraint conflict with other constraint on start
        12 - Constraint puts control overlapped on other control
        13 - Circular constraints
    */
    areGoodConstraints: function(thisConstraint) {
        // First check: valid properties
        if(thisConstraint.get('layoutEdge') === null || thisConstraint.get('referenceLayoutEdge') === null) {
            return 1;
        }
        if(!(thisConstraint.get('withParent')) && thisConstraint.get('referenceElement') === null) {
            return 1;
        }
        var control = thisConstraint.get('uiPhoneControl');
        var constraints = thisConstraint.get('uiPhoneControl.constraints').without(thisConstraint);
        var isIOS = thisConstraint.get('uiPhoneControl.viewController.application.device.platform') === 'ios';
        // Compute if the viewController has the menu bar
        var currentViewControllerIsMenu = thisConstraint.get('uiPhoneControl.viewController.hasMenu');
        // Check x position over-constrained
        var constrainedX;
        if(thisConstraint.get('layoutEdge') === 'start' || thisConstraint.get('layoutEdge') === 'end') {
            constrainedX = false;
            var alreadyStartEndConstraint = false;
            constraints.forEach(function(constraint) {
                if(constraint.get('layoutEdge') === 'centerX') {
                    constrainedX = true;
                } else if(constraint.get('layoutEdge') === 'start' || constraint.get('layoutEdge') === 'end') {
                    alreadyStartEndConstraint = true;
                }
            });
            if(constrainedX || (alreadyStartEndConstraint && control.get('isWidthConstrained'))) {
                return 2;
            } else if(alreadyStartEndConstraint && control.heightIsBindedByConstraints(constraints) && control.get('isRatioConstrained')) {
                return 2;
            }
        } else if(thisConstraint.get('layoutEdge') === 'centerX') {
            constrainedX = false;
            constraints.forEach(function(constraint) {
                if(constraint.get('layoutEdge') === 'start' || constraint.get('layoutEdge') === 'end') {
                    constrainedX = true;
                }
            });
            if(constrainedX) {
                return 2;
            }
        }
        // Check y position over-constrained
        var constrainedY;
        if(thisConstraint.get('layoutEdge') === 'top' || thisConstraint.get('layoutEdge') === 'bottom') {
            constrainedY = false;
            var alreadyTopBottomConstraint = false;
            constraints.forEach(function(constraint) {
                if(constraint.get('layoutEdge') === 'centerY') {
                    constrainedY = true;
                }
                if(constraint.get('layoutEdge') === 'top' || constraint.get('layoutEdge') === 'bottom') {
                    alreadyTopBottomConstraint = true;
                }
            });
            if(constrainedY || (alreadyTopBottomConstraint && control.get('isHeightConstrained'))) {
                return 3;
            } else if(alreadyTopBottomConstraint && control.widthIsBindedByConstraints(constraints) && control.get('isRatioConstrained')) {
                return 3;
            }
        } else if(thisConstraint.get('layoutEdge') === 'centerY') {
            constrainedY = false;
            constraints.forEach(function(constraint) {
                if(constraint.get('layoutEdge') === 'top' || constraint.get('layoutEdge') === 'bottom') {
                    constrainedY = true;
                }
            });
            if(constrainedY) {
                return 3;
            }
        }
        // Check boundaries: top
        var minTop = thisConstraint.get('uiPhoneControl.viewController.application.device.viewTop');
        if(currentViewControllerIsMenu && !isIOS) {
            minTop = minTop + 48;
        }
        if(control.getTopWithMargin(false) < minTop) {
            return 4;
        }
        // Check boundaries: bottom
        var maxBottom = thisConstraint.get('uiPhoneControl.viewController.application.device.viewBottom');
        if(currentViewControllerIsMenu && isIOS) {
            maxBottom = maxBottom - 48;
        }
        if(control.getBottomWithMargin(false) > maxBottom) {
            return 5;
        }
        // Check boundaries: start
        var minStart = 0;
        if(control.getStartWithMargin(false) < minStart) {
            return 6;
        }
        // Check boundaries: end
        var maxEnd = thisConstraint.get('uiPhoneControl.viewController.application.device.screenWidth');
        if(control.getEndWithMargin(false) > maxEnd) {
            return 7;
        }
        // Check conflicts between different constraints
        // Check conflicts on the same axis
        var conflict = false;
        if(thisConstraint.get('layoutEdge') === 'top') {
            constraints.forEach(function(constraint) {
                if(constraint.get('layoutEdge') === 'bottom' && control.getTopWithMargin() > control.getBottomWithMargin()) {
                    conflict = true;
                }
            });
            if(conflict) {
                return 8;
            }
        } else if(thisConstraint.get('layoutEdge') === 'bottom') {
            constraints.forEach(function(constraint) {
                if(constraint.get('layoutEdge') === 'top' && control.getTopWithMargin() > control.getBottomWithMargin()) {
                    conflict = true;
                }
            });
            if(conflict) {
                return 9;
            }
        } else if(thisConstraint.get('layoutEdge') === 'start') {
            constraints.forEach(function(constraint) {
                if(constraint.get('layoutEdge') === 'end' && control.getStartWithMargin() > control.getEndWithMargin()) {
                    conflict = true;
                }
            });
            if(conflict) {
                return 10;
            }
        } else if(thisConstraint.get('layoutEdge') === 'end') {
            constraints.forEach(function(constraint) {
                if(constraint.get('layoutEdge') === 'start' && control.getStartWithMargin() > control.getEndWithMargin()) {
                    conflict = true;
                }
            });
            if(conflict) {
                return 11;
            }
        }
        // Check conflict on different axis
        if(!(thisConstraint.get('withParent')) && thisConstraint.get('layoutEdge') === thisConstraint.get('referenceLayoutEdge')) {
            var equalConstraints = constraints.filter(function(c) {
                return c.get('layoutEdge') === c.get('referenceLayoutEdge');
            });
            if(thisConstraint.get('layoutEdge') === 'top' || thisConstraint.get('layoutEdge') === 'bottom') {
                equalConstraints.forEach(function(constraint) {
                    if(constraint.get('layoutEdge') === 'start' || constraint.get('layoutEdge') === 'end') {
                        conflict = true;
                    }
                });
                if(conflict) {
                    return 12;
                }
            } else if(thisConstraint.get('layoutEdge') === 'start' || thisConstraint.get('layoutEdge') === 'end') {
                equalConstraints.forEach(function(constraint) {
                    if(constraint.get('layoutEdge') === 'top' || constraint.get('layoutEdge') === 'bottom') {
                        conflict = true;
                    }
                });
                if(conflict) {
                    return 12;
                }
            }
        }
        // Check circular constraints
        if(!(thisConstraint.get('withParent'))) {
            var circularity = false;
            var referenceElementConstraints = thisConstraint.get('referenceElement.constraints');
            referenceElementConstraints.forEach(function(c) {
                if(c.get('referenceElement') === control) {
                    circularity = true;
                }
            });
            if(circularity) {
                return 13;
            }
        }
        return 0;
    },

    actions: {
        acceptChanges: function() {
            var constraint = this.get('model');
            var outcome = this.areGoodConstraints(constraint);
            if(outcome !== 0) {
                var message;
                switch(outcome) {
                    case 1:
                        message = "Invalid constraint attributes.\nThis constraint will not be active nor it will be exported in the model.";
                        break;

                    case 2:
                        message = "The control is over-binded on x-axis due to this constraint.\nThis constraint will not be active nor it will be exported in the model.";
                        break;

                    case 3:
                        message = "The control is over-binded on y-axis due to this constraint.\nThis constraint will not be active nor it will be exported in the model.";
                        break;

                    case 4:
                        message = "This constraint puts the control over the top of the screen.\nIt will not be active nor it will be exported in the model.";
                        break;

                    case 5:
                        message = "This constraint puts the control under the bottom of the screen.\nIt will not be active nor it will be exported in the model.";
                        break;

                    case 6:
                        message = "This constraint puts the control before the left edge of the screen.\nIt will not be active nor it will be exported in the model.";
                        break;

                    case 7:
                        message = "This constraint puts the control after the right edge of the screen.\nIt will not be active nor it will be exported in the model.";
                        break;

                    case 8:
                        message = "This constraint is in conflict with another constraint on the bottom edge.\nIt will not be active nor it will be exported in the model.";
                        break;

                    case 9:
                        message = "This constraint is in conflict with another constraint on the top edge.\nIt will not be active nor it will be exported in the model.";
                        break;

                    case 10:
                        message = "This constraint is in conflict with another constraint on the end edge.\nIt will not be active nor it will be exported in the model.";
                        break;

                    case 11:
                        message = "This constraint is in conflict with another constraint on the start edge.\nIt will not be active nor it will be exported in the model.";
                        break;

                    case 12:
                        message = "This constraint puts the control overlapped on another control.\nIt will not be active nor it will be exported in the model.";
                        break;

                    case 13:
                        message = "This constraint's reference element has a constraint with this constraint's control (circularity).\nIt will not be active nor it will be exported in the model.";
                        break;
                }
                alert(message);
            } else {
                constraint.set('valid', true);
                if(constraint.get('referenceElement') !== null) {
                    constraint.get('uiPhoneControl.bindedControls').pushObject(constraint.get('referenceElement'));
                }
            }
            this.set('flag', false);
            this._super();
        },

        delete: function () {
            var constraintToDelete = this.get('model');
            var uiPhoneControl = constraintToDelete.get('uiPhoneControl');
            if(constraintToDelete.get('referenceElement') !== null) {
                uiPhoneControl.get('bindedControls').removeObject(constraintToDelete.get('referenceElement'));
            }
            uiPhoneControl.get('constraints').removeObject(constraintToDelete);
            uiPhoneControl.save();
            this.get('model').deleteRecord();
            this.get('model').save();
            this.transitionToRoute('dispatchUiPhoneControl', uiPhoneControl);
        }
    }

});
