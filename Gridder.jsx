//The Gridder
//v1.0 - Initial release
//v1.1 - Expressions, CC fix
//v1.2 - Grid Overlay feature, more robust expressions, code cleanup
//v1.5 - New grid modes - 3D and Circular
//       Duplicator mode
//       Fixed bug with wrong icons folder
//v1.55 -Encapsulation issues solved
//       UndoGroups are working
//       Sliders don't change grid dynamically
//v1.56 -Fixed bug with non-english AE and expressions mode

//by Nik Ska, 2013
//vk.com/ae_exp
//CC-BY 3.0


var gridder = this;
gridder.version = 1.6;
gridder.name = "Gridder";
gridder.texts = {
    gridStepText: "Set grid step:",
    setSp: "Set spacing:",
    square: "Square grid",
    nullControlName: "GRIDDER_Control",
    nullControlName3D: "GRIDDER_Control_3D",
    nullControlNameCirc: "GRIDDER_Control_Circ",
    gridOverlayName: "GRIDDER_Grid_Overlay",
    colorControlName: "Grid Color",
    gridThicknessName: "Grid thickness",
    circModeHeader: "Set circle parameters",
    rotateAll: "Rotate circle",
    spiralText: "Spiral",
    tips: {
        col: "Columns only grid mode",
        row: "Rows only grid mode",
        plane: "Select 3d plane",
        xSpacing: "X axis spacing",
        ySpacing: "Y axis spacing",
        zSpacing: "Z axis spacing",
        angle: "Angle",
        radius: "Radius",
        spiral: "Spiral offset",
        spiralReverse: "Reverse spiral path",
        duplicator: "Toggle Duplicator mode",
        grid: "Create grid overlay layer",
        rect: "Rectangle mode",
        threeD: "3D mode",
        circ: "Circular mode",
        sqGrid: "Square grid",
        gridOverlay: "Create grid overlay layer",
        rotateAll: "Rotate all circle",
    }
};

gridder.selLength = 0;
gridder.selLayers = [];
gridder.undoGroupOpen = false;

gridder.make2DGrid = function(){
    //main function to arrage elements into 2D grid
    var activeComp = app.project.activeItem;

    if(activeComp != null && activeComp instanceof CompItem){
        var selLayers;

        // if(activeComp.selectedLayers.length!=gridder.selLength){
        //     //upon new selection
        //     gridder.selLayers = activeComp.selectedLayers.sort(function(a,b){
        //         return (a.index - b.index)
        //     });
        //     gridder.selLength = gridder.selLayers.length;
        // }

        selLayers = gridder.selLayers;

        app.beginUndoGroup("Make 2D Grid");

        var selLayers = activeComp.selectedLayers;

        if(this.duplicator == true){
            //work in Duplicator mode
            var sel = activeComp.selectedLayers;
            if(sel && sel.length == 1){
                selLayers = this.createDuplicates(sel[0], this.numCols*this.numRows);
            }
        }

        //select more than one layer
        if(selLayers.length>1){
            //set reference position
            var firstPos = selLayers[0].transform.position.value;

            for(var i = 0; i<selLayers.length; i++){

                selLayers[i].threeDLayer = false;
                selLayers[i].transform.rotation.setValue(0);

                if(this.onlyRows == false){
                    if(this.onlyCols == false){
                        //rectangular grid
                        trueIndex = i%(this.numRows*this.numCols);
                    }
                    else{
                        //only columns
                        trueIndex = i;
                    }
                    var thisCol = trueIndex % this.numCols;
                    var thisRow = Math.floor(trueIndex/this.numCols);

                    if(!selLayers[i].transform.position.isTimeVarying){
                        selLayers[i].transform.position.setValue(firstPos+[thisCol*dist[0], thisRow*dist[1]]);
                    }
                    else{
                        selLayers[i].transform.position.setValueAtTime(activeComp.time,firstPos+[thisCol*dist[0], thisRow*dist[1]]);
                    }
                }
                else{
                    //only rows
                    trueIndex = i;
                    var thisCol = trueIndex % this.numRows;
                    var thisRow = Math.floor(trueIndex/this.numRows);
                    if(!selLayers[i].transform.position.isTimeVarying){
                        selLayers[i].transform.position.setValue(firstPos+[thisRow*dist[0], thisCol*dist[1]]);
                    }
                    else{
                        selLayers[i].transform.position.setValueAtTime(activeComp.time,firstPos+[thisRow*dist[0], thisCol*dist[1]]);
                    }
                }
            }
            if(this.gridOverlay){
                this.updateGridOverlay();
            }
        }
        app.endUndoGroup();
    }
}

gridder.make3DGrid = function(){
    var activeComp = app.project.activeItem;

    if(activeComp != null && activeComp instanceof CompItem){
        app.beginUndoGroup("Make 3D Grid");
        var selLayers;

        if(activeComp.selectedLayers.length!=this.selLength){
            //upon new selection
            this.selLayers = activeComp.selectedLayers.sort(function(a,b){
                return (a.index - b.index)
            });
            this.selLength = this.selLayers.length;
        }

        selLayers = this.selLayers;


        if(this.duplicator == true){
            //work in Duplicator mode
            var sel = activeComp.selectedLayers;
            if(sel && sel.length == 1){
                selLayers = this.createDuplicates(sel[0], this.numCols*this.numRows);
            }
        }

        //select more than one layer
        if(selLayers.length>1){
            //set reference position
            var firstPos = selLayers[0].transform.position.value;
            var isCam = 0;
            for(var i = 0; i<selLayers.length; i++){
                if((selLayers[i] instanceof CameraLayer) == false){
                    selLayers[i].threeDLayer = true;
                    selLayers[i].transform.zRotation.setValue(0);

                    trueIndex = i-isCam;
                    var thisZ = Math.floor(trueIndex/(this.numRows*this.numCols));

                    trueIndex = trueIndex%(this.numRows*this.numCols);

                    var thisX = trueIndex % this.numCols;
                    var thisY = Math.floor(trueIndex/this.numCols);

                    if(this.planeSelect == 0) var pV = [thisX*dist3d[0], thisY*dist3d[1], thisZ*dist3d[2]]; //XY
                    else if(this.planeSelect == 1) var pV = [thisZ*dist3d[0], thisY*dist3d[1], thisX*dist3d[2]]; //XZ
                    else if(this.planeSelect == 2) var pV = [thisX*dist3d[0], thisZ*dist3d[1], thisY*dist3d[2]];//YZ


                    if(!selLayers[i].transform.position.isTimeVarying){
                        selLayers[i].transform.position.setValue(firstPos+pV);
                    }
                    else{
                        selLayers[i].transform.position.setValueAtTime(activeComp.time,firstPos+pV);
                    }
                }
                else isCam++;
            }
        }
    }
}


gridder.makeCircGrid = function(){
    var activeComp = app.project.activeItem;

    if(activeComp != null && activeComp instanceof CompItem){
        app.beginUndoGroup("Make Circular Grid");
        var selLayers;

        if(activeComp.selectedLayers.length!=this.selLength){
            //upon new selection
            this.selLayers = activeComp.selectedLayers.sort(function(a,b){
                return (a.index - b.index)
            });
            this.selLength = this.selLayers.length;
        }

        selLayers = this.selLayers;

        //select more than one layer
        if(selLayers.length>1){

            //set reference position
            var firstPos = [activeComp.width/2, activeComp.height/2];
            for(var i = 0; i < selLayers.length; i++){
                selLayers[i].threeDLayer = false;
                var r = this.radius + i*this.spiral;
                var a = i*this.angle+this.rotateAll;
                // $.writeln(this.spiralReverse)
                if(this.spiralReverse == true) a*=-1;

                if(!selLayers[i].transform.position.isTimeVarying){
                    selLayers[i].transform.position.setValue(firstPos+[r*Math.cos(a), r*Math.sin(a)]);
                }
                else{
                    selLayers[i].transform.position.setValueAtTime(activeComp.time, firstPos+[r*Math.cos(a), r*Math.sin(a)]);
                }
            }
        }
    }
}

gridder.buildGUI =function(thisObj){
    thisObj.getPrefs();
    // thisObj.gridMode = "RECT";

    //creating icons in appdata folder
    thisObj.iconsFiles = new Array();
    var fldr = new Folder(Folder.userData.fullName + '/gridder/')
    fldr.create();
    for(i = 0; i <= 13; i++) {
        thisObj.iconsFiles[i] = new File(fldr.fullName+'/gridderIconFile_'+ i + ".png");
        thisObj.iconsFiles[i].encoding = "BINARY";
        thisObj.iconsFiles[i].open("w");
        thisObj.iconsFiles[i].write(thisObj.iconsBinaries[i]);
        thisObj.iconsFiles[i].close();
    }

    thisObj.w = (thisObj instanceof Panel) ? thisObj : new Window("palette", thisObj.scriptTitle, undefined, {resizeable:true});
    var w = thisObj.w;
    thisObj.w.preferredSize = "width: 250, height: 450";
    thisObj.w.maximumSize = "width:250, height: 450";
    thisObj.w.alignChildren = ["left", "top"]
    thisObj.w.margins = [10,10,10,0];
    thisObj.w.setBG([.25,.25,.25])


    var mainGroup = thisObj.w.add("group{orientation:'stack',alignment:['left','top']}");

    //==================================
    //Rectangle mode
    //==================================

    var twoDmodeGroup = mainGroup.add("group{orientation:'column',alignment:['left','top'],alignChildren:['left','top']}");
    twoDmodeGroup.add("staticText", undefined, thisObj.texts.gridStepText).setFG([1,1,1]);

    var lineOne = twoDmodeGroup.add("group{orientation:'row'}");
    var colsBttn = lineOne.add("group{margins: 4, alignment: ['left', 'center']}").setIcon(thisObj.iconsFiles[0]).setTip(thisObj.texts.tips.col);
    var colsSlider = lineOne.add("slider", undefined, thisObj.numCols, 1, 15);
    colsSlider.size = 'width: 150, height: 10';
    var colsEdit = lineOne.add("editText{alignment: ['right', 'center'], size: [25,20], justify: 'center'}");
    colsEdit.text = colsSlider.value;

    var lineTwo = twoDmodeGroup.add("group{orientation:'row',alignment:['fill','top']}");
    var rowsBttn = lineTwo.add("group { margins: 4, alignment: ['left', 'center']}").setIcon(thisObj.iconsFiles[1]).setTip(thisObj.texts.tips.row);
    var rowsSlider = lineTwo.add("slider", undefined, thisObj.numRows, 1, 15);
    rowsSlider.size = 'width: 150, height: 10';
    var rowsEdit = lineTwo.add("editText{alignment: ['right', 'center'], size: [25,20], justify: 'center'}");
    rowsEdit.text = rowsSlider.value;

    twoDmodeGroup.add("statictext{alignment: ['left','top'], text: '"+thisObj.texts.setSp+"'}").setFG([1,1,1]);

    var lineFour = twoDmodeGroup.add("group{orientation:'row', alignment: ['fill','top']}").setIcon(thisObj.iconsFiles[3]).setTip(thisObj.texts.tips.xSpacing);
    var xSlider = lineFour.add ("slider", undefined, thisObj.xSpacing, 0, 1000);
    xSlider.size = 'width: 150, height: 10';
    var xEdit = lineFour.add("editText{alignment: ['right', 'center'], size: [30,20], justify: 'center'}", undefined, 50);
    xEdit.text = Math.floor(xSlider.value);

    var lineFive = twoDmodeGroup.add("group{orientation:'row',alignment:['fill','top']}").setIcon(thisObj.iconsFiles[4]).setTip(thisObj.texts.tips.ySpacing);
    var ySlider = lineFive.add ("slider", undefined, thisObj.ySpacing, 0, 1000);
    ySlider.size = 'width: 150, height: 10';
    var yEdit = lineFive.add ("editText{alignment: ['right', 'center'], size: [30,20], justify: 'center'}");
    yEdit.text = Math.floor(ySlider.value);

    var lineThree = twoDmodeGroup.add("group{orientation:'row'}");
    var sqGridChckbx = lineThree.add("checkbox", undefined, thisObj.texts.square).setTip(thisObj.texts.tips.sqGrid).setFG([1,1,1]);
    sqGridChckbx.preferredSize = [85,20]
    sqGridChckbx.value = parseInt(thisObj.sqGrid);

    //==================================
    //3D Mode
    //==================================

    var threeDmodeGroup = mainGroup.add("group{orientation:'column',alignment:['left','top'],alignChildren:['left','top']}");
    threeDmodeGroup.visible = false;

    threeDmodeGroup.add("staticText", undefined, thisObj.texts.gridStepText).setFG([1,1,1]);


    var lineOne3d = threeDmodeGroup.add("group{orientation:'row',alignment:['left','top']}");
    var colsBttn3d = lineOne3d.add("group{margins: 4, alignment: ['left', 'center']}").setIcon(thisObj.iconsFiles[0]).setTip(thisObj.texts.tips.col);
    var colsSlider3d = lineOne3d.add("slider", undefined, thisObj.numCols, 1, 15);
    colsSlider3d.size = 'width: 100, height: 10';
    var colsEdit3d = lineOne3d.add("editText{alignment: ['right', 'center'], size: [25,20], justify: 'center'}");
    colsEdit3d.text = colsSlider3d.value;

    var planeSelect = lineOne3d.add("dropdownlist", undefined, ["XY", "XZ", "YZ"]).setTip(thisObj.texts.tips.plane);
    planeSelect.selection = thisObj.planeSelect;

    var line3D = threeDmodeGroup.add("group{orientation:'row',alignment:['fill','top']}");
    var rowsBttn3d = line3D.add("group { margins: 4, alignment: ['left', 'center']}").setIcon(thisObj.iconsFiles[1]).setTip(thisObj.texts.tips.row);
    var rowsSlider3d = line3D.add("slider", undefined, thisObj.numRows, 1, 15);
    rowsSlider3d.size = 'width: 100, height: 10';
    var rowsEdit3d = line3D.add("editText{alignment: ['left', 'center'], size: [25,20], justify: 'center'}");
    rowsEdit3d.text = rowsSlider3d.value;

    threeDmodeGroup.add("statictext{alignment: ['left','top'], text: '"+thisObj.texts.setSp+"'}").setFG([1,1,1]);

    var lineFour3d = threeDmodeGroup.add("group{orientation:'row', alignment: ['fill','top']}").setTip(thisObj.texts.tips.xSpacing);
    lineFour3d.add("group{margins: 4, alignment: ['left', 'center']}").add("statictext", undefined, "X")
    var xSlider3d = lineFour3d.add ("slider", undefined, thisObj.xSpacing, 0, 1000);
    xSlider3d.size = 'width: 40, height: 10';
    var xEdit3d = lineFour3d.add("editText{alignment: ['left', 'center'], size: [30,20], justify: 'center'}", undefined, 50);
    xEdit3d.text = Math.floor(xSlider3d.value);
    lineFour3d.add("group{margins: 4, alignment: ['left', 'center']}").add("statictext", undefined, "Y")
    var ySlider3d = lineFour3d.add ("slider", undefined, thisObj.ySpacing, 0, 1000);
    ySlider3d.size = 'width: 40, height: 10';
    var yEdit3d = lineFour3d.add ("editText{alignment: ['left', 'center'], size: [30,20], justify: 'center'}");
    yEdit3d.text = Math.floor(ySlider3d.value);

    var lineFive3d = threeDmodeGroup.add("group{orientation:'row',alignment:['fill','top']}")
    lineFive3d.add("group{margins: 4, alignment: ['left', 'center']}").add("statictext", undefined, "Z").setTip(thisObj.texts.tips.zSpacing);
    var zSlider = lineFive3d.add ("slider", undefined, thisObj.ySpacing, 0, 1000);
    zSlider.size = 'width: 40, height: 10';
    var zEdit = lineFive3d.add ("editText{alignment: ['left', 'center'], size: [30,20], justify: 'center'}");
    zEdit.text = Math.floor(zSlider.value);

    var lineThree3d = threeDmodeGroup.add("group{orientation:'row',alignment:['left','top']}");
    var sqGridChckbx3d = lineThree3d.add("checkbox", undefined, thisObj.texts.square).setTip(thisObj.texts.tips.sqGrid).setFG([1,1,1]);
    sqGridChckbx3d.preferredSize = [85,20]
    sqGridChckbx3d.value = parseInt(thisObj.sqGrid);

    //==================================
    //Circular mode
    //==================================

    var circModeGroup = mainGroup.add("group{orientation:'column',alignment:['left','top'],alignChildren:['left','top']}").setFG([1,1,1]);
    circModeGroup.visible = false;
    circModeGroup.add("staticText", undefined, thisObj.texts.circModeHeader).setFG([1,1,1]);

    var lineOneCirc = circModeGroup.add("group{orientation:'row'}");
    var radiusBttn = lineOneCirc.add("group{margins: 4, alignment: ['left', 'center'], alignChildren:['left', 'top']}").setIcon(thisObj.iconsFiles[13]).setTip(thisObj.texts.tips.radius);
    var radiusSlider = lineOneCirc.add("slider", undefined, thisObj.radius, 0, 1000);
    radiusSlider.size = 'width: 150, height: 10';
    var radiusEdit = lineOneCirc.add("editText{size: [25,20], justify: 'center'}");
    radiusEdit.text = radiusSlider.value;

    var lineTwoCirc = circModeGroup.add("group{orientation:'row',alignment:['fill','top'], alignChildren:['left', 'top']}");
    var angleButton = lineTwoCirc.add("group { margins: 4}").setIcon(thisObj.iconsFiles[10]).setTip(thisObj.texts.tips.angle);
    var angleSlider = lineTwoCirc.add("slider", undefined, thisObj.angle, -359, 359);
    angleSlider.size = 'width: 150, height: 10';
    var angleEdit = lineTwoCirc.add("editText{size: [25,20], justify: 'center'}");
    angleEdit.text = angleSlider.value;

    circModeGroup.add("staticText", undefined, thisObj.texts.rotateAll).setFG([1,1,1]);

    var lineThreeCirc = circModeGroup.add("group{orientation:'row',alignment:['fill','top'], alignChildren:['left', 'top']}");
    var rotateBttn = lineThreeCirc.add("group{margins: 4, alignment: ['left', 'center'], alignChildren:['left', 'top']}").setIcon(thisObj.iconsFiles[10]).setTip(thisObj.texts.tips.rotateAll);

    var rotateSlider = lineThreeCirc.add("slider", undefined, thisObj.rotateAll, -359, 359);
    rotateSlider.size = 'width: 150, height: 10';
    var rotateEdit = lineThreeCirc.add("editText{size: [25,20], justify: 'center'}");
    rotateEdit.text = rotateSlider.value;

    circModeGroup.add("staticText", undefined, thisObj.texts.spiralText).setFG([1,1,1]);

    var lineFourCirc = circModeGroup.add("group{orientation:'row',alignment:['fill','top'], alignChildren:['left', 'top']}");
    var spiralBttn = lineFourCirc.add("group{margins: 4, alignment: ['left', 'center'], alignChildren:['left', 'top']}").setIcon(thisObj.iconsFiles[11]).setTip(thisObj.texts.tips.spiral);
    spiralBttn.setState(false);

    var spiralSlider = lineFourCirc.add("slider", undefined, thisObj.spiral, 0, 50);
    spiralSlider.size = 'width: 127, height: 10';
    var spiralEdit = lineFourCirc.add("editText{size: [25,20], justify: 'center'}");
    spiralEdit.text = spiralSlider.value;
    var spiralReverse = lineFourCirc.add("checkbox", undefined, "").setTip(thisObj.texts.tips.spiralReverse);
    spiralReverse.value = false;
    thisObj.spiralReverse = false;

    //==================================
    //Expression panel
    //==================================

    var exprPanel = thisObj.w.add("panel{text: 'Expressions', justify: 'center', alignment:['fill','top'], properties:{borderStyle: 'black'}}").setFG([1,1,1]);
    exprPanel.margins = [10,20,10,10];

    var lineSix = exprPanel.add("group{orientation:'row', alignChildren:['left', 'top']}");
    var createExpr = lineSix.add("button", undefined, "Create");
    var bakeExpr = lineSix.add("button", undefined, "Bake");

    //==================================
    //Modes panel
    //==================================

    var lineSeven = thisObj.w.add("group{orientation:'row', alignChildren:['left', 'top']}");

    var modesPanel = lineSeven.add("panel{text: 'Grid Mode', justify: 'center', alignment:['fill','top'], properties:{borderStyle: 'black'}}").setFG([1,1,1]);
    modesPanel.margins = [10,15,10,10];
    var modesGroup = modesPanel.add("group{orientation:'row', alignChildren:['left', 'top']}");
    var rectModeBttn = modesGroup.add("group { margins: 4, alignment: ['left', 'center']}").setIcon(thisObj.iconsFiles[5]).setTip(thisObj.texts.tips.rect);
    if(thisObj.gridMode == "RECT") rectModeBttn.setState(true);

    var threeDModeBttn = modesGroup.add("group { margins: 4, alignment: ['left', 'center']}").setIcon(thisObj.iconsFiles[6]).setTip(thisObj.texts.tips.threeD);
    if(thisObj.gridMode == "3D") threeDModeBttn.setState(true);

    var circModeBttn = modesGroup.add("group { margins: 4, alignment: ['left', 'center']}").setIcon(thisObj.iconsFiles[7]).setTip(thisObj.texts.tips.circ);
    if(thisObj.gridMode == "CIRC") circModeBttn.setState(true);

    //==================================
    //Options panel
    //==================================

    var optionPanel = lineSeven.add("panel{text: 'Utils', justify: 'center', alignment:['fill','top'], properties:{borderStyle: 'black'}}").setFG([1,1,1]);
    optionPanel.margins = [10,15,10,10];
    var optionGroup = optionPanel.add("group{orientation:'row', alignChildren:['left', 'top']}");

    var duplicatorBttn = optionGroup.add("group { margins: 4, alignment: ['left', 'center']}").setIcon(thisObj.iconsFiles[8]).setTip(thisObj.texts.tips.duplicator);
    duplicatorBttn.setState(thisObj.duplicator);

    var gridOverlayBttn = optionGroup.add("group { margins: 4, alignment: ['left', 'center']}").setIcon(thisObj.iconsFiles[9]).setTip(thisObj.texts.tips.gridOverlay);
    gridOverlayBttn.setState(false);

    //==================================
    //Defining callbacks for buttons
    //==================================

    gridOverlayBttn.addEventListener("mousedown", function(k){
        if(k.button == 0){
            gridOverlayBttn.setState(true);
        }
    });

    gridOverlayBttn.addEventListener("mouseup", function(k){
        if(k.button == 0){
            gridOverlayBttn.setState(false);
            thisObj.createGridOverlay();
            thisObj.updateGridOverlay();
        }
    });


    duplicatorBttn.addEventListener("click", function(k){
        //clicking images
        if(k.button == 0){
            thisObj.duplicator =! thisObj.duplicator;
            duplicatorBttn.setState(thisObj.duplicator);
        }
    });

    spiralReverse.onClick = function (){
        thisObj.spiralReverse =! thisObj.spiralReverse;
        doGrid();
    }

    createExpr.onClick = function(){
        updateSliders();
        updateSpacingStates();
        thisObj.createExpressions();
    }

    bakeExpr.onClick = function(){
        thisObj.bakeExpressions();
    }

    sqGridChckbx.onClick = function(){
        yEdit.text = xEdit.text;
        updateSliders();
        doGrid();
    }

    sqGridChckbx3d.onClick = function(){
        yEdit3d.text = xEdit3d.text;
        zEdit.text = xEdit3d.text;
        updateSliders();
        doGrid();
    }

    colsBttn.addEventListener("click", function(k){
        //clicking images
        if(k.button == 0){
            thisObj.onlyCols =!thisObj.onlyCols; //change clicked state
            setRowCol(colsBttn); //update radiobutton states
            doGrid();
        }
    });

    rowsBttn.addEventListener("click", function(k){
        //clicking images
        if(k.button == 0){
            thisObj.onlyRows =!thisObj.onlyRows; //change clicked state
            setRowCol(rowsBttn); //update radiobutton states
            doGrid();
        }
    });

    rectModeBttn.addEventListener("click", function(k){
        //setting 2D grid mode
        if(k.button == 0){
            thisObj.gridMode = "RECT"
            updateModes();
            doGrid();
        }
    });

    threeDModeBttn.addEventListener("click", function(k){
        //setting 3D grid mode
        if(k.button == 0){
            thisObj.gridMode = "3D"
            updateModes();
            doGrid();
        }
    });

    circModeBttn.addEventListener("click", function(k){
        //setting circular grid mode
        if(k.button == 0){
            thisObj.gridMode = "CIRC"
            updateModes();
            doGrid();
        }
    });


    function updateModes(){
        if(thisObj.gridMode == "RECT"){

            rectModeBttn.setState(true);
            threeDModeBttn.setState(false);
            circModeBttn.setState(false);

            twoDmodeGroup.visible = true;
            threeDmodeGroup.visible = false;
            circModeGroup.visible = false;
            optionPanel.enabled = true;

            duplicatorBttn.enabled = true;
            gridOverlayBttn.enabled = true;

        }
        else if(thisObj.gridMode == "3D"){
            twoDmodeGroup.visible = false;
            threeDmodeGroup.visible = true;
            circModeGroup.visible = false;

            rectModeBttn.setState(false);
            threeDModeBttn.setState(true);
            circModeBttn.setState(false);
            optionPanel.enabled = false;

            duplicatorBttn.enabled = false;
            gridOverlayBttn.enabled = false;

        }
        else{
            twoDmodeGroup.visible = false;
            threeDmodeGroup.visible = false;
            circModeGroup.visible = true;

            rectModeBttn.setState(false);
            threeDModeBttn.setState(false);
            circModeBttn.setState(true);
            optionPanel.enabled = false;

            duplicatorBttn.enabled = false;
            gridOverlayBttn.enabled = false;

        }
    }

    planeSelect.onChange = function(){
        thisObj.planeSelect = planeSelect.selection.index;
        doGrid();
    }

    function setRowCol(caller){
        //Main function for custom radiobuttons work.

        if(thisObj.onlyCols == true && thisObj.onlyRows == true){
            if(caller == rowsBttn){
                thisObj.onlyCols = false;
                thisObj.onlyRows = true;
            }
            else if(caller == colsBttn){
                thisObj.onlyCols = true;
                thisObj.onlyRows = false;
            }
            else{
                thisObj.onlyCols = false;
                thisObj.onlyRows = false;
            }
        }

        //set enabled/disabled state
        rowsEdit.enabled =!thisObj.onlyCols;
        rowsSlider.enabled =!thisObj.onlyCols;
        colsEdit.enabled =!thisObj.onlyRows;
        colsSlider.enabled =!thisObj.onlyRows;

        colsBttn.setState(thisObj.onlyCols);
        rowsBttn.setState(thisObj.onlyRows);
    }

    //set radiobuttons' states
    setRowCol();

    //==================================
    //Callbacks for sliders and fields
    //==================================

    var editFields = [colsEdit, colsEdit3d, rowsEdit, rowsEdit3d, radiusEdit, angleEdit, spiralEdit, rotateEdit, xEdit, xEdit3d, yEdit, yEdit3d, zEdit];
    var sliders = [colsSlider, colsSlider3d, rowsSlider, rowsSlider3d, radiusSlider, angleSlider, spiralSlider, rotateSlider, xSlider, xSlider3d, ySlider, ySlider3d, zSlider];


    for(var i = 0; i < editFields.length; i++){
        editFields[i].onChanging = function(){
           //if(isNan(Number(this.text))) this.text = this.text.match(/(\d*)/)[1]
            updateFields()};

        editFields[i].onEnterKey = function(){updateFields()};

        sliders[i].boundField = editFields[i];

        if(i<8){
        //set first 8 sliders
            sliders[i].onChange = function(){
                // $.writeln(isNaN(Number(sliders[i].value)))
                this.boundField.text = parseInt(this.value);
                doGrid();
            }
        }
    }

    xSlider.onChange = function () {
        this.boundField.text = parseInt(this.value);
        if(sqGridChckbx.value == 1){
            ySlider.value = xSlider.value;
            yEdit.text = parseInt(ySlider.value);
        }

        doGrid();
    }

    ySlider.onChange = function () {
        this.boundField.text = parseInt(this.value);
        if(sqGridChckbx.value == 1){
            xSlider.value = ySlider.value;
            xEdit.text = parseInt(ySlider.value);
        }
        doGrid();
    }

    xSlider3d.onChange = function () {
        this.boundField.text = parseInt(this.value);
        if(sqGridChckbx3d.value == 1){
            ySlider3d.value = this.value;
            ySlider3d.boundField.text = parseInt(ySlider3d.value);

            zSlider.value = this.value;
            zSlider.boundField.text = parseInt(zSlider.value);
        }
        doGrid();
    }

    ySlider3d.onChange = function () {
        thisObj.boundField.text = parseInt(this.value);
        if(sqGridChckbx3d.value == 1){
            xSlider3d.value = this.value;
            xSlider3d.boundField.text = parseInt(this.value);

            zSlider.value = this.value;
            zSlider.boundField.text = parseInt(zSlider.value);
        }
        doGrid();
    }

    zSlider.onChange = function () {
        this.boundField.text = parseInt(this.value);
        if(sqGridChckbx3d.value == 1){
            xSlider3d.value = this.value;
            xSlider3d.boundField.text = parseInt(this.value);

            ySlider3d.value = this.value;
            ySlider3d.boundField.text = parseInt(ySlider3d.value);
        }
        doGrid();
    }


    //==================================
    //Service update functions
    //==================================

    function updateFields(){
        //function to update text fields
        updateSliders();
        doGrid();
    }

    function updateSliders(){
        for (var i = 0; i < editFields.length; i++) {
            if(isNaN(Number(editFields[i].text))) sliders[i].value = 1;
            else sliders[i].value = parseInt(editFields[i].text);
        };
    }

    function updateSpacingStates(){
        //function to update variables according to sliders/editTexts
        if(thisObj.gridMode=="RECT"){

            if(sqGridChckbx.value == 1){
                thisObj.ySpacing = xSlider.value;
                thisObj.xSpacing = xSlider.value;
                dist = xSlider.value*[1,1];
            }
            else{
                thisObj.xSpacing = xSlider.value;
                thisObj.ySpacing = ySlider.value;
                dist = [xSlider.value, ySlider.value]
            }
            thisObj.sqGrid = sqGridChckbx.value;

            thisObj.numRows = Number(rowsEdit.text);
            thisObj.numCols = Number(colsEdit.text);
        }

        else if(thisObj.gridMode == "3D"){
            if(sqGridChckbx3d.value == 1){
                thisObj.xSpacing = xSlider3d.value;
                thisObj.ySpacing = xSlider3d.value;
                thisObj.zSpacing = xSlider3d.value;
                dist3d = thisObj.xSpacing*[1,1,1];
            }
            else{
                thisObj.xSpacing = xSlider3d.value;
                thisObj.ySpacing = ySlider3d.value;
                thisObj.zSpacing = zSlider.value;
                dist3d = [thisObj.xSpacing,thisObj.ySpacing,thisObj.zSpacing];
            }
            thisObj.sqGrid = sqGridChckbx3d.value;
            thisObj.numRows = Number(rowsEdit3d.text);
            thisObj.numCols = Number(colsEdit3d.text);
        }

        else if(thisObj.gridMode == "CIRC"){
            thisObj.radius = Number(radiusEdit.text);
            thisObj.angle = Number(angleEdit.text)*Math.PI/180;
            thisObj.spiral = Number(spiralEdit.text);
            thisObj.rotateAll = Number(rotateEdit.text)*Math.PI/180;
        }
    }



    function doGrid(){
        updateSpacingStates();
        thisObj.setPrefs();


        // app.beginUndoGroup("Group");
        if(thisObj.gridMode == "RECT") thisObj.make2DGrid();
        else if(thisObj.gridMode == "3D") thisObj.make3DGrid();
        else if(thisObj.gridMode == "CIRC") thisObj.makeCircGrid();
        // app.endUndoGroup();

    }

    updateModes();

    if (thisObj.w instanceof Window){
        thisObj.w.center();
        thisObj.w.show();
    }

    else thisObj.w.layout.layout(true);
}

//==================================
//Create expressions
//==================================
gridder.createExpressions = function(){
    var activeComp = app.project.activeItem;

    if(activeComp != null && activeComp instanceof CompItem){
        app.beginUndoGroup("Creating expressions");

        var selLayers = activeComp.selectedLayers;

        if(selLayers.length>1){
            // sort layers ascending so index 1 is on top
            selLayers.sort(function(a,b){
                return (a.index - b.index);
            });

            //======================
            //Rectangle mode
            //======================

            if(this.gridMode == "RECT"){

                var nullExists = false
                for(var i = 1; i<=activeComp.layers.length;i++){
                    if(activeComp.layers[i].name == this.texts.nullControlName){
                        var nullControl = activeComp.layers[i];
                        nullExists = true;
                    }
                }

                if(nullExists == false){
                    this.nullControl = activeComp.layers.addNull(activeComp.duration)
                    this.nullControl.label = 11;

                    this.nullControl.moveBefore(selLayers[0]);

                    this.nullControl.name = this.texts.nullControlName;

                    var stepXControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                    stepXControl.name = "Colums";

                    var stepYControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                    stepYControl.name = "Rows";

                    var onlyColsControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Checkbox Control");
                    onlyColsControl.name = "Only Columns";

                    var onlyRowsControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Checkbox Control");
                    onlyRowsControl.name = "Only Rows";

                    var spacingXControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                    spacingXControl.name = "Spacing X";

                    var spacingYControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                    spacingYControl.name = "Spacing Y";

                    var sqGridControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Checkbox Control");
                    sqGridControl.name = "Square Grid";

                    var colorControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Color Control");
                    colorControl.name = this.texts.colorControlName;
                    colorControl(1).setValue([0,1,1]);

                    var gridThicknessControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                    gridThicknessControl.name = this.texts.gridThicknessName;
                    gridThicknessControl(1).setValue(1);


                    //set expresions
                    this.nullControl.effect(1).slider.expression = "if(value==0) value = 1 else value"
                    this.nullControl.effect(2).slider.expression = "if(value==0) value = 1 else value"
                    this.nullControl.effect(3).checkbox.expression = "if(effect(4)(1) == true) false else value"
                    this.nullControl.effect(4).checkbox.expression = "if(effect(3)(1) == true) false else value"
                    this.nullControl.effect(6).slider.expression = "if(effect(7)(1) == true) effect(5)(1) else value";
                }

                //set slider values
                this.nullControl.effect(1).slider.setValue(this.numCols);
                this.nullControl.effect(2).slider.setValue(this.numRows);
                this.nullControl.effect(3).checkbox.setValue(this.onlyCols)
                this.nullControl.effect(4).checkbox.setValue(this.onlyRows)
                this.nullControl.effect(5).slider.setValue(this.xSpacing);
                this.nullControl.effect(6).slider.setValue(this.ySpacing);
                this.nullControl.effect(7).checkbox.setValue(this.sqGrid);

                this.nullControl.transform.position.setValue([selLayers[0].transform.position.value[0],selLayers[0].transform.position.value[1]]);
                for(var i = 0; i<selLayers.length; i++){
                    //set expressions for selected layers
                    selLayers[i].transform.position.expression = this.expressions.pos2D;
                    selLayers[i].transform.rotation.expression = this.expressions.rot2D;
                }
            }

            //======================
            //3D mode
            //======================

            else if(this.gridMode == "3D"){
                var nullExists = false
                for(var i = 1; i<=activeComp.layers.length;i++){
                    if(activeComp.layers[i].name == this.texts.nullControlName3D){
                        var nullControl = activeComp.layers[i];
                        nullExists = true;
                    }
                }

                if(nullExists == false){
                    this.nullControl = activeComp.layers.addNull(activeComp.duration)
                    this.nullControl.label = 13;

                    this.nullControl.threeDLayer = true;

                    this.nullControl.moveBefore(selLayers[0]);

                    this.nullControl.name = this.texts.nullControlName3D;
                    var stepXControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                    stepXControl.name = "Colums";

                    var stepYControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                    stepYControl.name = "Rows";

                    var XYChckbx = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Checkbox Control");
                    XYChckbx.name = "XY";

                    var XZChckbx = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Checkbox Control");
                    XZChckbx.name = "XZ";

                    var YZChckbx = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Checkbox Control");
                    YZChckbx.name = "YZ";

                    var spacingXControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                    spacingXControl.name = "Spacing X";

                    var spacingYControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                    spacingYControl.name = "Spacing Y";

                    var spacingZControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                    spacingZControl.name = "Spacing Z";

                    var sqGridControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Checkbox Control");
                    sqGridControl.name = "Square Grid";

                    //set expresions
                    this.nullControl.effect(1).slider.expression = "if(value==0) value = 1 else value";
                    this.nullControl.effect(2).slider.expression = "if(value==0) value = 1 else value";

                    this.nullControl.effect(3).checkbox.expression = "if(effect(4)(1) == true) false else value";
                    this.nullControl.effect(4).checkbox.expression = "if(effect(3)(1) == true) false else value";
                    this.nullControl.effect(5).checkbox.expression = "if(effect(3)(1) == true) false else value";

                    this.nullControl.effect(7).slider.expression = "if(effect(9)(1) == true) effect(6)(1) else value";
                    this.nullControl.effect(8).slider.expression = "if(effect(9)(1) == true) effect(6)(1) else value";
                }

                //set slider values
                this.nullControl.effect(1).slider.setValue(this.numCols);
                this.nullControl.effect(2).slider.setValue(this.numRows);

                for(var i = 0; i <= 2; i++){
                    if(this.planeSelect == i){
                        this.nullControl.effect(3+i).checkbox.setValue(true);
                    }
                    else this.nullControl.effect(3+i).checkbox.setValue(false);
                }

                this.nullControl.effect(6).slider.setValue(this.xSpacing);
                this.nullControl.effect(7).slider.setValue(this.ySpacing);
                this.nullControl.effect(8).slider.setValue(this.zSpacing);

                this.nullControl.effect(9).checkbox.setValue(this.sqGrid);

                this.nullControl.transform.position.setValue([selLayers[0].transform.position.value[0],selLayers[0].transform.position.value[1]]);
                for(var i = 0; i<selLayers.length; i++){
                    //set expressions for selected layers
                    selLayers[i].position.expression = this.expressions.pos3D;
                    selLayers[i].orientation.expression = this.expressions.rot3D;
                }
            }

            //======================
            //Circular mode
            //======================

            else if(this.gridMode == "CIRC"){
                var nullExists = false
                for(var i = 1; i<=activeComp.layers.length;i++){
                    if(activeComp.layers[i].name == this.texts.nullControlNameCirc){
                        var nullControl = activeComp.layers[i];
                        nullExists = true;
                    }
                }

                if(nullExists == false){
                    this.nullControl = activeComp.layers.addNull(activeComp.duration)
                    this.nullControl.label = 12;

                    this.nullControl.moveBefore(selLayers[0]);

                    this.nullControl.name = this.texts.nullControlNameCirc;
                    var radiusControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                    radiusControl.name = "Radius";

                    var angleControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                    angleControl.name = "Angle";

                    var spiralControl = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                    spiralControl.name = "Spiral";

                    var spiralChckBx = this.nullControl.property("ADBE Effect Parade").addProperty("ADBE Checkbox Control");
                    spiralChckBx.name = "Reverse Spiral";

                }

                //set slider values
                this.nullControl.effect(1).slider.setValue(this.radius);
                this.nullControl.effect(2).slider.setValue(this.angle*180/Math.PI);
                this.nullControl.effect(3).slider.setValue(this.spiral)
                // this.nullControl.effect(4).checkbox.setValue(this.onlyCols)

                this.nullControl.transform.position.setValue([activeComp.width/2, activeComp.height/2]);
                for(var i = 0; i<selLayers.length; i++){
                    //set expressions for selected layers
                    selLayers[i].transform.position.expression = this.expressions.posCirc;
                    selLayers[i].transform.rotation.expression = this.expressions.rotCirc;
                }
            }
        }
    }
    app.endUndoGroup();
}

//==================================
//Baking expressions
//==================================

gridder.bakeExpressions = function(){
    app.beginUndoGroup("Baking expressions")
    var activeComp = app.project.activeItem;
    for(var i = 1; i<=activeComp.layers.length;i++){
        var curLayer = activeComp.layers[i].transform;
        if(curLayer.position.expression == this.expressions.pos2D || curLayer.position.expression == this.expressions.pos3D || curLayer.position.expression == this.expressions.posCirc){

            try{
                curLayer.position.setValue(curLayer.position.value);
            }
            catch(err){
                curLayer.position.setValueAtTime(activeComp.time,curLayer.position.value);
            }
            curLayer.position.expression = '';

            if(activeComp.layers[i].threeDLayer == true){
                curLayer.orientation.setValue(activeComp.layers[i].orientation.value);
                curLayer.orientation.expression = '';
            }
            else{
                curLayer.rotation.setValue(activeComp.layers[i].transform.rotation.value%360);
                curLayer.rotation.expression = '';
            }

        }
    }

    if(this.nullControl){
        if(this.gridOverlay){
            //set the values from null back to the grid overlay
            try{
                this.gridOverlay.property("ADBE Effect Parade")(1)(12).setValue(this.nullControl.effect(8)(1).value);
                this.gridOverlay.property("ADBE Effect Parade")(1)(6).setValue(this.nullControl.effect(9)(1).value);
            }
            catch(err){null}
        }
        activeComp.layers[this.nullControl.index].remove();
    }
    app.endUndoGroup();
}

//==================================
//Create and update grid overlay
//==================================

gridder.createGridOverlay = function(){
    //creating visual representation of grid
    var thisComp = app.project.activeItem;
    if(thisComp.layers[1].name!==this.gridOverlayName){
        app.beginUndoGroup("Creating grid overlay");
        this.gridOverlay = thisComp.layers.addSolid([0,1,1], this.texts.gridOverlayName, thisComp.width, thisComp.height, thisComp.pixelAspect, thisComp.duration);
        var gridOverlay = this.gridOverlay;
        gridOverlay.adjustmentLayer = true;
        gridOverlay.guideLayer = true;
        gridOverlay.locked = true;
        gridOverlay.selected = false;
        var overlay = gridOverlay.property("ADBE Effect Parade").addProperty("ADBE Grid");

        overlay(2).setValue(3); //setting size mode
        overlay(6).setValue(1); //setting border
        overlay(12).setValue([0,1,1,1]); //setting color
        overlay(14).setValue(2); //setting blending mode

        overlay(1).expression = "if(thisComp.layer(index+1).name!="+'"'+this.texts.nullControlName+'"'+"){\n\tshiftIndex = 1\n}\nelse shiftIndex = 2\n\nthisComp.layer(index+shiftIndex).position"; //anchor expression
        overlay(4).expression = "try{\n\tthisComp.layer(" + '"' + this.texts.nullControlName+ '"' +").effect(5)(1)\n}\ncatch(err){\n\tvalue\n}"; //width expression
        overlay(5).expression = "try{\n\tthisComp.layer(" + '"' + this.texts.nullControlName+ '"' +").effect(6)(1)\n}\ncatch(err){\n\tvalue\n}"; //height expression
        overlay(6).expression = "try{\nMath.abs(thisComp.layer(" + '"' + this.texts.nullControlName+ '"' +").effect("+'"'+ this.texts.gridThicknessName + '"'+")(1))\n}catch(err){value}"; //border expression
        overlay(12).expression = "try{\nthisComp.layer(" + '"' + this.texts.nullControlName+ '"' +").effect("+'"'+ this.texts.colorControlName + '"'+")(1)\n}catch(err){value}"; //color expression

        gridOverlay.label = 14;

        // if(this.nullControl){
        //     $.writeln(this.nullControl) // +' '+ thisComp.layers[this.nullControl.index].name)
        //     if(thisComp.layers[this.nullControl.index].name==this.gridOverlayName){
        //         gridOverlay.moveBefore(this.nullControl);
        //     }
        // }
        this.updateGridOverlay();

        app.endUndoGroup();
    }
}

gridder.updateGridOverlay = function(){
    //Function that is used for controlling grid overlay
    try{
    this.gridOverlay.property("ADBE Effect Parade")(1)(4).setValue(this.xSpacing);
    this.gridOverlay.property("ADBE Effect Parade")(1)(5).setValue(this.ySpacing);
    }
    catch(err){null }

}

//==================================
//Creating duplicates function
//May still be buggy
//==================================

gridder.createDuplicates = function(targetLayer, number){
    var activeLayers = app.project.activeItem.layers;
    var dupLayers = [];

    if(number>0){
        var count = activeLayers.countNames(targetLayer);

        if(number >= count){
            //надо больше чем есть
            for(var i = targetLayer.index+1; i<=number+targetLayer.index+1; i++){
                try{
                    //если следующий слой есть
                    if(activeLayers[i].name!=targetLayer.name){
                        //если следующий слой это не копия предыдущего
                        targetLayer.duplicate().moveAfter(targetLayer);
                        dupLayers = dupLayers.concat(activeLayers[2]);
                        i++;
                    }
                }
                catch(err){
                    //если следующего слоя нет
                    targetLayer.duplicate().moveAfter(targetLayer);
                    dupLayers = dupLayers.concat(activeLayers[2]);
                    i++;
                }
            }
        }

        else{
            //если есть больше чем надо
            for(var i = targetLayer.index; i<=activeLayers.length; i++){
                if(activeLayers[i].name == targetLayer.name){
                    //если следующий слой - копия
                    if(number>0){
                        //если не все еще нашли например
                        number--; //то вычитаем из общего числа
                    }
                    else{
                        //если все найдены то удаляем копию
                        activeLayers[i].remove();
                        i--;
                    }
                }
                else{
                    //если следующий слой назван по другому
                    if(number>0){
                        //и не все на месте
                        number--;
                        targetLayer.duplicate().moveAfter(targetLayer);
                        // dupLayers = dupLayers.concat(activeLayers[2]);
                        i++;
                    }
                }
            }
        }
    }
    return(dupLayers);
}


//==================================
//Saving/retrieving UI settings
//==================================

gridder.setPrefs = function(){
    //save variables' states
    app.settings.saveSetting("gridderUI", "numRows", this.numRows);
    app.settings.saveSetting("gridderUI", "numCols", this.numCols);
    app.settings.saveSetting("gridderUI", "numDepth", this.numDepth);
    app.settings.saveSetting("gridderUI", "xSpacing", this.xSpacing);
    app.settings.saveSetting("gridderUI", "ySpacing", this.ySpacing);
    app.settings.saveSetting("gridderUI", "zSpacing", this.zSpacing);
    app.settings.saveSetting("gridderUI", "radius", this.radius);
    app.settings.saveSetting("gridderUI", "angle", this.angle*180/Math.PI);
    app.settings.saveSetting("gridderUI", "rotateAll", this.rotateAll*180/Math.PI);
    app.settings.saveSetting("gridderUI", "spiral", this.spiral);
    app.settings.saveSetting("gridderUI", "sqGrid", this.sqGrid);
    app.settings.saveSetting("gridderUI", "onlyCols", this.onlyCols);
    app.settings.saveSetting("gridderUI", "onlyRows", this.onlyRows);
    app.settings.saveSetting("gridderUI", "onlyDepth", this.onlyDepth);
    app.settings.saveSetting("gridderUI", "duplicator", this.duplicator);
    app.settings.saveSetting("gridderUI", "gridMode", this.gridMode); //RECT, 3D, CIRC
    app.settings.saveSetting("gridderUI", "planeSelect", this.planeSelect);

}

gridder.getPrefs = function(){
    //retrieve
    if(app.settings.haveSetting("gridderUI", "numRows") == false) this.numRows = 2;
    else this.numRows = app.settings.getSetting("gridderUI", "numRows");

    if(app.settings.haveSetting("gridderUI", "numCols") == false) this.numCols = 2;
    else this.numCols = app.settings.getSetting("gridderUI", "numCols");

    if(app.settings.haveSetting("gridderUI", "numDepth") == false) this.numDepth = 2;
    else this.numDepth = app.settings.getSetting("gridderUI", "numDepth");

    if(app.settings.haveSetting("gridderUI", "xSpacing") == false) this.xSpacing = 200;
    else this.xSpacing = app.settings.getSetting("gridderUI", "xSpacing");

    if(app.settings.haveSetting("gridderUI", "ySpacing") == false) this.ySpacing = 200;
    else this.ySpacing = app.settings.getSetting("gridderUI", "ySpacing");

    if(app.settings.haveSetting("gridderUI", "zSpacing") == false) this.zSpacing = 200;
    else this.zSpacing = app.settings.getSetting("gridderUI", "zSpacing");

    if(app.settings.haveSetting("gridderUI", "radius") == false) this.radius = 200;
    else this.radius = app.settings.getSetting("gridderUI", "radius");

    if(app.settings.haveSetting("gridderUI", "angle") == false) this.angle = 15;
    else this.angle = app.settings.getSetting("gridderUI", "angle");

    if(app.settings.haveSetting("gridderUI", "rotateAll") == false) this.rotateAll = 0;
    else this.rotateAll = app.settings.getSetting("gridderUI", "rotateAll");

    if(app.settings.haveSetting("gridderUI", "spiral") == false) this.spiral = 0;
    else this.spiral = app.settings.getSetting("gridderUI", "spiral");

    if(app.settings.haveSetting("gridderUI", "sqGrid") == false) this.sqGrid = true;
    else this.sqGrid = app.settings.getSetting("gridderUI", "sqGrid");

    if(app.settings.haveSetting("gridderUI", "onlyCols") == false) this.onlyCols = true;
    else{
        this.onlyCols = app.settings.getSetting("gridderUI", "onlyCols");
        if(this.onlyCols == "true") this.onlyCols = true;
        else this.onlyCols = false;
    }

    if(app.settings.haveSetting("gridderUI", "onlyRows") == false) this.onlyRows = false;
    else{
        this.onlyRows = app.settings.getSetting("gridderUI", "onlyRows");
        if(this.onlyRows == "true") this.onlyRows = true;
        else this.onlyRows = false;
    }

    if(app.settings.haveSetting("gridderUI", "onlyDepth") == false) this.onlyDepth = false;
    else{
        this.onlyDepth = app.settings.getSetting("gridderUI", "onlyDepth");
        if(this.onlyDepth == "true") this.onlyDepth = true;
        else this.onlyDepth = false;
    }

    if(app.settings.haveSetting("gridderUI", "duplicator") == false) this.duplicator = false;
    else this.duplicator = app.settings.getSetting("gridderUI", "duplicator");

    if(app.settings.haveSetting("gridderUI", "gridMode") == false) this.gridMode = "RECT";
    else this.gridMode = app.settings.getSetting("gridderUI", "gridMode");

    if(app.settings.haveSetting("gridderUI", "planeSelect") == false) this.planeSelect = 0;
    else this.planeSelect = app.settings.getSetting("gridderUI", "planeSelect");
}

//====================================
//Setting new functions to prototypes
//====================================

/*
LayerCollection.prototype.getLayersList = function(layerToFind){
    if(layerToFind){
        var tmp = [];
        for (var i = 1; i <=this.length; i++) {
            if(this[i].name == layerToFind.name){
                tmp = tmp.concat(this[i]);
            }
        }
    return(tmp)
    }
}

LayerCollection.prototype.findFirstOccurence = function(layerToFind){
    if(layerToFind){
        for (var i = 1; i <=this.length; i++) {
            if(this[i].name == layerToFind.name) return(i);
        }
    return(-1)
    }
}

LayerCollection.prototype.countNames = function(layerToCount){
    if(layerToCount){
        var counter = 0;
        for (var i = this.length; i > 0; i--){
            if (this[i].name == layerToCount.name){
                counter++;
            }
        }
        return(counter);
    }
}
*/

Object.prototype.setFG = function(colorArray) {
    if (typeof colorArray != 'undefined' && colorArray.length >=3) {
        this.graphics.foregroundColor = this.graphics.newPen(this.graphics.PenType.SOLID_COLOR, colorArray, 1);
    }
    return this;
}

Object.prototype.setBG = function (colorArray) {
    if (typeof colorArray != 'undefined' && colorArray.length >=3) {
        this.graphics.backgroundColor = this.graphics.newBrush(this.graphics.BrushType.SOLID_COLOR, colorArray);
    }
    return this;
}

Group.prototype.setIcon = function(iconFile) {
    if(iconFile){
        this.icon = this.add("image", undefined, iconFile);
    }
    return this;
}

Object.prototype.setTip = function(hlpTip) {
    if(hlpTip){
        if(this.icon) this.icon.helpTip = hlpTip;
        else this.helpTip = hlpTip;
    }
    return this;
}

Group.prototype.setState = function(state){
    if(state){
        this.state = state
    }
    else this.state = false;
    this.setBG([[.25,.25,.25], [1, 0.58, 0.0]][Number(this.state)])
}

//==================================
//Control expressions
//==================================

gridder.expressions = {
    pos2D : "try{\ncntrl = thisComp.layer(" + '"' + this.texts.nullControlName+ '"' +");\nstepX = Math.floor(cntrl.effect(1)(1));\nstepY = Math.floor(cntrl.effect(2)(1));\nspacingX = cntrl.effect(5)(1);\nspacingY = cntrl.effect(6)(1);\nsqGrid = cntrl.effect(7)(1);\nonlyCols = cntrl.effect(3)(1);\nonlyRows = cntrl.effect(4)(1);\nthisIndex = index - (1+cntrl.index);\na = degreesToRadians(recursiveRotation(cntrl,cntrl.transform.rotation));\n\nif(onlyRows == 0){\n\tif(onlyCols == 0){\n\t\tthisIndex = thisIndex%(stepX*stepY);\n\t}\n\tthisCol = thisIndex%stepX;\n\tthisRow = Math.floor(thisIndex/stepX);\n\tpos = [spacingX*thisCol, spacingY*thisRow];\n}\nelse{\n\tthisCol = thisIndex%stepY;\n\tthisRow = Math.floor(thisIndex/stepY);\n\tpos = [spacingX*thisRow, spacingY*thisCol];\n}\n\tpos = [pos[0]*cntrl.transform.scale[0]/100, pos[1]*cntrl.transform.scale[1]/100]\n\ncntrl.toComp(cntrl.transform.anchorPoint)+[pos[0]*Math.cos(a)-pos[1]*Math.sin(a), pos[0]*Math.sin(a)+pos[1]*Math.cos(a)]\n}\ncatch(err){value}\n\nfunction recursiveRotation(layer,rot){\n\t//recursive function to calculate true rotation\n\tif(layer.hasParent){\n\t\treturn recursiveRotation(layer.parent,rot+=layer.parent.rotation);\n\t}\n\telse{\n\t\treturn rot;\n\t}\n}",

    pos3D: "cntrl = thisComp.layer(" + '"' + this.texts.nullControlName3D+ '"' +");\nstepX = Math.floor(cntrl.effect(1)(1));\nstepY = Math.floor(cntrl.effect(2)(1));XY = cntrl.effect(3)(1);\nXZ = cntrl.effect(4)(1);\nYZ = cntrl.effect(5)(1);\nspacingX = cntrl.effect(6)(1);\nspacingY = cntrl.effect(7)(1);\nspacingZ = cntrl.effect(8)(1);\nsqGrid = cntrl.effect(9)(1);\n\nthisIndex = index - (1+cntrl.index);\na = recursiveRotation(cntrl,cntrl.transform.orientation + [cntrl.transform.xRotation, cntrl.transform.yRotation, cntrl.transform.zRotation]);\n\nthisZ = Math.floor(thisIndex/(stepX*stepY));\nthisIndex = thisIndex%(stepX*stepY);\nthisX = thisIndex%stepX;\nthisY = Math.floor(thisIndex/stepX);\n\npV = [thisX, thisY, thisZ];\nif(XY == true) pV = [thisX, thisY, thisZ];\nif(XZ == true) pV = [thisZ, thisY, thisX];\nif(YZ == true) pV = [thisX, thisZ, thisY];\n\npos = [spacingX*pV[0], spacingY*pV[1], spacingZ*pV[2]];\n\nx = a[0];\ny = -1*a[1];\nz = a[2];\n\nx1 = pos[0]*cos(y)*cos(z) - pos[1]*cos(y)*sin(z) - pos[2]*sin(y);\ny1 = pos[0]*(-1*sin(x)*sin(y)*cos(z) + cos(x)*sin(z)) + pos[1]*(sin(x)*sin(y)*sin(z) + cos(x)*cos(z)) - pos[2]*(sin(x)*cos(y)); \nz1 = pos[0]*(cos(x)*sin(y)*cos(z) + sin(x)*sin(z)) + pos[1]*(-1*cos(x)*sin(y)*sin(z) + sin(x)*cos(z)) + pos[2]*(cos(x)*cos(y));\n\nrecursivePosition(cntrl,cntrl.transform.position)+[x1,y1,z1];\n\nfunction cos(a){return Math.cos(degreesToRadians(a))};\nfunction sin(a){return Math.sin(degreesToRadians(a))};\n\nfunction recursiveRotation(layer,rot){\n\t//recursive function to calculate true rotation\n\tif(layer.hasParent){\n\t\ttry{\n\t\t\treturn recursiveRotation(layer.parent,rot+=([layer.parent.transform.xRotation, layer.parent.transform.yRotation, layer.parent.transform.zRotation]+layer.parent.transform.orientation));\n\t\t\t}\n\t\tcatch(err){\n\t\t\treturn recursiveRotation(layer.parent,rot+=([0, 0, layer.parent.transform.rotation]));\n\t\t}\n\t}\n\telse{\n\t\treturn rot;\n\t}\n}\n\nfunction recursivePosition(layer, pos){\n\tif(layer.hasParent){\n\t\treturn recursivePosition(layer.parent, pos+=layer.parent.transform.position);\n\t}\n\telse{\n\t\treturn pos;\n\t}\n}\n",

    posCirc: "cntrl = thisComp.layer(" + '"' + this.texts.nullControlNameCirc+ '"' +");\nr = cntrl.effect(1)(1);\na = degreesToRadians(cntrl.effect(2)(1));\na1 = degreesToRadians(recursiveRotation(cntrl,cntrl.transform.rotation));\nspiral = cntrl.effect(3)(1);\nreverse = cntrl.effect(4)(1);\nthisIndex = index - (1+cntrl.index);\n\nif(reverse == true) a*=-1;\nr += thisIndex*spiral;\na *= thisIndex;\npos = [r*Math.cos(a), r*Math.sin(a)];\n\ncntrl.toComp(cntrl.transform.anchorPoint)+[pos[0]*Math.cos(a1)-pos[1]*Math.sin(a1), pos[0]*Math.sin(a1)+pos[1]*Math.cos(a1)];\n\nfunction recursiveRotation(layer,rot){\n//recursive function to calculate true rotation\n\tif(layer.hasParent){\n\t\treturn recursiveRotation(layer.parent,rot+=layer.parent.rotation);\n\t}\n\telse{\n\t\treturn rot;\n\t}\n}",

    rot2D: "try{\nc = thisComp.layer(" + '"' + this.texts.nullControlName+ '"' +");\n\nrecursiveRotation(c, c.transform.rotation)\n\nfunction recursiveRotation(layer,rot){\n\t//recursive function to calculate true rotation\n\tif(layer.hasParent){\n\t\treturn recursiveRotation(layer.parent,rot+=layer.parent.rotation);\n\t}\n\telse{\n\t\treturn rot;\n\t}\n}\n}catch(err){value}",

    rot3D: "cntrl = thisComp.layer(" + '"' + this.texts.nullControlName3D + '"' +");\nvalue+[transform.xRotation, transform.yRotation, transform.zRotation] + recursiveRotation(cntrl, cntrl.transform.orientation+[cntrl.transform.xRotation, cntrl.transform.yRotation, cntrl.transform.zRotation])\n\nfunction recursiveRotation(layer,rot){\n\t//recursive function to calculate true rotation\n\tif(layer.hasParent){\n\t\ttry{\n\t\t\treturn recursiveRotation(layer.parent,rot+=([layer.parent.transform.xRotation, layer.parent.transform.yRotation, layer.parent.transform.zRotation]+layer.parent.transform.orientation));\n\t\t}\n\t\tcatch(err){\n\t\t\treturn recursiveRotation(layer.parent,rot+=([0, 0, layer.parent.transform.rotation]));\n\t\t}\n\t}\n\telse{\n\t\treturn rot;\n\t}\n}",

    rotCirc: "try{\nc = thisComp.layer(" + '"' + this.texts.nullControlNameCirc + '"' +");\n\nrecursiveRotation(c, c.transform.rotation) + ((c.index-(index-1))*c.effect(2)(1))\n\nfunction recursiveRotation(layer,rot){\n\t//recursive function to calculate true rotation\n\tif(layer.hasParent){\n\t\treturn recursiveRotation(layer.parent,rot+=layer.parent.rotation);\n\t}\n\telse{\n\t\treturn rot;\n\t}\n}\n}catch(err){value}",
}

//==================================
//Future - custom effects
//==================================

/*
//Custom effect for grid control

<Effect matchname="GRIDDER_Control" name="$$$/AE/Preset/GRIDDER_Control=GRIDDER_Control">
    <Group name="$$$/AE/Preset/Grid_step=Grid step">
        <Slider name="$$$/AE/Preset/Columns=Columns" default="0" valid_min="-100" valid_max="100" slider_min="0" slider_max="100" precision="1"/>
        <Slider name="$$$/AE/Preset/Rows=Rows" default="0" valid_min="-100" valid_max="100" slider_min="0" slider_max="100" precision="1"/>
    </Group>
    <Group name="$$$/AE/Preset/Grid_Mode=Grid Mode">
        <Checkbox name="$$$/AE/Preset/OnlyColumns=Only Columns" default="true" CANNOT_TIME_VARY="true"/>
        <Checkbox name="$$$/AE/Preset/OnlyRows=Only Rows" default="false" CANNOT_TIME_VARY="true"/>
    </Group>
    <Group name="$$$/AE/Preset/Spacing=Spacing">
        <Slider name="$$$/AE/Preset/X=X" default="0" valid_min="-1000" valid_max="1000" slider_min="0" slider_max="100" precision="1" DISPLAY_PIXEL="true"/>
        <Slider name="$$$/AE/Preset/Y=Y" default="0" valid_min="-1000" valid_max="1000" slider_min="0" slider_max="100" precision="1" DISPLAY_PIXEL="true"/>
        <Checkbox name="$$$/AE/Preset/RectangelGrid=Rectangel Grid" default="true" CANNOT_TIME_VARY="true"/>
    </Group>
    <Group name="$$$/AE/Preset/Grid_Overlay_Controls=Grid Overlay Controls">
        <Color name="$$$/AE/Preset/OverlayColor=Overlay Color" default_red="0" default_green="255" default_blue="255"/>
        <Slider name="$$$/AE/Preset/Thickness=Thickness" default="1" valid_min="0" valid_max="100" slider_min="0" slider_max="20" precision="1"/>
    </Group>
</Effect>
*/

//==================================
//Binary icons
//==================================

gridder.iconsBinaries = ["\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\f\x00\x00\x00\f\b\x06\x00\x00\x00Vu\\\u00E7\x00\x00\x00\tpHYs\x00\x00\x0B\x13\x00\x00\x0B\x13\x01\x00\u009A\u009C\x18\x00\x00\nOiCCPPhotoshop ICC profile\x00\x00x\u00DA\u009DSgTS\u00E9\x16=\u00F7\u00DE\u00F4BK\u0088\u0080\u0094KoR\x15\b RB\u008B\u0080\x14\u0091&*!\t\x10J\u0088!\u00A1\u00D9\x15Q\u00C1\x11EE\x04\x1B\u00C8\u00A0\u0088\x03\u008E\u008E\u0080\u008C\x15Q,\f\u008A\n\u00D8\x07\u00E4!\u00A2\u008E\u0083\u00A3\u0088\u008A\u00CA\u00FB\u00E1{\u00A3k\u00D6\u00BC\u00F7\u00E6\u00CD\u00FE\u00B5\u00D7>\u00E7\u00AC\u00F3\u009D\u00B3\u00CF\x07\u00C0\b\f\u0096H3Q5\u0080\f\u00A9B\x1E\x11\u00E0\u0083\u00C7\u00C4\u00C6\u00E1\u00E4.@\u0081\n$p\x00\x10\b\u00B3d!s\u00FD#\x01\x00\u00F8~<<+\"\u00C0\x07\u00BE\x00\x01x\u00D3\x0B\b\x00\u00C0M\u009B\u00C00\x1C\u0087\u00FF\x0F\u00EAB\u0099\\\x01\u0080\u0084\x01\u00C0t\u00918K\b\u0080\x14\x00@z\u008EB\u00A6\x00@F\x01\u0080\u009D\u0098&S\x00\u00A0\x04\x00`\u00CBcb\u00E3\x00P-\x00`'\x7F\u00E6\u00D3\x00\u0080\u009D\u00F8\u0099{\x01\x00[\u0094!\x15\x01\u00A0\u0091\x00 \x13e\u0088D\x00h;\x00\u00AC\u00CFV\u008AE\x00X0\x00\x14fK\u00C49\x00\u00D8-\x000IWfH\x00\u00B0\u00B7\x00\u00C0\u00CE\x10\x0B\u00B2\x00\b\f\x000Q\u0088\u0085)\x00\x04{\x00`\u00C8##x\x00\u0084\u0099\x00\x14F\u00F2W<\u00F1+\u00AE\x10\u00E7*\x00\x00x\u0099\u00B2<\u00B9$9E\u0081[\b-q\x07WW.\x1E(\u00CEI\x17+\x146a\x02a\u009A@.\u00C2y\u0099\x192\u00814\x0F\u00E0\u00F3\u00CC\x00\x00\u00A0\u0091\x15\x11\u00E0\u0083\u00F3\u00FDx\u00CE\x0E\u00AE\u00CE\u00CE6\u008E\u00B6\x0E_-\u00EA\u00BF\x06\u00FF\"bb\u00E3\u00FE\u00E5\u00CF\u00ABp@\x00\x00\u00E1t~\u00D1\u00FE,/\u00B3\x1A\u0080;\x06\u0080m\u00FE\u00A2%\u00EE\x04h^\x0B\u00A0u\u00F7\u008Bf\u00B2\x0F@\u00B5\x00\u00A0\u00E9\u00DAW\u00F3p\u00F8~<<E\u00A1\u0090\u00B9\u00D9\u00D9\u00E5\u00E4\u00E4\u00D8J\u00C4B[a\u00CAW}\u00FEg\u00C2_\u00C0W\u00FDl\u00F9~<\u00FC\u00F7\u00F5\u00E0\u00BE\u00E2$\u00812]\u0081G\x04\u00F8\u00E0\u00C2\u00CC\u00F4L\u00A5\x1C\u00CF\u0092\t\u0084b\u00DC\u00E6\u008FG\u00FC\u00B7\x0B\u00FF\u00FC\x1D\u00D3\"\u00C4Ib\u00B9X*\x14\u00E3Q\x12q\u008ED\u009A\u008C\u00F32\u00A5\"\u0089B\u0092)\u00C5%\u00D2\u00FFd\u00E2\u00DF,\u00FB\x03>\u00DF5\x00\u00B0j>\x01{\u0091-\u00A8]c\x03\u00F6K'\x10Xt\u00C0\u00E2\u00F7\x00\x00\u00F2\u00BBo\u00C1\u00D4(\b\x03\u0080h\u0083\u00E1\u00CFw\u00FF\u00EF?\u00FDG\u00A0%\x00\u0080fI\u0092q\x00\x00^D$.T\u00CA\u00B3?\u00C7\b\x00\x00D\u00A0\u0081*\u00B0A\x1B\u00F4\u00C1\x18,\u00C0\x06\x1C\u00C1\x05\u00DC\u00C1\x0B\u00FC`6\u0084B$\u00C4\u00C2B\x10B\nd\u0080\x1Cr`)\u00AC\u0082B(\u0086\u00CD\u00B0\x1D*`/\u00D4@\x1D4\u00C0Qh\u0086\u0093p\x0E.\u00C2U\u00B8\x0E=p\x0F\u00FAa\b\u009E\u00C1(\u00BC\u0081\t\x04A\u00C8\b\x13a!\u00DA\u0088\x01b\u008AX#\u008E\b\x17\u0099\u0085\u00F8!\u00C1H\x04\x12\u008B$ \u00C9\u0088\x14Q\"K\u00915H1R\u008AT UH\x1D\u00F2=r\x029\u0087\\F\u00BA\u0091;\u00C8\x002\u0082\u00FC\u0086\u00BCG1\u0094\u0081\u00B2Q=\u00D4\f\u00B5C\u00B9\u00A87\x1A\u0084F\u00A2\x0B\u00D0dt1\u009A\u008F\x16\u00A0\u009B\u00D0r\u00B4\x1A=\u008C6\u00A1\u00E7\u00D0\u00ABh\x0F\u00DA\u008F>C\u00C70\u00C0\u00E8\x18\x073\u00C4l0.\u00C6\u00C3B\u00B18,\t\u0093c\u00CB\u00B1\"\u00AC\f\u00AB\u00C6\x1A\u00B0V\u00AC\x03\u00BB\u0089\u00F5c\u00CF\u00B1w\x04\x12\u0081E\u00C0\t6\x04wB a\x1EAHXLXN\u00D8H\u00A8 \x1C$4\x11\u00DA\t7\t\x03\u0084Q\u00C2'\"\u0093\u00A8K\u00B4&\u00BA\x11\u00F9\u00C4\x18b21\u0087XH,#\u00D6\x12\u008F\x13/\x10{\u0088C\u00C47$\x12\u0089C2'\u00B9\u0090\x02I\u00B1\u00A4T\u00D2\x12\u00D2F\u00D2nR#\u00E9,\u00A9\u009B4H\x1A#\u0093\u00C9\u00DAdk\u00B2\x079\u0094, +\u00C8\u0085\u00E4\u009D\u00E4\u00C3\u00E43\u00E4\x1B\u00E4!\u00F2[\n\u009Db@q\u00A4\u00F8S\u00E2(R\u00CAjJ\x19\u00E5\x10\u00E54\u00E5\x06e\u00982AU\u00A3\u009AR\u00DD\u00A8\u00A1T\x115\u008FZB\u00AD\u00A1\u00B6R\u00AFQ\u0087\u00A8\x134u\u009A9\u00CD\u0083\x16IK\u00A5\u00AD\u00A2\u0095\u00D3\x1Ah\x17h\u00F7i\u00AF\u00E8t\u00BA\x11\u00DD\u0095\x1EN\u0097\u00D0W\u00D2\u00CB\u00E9G\u00E8\u0097\u00E8\x03\u00F4w\f\r\u0086\x15\u0083\u00C7\u0088g(\x19\u009B\x18\x07\x18g\x19w\x18\u00AF\u0098L\u00A6\x19\u00D3\u008B\x19\u00C7T071\u00EB\u0098\u00E7\u0099\x0F\u0099oUX*\u00B6*|\x15\u0091\u00CA\n\u0095J\u0095&\u0095\x1B*/T\u00A9\u00AA\u00A6\u00AA\u00DE\u00AA\x0BU\u00F3U\u00CBT\u008F\u00A9^S}\u00AEFU3S\u00E3\u00A9\t\u00D4\u0096\u00ABU\u00AA\u009DP\u00EBS\x1BSg\u00A9;\u00A8\u0087\u00AAg\u00A8oT?\u00A4~Y\u00FD\u0089\x06Y\u00C3L\u00C3OC\u00A4Q\u00A0\u00B1_\u00E3\u00BC\u00C6 \x0Bc\x19\u00B3x,!k\r\u00AB\u0086u\u00815\u00C4&\u00B1\u00CD\u00D9|v*\u00BB\u0098\u00FD\x1D\u00BB\u008B=\u00AA\u00A9\u00A19C3J3W\u00B3R\u00F3\u0094f?\x07\u00E3\u0098q\u00F8\u009CtN\t\u00E7(\u00A7\u0097\u00F3~\u008A\u00DE\x14\u00EF)\u00E2)\x1B\u00A64L\u00B91e\\k\u00AA\u0096\u0097\u0096X\u00ABH\u00ABQ\u00ABG\u00EB\u00BD6\u00AE\u00ED\u00A7\u009D\u00A6\u00BDE\u00BBY\u00FB\u0081\x0EA\u00C7J'\\'Gg\u008F\u00CE\x05\u009D\u00E7S\u00D9S\u00DD\u00A7\n\u00A7\x16M=:\u00F5\u00AE.\u00AAk\u00A5\x1B\u00A1\u00BBDw\u00BFn\u00A7\u00EE\u0098\u009E\u00BE^\u0080\u009ELo\u00A7\u00DEy\u00BD\u00E7\u00FA\x1C}/\u00FDT\u00FDm\u00FA\u00A7\u00F5G\fX\x06\u00B3\f$\x06\u00DB\f\u00CE\x18<\u00C55qo<\x1D/\u00C7\u00DB\u00F1QC]\u00C3@C\u00A5a\u0095a\u0097\u00E1\u0084\u0091\u00B9\u00D1<\u00A3\u00D5F\u008DF\x0F\u008Ci\u00C6\\\u00E3$\u00E3m\u00C6m\u00C6\u00A3&\x06&!&KM\u00EAM\u00EE\u009ARM\u00B9\u00A6)\u00A6;L;L\u00C7\u00CD\u00CC\u00CD\u00A2\u00CD\u00D6\u00995\u009B=1\u00D72\u00E7\u009B\u00E7\u009B\u00D7\u009B\u00DF\u00B7`ZxZ,\u00B6\u00A8\u00B6\u00B8eI\u00B2\u00E4Z\u00A6Y\u00EE\u00B6\u00BCn\u0085Z9Y\u00A5XUZ]\u00B3F\u00AD\u009D\u00AD%\u00D6\u00BB\u00AD\u00BB\u00A7\x11\u00A7\u00B9N\u0093N\u00AB\u009E\u00D6g\u00C3\u00B0\u00F1\u00B6\u00C9\u00B6\u00A9\u00B7\x19\u00B0\u00E5\u00D8\x06\u00DB\u00AE\u00B6m\u00B6}agb\x17g\u00B7\u00C5\u00AE\u00C3\u00EE\u0093\u00BD\u0093}\u00BA}\u008D\u00FD=\x07\r\u0087\u00D9\x0E\u00AB\x1DZ\x1D~s\u00B4r\x14:V:\u00DE\u009A\u00CE\u009C\u00EE?}\u00C5\u00F4\u0096\u00E9/gX\u00CF\x10\u00CF\u00D83\u00E3\u00B6\x13\u00CB)\u00C4i\u009DS\u009B\u00D3Gg\x17g\u00B9s\u0083\u00F3\u0088\u008B\u0089K\u0082\u00CB.\u0097>.\u009B\x1B\u00C6\u00DD\u00C8\u00BD\u00E4Jt\u00F5q]\u00E1z\u00D2\u00F5\u009D\u009B\u00B3\u009B\u00C2\u00ED\u00A8\u00DB\u00AF\u00EE6\u00EEi\u00EE\u0087\u00DC\u009F\u00CC4\u009F)\u009EY3s\u00D0\u00C3\u00C8C\u00E0Q\u00E5\u00D1?\x0B\u009F\u00950k\u00DF\u00AC~OCO\u0081g\u00B5\u00E7#/c/\u0091W\u00AD\u00D7\u00B0\u00B7\u00A5w\u00AA\u00F7a\u00EF\x17>\u00F6>r\u009F\u00E3>\u00E3<7\u00DE2\u00DEY_\u00CC7\u00C0\u00B7\u00C8\u00B7\u00CBO\u00C3o\u009E_\u0085\u00DFC\x7F#\u00FFd\u00FFz\u00FF\u00D1\x00\u00A7\u0080%\x01g\x03\u0089\u0081A\u0081[\x02\u00FB\u00F8z|!\u00BF\u008E?:\u00DBe\u00F6\u00B2\u00D9\u00EDA\u008C\u00A0\u00B9A\x15A\u008F\u0082\u00AD\u0082\u00E5\u00C1\u00AD!h\u00C8\u00EC\u0090\u00AD!\u00F7\u00E7\u0098\u00CE\u0091\u00CEi\x0E\u0085P~\u00E8\u00D6\u00D0\x07a\u00E6a\u008B\u00C3~\f'\u0085\u0087\u0085W\u0086?\u008Ep\u0088X\x1A\u00D11\u00975w\u00D1\u00DCCs\u00DFD\u00FAD\u0096D\u00DE\u009Bg1O9\u00AF-J5*>\u00AA.j<\u00DA7\u00BA4\u00BA?\u00C6.fY\u00CC\u00D5X\u009DXIlK\x1C9.*\u00AE6nl\u00BE\u00DF\u00FC\u00ED\u00F3\u0087\u00E2\u009D\u00E2\x0B\u00E3{\x17\u0098/\u00C8]py\u00A1\u00CE\u00C2\u00F4\u0085\u00A7\x16\u00A9.\x12,:\u0096@L\u0088N8\u0094\u00F0A\x10*\u00A8\x16\u008C%\u00F2\x13w%\u008E\ny\u00C2\x1D\u00C2g\"/\u00D16\u00D1\u0088\u00D8C\\*\x1EN\u00F2H*Mz\u0092\u00EC\u0091\u00BC5y$\u00C53\u00A5,\u00E5\u00B9\u0084'\u00A9\u0090\u00BCL\rL\u00DD\u009B:\u009E\x16\u009Av m2=:\u00BD1\u0083\u0092\u0091\u0090qB\u00AA!M\u0093\u00B6g\u00EAg\u00E6fv\u00CB\u00ACe\u0085\u00B2\u00FE\u00C5n\u008B\u00B7/\x1E\u0095\x07\u00C9k\u00B3\u0090\u00AC\x05Y-\n\u00B6B\u00A6\u00E8TZ(\u00D7*\x07\u00B2geWf\u00BF\u00CD\u0089\u00CA9\u0096\u00AB\u009E+\u00CD\u00ED\u00CC\u00B3\u00CA\u00DB\u00907\u009C\u00EF\u009F\u00FF\u00ED\x12\u00C2\x12\u00E1\u0092\u00B6\u00A5\u0086KW-\x1DX\u00E6\u00BD\u00ACj9\u00B2<qy\u00DB\n\u00E3\x15\x05+\u0086V\x06\u00AC<\u00B8\u008A\u00B6*m\u00D5O\u00AB\u00EDW\u0097\u00AE~\u00BD&zMk\u0081^\u00C1\u00CA\u0082\u00C1\u00B5\x01k\u00EB\x0BU\n\u00E5\u0085}\u00EB\u00DC\u00D7\u00ED]OX/Y\u00DF\u00B5a\u00FA\u0086\u009D\x1B>\x15\u0089\u008A\u00AE\x14\u00DB\x17\u0097\x15\x7F\u00D8(\u00DCx\u00E5\x1B\u0087o\u00CA\u00BF\u0099\u00DC\u0094\u00B4\u00A9\u00AB\u00C4\u00B9d\u00CFf\u00D2f\u00E9\u00E6\u00DE-\u009E[\x0E\u0096\u00AA\u0097\u00E6\u0097\x0En\r\u00D9\u00DA\u00B4\r\u00DFV\u00B4\u00ED\u00F5\u00F6E\u00DB/\u0097\u00CD(\u00DB\u00BB\u0083\u00B6C\u00B9\u00A3\u00BF<\u00B8\u00BCe\u00A7\u00C9\u00CE\u00CD;?T\u00A4T\u00F4T\u00FAT6\u00EE\u00D2\u00DD\u00B5a\u00D7\u00F8n\u00D1\u00EE\x1B{\u00BC\u00F64\u00EC\u00D5\u00DB[\u00BC\u00F7\u00FD>\u00C9\u00BE\u00DBU\x01UM\u00D5f\u00D5e\u00FBI\u00FB\u00B3\u00F7?\u00AE\u0089\u00AA\u00E9\u00F8\u0096\u00FBm]\u00ADNmq\u00ED\u00C7\x03\u00D2\x03\u00FD\x07#\x0E\u00B6\u00D7\u00B9\u00D4\u00D5\x1D\u00D2=TR\u008F\u00D6+\u00EBG\x0E\u00C7\x1F\u00BE\u00FE\u009D\u00EFw-\r6\rU\u008D\u009C\u00C6\u00E2#pDy\u00E4\u00E9\u00F7\t\u00DF\u00F7\x1E\r:\u00DAv\u008C{\u00AC\u00E1\x07\u00D3\x1Fv\x1Dg\x1D/jB\u009A\u00F2\u009AF\u009BS\u009A\u00FB[b[\u00BAO\u00CC>\u00D1\u00D6\u00EA\u00DEz\u00FCG\u00DB\x1F\x0F\u009C4<YyJ\u00F3T\u00C9i\u00DA\u00E9\u0082\u00D3\u0093g\u00F2\u00CF\u008C\u009D\u0095\u009D}~.\u00F9\u00DC`\u00DB\u00A2\u00B6{\u00E7c\u00CE\u00DFj\x0Fo\u00EF\u00BA\x10t\u00E1\u00D2E\u00FF\u008B\u00E7;\u00BC;\u00CE\\\u00F2\u00B8t\u00F2\u00B2\u00DB\u00E5\x13W\u00B8W\u009A\u00AF:_m\u00EAt\u00EA<\u00FE\u0093\u00D3O\u00C7\u00BB\u009C\u00BB\u009A\u00AE\u00B9\\k\u00B9\u00EEz\u00BD\u00B5{f\u00F7\u00E9\x1B\u009E7\u00CE\u00DD\u00F4\u00BDy\u00F1\x16\u00FF\u00D6\u00D5\u009E9=\u00DD\u00BD\u00F3zo\u00F7\u00C5\u00F7\u00F5\u00DF\x16\u00DD~r'\u00FD\u00CE\u00CB\u00BB\u00D9w'\u00EE\u00AD\u00BCO\u00BC_\u00F4@\u00EDA\u00D9C\u00DD\u0087\u00D5?[\u00FE\u00DC\u00D8\u00EF\u00DC\x7Fj\u00C0w\u00A0\u00F3\u00D1\u00DCG\u00F7\x06\u0085\u0083\u00CF\u00FE\u0091\u00F5\u008F\x0FC\x05\u008F\u0099\u008F\u00CB\u0086\r\u0086\u00EB\u009E8>99\u00E2?r\u00FD\u00E9\u00FC\u00A7C\u00CFd\u00CF&\u009E\x17\u00FE\u00A2\u00FE\u00CB\u00AE\x17\x16/~\u00F8\u00D5\u00EB\u00D7\u00CE\u00D1\u0098\u00D1\u00A1\u0097\u00F2\u0097\u0093\u00BFm|\u00A5\u00FD\u00EA\u00C0\u00EB\x19\u00AF\u00DB\u00C6\u00C2\u00C6\x1E\u00BE\u00C9x31^\u00F4V\u00FB\u00ED\u00C1w\u00DCw\x1D\u00EF\u00A3\u00DF\x0FO\u00E4| \x7F(\u00FFh\u00F9\u00B1\u00F5S\u00D0\u00A7\u00FB\u0093\x19\u0093\u0093\u00FF\x04\x03\u0098\u00F3\u00FCc3-\u00DB\x00\x00\x00 cHRM\x00\x00z%\x00\x00\u0080\u0083\x00\x00\u00F9\u00FF\x00\x00\u0080\u00E9\x00\x00u0\x00\x00\u00EA`\x00\x00:\u0098\x00\x00\x17o\u0092_\u00C5F\x00\x00\x00)IDATx\u00DAb\u00FC\u00FF\u00FF?\x03\x03\x03\u00C3\x7F\x06\x06\x06F\x06\b\u00C0\u00CBfb \x11\u008Cj\x18)\x1A\x00\x00\x00\x00\u00FF\u00FF\x03\x00\u00BD\u00CF\x07\x15Xr-p\x00\x00\x00\x00IEND\u00AEB`\u0082",
"\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\f\x00\x00\x00\f\b\x06\x00\x00\x00Vu\\\u00E7\x00\x00\x00\tpHYs\x00\x00\x0B\x13\x00\x00\x0B\x13\x01\x00\u009A\u009C\x18\x00\x00\nOiCCPPhotoshop ICC profile\x00\x00x\u00DA\u009DSgTS\u00E9\x16=\u00F7\u00DE\u00F4BK\u0088\u0080\u0094KoR\x15\b RB\u008B\u0080\x14\u0091&*!\t\x10J\u0088!\u00A1\u00D9\x15Q\u00C1\x11EE\x04\x1B\u00C8\u00A0\u0088\x03\u008E\u008E\u0080\u008C\x15Q,\f\u008A\n\u00D8\x07\u00E4!\u00A2\u008E\u0083\u00A3\u0088\u008A\u00CA\u00FB\u00E1{\u00A3k\u00D6\u00BC\u00F7\u00E6\u00CD\u00FE\u00B5\u00D7>\u00E7\u00AC\u00F3\u009D\u00B3\u00CF\x07\u00C0\b\f\u0096H3Q5\u0080\f\u00A9B\x1E\x11\u00E0\u0083\u00C7\u00C4\u00C6\u00E1\u00E4.@\u0081\n$p\x00\x10\b\u00B3d!s\u00FD#\x01\x00\u00F8~<<+\"\u00C0\x07\u00BE\x00\x01x\u00D3\x0B\b\x00\u00C0M\u009B\u00C00\x1C\u0087\u00FF\x0F\u00EAB\u0099\\\x01\u0080\u0084\x01\u00C0t\u00918K\b\u0080\x14\x00@z\u008EB\u00A6\x00@F\x01\u0080\u009D\u0098&S\x00\u00A0\x04\x00`\u00CBcb\u00E3\x00P-\x00`'\x7F\u00E6\u00D3\x00\u0080\u009D\u00F8\u0099{\x01\x00[\u0094!\x15\x01\u00A0\u0091\x00 \x13e\u0088D\x00h;\x00\u00AC\u00CFV\u008AE\x00X0\x00\x14fK\u00C49\x00\u00D8-\x000IWfH\x00\u00B0\u00B7\x00\u00C0\u00CE\x10\x0B\u00B2\x00\b\f\x000Q\u0088\u0085)\x00\x04{\x00`\u00C8##x\x00\u0084\u0099\x00\x14F\u00F2W<\u00F1+\u00AE\x10\u00E7*\x00\x00x\u0099\u00B2<\u00B9$9E\u0081[\b-q\x07WW.\x1E(\u00CEI\x17+\x146a\x02a\u009A@.\u00C2y\u0099\x192\u00814\x0F\u00E0\u00F3\u00CC\x00\x00\u00A0\u0091\x15\x11\u00E0\u0083\u00F3\u00FDx\u00CE\x0E\u00AE\u00CE\u00CE6\u008E\u00B6\x0E_-\u00EA\u00BF\x06\u00FF\"bb\u00E3\u00FE\u00E5\u00CF\u00ABp@\x00\x00\u00E1t~\u00D1\u00FE,/\u00B3\x1A\u0080;\x06\u0080m\u00FE\u00A2%\u00EE\x04h^\x0B\u00A0u\u00F7\u008Bf\u00B2\x0F@\u00B5\x00\u00A0\u00E9\u00DAW\u00F3p\u00F8~<<E\u00A1\u0090\u00B9\u00D9\u00D9\u00E5\u00E4\u00E4\u00D8J\u00C4B[a\u00CAW}\u00FEg\u00C2_\u00C0W\u00FDl\u00F9~<\u00FC\u00F7\u00F5\u00E0\u00BE\u00E2$\u00812]\u0081G\x04\u00F8\u00E0\u00C2\u00CC\u00F4L\u00A5\x1C\u00CF\u0092\t\u0084b\u00DC\u00E6\u008FG\u00FC\u00B7\x0B\u00FF\u00FC\x1D\u00D3\"\u00C4Ib\u00B9X*\x14\u00E3Q\x12q\u008ED\u009A\u008C\u00F32\u00A5\"\u0089B\u0092)\u00C5%\u00D2\u00FFd\u00E2\u00DF,\u00FB\x03>\u00DF5\x00\u00B0j>\x01{\u0091-\u00A8]c\x03\u00F6K'\x10Xt\u00C0\u00E2\u00F7\x00\x00\u00F2\u00BBo\u00C1\u00D4(\b\x03\u0080h\u0083\u00E1\u00CFw\u00FF\u00EF?\u00FDG\u00A0%\x00\u0080fI\u0092q\x00\x00^D$.T\u00CA\u00B3?\u00C7\b\x00\x00D\u00A0\u0081*\u00B0A\x1B\u00F4\u00C1\x18,\u00C0\x06\x1C\u00C1\x05\u00DC\u00C1\x0B\u00FC`6\u0084B$\u00C4\u00C2B\x10B\nd\u0080\x1Cr`)\u00AC\u0082B(\u0086\u00CD\u00B0\x1D*`/\u00D4@\x1D4\u00C0Qh\u0086\u0093p\x0E.\u00C2U\u00B8\x0E=p\x0F\u00FAa\b\u009E\u00C1(\u00BC\u0081\t\x04A\u00C8\b\x13a!\u00DA\u0088\x01b\u008AX#\u008E\b\x17\u0099\u0085\u00F8!\u00C1H\x04\x12\u008B$ \u00C9\u0088\x14Q\"K\u00915H1R\u008AT UH\x1D\u00F2=r\x029\u0087\\F\u00BA\u0091;\u00C8\x002\u0082\u00FC\u0086\u00BCG1\u0094\u0081\u00B2Q=\u00D4\f\u00B5C\u00B9\u00A87\x1A\u0084F\u00A2\x0B\u00D0dt1\u009A\u008F\x16\u00A0\u009B\u00D0r\u00B4\x1A=\u008C6\u00A1\u00E7\u00D0\u00ABh\x0F\u00DA\u008F>C\u00C70\u00C0\u00E8\x18\x073\u00C4l0.\u00C6\u00C3B\u00B18,\t\u0093c\u00CB\u00B1\"\u00AC\f\u00AB\u00C6\x1A\u00B0V\u00AC\x03\u00BB\u0089\u00F5c\u00CF\u00B1w\x04\x12\u0081E\u00C0\t6\x04wB a\x1EAHXLXN\u00D8H\u00A8 \x1C$4\x11\u00DA\t7\t\x03\u0084Q\u00C2'\"\u0093\u00A8K\u00B4&\u00BA\x11\u00F9\u00C4\x18b21\u0087XH,#\u00D6\x12\u008F\x13/\x10{\u0088C\u00C47$\x12\u0089C2'\u00B9\u0090\x02I\u00B1\u00A4T\u00D2\x12\u00D2F\u00D2nR#\u00E9,\u00A9\u009B4H\x1A#\u0093\u00C9\u00DAdk\u00B2\x079\u0094, +\u00C8\u0085\u00E4\u009D\u00E4\u00C3\u00E43\u00E4\x1B\u00E4!\u00F2[\n\u009Db@q\u00A4\u00F8S\u00E2(R\u00CAjJ\x19\u00E5\x10\u00E54\u00E5\x06e\u00982AU\u00A3\u009AR\u00DD\u00A8\u00A1T\x115\u008FZB\u00AD\u00A1\u00B6R\u00AFQ\u0087\u00A8\x134u\u009A9\u00CD\u0083\x16IK\u00A5\u00AD\u00A2\u0095\u00D3\x1Ah\x17h\u00F7i\u00AF\u00E8t\u00BA\x11\u00DD\u0095\x1EN\u0097\u00D0W\u00D2\u00CB\u00E9G\u00E8\u0097\u00E8\x03\u00F4w\f\r\u0086\x15\u0083\u00C7\u0088g(\x19\u009B\x18\x07\x18g\x19w\x18\u00AF\u0098L\u00A6\x19\u00D3\u008B\x19\u00C7T071\u00EB\u0098\u00E7\u0099\x0F\u0099oUX*\u00B6*|\x15\u0091\u00CA\n\u0095J\u0095&\u0095\x1B*/T\u00A9\u00AA\u00A6\u00AA\u00DE\u00AA\x0BU\u00F3U\u00CBT\u008F\u00A9^S}\u00AEFU3S\u00E3\u00A9\t\u00D4\u0096\u00ABU\u00AA\u009DP\u00EBS\x1BSg\u00A9;\u00A8\u0087\u00AAg\u00A8oT?\u00A4~Y\u00FD\u0089\x06Y\u00C3L\u00C3OC\u00A4Q\u00A0\u00B1_\u00E3\u00BC\u00C6 \x0Bc\x19\u00B3x,!k\r\u00AB\u0086u\u00815\u00C4&\u00B1\u00CD\u00D9|v*\u00BB\u0098\u00FD\x1D\u00BB\u008B=\u00AA\u00A9\u00A19C3J3W\u00B3R\u00F3\u0094f?\x07\u00E3\u0098q\u00F8\u009CtN\t\u00E7(\u00A7\u0097\u00F3~\u008A\u00DE\x14\u00EF)\u00E2)\x1B\u00A64L\u00B91e\\k\u00AA\u0096\u0097\u0096X\u00ABH\u00ABQ\u00ABG\u00EB\u00BD6\u00AE\u00ED\u00A7\u009D\u00A6\u00BDE\u00BBY\u00FB\u0081\x0EA\u00C7J'\\'Gg\u008F\u00CE\x05\u009D\u00E7S\u00D9S\u00DD\u00A7\n\u00A7\x16M=:\u00F5\u00AE.\u00AAk\u00A5\x1B\u00A1\u00BBDw\u00BFn\u00A7\u00EE\u0098\u009E\u00BE^\u0080\u009ELo\u00A7\u00DEy\u00BD\u00E7\u00FA\x1C}/\u00FDT\u00FDm\u00FA\u00A7\u00F5G\fX\x06\u00B3\f$\x06\u00DB\f\u00CE\x18<\u00C55qo<\x1D/\u00C7\u00DB\u00F1QC]\u00C3@C\u00A5a\u0095a\u0097\u00E1\u0084\u0091\u00B9\u00D1<\u00A3\u00D5F\u008DF\x0F\u008Ci\u00C6\\\u00E3$\u00E3m\u00C6m\u00C6\u00A3&\x06&!&KM\u00EAM\u00EE\u009ARM\u00B9\u00A6)\u00A6;L;L\u00C7\u00CD\u00CC\u00CD\u00A2\u00CD\u00D6\u00995\u009B=1\u00D72\u00E7\u009B\u00E7\u009B\u00D7\u009B\u00DF\u00B7`ZxZ,\u00B6\u00A8\u00B6\u00B8eI\u00B2\u00E4Z\u00A6Y\u00EE\u00B6\u00BCn\u0085Z9Y\u00A5XUZ]\u00B3F\u00AD\u009D\u00AD%\u00D6\u00BB\u00AD\u00BB\u00A7\x11\u00A7\u00B9N\u0093N\u00AB\u009E\u00D6g\u00C3\u00B0\u00F1\u00B6\u00C9\u00B6\u00A9\u00B7\x19\u00B0\u00E5\u00D8\x06\u00DB\u00AE\u00B6m\u00B6}agb\x17g\u00B7\u00C5\u00AE\u00C3\u00EE\u0093\u00BD\u0093}\u00BA}\u008D\u00FD=\x07\r\u0087\u00D9\x0E\u00AB\x1DZ\x1D~s\u00B4r\x14:V:\u00DE\u009A\u00CE\u009C\u00EE?}\u00C5\u00F4\u0096\u00E9/gX\u00CF\x10\u00CF\u00D83\u00E3\u00B6\x13\u00CB)\u00C4i\u009DS\u009B\u00D3Gg\x17g\u00B9s\u0083\u00F3\u0088\u008B\u0089K\u0082\u00CB.\u0097>.\u009B\x1B\u00C6\u00DD\u00C8\u00BD\u00E4Jt\u00F5q]\u00E1z\u00D2\u00F5\u009D\u009B\u00B3\u009B\u00C2\u00ED\u00A8\u00DB\u00AF\u00EE6\u00EEi\u00EE\u0087\u00DC\u009F\u00CC4\u009F)\u009EY3s\u00D0\u00C3\u00C8C\u00E0Q\u00E5\u00D1?\x0B\u009F\u00950k\u00DF\u00AC~OCO\u0081g\u00B5\u00E7#/c/\u0091W\u00AD\u00D7\u00B0\u00B7\u00A5w\u00AA\u00F7a\u00EF\x17>\u00F6>r\u009F\u00E3>\u00E3<7\u00DE2\u00DEY_\u00CC7\u00C0\u00B7\u00C8\u00B7\u00CBO\u00C3o\u009E_\u0085\u00DFC\x7F#\u00FFd\u00FFz\u00FF\u00D1\x00\u00A7\u0080%\x01g\x03\u0089\u0081A\u0081[\x02\u00FB\u00F8z|!\u00BF\u008E?:\u00DBe\u00F6\u00B2\u00D9\u00EDA\u008C\u00A0\u00B9A\x15A\u008F\u0082\u00AD\u0082\u00E5\u00C1\u00AD!h\u00C8\u00EC\u0090\u00AD!\u00F7\u00E7\u0098\u00CE\u0091\u00CEi\x0E\u0085P~\u00E8\u00D6\u00D0\x07a\u00E6a\u008B\u00C3~\f'\u0085\u0087\u0085W\u0086?\u008Ep\u0088X\x1A\u00D11\u00975w\u00D1\u00DCCs\u00DFD\u00FAD\u0096D\u00DE\u009Bg1O9\u00AF-J5*>\u00AA.j<\u00DA7\u00BA4\u00BA?\u00C6.fY\u00CC\u00D5X\u009DXIlK\x1C9.*\u00AE6nl\u00BE\u00DF\u00FC\u00ED\u00F3\u0087\u00E2\u009D\u00E2\x0B\u00E3{\x17\u0098/\u00C8]py\u00A1\u00CE\u00C2\u00F4\u0085\u00A7\x16\u00A9.\x12,:\u0096@L\u0088N8\u0094\u00F0A\x10*\u00A8\x16\u008C%\u00F2\x13w%\u008E\ny\u00C2\x1D\u00C2g\"/\u00D16\u00D1\u0088\u00D8C\\*\x1EN\u00F2H*Mz\u0092\u00EC\u0091\u00BC5y$\u00C53\u00A5,\u00E5\u00B9\u0084'\u00A9\u0090\u00BCL\rL\u00DD\u009B:\u009E\x16\u009Av m2=:\u00BD1\u0083\u0092\u0091\u0090qB\u00AA!M\u0093\u00B6g\u00EAg\u00E6fv\u00CB\u00ACe\u0085\u00B2\u00FE\u00C5n\u008B\u00B7/\x1E\u0095\x07\u00C9k\u00B3\u0090\u00AC\x05Y-\n\u00B6B\u00A6\u00E8TZ(\u00D7*\x07\u00B2geWf\u00BF\u00CD\u0089\u00CA9\u0096\u00AB\u009E+\u00CD\u00ED\u00CC\u00B3\u00CA\u00DB\u00907\u009C\u00EF\u009F\u00FF\u00ED\x12\u00C2\x12\u00E1\u0092\u00B6\u00A5\u0086KW-\x1DX\u00E6\u00BD\u00ACj9\u00B2<qy\u00DB\n\u00E3\x15\x05+\u0086V\x06\u00AC<\u00B8\u008A\u00B6*m\u00D5O\u00AB\u00EDW\u0097\u00AE~\u00BD&zMk\u0081^\u00C1\u00CA\u0082\u00C1\u00B5\x01k\u00EB\x0BU\n\u00E5\u0085}\u00EB\u00DC\u00D7\u00ED]OX/Y\u00DF\u00B5a\u00FA\u0086\u009D\x1B>\x15\u0089\u008A\u00AE\x14\u00DB\x17\u0097\x15\x7F\u00D8(\u00DCx\u00E5\x1B\u0087o\u00CA\u00BF\u0099\u00DC\u0094\u00B4\u00A9\u00AB\u00C4\u00B9d\u00CFf\u00D2f\u00E9\u00E6\u00DE-\u009E[\x0E\u0096\u00AA\u0097\u00E6\u0097\x0En\r\u00D9\u00DA\u00B4\r\u00DFV\u00B4\u00ED\u00F5\u00F6E\u00DB/\u0097\u00CD(\u00DB\u00BB\u0083\u00B6C\u00B9\u00A3\u00BF<\u00B8\u00BCe\u00A7\u00C9\u00CE\u00CD;?T\u00A4T\u00F4T\u00FAT6\u00EE\u00D2\u00DD\u00B5a\u00D7\u00F8n\u00D1\u00EE\x1B{\u00BC\u00F64\u00EC\u00D5\u00DB[\u00BC\u00F7\u00FD>\u00C9\u00BE\u00DBU\x01UM\u00D5f\u00D5e\u00FBI\u00FB\u00B3\u00F7?\u00AE\u0089\u00AA\u00E9\u00F8\u0096\u00FBm]\u00ADNmq\u00ED\u00C7\x03\u00D2\x03\u00FD\x07#\x0E\u00B6\u00D7\u00B9\u00D4\u00D5\x1D\u00D2=TR\u008F\u00D6+\u00EBG\x0E\u00C7\x1F\u00BE\u00FE\u009D\u00EFw-\r6\rU\u008D\u009C\u00C6\u00E2#pDy\u00E4\u00E9\u00F7\t\u00DF\u00F7\x1E\r:\u00DAv\u008C{\u00AC\u00E1\x07\u00D3\x1Fv\x1Dg\x1D/jB\u009A\u00F2\u009AF\u009BS\u009A\u00FB[b[\u00BAO\u00CC>\u00D1\u00D6\u00EA\u00DEz\u00FCG\u00DB\x1F\x0F\u009C4<YyJ\u00F3T\u00C9i\u00DA\u00E9\u0082\u00D3\u0093g\u00F2\u00CF\u008C\u009D\u0095\u009D}~.\u00F9\u00DC`\u00DB\u00A2\u00B6{\u00E7c\u00CE\u00DFj\x0Fo\u00EF\u00BA\x10t\u00E1\u00D2E\u00FF\u008B\u00E7;\u00BC;\u00CE\\\u00F2\u00B8t\u00F2\u00B2\u00DB\u00E5\x13W\u00B8W\u009A\u00AF:_m\u00EAt\u00EA<\u00FE\u0093\u00D3O\u00C7\u00BB\u009C\u00BB\u009A\u00AE\u00B9\\k\u00B9\u00EEz\u00BD\u00B5{f\u00F7\u00E9\x1B\u009E7\u00CE\u00DD\u00F4\u00BDy\u00F1\x16\u00FF\u00D6\u00D5\u009E9=\u00DD\u00BD\u00F3zo\u00F7\u00C5\u00F7\u00F5\u00DF\x16\u00DD~r'\u00FD\u00CE\u00CB\u00BB\u00D9w'\u00EE\u00AD\u00BCO\u00BC_\u00F4@\u00EDA\u00D9C\u00DD\u0087\u00D5?[\u00FE\u00DC\u00D8\u00EF\u00DC\x7Fj\u00C0w\u00A0\u00F3\u00D1\u00DCG\u00F7\x06\u0085\u0083\u00CF\u00FE\u0091\u00F5\u008F\x0FC\x05\u008F\u0099\u008F\u00CB\u0086\r\u0086\u00EB\u009E8>99\u00E2?r\u00FD\u00E9\u00FC\u00A7C\u00CFd\u00CF&\u009E\x17\u00FE\u00A2\u00FE\u00CB\u00AE\x17\x16/~\u00F8\u00D5\u00EB\u00D7\u00CE\u00D1\u0098\u00D1\u00A1\u0097\u00F2\u0097\u0093\u00BFm|\u00A5\u00FD\u00EA\u00C0\u00EB\x19\u00AF\u00DB\u00C6\u00C2\u00C6\x1E\u00BE\u00C9x31^\u00F4V\u00FB\u00ED\u00C1w\u00DCw\x1D\u00EF\u00A3\u00DF\x0FO\u00E4| \x7F(\u00FFh\u00F9\u00B1\u00F5S\u00D0\u00A7\u00FB\u0093\x19\u0093\u0093\u00FF\x04\x03\u0098\u00F3\u00FCc3-\u00DB\x00\x00\x00 cHRM\x00\x00z%\x00\x00\u0080\u0083\x00\x00\u00F9\u00FF\x00\x00\u0080\u00E9\x00\x00u0\x00\x00\u00EA`\x00\x00:\u0098\x00\x00\x17o\u0092_\u00C5F\x00\x00\x00)IDATx\u00DAb\u00FC\u00FF\u00FF?\x03)\u0080\u0085\u0081\u0081\u00E1?\u00A9\x1A\x18I\u00D1\u00C0\u00C4@\"\x18u\u00D2\u00E0p\x12\x00\x00\x00\u00FF\u00FF\x03\x00\u00F1?\x07%\u00D7\u009B]\u00A4\x00\x00\x00\x00IEND\u00AEB`\u0082",
"\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\b\x00\x00\x00\f\b\x06\x00\x00\x00_\u009E\u00FC\u009D\x00\x00\x00\tpHYs\x00\x00\x0B\x13\x00\x00\x0B\x13\x01\x00\u009A\u009C\x18\x00\x00\nOiCCPPhotoshop ICC profile\x00\x00x\u00DA\u009DSgTS\u00E9\x16=\u00F7\u00DE\u00F4BK\u0088\u0080\u0094KoR\x15\b RB\u008B\u0080\x14\u0091&*!\t\x10J\u0088!\u00A1\u00D9\x15Q\u00C1\x11EE\x04\x1B\u00C8\u00A0\u0088\x03\u008E\u008E\u0080\u008C\x15Q,\f\u008A\n\u00D8\x07\u00E4!\u00A2\u008E\u0083\u00A3\u0088\u008A\u00CA\u00FB\u00E1{\u00A3k\u00D6\u00BC\u00F7\u00E6\u00CD\u00FE\u00B5\u00D7>\u00E7\u00AC\u00F3\u009D\u00B3\u00CF\x07\u00C0\b\f\u0096H3Q5\u0080\f\u00A9B\x1E\x11\u00E0\u0083\u00C7\u00C4\u00C6\u00E1\u00E4.@\u0081\n$p\x00\x10\b\u00B3d!s\u00FD#\x01\x00\u00F8~<<+\"\u00C0\x07\u00BE\x00\x01x\u00D3\x0B\b\x00\u00C0M\u009B\u00C00\x1C\u0087\u00FF\x0F\u00EAB\u0099\\\x01\u0080\u0084\x01\u00C0t\u00918K\b\u0080\x14\x00@z\u008EB\u00A6\x00@F\x01\u0080\u009D\u0098&S\x00\u00A0\x04\x00`\u00CBcb\u00E3\x00P-\x00`'\x7F\u00E6\u00D3\x00\u0080\u009D\u00F8\u0099{\x01\x00[\u0094!\x15\x01\u00A0\u0091\x00 \x13e\u0088D\x00h;\x00\u00AC\u00CFV\u008AE\x00X0\x00\x14fK\u00C49\x00\u00D8-\x000IWfH\x00\u00B0\u00B7\x00\u00C0\u00CE\x10\x0B\u00B2\x00\b\f\x000Q\u0088\u0085)\x00\x04{\x00`\u00C8##x\x00\u0084\u0099\x00\x14F\u00F2W<\u00F1+\u00AE\x10\u00E7*\x00\x00x\u0099\u00B2<\u00B9$9E\u0081[\b-q\x07WW.\x1E(\u00CEI\x17+\x146a\x02a\u009A@.\u00C2y\u0099\x192\u00814\x0F\u00E0\u00F3\u00CC\x00\x00\u00A0\u0091\x15\x11\u00E0\u0083\u00F3\u00FDx\u00CE\x0E\u00AE\u00CE\u00CE6\u008E\u00B6\x0E_-\u00EA\u00BF\x06\u00FF\"bb\u00E3\u00FE\u00E5\u00CF\u00ABp@\x00\x00\u00E1t~\u00D1\u00FE,/\u00B3\x1A\u0080;\x06\u0080m\u00FE\u00A2%\u00EE\x04h^\x0B\u00A0u\u00F7\u008Bf\u00B2\x0F@\u00B5\x00\u00A0\u00E9\u00DAW\u00F3p\u00F8~<<E\u00A1\u0090\u00B9\u00D9\u00D9\u00E5\u00E4\u00E4\u00D8J\u00C4B[a\u00CAW}\u00FEg\u00C2_\u00C0W\u00FDl\u00F9~<\u00FC\u00F7\u00F5\u00E0\u00BE\u00E2$\u00812]\u0081G\x04\u00F8\u00E0\u00C2\u00CC\u00F4L\u00A5\x1C\u00CF\u0092\t\u0084b\u00DC\u00E6\u008FG\u00FC\u00B7\x0B\u00FF\u00FC\x1D\u00D3\"\u00C4Ib\u00B9X*\x14\u00E3Q\x12q\u008ED\u009A\u008C\u00F32\u00A5\"\u0089B\u0092)\u00C5%\u00D2\u00FFd\u00E2\u00DF,\u00FB\x03>\u00DF5\x00\u00B0j>\x01{\u0091-\u00A8]c\x03\u00F6K'\x10Xt\u00C0\u00E2\u00F7\x00\x00\u00F2\u00BBo\u00C1\u00D4(\b\x03\u0080h\u0083\u00E1\u00CFw\u00FF\u00EF?\u00FDG\u00A0%\x00\u0080fI\u0092q\x00\x00^D$.T\u00CA\u00B3?\u00C7\b\x00\x00D\u00A0\u0081*\u00B0A\x1B\u00F4\u00C1\x18,\u00C0\x06\x1C\u00C1\x05\u00DC\u00C1\x0B\u00FC`6\u0084B$\u00C4\u00C2B\x10B\nd\u0080\x1Cr`)\u00AC\u0082B(\u0086\u00CD\u00B0\x1D*`/\u00D4@\x1D4\u00C0Qh\u0086\u0093p\x0E.\u00C2U\u00B8\x0E=p\x0F\u00FAa\b\u009E\u00C1(\u00BC\u0081\t\x04A\u00C8\b\x13a!\u00DA\u0088\x01b\u008AX#\u008E\b\x17\u0099\u0085\u00F8!\u00C1H\x04\x12\u008B$ \u00C9\u0088\x14Q\"K\u00915H1R\u008AT UH\x1D\u00F2=r\x029\u0087\\F\u00BA\u0091;\u00C8\x002\u0082\u00FC\u0086\u00BCG1\u0094\u0081\u00B2Q=\u00D4\f\u00B5C\u00B9\u00A87\x1A\u0084F\u00A2\x0B\u00D0dt1\u009A\u008F\x16\u00A0\u009B\u00D0r\u00B4\x1A=\u008C6\u00A1\u00E7\u00D0\u00ABh\x0F\u00DA\u008F>C\u00C70\u00C0\u00E8\x18\x073\u00C4l0.\u00C6\u00C3B\u00B18,\t\u0093c\u00CB\u00B1\"\u00AC\f\u00AB\u00C6\x1A\u00B0V\u00AC\x03\u00BB\u0089\u00F5c\u00CF\u00B1w\x04\x12\u0081E\u00C0\t6\x04wB a\x1EAHXLXN\u00D8H\u00A8 \x1C$4\x11\u00DA\t7\t\x03\u0084Q\u00C2'\"\u0093\u00A8K\u00B4&\u00BA\x11\u00F9\u00C4\x18b21\u0087XH,#\u00D6\x12\u008F\x13/\x10{\u0088C\u00C47$\x12\u0089C2'\u00B9\u0090\x02I\u00B1\u00A4T\u00D2\x12\u00D2F\u00D2nR#\u00E9,\u00A9\u009B4H\x1A#\u0093\u00C9\u00DAdk\u00B2\x079\u0094, +\u00C8\u0085\u00E4\u009D\u00E4\u00C3\u00E43\u00E4\x1B\u00E4!\u00F2[\n\u009Db@q\u00A4\u00F8S\u00E2(R\u00CAjJ\x19\u00E5\x10\u00E54\u00E5\x06e\u00982AU\u00A3\u009AR\u00DD\u00A8\u00A1T\x115\u008FZB\u00AD\u00A1\u00B6R\u00AFQ\u0087\u00A8\x134u\u009A9\u00CD\u0083\x16IK\u00A5\u00AD\u00A2\u0095\u00D3\x1Ah\x17h\u00F7i\u00AF\u00E8t\u00BA\x11\u00DD\u0095\x1EN\u0097\u00D0W\u00D2\u00CB\u00E9G\u00E8\u0097\u00E8\x03\u00F4w\f\r\u0086\x15\u0083\u00C7\u0088g(\x19\u009B\x18\x07\x18g\x19w\x18\u00AF\u0098L\u00A6\x19\u00D3\u008B\x19\u00C7T071\u00EB\u0098\u00E7\u0099\x0F\u0099oUX*\u00B6*|\x15\u0091\u00CA\n\u0095J\u0095&\u0095\x1B*/T\u00A9\u00AA\u00A6\u00AA\u00DE\u00AA\x0BU\u00F3U\u00CBT\u008F\u00A9^S}\u00AEFU3S\u00E3\u00A9\t\u00D4\u0096\u00ABU\u00AA\u009DP\u00EBS\x1BSg\u00A9;\u00A8\u0087\u00AAg\u00A8oT?\u00A4~Y\u00FD\u0089\x06Y\u00C3L\u00C3OC\u00A4Q\u00A0\u00B1_\u00E3\u00BC\u00C6 \x0Bc\x19\u00B3x,!k\r\u00AB\u0086u\u00815\u00C4&\u00B1\u00CD\u00D9|v*\u00BB\u0098\u00FD\x1D\u00BB\u008B=\u00AA\u00A9\u00A19C3J3W\u00B3R\u00F3\u0094f?\x07\u00E3\u0098q\u00F8\u009CtN\t\u00E7(\u00A7\u0097\u00F3~\u008A\u00DE\x14\u00EF)\u00E2)\x1B\u00A64L\u00B91e\\k\u00AA\u0096\u0097\u0096X\u00ABH\u00ABQ\u00ABG\u00EB\u00BD6\u00AE\u00ED\u00A7\u009D\u00A6\u00BDE\u00BBY\u00FB\u0081\x0EA\u00C7J'\\'Gg\u008F\u00CE\x05\u009D\u00E7S\u00D9S\u00DD\u00A7\n\u00A7\x16M=:\u00F5\u00AE.\u00AAk\u00A5\x1B\u00A1\u00BBDw\u00BFn\u00A7\u00EE\u0098\u009E\u00BE^\u0080\u009ELo\u00A7\u00DEy\u00BD\u00E7\u00FA\x1C}/\u00FDT\u00FDm\u00FA\u00A7\u00F5G\fX\x06\u00B3\f$\x06\u00DB\f\u00CE\x18<\u00C55qo<\x1D/\u00C7\u00DB\u00F1QC]\u00C3@C\u00A5a\u0095a\u0097\u00E1\u0084\u0091\u00B9\u00D1<\u00A3\u00D5F\u008DF\x0F\u008Ci\u00C6\\\u00E3$\u00E3m\u00C6m\u00C6\u00A3&\x06&!&KM\u00EAM\u00EE\u009ARM\u00B9\u00A6)\u00A6;L;L\u00C7\u00CD\u00CC\u00CD\u00A2\u00CD\u00D6\u00995\u009B=1\u00D72\u00E7\u009B\u00E7\u009B\u00D7\u009B\u00DF\u00B7`ZxZ,\u00B6\u00A8\u00B6\u00B8eI\u00B2\u00E4Z\u00A6Y\u00EE\u00B6\u00BCn\u0085Z9Y\u00A5XUZ]\u00B3F\u00AD\u009D\u00AD%\u00D6\u00BB\u00AD\u00BB\u00A7\x11\u00A7\u00B9N\u0093N\u00AB\u009E\u00D6g\u00C3\u00B0\u00F1\u00B6\u00C9\u00B6\u00A9\u00B7\x19\u00B0\u00E5\u00D8\x06\u00DB\u00AE\u00B6m\u00B6}agb\x17g\u00B7\u00C5\u00AE\u00C3\u00EE\u0093\u00BD\u0093}\u00BA}\u008D\u00FD=\x07\r\u0087\u00D9\x0E\u00AB\x1DZ\x1D~s\u00B4r\x14:V:\u00DE\u009A\u00CE\u009C\u00EE?}\u00C5\u00F4\u0096\u00E9/gX\u00CF\x10\u00CF\u00D83\u00E3\u00B6\x13\u00CB)\u00C4i\u009DS\u009B\u00D3Gg\x17g\u00B9s\u0083\u00F3\u0088\u008B\u0089K\u0082\u00CB.\u0097>.\u009B\x1B\u00C6\u00DD\u00C8\u00BD\u00E4Jt\u00F5q]\u00E1z\u00D2\u00F5\u009D\u009B\u00B3\u009B\u00C2\u00ED\u00A8\u00DB\u00AF\u00EE6\u00EEi\u00EE\u0087\u00DC\u009F\u00CC4\u009F)\u009EY3s\u00D0\u00C3\u00C8C\u00E0Q\u00E5\u00D1?\x0B\u009F\u00950k\u00DF\u00AC~OCO\u0081g\u00B5\u00E7#/c/\u0091W\u00AD\u00D7\u00B0\u00B7\u00A5w\u00AA\u00F7a\u00EF\x17>\u00F6>r\u009F\u00E3>\u00E3<7\u00DE2\u00DEY_\u00CC7\u00C0\u00B7\u00C8\u00B7\u00CBO\u00C3o\u009E_\u0085\u00DFC\x7F#\u00FFd\u00FFz\u00FF\u00D1\x00\u00A7\u0080%\x01g\x03\u0089\u0081A\u0081[\x02\u00FB\u00F8z|!\u00BF\u008E?:\u00DBe\u00F6\u00B2\u00D9\u00EDA\u008C\u00A0\u00B9A\x15A\u008F\u0082\u00AD\u0082\u00E5\u00C1\u00AD!h\u00C8\u00EC\u0090\u00AD!\u00F7\u00E7\u0098\u00CE\u0091\u00CEi\x0E\u0085P~\u00E8\u00D6\u00D0\x07a\u00E6a\u008B\u00C3~\f'\u0085\u0087\u0085W\u0086?\u008Ep\u0088X\x1A\u00D11\u00975w\u00D1\u00DCCs\u00DFD\u00FAD\u0096D\u00DE\u009Bg1O9\u00AF-J5*>\u00AA.j<\u00DA7\u00BA4\u00BA?\u00C6.fY\u00CC\u00D5X\u009DXIlK\x1C9.*\u00AE6nl\u00BE\u00DF\u00FC\u00ED\u00F3\u0087\u00E2\u009D\u00E2\x0B\u00E3{\x17\u0098/\u00C8]py\u00A1\u00CE\u00C2\u00F4\u0085\u00A7\x16\u00A9.\x12,:\u0096@L\u0088N8\u0094\u00F0A\x10*\u00A8\x16\u008C%\u00F2\x13w%\u008E\ny\u00C2\x1D\u00C2g\"/\u00D16\u00D1\u0088\u00D8C\\*\x1EN\u00F2H*Mz\u0092\u00EC\u0091\u00BC5y$\u00C53\u00A5,\u00E5\u00B9\u0084'\u00A9\u0090\u00BCL\rL\u00DD\u009B:\u009E\x16\u009Av m2=:\u00BD1\u0083\u0092\u0091\u0090qB\u00AA!M\u0093\u00B6g\u00EAg\u00E6fv\u00CB\u00ACe\u0085\u00B2\u00FE\u00C5n\u008B\u00B7/\x1E\u0095\x07\u00C9k\u00B3\u0090\u00AC\x05Y-\n\u00B6B\u00A6\u00E8TZ(\u00D7*\x07\u00B2geWf\u00BF\u00CD\u0089\u00CA9\u0096\u00AB\u009E+\u00CD\u00ED\u00CC\u00B3\u00CA\u00DB\u00907\u009C\u00EF\u009F\u00FF\u00ED\x12\u00C2\x12\u00E1\u0092\u00B6\u00A5\u0086KW-\x1DX\u00E6\u00BD\u00ACj9\u00B2<qy\u00DB\n\u00E3\x15\x05+\u0086V\x06\u00AC<\u00B8\u008A\u00B6*m\u00D5O\u00AB\u00EDW\u0097\u00AE~\u00BD&zMk\u0081^\u00C1\u00CA\u0082\u00C1\u00B5\x01k\u00EB\x0BU\n\u00E5\u0085}\u00EB\u00DC\u00D7\u00ED]OX/Y\u00DF\u00B5a\u00FA\u0086\u009D\x1B>\x15\u0089\u008A\u00AE\x14\u00DB\x17\u0097\x15\x7F\u00D8(\u00DCx\u00E5\x1B\u0087o\u00CA\u00BF\u0099\u00DC\u0094\u00B4\u00A9\u00AB\u00C4\u00B9d\u00CFf\u00D2f\u00E9\u00E6\u00DE-\u009E[\x0E\u0096\u00AA\u0097\u00E6\u0097\x0En\r\u00D9\u00DA\u00B4\r\u00DFV\u00B4\u00ED\u00F5\u00F6E\u00DB/\u0097\u00CD(\u00DB\u00BB\u0083\u00B6C\u00B9\u00A3\u00BF<\u00B8\u00BCe\u00A7\u00C9\u00CE\u00CD;?T\u00A4T\u00F4T\u00FAT6\u00EE\u00D2\u00DD\u00B5a\u00D7\u00F8n\u00D1\u00EE\x1B{\u00BC\u00F64\u00EC\u00D5\u00DB[\u00BC\u00F7\u00FD>\u00C9\u00BE\u00DBU\x01UM\u00D5f\u00D5e\u00FBI\u00FB\u00B3\u00F7?\u00AE\u0089\u00AA\u00E9\u00F8\u0096\u00FBm]\u00ADNmq\u00ED\u00C7\x03\u00D2\x03\u00FD\x07#\x0E\u00B6\u00D7\u00B9\u00D4\u00D5\x1D\u00D2=TR\u008F\u00D6+\u00EBG\x0E\u00C7\x1F\u00BE\u00FE\u009D\u00EFw-\r6\rU\u008D\u009C\u00C6\u00E2#pDy\u00E4\u00E9\u00F7\t\u00DF\u00F7\x1E\r:\u00DAv\u008C{\u00AC\u00E1\x07\u00D3\x1Fv\x1Dg\x1D/jB\u009A\u00F2\u009AF\u009BS\u009A\u00FB[b[\u00BAO\u00CC>\u00D1\u00D6\u00EA\u00DEz\u00FCG\u00DB\x1F\x0F\u009C4<YyJ\u00F3T\u00C9i\u00DA\u00E9\u0082\u00D3\u0093g\u00F2\u00CF\u008C\u009D\u0095\u009D}~.\u00F9\u00DC`\u00DB\u00A2\u00B6{\u00E7c\u00CE\u00DFj\x0Fo\u00EF\u00BA\x10t\u00E1\u00D2E\u00FF\u008B\u00E7;\u00BC;\u00CE\\\u00F2\u00B8t\u00F2\u00B2\u00DB\u00E5\x13W\u00B8W\u009A\u00AF:_m\u00EAt\u00EA<\u00FE\u0093\u00D3O\u00C7\u00BB\u009C\u00BB\u009A\u00AE\u00B9\\k\u00B9\u00EEz\u00BD\u00B5{f\u00F7\u00E9\x1B\u009E7\u00CE\u00DD\u00F4\u00BDy\u00F1\x16\u00FF\u00D6\u00D5\u009E9=\u00DD\u00BD\u00F3zo\u00F7\u00C5\u00F7\u00F5\u00DF\x16\u00DD~r'\u00FD\u00CE\u00CB\u00BB\u00D9w'\u00EE\u00AD\u00BCO\u00BC_\u00F4@\u00EDA\u00D9C\u00DD\u0087\u00D5?[\u00FE\u00DC\u00D8\u00EF\u00DC\x7Fj\u00C0w\u00A0\u00F3\u00D1\u00DCG\u00F7\x06\u0085\u0083\u00CF\u00FE\u0091\u00F5\u008F\x0FC\x05\u008F\u0099\u008F\u00CB\u0086\r\u0086\u00EB\u009E8>99\u00E2?r\u00FD\u00E9\u00FC\u00A7C\u00CFd\u00CF&\u009E\x17\u00FE\u00A2\u00FE\u00CB\u00AE\x17\x16/~\u00F8\u00D5\u00EB\u00D7\u00CE\u00D1\u0098\u00D1\u00A1\u0097\u00F2\u0097\u0093\u00BFm|\u00A5\u00FD\u00EA\u00C0\u00EB\x19\u00AF\u00DB\u00C6\u00C2\u00C6\x1E\u00BE\u00C9x31^\u00F4V\u00FB\u00ED\u00C1w\u00DCw\x1D\u00EF\u00A3\u00DF\x0FO\u00E4| \x7F(\u00FFh\u00F9\u00B1\u00F5S\u00D0\u00A7\u00FB\u0093\x19\u0093\u0093\u00FF\x04\x03\u0098\u00F3\u00FCc3-\u00DB\x00\x00\x00 cHRM\x00\x00z%\x00\x00\u0080\u0083\x00\x00\u00F9\u00FF\x00\x00\u0080\u00E9\x00\x00u0\x00\x00\u00EA`\x00\x00:\u0098\x00\x00\x17o\u0092_\u00C5F\x00\x00\x00:IDATx\u00DA\u00CC\u00CD!\x12\x00 \f\x04\u00B1\u00B4\u00FF\u00FF\u00F3\u00A1\u0098A@5k#\u00B6\u0092\u00B8\x14\x14\u00F4\u0084HO\u0088\u00EA\t\u00CF\u00C5\x15\u00F7\u00E2\u0089{Q\u009F/L\x0B\u00B0\x00\x00\x00\u00FF\u00FF\x03\x00h\u00EF\x1E\x14\u00CC\u00ACX\u00B5\x00\x00\x00\x00IEND\u00AEB`\u0082",
"\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\f\x00\x00\x00\f\b\x06\x00\x00\x00Vu\\\u00E7\x00\x00\x00\tpHYs\x00\x00\x0B\x13\x00\x00\x0B\x13\x01\x00\u009A\u009C\x18\x00\x00\nOiCCPPhotoshop ICC profile\x00\x00x\u00DA\u009DSgTS\u00E9\x16=\u00F7\u00DE\u00F4BK\u0088\u0080\u0094KoR\x15\b RB\u008B\u0080\x14\u0091&*!\t\x10J\u0088!\u00A1\u00D9\x15Q\u00C1\x11EE\x04\x1B\u00C8\u00A0\u0088\x03\u008E\u008E\u0080\u008C\x15Q,\f\u008A\n\u00D8\x07\u00E4!\u00A2\u008E\u0083\u00A3\u0088\u008A\u00CA\u00FB\u00E1{\u00A3k\u00D6\u00BC\u00F7\u00E6\u00CD\u00FE\u00B5\u00D7>\u00E7\u00AC\u00F3\u009D\u00B3\u00CF\x07\u00C0\b\f\u0096H3Q5\u0080\f\u00A9B\x1E\x11\u00E0\u0083\u00C7\u00C4\u00C6\u00E1\u00E4.@\u0081\n$p\x00\x10\b\u00B3d!s\u00FD#\x01\x00\u00F8~<<+\"\u00C0\x07\u00BE\x00\x01x\u00D3\x0B\b\x00\u00C0M\u009B\u00C00\x1C\u0087\u00FF\x0F\u00EAB\u0099\\\x01\u0080\u0084\x01\u00C0t\u00918K\b\u0080\x14\x00@z\u008EB\u00A6\x00@F\x01\u0080\u009D\u0098&S\x00\u00A0\x04\x00`\u00CBcb\u00E3\x00P-\x00`'\x7F\u00E6\u00D3\x00\u0080\u009D\u00F8\u0099{\x01\x00[\u0094!\x15\x01\u00A0\u0091\x00 \x13e\u0088D\x00h;\x00\u00AC\u00CFV\u008AE\x00X0\x00\x14fK\u00C49\x00\u00D8-\x000IWfH\x00\u00B0\u00B7\x00\u00C0\u00CE\x10\x0B\u00B2\x00\b\f\x000Q\u0088\u0085)\x00\x04{\x00`\u00C8##x\x00\u0084\u0099\x00\x14F\u00F2W<\u00F1+\u00AE\x10\u00E7*\x00\x00x\u0099\u00B2<\u00B9$9E\u0081[\b-q\x07WW.\x1E(\u00CEI\x17+\x146a\x02a\u009A@.\u00C2y\u0099\x192\u00814\x0F\u00E0\u00F3\u00CC\x00\x00\u00A0\u0091\x15\x11\u00E0\u0083\u00F3\u00FDx\u00CE\x0E\u00AE\u00CE\u00CE6\u008E\u00B6\x0E_-\u00EA\u00BF\x06\u00FF\"bb\u00E3\u00FE\u00E5\u00CF\u00ABp@\x00\x00\u00E1t~\u00D1\u00FE,/\u00B3\x1A\u0080;\x06\u0080m\u00FE\u00A2%\u00EE\x04h^\x0B\u00A0u\u00F7\u008Bf\u00B2\x0F@\u00B5\x00\u00A0\u00E9\u00DAW\u00F3p\u00F8~<<E\u00A1\u0090\u00B9\u00D9\u00D9\u00E5\u00E4\u00E4\u00D8J\u00C4B[a\u00CAW}\u00FEg\u00C2_\u00C0W\u00FDl\u00F9~<\u00FC\u00F7\u00F5\u00E0\u00BE\u00E2$\u00812]\u0081G\x04\u00F8\u00E0\u00C2\u00CC\u00F4L\u00A5\x1C\u00CF\u0092\t\u0084b\u00DC\u00E6\u008FG\u00FC\u00B7\x0B\u00FF\u00FC\x1D\u00D3\"\u00C4Ib\u00B9X*\x14\u00E3Q\x12q\u008ED\u009A\u008C\u00F32\u00A5\"\u0089B\u0092)\u00C5%\u00D2\u00FFd\u00E2\u00DF,\u00FB\x03>\u00DF5\x00\u00B0j>\x01{\u0091-\u00A8]c\x03\u00F6K'\x10Xt\u00C0\u00E2\u00F7\x00\x00\u00F2\u00BBo\u00C1\u00D4(\b\x03\u0080h\u0083\u00E1\u00CFw\u00FF\u00EF?\u00FDG\u00A0%\x00\u0080fI\u0092q\x00\x00^D$.T\u00CA\u00B3?\u00C7\b\x00\x00D\u00A0\u0081*\u00B0A\x1B\u00F4\u00C1\x18,\u00C0\x06\x1C\u00C1\x05\u00DC\u00C1\x0B\u00FC`6\u0084B$\u00C4\u00C2B\x10B\nd\u0080\x1Cr`)\u00AC\u0082B(\u0086\u00CD\u00B0\x1D*`/\u00D4@\x1D4\u00C0Qh\u0086\u0093p\x0E.\u00C2U\u00B8\x0E=p\x0F\u00FAa\b\u009E\u00C1(\u00BC\u0081\t\x04A\u00C8\b\x13a!\u00DA\u0088\x01b\u008AX#\u008E\b\x17\u0099\u0085\u00F8!\u00C1H\x04\x12\u008B$ \u00C9\u0088\x14Q\"K\u00915H1R\u008AT UH\x1D\u00F2=r\x029\u0087\\F\u00BA\u0091;\u00C8\x002\u0082\u00FC\u0086\u00BCG1\u0094\u0081\u00B2Q=\u00D4\f\u00B5C\u00B9\u00A87\x1A\u0084F\u00A2\x0B\u00D0dt1\u009A\u008F\x16\u00A0\u009B\u00D0r\u00B4\x1A=\u008C6\u00A1\u00E7\u00D0\u00ABh\x0F\u00DA\u008F>C\u00C70\u00C0\u00E8\x18\x073\u00C4l0.\u00C6\u00C3B\u00B18,\t\u0093c\u00CB\u00B1\"\u00AC\f\u00AB\u00C6\x1A\u00B0V\u00AC\x03\u00BB\u0089\u00F5c\u00CF\u00B1w\x04\x12\u0081E\u00C0\t6\x04wB a\x1EAHXLXN\u00D8H\u00A8 \x1C$4\x11\u00DA\t7\t\x03\u0084Q\u00C2'\"\u0093\u00A8K\u00B4&\u00BA\x11\u00F9\u00C4\x18b21\u0087XH,#\u00D6\x12\u008F\x13/\x10{\u0088C\u00C47$\x12\u0089C2'\u00B9\u0090\x02I\u00B1\u00A4T\u00D2\x12\u00D2F\u00D2nR#\u00E9,\u00A9\u009B4H\x1A#\u0093\u00C9\u00DAdk\u00B2\x079\u0094, +\u00C8\u0085\u00E4\u009D\u00E4\u00C3\u00E43\u00E4\x1B\u00E4!\u00F2[\n\u009Db@q\u00A4\u00F8S\u00E2(R\u00CAjJ\x19\u00E5\x10\u00E54\u00E5\x06e\u00982AU\u00A3\u009AR\u00DD\u00A8\u00A1T\x115\u008FZB\u00AD\u00A1\u00B6R\u00AFQ\u0087\u00A8\x134u\u009A9\u00CD\u0083\x16IK\u00A5\u00AD\u00A2\u0095\u00D3\x1Ah\x17h\u00F7i\u00AF\u00E8t\u00BA\x11\u00DD\u0095\x1EN\u0097\u00D0W\u00D2\u00CB\u00E9G\u00E8\u0097\u00E8\x03\u00F4w\f\r\u0086\x15\u0083\u00C7\u0088g(\x19\u009B\x18\x07\x18g\x19w\x18\u00AF\u0098L\u00A6\x19\u00D3\u008B\x19\u00C7T071\u00EB\u0098\u00E7\u0099\x0F\u0099oUX*\u00B6*|\x15\u0091\u00CA\n\u0095J\u0095&\u0095\x1B*/T\u00A9\u00AA\u00A6\u00AA\u00DE\u00AA\x0BU\u00F3U\u00CBT\u008F\u00A9^S}\u00AEFU3S\u00E3\u00A9\t\u00D4\u0096\u00ABU\u00AA\u009DP\u00EBS\x1BSg\u00A9;\u00A8\u0087\u00AAg\u00A8oT?\u00A4~Y\u00FD\u0089\x06Y\u00C3L\u00C3OC\u00A4Q\u00A0\u00B1_\u00E3\u00BC\u00C6 \x0Bc\x19\u00B3x,!k\r\u00AB\u0086u\u00815\u00C4&\u00B1\u00CD\u00D9|v*\u00BB\u0098\u00FD\x1D\u00BB\u008B=\u00AA\u00A9\u00A19C3J3W\u00B3R\u00F3\u0094f?\x07\u00E3\u0098q\u00F8\u009CtN\t\u00E7(\u00A7\u0097\u00F3~\u008A\u00DE\x14\u00EF)\u00E2)\x1B\u00A64L\u00B91e\\k\u00AA\u0096\u0097\u0096X\u00ABH\u00ABQ\u00ABG\u00EB\u00BD6\u00AE\u00ED\u00A7\u009D\u00A6\u00BDE\u00BBY\u00FB\u0081\x0EA\u00C7J'\\'Gg\u008F\u00CE\x05\u009D\u00E7S\u00D9S\u00DD\u00A7\n\u00A7\x16M=:\u00F5\u00AE.\u00AAk\u00A5\x1B\u00A1\u00BBDw\u00BFn\u00A7\u00EE\u0098\u009E\u00BE^\u0080\u009ELo\u00A7\u00DEy\u00BD\u00E7\u00FA\x1C}/\u00FDT\u00FDm\u00FA\u00A7\u00F5G\fX\x06\u00B3\f$\x06\u00DB\f\u00CE\x18<\u00C55qo<\x1D/\u00C7\u00DB\u00F1QC]\u00C3@C\u00A5a\u0095a\u0097\u00E1\u0084\u0091\u00B9\u00D1<\u00A3\u00D5F\u008DF\x0F\u008Ci\u00C6\\\u00E3$\u00E3m\u00C6m\u00C6\u00A3&\x06&!&KM\u00EAM\u00EE\u009ARM\u00B9\u00A6)\u00A6;L;L\u00C7\u00CD\u00CC\u00CD\u00A2\u00CD\u00D6\u00995\u009B=1\u00D72\u00E7\u009B\u00E7\u009B\u00D7\u009B\u00DF\u00B7`ZxZ,\u00B6\u00A8\u00B6\u00B8eI\u00B2\u00E4Z\u00A6Y\u00EE\u00B6\u00BCn\u0085Z9Y\u00A5XUZ]\u00B3F\u00AD\u009D\u00AD%\u00D6\u00BB\u00AD\u00BB\u00A7\x11\u00A7\u00B9N\u0093N\u00AB\u009E\u00D6g\u00C3\u00B0\u00F1\u00B6\u00C9\u00B6\u00A9\u00B7\x19\u00B0\u00E5\u00D8\x06\u00DB\u00AE\u00B6m\u00B6}agb\x17g\u00B7\u00C5\u00AE\u00C3\u00EE\u0093\u00BD\u0093}\u00BA}\u008D\u00FD=\x07\r\u0087\u00D9\x0E\u00AB\x1DZ\x1D~s\u00B4r\x14:V:\u00DE\u009A\u00CE\u009C\u00EE?}\u00C5\u00F4\u0096\u00E9/gX\u00CF\x10\u00CF\u00D83\u00E3\u00B6\x13\u00CB)\u00C4i\u009DS\u009B\u00D3Gg\x17g\u00B9s\u0083\u00F3\u0088\u008B\u0089K\u0082\u00CB.\u0097>.\u009B\x1B\u00C6\u00DD\u00C8\u00BD\u00E4Jt\u00F5q]\u00E1z\u00D2\u00F5\u009D\u009B\u00B3\u009B\u00C2\u00ED\u00A8\u00DB\u00AF\u00EE6\u00EEi\u00EE\u0087\u00DC\u009F\u00CC4\u009F)\u009EY3s\u00D0\u00C3\u00C8C\u00E0Q\u00E5\u00D1?\x0B\u009F\u00950k\u00DF\u00AC~OCO\u0081g\u00B5\u00E7#/c/\u0091W\u00AD\u00D7\u00B0\u00B7\u00A5w\u00AA\u00F7a\u00EF\x17>\u00F6>r\u009F\u00E3>\u00E3<7\u00DE2\u00DEY_\u00CC7\u00C0\u00B7\u00C8\u00B7\u00CBO\u00C3o\u009E_\u0085\u00DFC\x7F#\u00FFd\u00FFz\u00FF\u00D1\x00\u00A7\u0080%\x01g\x03\u0089\u0081A\u0081[\x02\u00FB\u00F8z|!\u00BF\u008E?:\u00DBe\u00F6\u00B2\u00D9\u00EDA\u008C\u00A0\u00B9A\x15A\u008F\u0082\u00AD\u0082\u00E5\u00C1\u00AD!h\u00C8\u00EC\u0090\u00AD!\u00F7\u00E7\u0098\u00CE\u0091\u00CEi\x0E\u0085P~\u00E8\u00D6\u00D0\x07a\u00E6a\u008B\u00C3~\f'\u0085\u0087\u0085W\u0086?\u008Ep\u0088X\x1A\u00D11\u00975w\u00D1\u00DCCs\u00DFD\u00FAD\u0096D\u00DE\u009Bg1O9\u00AF-J5*>\u00AA.j<\u00DA7\u00BA4\u00BA?\u00C6.fY\u00CC\u00D5X\u009DXIlK\x1C9.*\u00AE6nl\u00BE\u00DF\u00FC\u00ED\u00F3\u0087\u00E2\u009D\u00E2\x0B\u00E3{\x17\u0098/\u00C8]py\u00A1\u00CE\u00C2\u00F4\u0085\u00A7\x16\u00A9.\x12,:\u0096@L\u0088N8\u0094\u00F0A\x10*\u00A8\x16\u008C%\u00F2\x13w%\u008E\ny\u00C2\x1D\u00C2g\"/\u00D16\u00D1\u0088\u00D8C\\*\x1EN\u00F2H*Mz\u0092\u00EC\u0091\u00BC5y$\u00C53\u00A5,\u00E5\u00B9\u0084'\u00A9\u0090\u00BCL\rL\u00DD\u009B:\u009E\x16\u009Av m2=:\u00BD1\u0083\u0092\u0091\u0090qB\u00AA!M\u0093\u00B6g\u00EAg\u00E6fv\u00CB\u00ACe\u0085\u00B2\u00FE\u00C5n\u008B\u00B7/\x1E\u0095\x07\u00C9k\u00B3\u0090\u00AC\x05Y-\n\u00B6B\u00A6\u00E8TZ(\u00D7*\x07\u00B2geWf\u00BF\u00CD\u0089\u00CA9\u0096\u00AB\u009E+\u00CD\u00ED\u00CC\u00B3\u00CA\u00DB\u00907\u009C\u00EF\u009F\u00FF\u00ED\x12\u00C2\x12\u00E1\u0092\u00B6\u00A5\u0086KW-\x1DX\u00E6\u00BD\u00ACj9\u00B2<qy\u00DB\n\u00E3\x15\x05+\u0086V\x06\u00AC<\u00B8\u008A\u00B6*m\u00D5O\u00AB\u00EDW\u0097\u00AE~\u00BD&zMk\u0081^\u00C1\u00CA\u0082\u00C1\u00B5\x01k\u00EB\x0BU\n\u00E5\u0085}\u00EB\u00DC\u00D7\u00ED]OX/Y\u00DF\u00B5a\u00FA\u0086\u009D\x1B>\x15\u0089\u008A\u00AE\x14\u00DB\x17\u0097\x15\x7F\u00D8(\u00DCx\u00E5\x1B\u0087o\u00CA\u00BF\u0099\u00DC\u0094\u00B4\u00A9\u00AB\u00C4\u00B9d\u00CFf\u00D2f\u00E9\u00E6\u00DE-\u009E[\x0E\u0096\u00AA\u0097\u00E6\u0097\x0En\r\u00D9\u00DA\u00B4\r\u00DFV\u00B4\u00ED\u00F5\u00F6E\u00DB/\u0097\u00CD(\u00DB\u00BB\u0083\u00B6C\u00B9\u00A3\u00BF<\u00B8\u00BCe\u00A7\u00C9\u00CE\u00CD;?T\u00A4T\u00F4T\u00FAT6\u00EE\u00D2\u00DD\u00B5a\u00D7\u00F8n\u00D1\u00EE\x1B{\u00BC\u00F64\u00EC\u00D5\u00DB[\u00BC\u00F7\u00FD>\u00C9\u00BE\u00DBU\x01UM\u00D5f\u00D5e\u00FBI\u00FB\u00B3\u00F7?\u00AE\u0089\u00AA\u00E9\u00F8\u0096\u00FBm]\u00ADNmq\u00ED\u00C7\x03\u00D2\x03\u00FD\x07#\x0E\u00B6\u00D7\u00B9\u00D4\u00D5\x1D\u00D2=TR\u008F\u00D6+\u00EBG\x0E\u00C7\x1F\u00BE\u00FE\u009D\u00EFw-\r6\rU\u008D\u009C\u00C6\u00E2#pDy\u00E4\u00E9\u00F7\t\u00DF\u00F7\x1E\r:\u00DAv\u008C{\u00AC\u00E1\x07\u00D3\x1Fv\x1Dg\x1D/jB\u009A\u00F2\u009AF\u009BS\u009A\u00FB[b[\u00BAO\u00CC>\u00D1\u00D6\u00EA\u00DEz\u00FCG\u00DB\x1F\x0F\u009C4<YyJ\u00F3T\u00C9i\u00DA\u00E9\u0082\u00D3\u0093g\u00F2\u00CF\u008C\u009D\u0095\u009D}~.\u00F9\u00DC`\u00DB\u00A2\u00B6{\u00E7c\u00CE\u00DFj\x0Fo\u00EF\u00BA\x10t\u00E1\u00D2E\u00FF\u008B\u00E7;\u00BC;\u00CE\\\u00F2\u00B8t\u00F2\u00B2\u00DB\u00E5\x13W\u00B8W\u009A\u00AF:_m\u00EAt\u00EA<\u00FE\u0093\u00D3O\u00C7\u00BB\u009C\u00BB\u009A\u00AE\u00B9\\k\u00B9\u00EEz\u00BD\u00B5{f\u00F7\u00E9\x1B\u009E7\u00CE\u00DD\u00F4\u00BDy\u00F1\x16\u00FF\u00D6\u00D5\u009E9=\u00DD\u00BD\u00F3zo\u00F7\u00C5\u00F7\u00F5\u00DF\x16\u00DD~r'\u00FD\u00CE\u00CB\u00BB\u00D9w'\u00EE\u00AD\u00BCO\u00BC_\u00F4@\u00EDA\u00D9C\u00DD\u0087\u00D5?[\u00FE\u00DC\u00D8\u00EF\u00DC\x7Fj\u00C0w\u00A0\u00F3\u00D1\u00DCG\u00F7\x06\u0085\u0083\u00CF\u00FE\u0091\u00F5\u008F\x0FC\x05\u008F\u0099\u008F\u00CB\u0086\r\u0086\u00EB\u009E8>99\u00E2?r\u00FD\u00E9\u00FC\u00A7C\u00CFd\u00CF&\u009E\x17\u00FE\u00A2\u00FE\u00CB\u00AE\x17\x16/~\u00F8\u00D5\u00EB\u00D7\u00CE\u00D1\u0098\u00D1\u00A1\u0097\u00F2\u0097\u0093\u00BFm|\u00A5\u00FD\u00EA\u00C0\u00EB\x19\u00AF\u00DB\u00C6\u00C2\u00C6\x1E\u00BE\u00C9x31^\u00F4V\u00FB\u00ED\u00C1w\u00DCw\x1D\u00EF\u00A3\u00DF\x0FO\u00E4| \x7F(\u00FFh\u00F9\u00B1\u00F5S\u00D0\u00A7\u00FB\u0093\x19\u0093\u0093\u00FF\x04\x03\u0098\u00F3\u00FCc3-\u00DB\x00\x00\x00 cHRM\x00\x00z%\x00\x00\u0080\u0083\x00\x00\u00F9\u00FF\x00\x00\u0080\u00E9\x00\x00u0\x00\x00\u00EA`\x00\x00:\u0098\x00\x00\x17o\u0092_\u00C5F\x00\x00\x00KIDATx\u00DA\u0094\u0091A\n\x00 \x10\x02]\u00E9\u00FF_\u00B6KDE\u0094z]\x07F\u00B6$!\t?w\u00A5@\u009D\x10\r\u008B\r\u00A2\u00A9>\u00A1v\u00F3|mj\u0083\u00B6\u00CA\x00\u008AI\u00D9\u00DD\u00A0\u00D5\u0082I\u00D9\u00FD\x03\u00D2?l\u00E9\x00\x00\x00\u00FF\u00FF\x03\x00\u00F9\u00F1\r\x18\u00F5\\aQ\x00\x00\x00\x00IEND\u00AEB`\u0082",
"\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\t\x00\x00\x00\f\b\x06\x00\x00\x00\u00B0\\\u0097\u00A3\x00\x00\x00\x19tEXtSoftware\x00Adobe ImageReadyq\u00C9e<\x00\x00\x03fiTXtXML:com.adobe.xmp\x00\x00\x00\x00\x00<?xpacket begin=\"\u00EF\u00BB\u00BF\" id=\"W5M0MpCehiHzreSzNTczkc9d\"?> <x:xmpmeta xmlns:x=\"adobe:ns:meta/\" x:xmptk=\"Adobe XMP Core 5.3-c011 66.145661, 2012/02/06-14:56:27        \"> <rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"> <rdf:Description rdf:about=\"\" xmlns:xmpMM=\"http://ns.adobe.com/xap/1.0/mm/\" xmlns:stRef=\"http://ns.adobe.com/xap/1.0/sType/ResourceRef#\" xmlns:xmp=\"http://ns.adobe.com/xap/1.0/\" xmpMM:OriginalDocumentID=\"xmp.did:7E1F471DB7DDE2119E70AA3EF412306F\" xmpMM:DocumentID=\"xmp.did:45C321CFDE4711E29C74E18660CC79BF\" xmpMM:InstanceID=\"xmp.iid:45C321CEDE4711E29C74E18660CC79BF\" xmp:CreatorTool=\"Adobe Photoshop CS6 (Windows)\"> <xmpMM:DerivedFrom stRef:instanceID=\"xmp.iid:D9C7408542DEE211948D8F3920494658\" stRef:documentID=\"xmp.did:7E1F471DB7DDE2119E70AA3EF412306F\"/> </rdf:Description> </rdf:RDF> </x:xmpmeta> <?xpacket end=\"r\"?>\u00BCq\x06\x02\x00\x00\x009IDATx\u00DAb\u00FC\u00FF\u00FF?\x03\x1A\x00\t0\"\x0B0aQ\u0080Lc(B6\u0081\x11Y!\x13.+\u0090\x152\u00E1P\u0080\u00A2\u0090\t\u008F\x02\u00B8B&\x06\"\u00C0\u0090U\x04\x10`\x00C1\f\x15\u00C8c\u00FE\u00C2\x00\x00\x00\x00IEND\u00AEB`\u0082",
"\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\f\x00\x00\x00\f\b\x06\x00\x00\x00Vu\\\u00E7\x00\x00\x00\x19tEXtSoftware\x00Adobe ImageReadyq\u00C9e<\x00\x00\x03fiTXtXML:com.adobe.xmp\x00\x00\x00\x00\x00<?xpacket begin=\"\u00EF\u00BB\u00BF\" id=\"W5M0MpCehiHzreSzNTczkc9d\"?> <x:xmpmeta xmlns:x=\"adobe:ns:meta/\" x:xmptk=\"Adobe XMP Core 5.3-c011 66.145661, 2012/02/06-14:56:27        \"> <rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"> <rdf:Description rdf:about=\"\" xmlns:xmpMM=\"http://ns.adobe.com/xap/1.0/mm/\" xmlns:stRef=\"http://ns.adobe.com/xap/1.0/sType/ResourceRef#\" xmlns:xmp=\"http://ns.adobe.com/xap/1.0/\" xmpMM:OriginalDocumentID=\"xmp.did:7E1F471DB7DDE2119E70AA3EF412306F\" xmpMM:DocumentID=\"xmp.did:9B923355E17911E286A0B62CC6757413\" xmpMM:InstanceID=\"xmp.iid:9B923354E17911E286A0B62CC6757413\" xmp:CreatorTool=\"Adobe Photoshop CS6 (Windows)\"> <xmpMM:DerivedFrom stRef:instanceID=\"xmp.iid:76DA024754E1E21199638D58CE36839B\" stRef:documentID=\"xmp.did:7E1F471DB7DDE2119E70AA3EF412306F\"/> </rdf:Description> </rdf:RDF> </x:xmpmeta> <?xpacket end=\"r\"?>\u0093\u00BF\u00BA\u00F4\x00\x00\x00@IDATx\u00DAb\u00FC\x0F\x04\f$\x00\x16\x10\u00B1e\u00CB\x16\u00A2\x14\u00FB\u00F8\u00F8@4@\x01#\x01\u00F5`\u009701\u0090\bX\u00D0\u00AD\u00C4\x05`\u00CE&\u00D9\u0086\u00E1\u00A0\x019\u0094\u00FE\x13\x13\u0081\u008C\u00A4&\r\u0080\x00\x03\x00\x14L\x122\u00DD\u00E4G\u00C9\x00\x00\x00\x00IEND\u00AEB`\u0082",
"\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\f\x00\x00\x00\f\b\x06\x00\x00\x00Vu\\\u00E7\x00\x00\x00\tpHYs\x00\x00\x0B\x13\x00\x00\x0B\x13\x01\x00\u009A\u009C\x18\x00\x00\nOiCCPPhotoshop ICC profile\x00\x00x\u00DA\u009DSgTS\u00E9\x16=\u00F7\u00DE\u00F4BK\u0088\u0080\u0094KoR\x15\b RB\u008B\u0080\x14\u0091&*!\t\x10J\u0088!\u00A1\u00D9\x15Q\u00C1\x11EE\x04\x1B\u00C8\u00A0\u0088\x03\u008E\u008E\u0080\u008C\x15Q,\f\u008A\n\u00D8\x07\u00E4!\u00A2\u008E\u0083\u00A3\u0088\u008A\u00CA\u00FB\u00E1{\u00A3k\u00D6\u00BC\u00F7\u00E6\u00CD\u00FE\u00B5\u00D7>\u00E7\u00AC\u00F3\u009D\u00B3\u00CF\x07\u00C0\b\f\u0096H3Q5\u0080\f\u00A9B\x1E\x11\u00E0\u0083\u00C7\u00C4\u00C6\u00E1\u00E4.@\u0081\n$p\x00\x10\b\u00B3d!s\u00FD#\x01\x00\u00F8~<<+\"\u00C0\x07\u00BE\x00\x01x\u00D3\x0B\b\x00\u00C0M\u009B\u00C00\x1C\u0087\u00FF\x0F\u00EAB\u0099\\\x01\u0080\u0084\x01\u00C0t\u00918K\b\u0080\x14\x00@z\u008EB\u00A6\x00@F\x01\u0080\u009D\u0098&S\x00\u00A0\x04\x00`\u00CBcb\u00E3\x00P-\x00`'\x7F\u00E6\u00D3\x00\u0080\u009D\u00F8\u0099{\x01\x00[\u0094!\x15\x01\u00A0\u0091\x00 \x13e\u0088D\x00h;\x00\u00AC\u00CFV\u008AE\x00X0\x00\x14fK\u00C49\x00\u00D8-\x000IWfH\x00\u00B0\u00B7\x00\u00C0\u00CE\x10\x0B\u00B2\x00\b\f\x000Q\u0088\u0085)\x00\x04{\x00`\u00C8##x\x00\u0084\u0099\x00\x14F\u00F2W<\u00F1+\u00AE\x10\u00E7*\x00\x00x\u0099\u00B2<\u00B9$9E\u0081[\b-q\x07WW.\x1E(\u00CEI\x17+\x146a\x02a\u009A@.\u00C2y\u0099\x192\u00814\x0F\u00E0\u00F3\u00CC\x00\x00\u00A0\u0091\x15\x11\u00E0\u0083\u00F3\u00FDx\u00CE\x0E\u00AE\u00CE\u00CE6\u008E\u00B6\x0E_-\u00EA\u00BF\x06\u00FF\"bb\u00E3\u00FE\u00E5\u00CF\u00ABp@\x00\x00\u00E1t~\u00D1\u00FE,/\u00B3\x1A\u0080;\x06\u0080m\u00FE\u00A2%\u00EE\x04h^\x0B\u00A0u\u00F7\u008Bf\u00B2\x0F@\u00B5\x00\u00A0\u00E9\u00DAW\u00F3p\u00F8~<<E\u00A1\u0090\u00B9\u00D9\u00D9\u00E5\u00E4\u00E4\u00D8J\u00C4B[a\u00CAW}\u00FEg\u00C2_\u00C0W\u00FDl\u00F9~<\u00FC\u00F7\u00F5\u00E0\u00BE\u00E2$\u00812]\u0081G\x04\u00F8\u00E0\u00C2\u00CC\u00F4L\u00A5\x1C\u00CF\u0092\t\u0084b\u00DC\u00E6\u008FG\u00FC\u00B7\x0B\u00FF\u00FC\x1D\u00D3\"\u00C4Ib\u00B9X*\x14\u00E3Q\x12q\u008ED\u009A\u008C\u00F32\u00A5\"\u0089B\u0092)\u00C5%\u00D2\u00FFd\u00E2\u00DF,\u00FB\x03>\u00DF5\x00\u00B0j>\x01{\u0091-\u00A8]c\x03\u00F6K'\x10Xt\u00C0\u00E2\u00F7\x00\x00\u00F2\u00BBo\u00C1\u00D4(\b\x03\u0080h\u0083\u00E1\u00CFw\u00FF\u00EF?\u00FDG\u00A0%\x00\u0080fI\u0092q\x00\x00^D$.T\u00CA\u00B3?\u00C7\b\x00\x00D\u00A0\u0081*\u00B0A\x1B\u00F4\u00C1\x18,\u00C0\x06\x1C\u00C1\x05\u00DC\u00C1\x0B\u00FC`6\u0084B$\u00C4\u00C2B\x10B\nd\u0080\x1Cr`)\u00AC\u0082B(\u0086\u00CD\u00B0\x1D*`/\u00D4@\x1D4\u00C0Qh\u0086\u0093p\x0E.\u00C2U\u00B8\x0E=p\x0F\u00FAa\b\u009E\u00C1(\u00BC\u0081\t\x04A\u00C8\b\x13a!\u00DA\u0088\x01b\u008AX#\u008E\b\x17\u0099\u0085\u00F8!\u00C1H\x04\x12\u008B$ \u00C9\u0088\x14Q\"K\u00915H1R\u008AT UH\x1D\u00F2=r\x029\u0087\\F\u00BA\u0091;\u00C8\x002\u0082\u00FC\u0086\u00BCG1\u0094\u0081\u00B2Q=\u00D4\f\u00B5C\u00B9\u00A87\x1A\u0084F\u00A2\x0B\u00D0dt1\u009A\u008F\x16\u00A0\u009B\u00D0r\u00B4\x1A=\u008C6\u00A1\u00E7\u00D0\u00ABh\x0F\u00DA\u008F>C\u00C70\u00C0\u00E8\x18\x073\u00C4l0.\u00C6\u00C3B\u00B18,\t\u0093c\u00CB\u00B1\"\u00AC\f\u00AB\u00C6\x1A\u00B0V\u00AC\x03\u00BB\u0089\u00F5c\u00CF\u00B1w\x04\x12\u0081E\u00C0\t6\x04wB a\x1EAHXLXN\u00D8H\u00A8 \x1C$4\x11\u00DA\t7\t\x03\u0084Q\u00C2'\"\u0093\u00A8K\u00B4&\u00BA\x11\u00F9\u00C4\x18b21\u0087XH,#\u00D6\x12\u008F\x13/\x10{\u0088C\u00C47$\x12\u0089C2'\u00B9\u0090\x02I\u00B1\u00A4T\u00D2\x12\u00D2F\u00D2nR#\u00E9,\u00A9\u009B4H\x1A#\u0093\u00C9\u00DAdk\u00B2\x079\u0094, +\u00C8\u0085\u00E4\u009D\u00E4\u00C3\u00E43\u00E4\x1B\u00E4!\u00F2[\n\u009Db@q\u00A4\u00F8S\u00E2(R\u00CAjJ\x19\u00E5\x10\u00E54\u00E5\x06e\u00982AU\u00A3\u009AR\u00DD\u00A8\u00A1T\x115\u008FZB\u00AD\u00A1\u00B6R\u00AFQ\u0087\u00A8\x134u\u009A9\u00CD\u0083\x16IK\u00A5\u00AD\u00A2\u0095\u00D3\x1Ah\x17h\u00F7i\u00AF\u00E8t\u00BA\x11\u00DD\u0095\x1EN\u0097\u00D0W\u00D2\u00CB\u00E9G\u00E8\u0097\u00E8\x03\u00F4w\f\r\u0086\x15\u0083\u00C7\u0088g(\x19\u009B\x18\x07\x18g\x19w\x18\u00AF\u0098L\u00A6\x19\u00D3\u008B\x19\u00C7T071\u00EB\u0098\u00E7\u0099\x0F\u0099oUX*\u00B6*|\x15\u0091\u00CA\n\u0095J\u0095&\u0095\x1B*/T\u00A9\u00AA\u00A6\u00AA\u00DE\u00AA\x0BU\u00F3U\u00CBT\u008F\u00A9^S}\u00AEFU3S\u00E3\u00A9\t\u00D4\u0096\u00ABU\u00AA\u009DP\u00EBS\x1BSg\u00A9;\u00A8\u0087\u00AAg\u00A8oT?\u00A4~Y\u00FD\u0089\x06Y\u00C3L\u00C3OC\u00A4Q\u00A0\u00B1_\u00E3\u00BC\u00C6 \x0Bc\x19\u00B3x,!k\r\u00AB\u0086u\u00815\u00C4&\u00B1\u00CD\u00D9|v*\u00BB\u0098\u00FD\x1D\u00BB\u008B=\u00AA\u00A9\u00A19C3J3W\u00B3R\u00F3\u0094f?\x07\u00E3\u0098q\u00F8\u009CtN\t\u00E7(\u00A7\u0097\u00F3~\u008A\u00DE\x14\u00EF)\u00E2)\x1B\u00A64L\u00B91e\\k\u00AA\u0096\u0097\u0096X\u00ABH\u00ABQ\u00ABG\u00EB\u00BD6\u00AE\u00ED\u00A7\u009D\u00A6\u00BDE\u00BBY\u00FB\u0081\x0EA\u00C7J'\\'Gg\u008F\u00CE\x05\u009D\u00E7S\u00D9S\u00DD\u00A7\n\u00A7\x16M=:\u00F5\u00AE.\u00AAk\u00A5\x1B\u00A1\u00BBDw\u00BFn\u00A7\u00EE\u0098\u009E\u00BE^\u0080\u009ELo\u00A7\u00DEy\u00BD\u00E7\u00FA\x1C}/\u00FDT\u00FDm\u00FA\u00A7\u00F5G\fX\x06\u00B3\f$\x06\u00DB\f\u00CE\x18<\u00C55qo<\x1D/\u00C7\u00DB\u00F1QC]\u00C3@C\u00A5a\u0095a\u0097\u00E1\u0084\u0091\u00B9\u00D1<\u00A3\u00D5F\u008DF\x0F\u008Ci\u00C6\\\u00E3$\u00E3m\u00C6m\u00C6\u00A3&\x06&!&KM\u00EAM\u00EE\u009ARM\u00B9\u00A6)\u00A6;L;L\u00C7\u00CD\u00CC\u00CD\u00A2\u00CD\u00D6\u00995\u009B=1\u00D72\u00E7\u009B\u00E7\u009B\u00D7\u009B\u00DF\u00B7`ZxZ,\u00B6\u00A8\u00B6\u00B8eI\u00B2\u00E4Z\u00A6Y\u00EE\u00B6\u00BCn\u0085Z9Y\u00A5XUZ]\u00B3F\u00AD\u009D\u00AD%\u00D6\u00BB\u00AD\u00BB\u00A7\x11\u00A7\u00B9N\u0093N\u00AB\u009E\u00D6g\u00C3\u00B0\u00F1\u00B6\u00C9\u00B6\u00A9\u00B7\x19\u00B0\u00E5\u00D8\x06\u00DB\u00AE\u00B6m\u00B6}agb\x17g\u00B7\u00C5\u00AE\u00C3\u00EE\u0093\u00BD\u0093}\u00BA}\u008D\u00FD=\x07\r\u0087\u00D9\x0E\u00AB\x1DZ\x1D~s\u00B4r\x14:V:\u00DE\u009A\u00CE\u009C\u00EE?}\u00C5\u00F4\u0096\u00E9/gX\u00CF\x10\u00CF\u00D83\u00E3\u00B6\x13\u00CB)\u00C4i\u009DS\u009B\u00D3Gg\x17g\u00B9s\u0083\u00F3\u0088\u008B\u0089K\u0082\u00CB.\u0097>.\u009B\x1B\u00C6\u00DD\u00C8\u00BD\u00E4Jt\u00F5q]\u00E1z\u00D2\u00F5\u009D\u009B\u00B3\u009B\u00C2\u00ED\u00A8\u00DB\u00AF\u00EE6\u00EEi\u00EE\u0087\u00DC\u009F\u00CC4\u009F)\u009EY3s\u00D0\u00C3\u00C8C\u00E0Q\u00E5\u00D1?\x0B\u009F\u00950k\u00DF\u00AC~OCO\u0081g\u00B5\u00E7#/c/\u0091W\u00AD\u00D7\u00B0\u00B7\u00A5w\u00AA\u00F7a\u00EF\x17>\u00F6>r\u009F\u00E3>\u00E3<7\u00DE2\u00DEY_\u00CC7\u00C0\u00B7\u00C8\u00B7\u00CBO\u00C3o\u009E_\u0085\u00DFC\x7F#\u00FFd\u00FFz\u00FF\u00D1\x00\u00A7\u0080%\x01g\x03\u0089\u0081A\u0081[\x02\u00FB\u00F8z|!\u00BF\u008E?:\u00DBe\u00F6\u00B2\u00D9\u00EDA\u008C\u00A0\u00B9A\x15A\u008F\u0082\u00AD\u0082\u00E5\u00C1\u00AD!h\u00C8\u00EC\u0090\u00AD!\u00F7\u00E7\u0098\u00CE\u0091\u00CEi\x0E\u0085P~\u00E8\u00D6\u00D0\x07a\u00E6a\u008B\u00C3~\f'\u0085\u0087\u0085W\u0086?\u008Ep\u0088X\x1A\u00D11\u00975w\u00D1\u00DCCs\u00DFD\u00FAD\u0096D\u00DE\u009Bg1O9\u00AF-J5*>\u00AA.j<\u00DA7\u00BA4\u00BA?\u00C6.fY\u00CC\u00D5X\u009DXIlK\x1C9.*\u00AE6nl\u00BE\u00DF\u00FC\u00ED\u00F3\u0087\u00E2\u009D\u00E2\x0B\u00E3{\x17\u0098/\u00C8]py\u00A1\u00CE\u00C2\u00F4\u0085\u00A7\x16\u00A9.\x12,:\u0096@L\u0088N8\u0094\u00F0A\x10*\u00A8\x16\u008C%\u00F2\x13w%\u008E\ny\u00C2\x1D\u00C2g\"/\u00D16\u00D1\u0088\u00D8C\\*\x1EN\u00F2H*Mz\u0092\u00EC\u0091\u00BC5y$\u00C53\u00A5,\u00E5\u00B9\u0084'\u00A9\u0090\u00BCL\rL\u00DD\u009B:\u009E\x16\u009Av m2=:\u00BD1\u0083\u0092\u0091\u0090qB\u00AA!M\u0093\u00B6g\u00EAg\u00E6fv\u00CB\u00ACe\u0085\u00B2\u00FE\u00C5n\u008B\u00B7/\x1E\u0095\x07\u00C9k\u00B3\u0090\u00AC\x05Y-\n\u00B6B\u00A6\u00E8TZ(\u00D7*\x07\u00B2geWf\u00BF\u00CD\u0089\u00CA9\u0096\u00AB\u009E+\u00CD\u00ED\u00CC\u00B3\u00CA\u00DB\u00907\u009C\u00EF\u009F\u00FF\u00ED\x12\u00C2\x12\u00E1\u0092\u00B6\u00A5\u0086KW-\x1DX\u00E6\u00BD\u00ACj9\u00B2<qy\u00DB\n\u00E3\x15\x05+\u0086V\x06\u00AC<\u00B8\u008A\u00B6*m\u00D5O\u00AB\u00EDW\u0097\u00AE~\u00BD&zMk\u0081^\u00C1\u00CA\u0082\u00C1\u00B5\x01k\u00EB\x0BU\n\u00E5\u0085}\u00EB\u00DC\u00D7\u00ED]OX/Y\u00DF\u00B5a\u00FA\u0086\u009D\x1B>\x15\u0089\u008A\u00AE\x14\u00DB\x17\u0097\x15\x7F\u00D8(\u00DCx\u00E5\x1B\u0087o\u00CA\u00BF\u0099\u00DC\u0094\u00B4\u00A9\u00AB\u00C4\u00B9d\u00CFf\u00D2f\u00E9\u00E6\u00DE-\u009E[\x0E\u0096\u00AA\u0097\u00E6\u0097\x0En\r\u00D9\u00DA\u00B4\r\u00DFV\u00B4\u00ED\u00F5\u00F6E\u00DB/\u0097\u00CD(\u00DB\u00BB\u0083\u00B6C\u00B9\u00A3\u00BF<\u00B8\u00BCe\u00A7\u00C9\u00CE\u00CD;?T\u00A4T\u00F4T\u00FAT6\u00EE\u00D2\u00DD\u00B5a\u00D7\u00F8n\u00D1\u00EE\x1B{\u00BC\u00F64\u00EC\u00D5\u00DB[\u00BC\u00F7\u00FD>\u00C9\u00BE\u00DBU\x01UM\u00D5f\u00D5e\u00FBI\u00FB\u00B3\u00F7?\u00AE\u0089\u00AA\u00E9\u00F8\u0096\u00FBm]\u00ADNmq\u00ED\u00C7\x03\u00D2\x03\u00FD\x07#\x0E\u00B6\u00D7\u00B9\u00D4\u00D5\x1D\u00D2=TR\u008F\u00D6+\u00EBG\x0E\u00C7\x1F\u00BE\u00FE\u009D\u00EFw-\r6\rU\u008D\u009C\u00C6\u00E2#pDy\u00E4\u00E9\u00F7\t\u00DF\u00F7\x1E\r:\u00DAv\u008C{\u00AC\u00E1\x07\u00D3\x1Fv\x1Dg\x1D/jB\u009A\u00F2\u009AF\u009BS\u009A\u00FB[b[\u00BAO\u00CC>\u00D1\u00D6\u00EA\u00DEz\u00FCG\u00DB\x1F\x0F\u009C4<YyJ\u00F3T\u00C9i\u00DA\u00E9\u0082\u00D3\u0093g\u00F2\u00CF\u008C\u009D\u0095\u009D}~.\u00F9\u00DC`\u00DB\u00A2\u00B6{\u00E7c\u00CE\u00DFj\x0Fo\u00EF\u00BA\x10t\u00E1\u00D2E\u00FF\u008B\u00E7;\u00BC;\u00CE\\\u00F2\u00B8t\u00F2\u00B2\u00DB\u00E5\x13W\u00B8W\u009A\u00AF:_m\u00EAt\u00EA<\u00FE\u0093\u00D3O\u00C7\u00BB\u009C\u00BB\u009A\u00AE\u00B9\\k\u00B9\u00EEz\u00BD\u00B5{f\u00F7\u00E9\x1B\u009E7\u00CE\u00DD\u00F4\u00BDy\u00F1\x16\u00FF\u00D6\u00D5\u009E9=\u00DD\u00BD\u00F3zo\u00F7\u00C5\u00F7\u00F5\u00DF\x16\u00DD~r'\u00FD\u00CE\u00CB\u00BB\u00D9w'\u00EE\u00AD\u00BCO\u00BC_\u00F4@\u00EDA\u00D9C\u00DD\u0087\u00D5?[\u00FE\u00DC\u00D8\u00EF\u00DC\x7Fj\u00C0w\u00A0\u00F3\u00D1\u00DCG\u00F7\x06\u0085\u0083\u00CF\u00FE\u0091\u00F5\u008F\x0FC\x05\u008F\u0099\u008F\u00CB\u0086\r\u0086\u00EB\u009E8>99\u00E2?r\u00FD\u00E9\u00FC\u00A7C\u00CFd\u00CF&\u009E\x17\u00FE\u00A2\u00FE\u00CB\u00AE\x17\x16/~\u00F8\u00D5\u00EB\u00D7\u00CE\u00D1\u0098\u00D1\u00A1\u0097\u00F2\u0097\u0093\u00BFm|\u00A5\u00FD\u00EA\u00C0\u00EB\x19\u00AF\u00DB\u00C6\u00C2\u00C6\x1E\u00BE\u00C9x31^\u00F4V\u00FB\u00ED\u00C1w\u00DCw\x1D\u00EF\u00A3\u00DF\x0FO\u00E4| \x7F(\u00FFh\u00F9\u00B1\u00F5S\u00D0\u00A7\u00FB\u0093\x19\u0093\u0093\u00FF\x04\x03\u0098\u00F3\u00FCc3-\u00DB\x00\x00\x00 cHRM\x00\x00z%\x00\x00\u0080\u0083\x00\x00\u00F9\u00FF\x00\x00\u0080\u00E9\x00\x00u0\x00\x00\u00EA`\x00\x00:\u0098\x00\x00\x17o\u0092_\u00C5F\x00\x00\x00oIDATx\u00DA\u00B4\u0090\u00C1\r\u00C4 \f\x04\u00D7\u00E8\u00AAr\r\u00F4\u00E3\x1A\u00B6\x1Fj\u00D8\u00B6|\u008F\x04\u00C9:\x12\u0085<n>`k\u00F0\u00CAXf\u00E2\u0087\u00A5Q\u00F9\u00CCKD\u0080dF\u00C4\u00ADL\x12V\x12ne\u0092pwHB\u00DB\u0095'\u0096\x17KT\u00AA,\u00E9\u00D8a\u008Cq)\u00F7\u00DE\u0097^\u00C3K\u00FE\u00F7@\x12\x00X\u00DB\u0095\u00DD\u00DD\u00B6\x12\u00E6\u00E4\u00F3|\u00FEV\x00V\u008B\u00EF\x00\u00AE\x1A1\u00AF\u00C0\u00B4F\u00D4\x00\x00\x00\x00IEND\u00AEB`\u0082",
"\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\f\x00\x00\x00\f\b\x06\x00\x00\x00Vu\\\u00E7\x00\x00\x00\x19tEXtSoftware\x00Adobe ImageReadyq\u00C9e<\x00\x00\x03fiTXtXML:com.adobe.xmp\x00\x00\x00\x00\x00<?xpacket begin=\"\u00EF\u00BB\u00BF\" id=\"W5M0MpCehiHzreSzNTczkc9d\"?> <x:xmpmeta xmlns:x=\"adobe:ns:meta/\" x:xmptk=\"Adobe XMP Core 5.3-c011 66.145661, 2012/02/06-14:56:27        \"> <rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"> <rdf:Description rdf:about=\"\" xmlns:xmpMM=\"http://ns.adobe.com/xap/1.0/mm/\" xmlns:stRef=\"http://ns.adobe.com/xap/1.0/sType/ResourceRef#\" xmlns:xmp=\"http://ns.adobe.com/xap/1.0/\" xmpMM:OriginalDocumentID=\"xmp.did:7E1F471DB7DDE2119E70AA3EF412306F\" xmpMM:DocumentID=\"xmp.did:9B0FE20CE17911E2AE95D8B1A911EF2F\" xmpMM:InstanceID=\"xmp.iid:9B0FE20BE17911E2AE95D8B1A911EF2F\" xmp:CreatorTool=\"Adobe Photoshop CS6 (Windows)\"> <xmpMM:DerivedFrom stRef:instanceID=\"xmp.iid:76DA024754E1E21199638D58CE36839B\" stRef:documentID=\"xmp.did:7E1F471DB7DDE2119E70AA3EF412306F\"/> </rdf:Description> </rdf:RDF> </x:xmpmeta> <?xpacket end=\"r\"?>\u00CA\u00DB@8\x00\x00\x00vIDATx\u00DA\u0094Q\u0081\r\u00C0 \b\x13\u00E3y~\u00AB\u00FFu\u00B2\u00C8\x02\x1Dq\x19\t\u0089-\u0085\u00AA\b\u0080B\u00C1\u0084x\u00D0X8\u00E7\f\u00EA\u00DE;|\u00A3l\x078\u00A1d\u008E\u00AB\u00F1\u00AE\u00D5\u0093}\u00C6\u00A9\u0083M\x17w\u008DG\u00E0\u009C\u00A1<;\x04q\u0086\u00EB\u00A9\u0098\u00F1\u00B5\u00FC\r\u00FD%}\u00C7\x18C\u00D3pH\u00ADm\u00CD\u00CB\x01\u00BC\u0087\u0085\u00C1\u00BF\u00F4\u00B58k\x14=77Ih\u00B3\u0081\u00B7\u00B8\x04\x18\x008\x05Z6\u00A2\u00A2\u00DF\u00B1\x00\x00\x00\x00IEND\u00AEB`\u0082",
"\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\f\x00\x00\x00\f\b\x06\x00\x00\x00Vu\\\u00E7\x00\x00\x00\tpHYs\x00\x00\x0B\x13\x00\x00\x0B\x13\x01\x00\u009A\u009C\x18\x00\x00\nOiCCPPhotoshop ICC profile\x00\x00x\u00DA\u009DSgTS\u00E9\x16=\u00F7\u00DE\u00F4BK\u0088\u0080\u0094KoR\x15\b RB\u008B\u0080\x14\u0091&*!\t\x10J\u0088!\u00A1\u00D9\x15Q\u00C1\x11EE\x04\x1B\u00C8\u00A0\u0088\x03\u008E\u008E\u0080\u008C\x15Q,\f\u008A\n\u00D8\x07\u00E4!\u00A2\u008E\u0083\u00A3\u0088\u008A\u00CA\u00FB\u00E1{\u00A3k\u00D6\u00BC\u00F7\u00E6\u00CD\u00FE\u00B5\u00D7>\u00E7\u00AC\u00F3\u009D\u00B3\u00CF\x07\u00C0\b\f\u0096H3Q5\u0080\f\u00A9B\x1E\x11\u00E0\u0083\u00C7\u00C4\u00C6\u00E1\u00E4.@\u0081\n$p\x00\x10\b\u00B3d!s\u00FD#\x01\x00\u00F8~<<+\"\u00C0\x07\u00BE\x00\x01x\u00D3\x0B\b\x00\u00C0M\u009B\u00C00\x1C\u0087\u00FF\x0F\u00EAB\u0099\\\x01\u0080\u0084\x01\u00C0t\u00918K\b\u0080\x14\x00@z\u008EB\u00A6\x00@F\x01\u0080\u009D\u0098&S\x00\u00A0\x04\x00`\u00CBcb\u00E3\x00P-\x00`'\x7F\u00E6\u00D3\x00\u0080\u009D\u00F8\u0099{\x01\x00[\u0094!\x15\x01\u00A0\u0091\x00 \x13e\u0088D\x00h;\x00\u00AC\u00CFV\u008AE\x00X0\x00\x14fK\u00C49\x00\u00D8-\x000IWfH\x00\u00B0\u00B7\x00\u00C0\u00CE\x10\x0B\u00B2\x00\b\f\x000Q\u0088\u0085)\x00\x04{\x00`\u00C8##x\x00\u0084\u0099\x00\x14F\u00F2W<\u00F1+\u00AE\x10\u00E7*\x00\x00x\u0099\u00B2<\u00B9$9E\u0081[\b-q\x07WW.\x1E(\u00CEI\x17+\x146a\x02a\u009A@.\u00C2y\u0099\x192\u00814\x0F\u00E0\u00F3\u00CC\x00\x00\u00A0\u0091\x15\x11\u00E0\u0083\u00F3\u00FDx\u00CE\x0E\u00AE\u00CE\u00CE6\u008E\u00B6\x0E_-\u00EA\u00BF\x06\u00FF\"bb\u00E3\u00FE\u00E5\u00CF\u00ABp@\x00\x00\u00E1t~\u00D1\u00FE,/\u00B3\x1A\u0080;\x06\u0080m\u00FE\u00A2%\u00EE\x04h^\x0B\u00A0u\u00F7\u008Bf\u00B2\x0F@\u00B5\x00\u00A0\u00E9\u00DAW\u00F3p\u00F8~<<E\u00A1\u0090\u00B9\u00D9\u00D9\u00E5\u00E4\u00E4\u00D8J\u00C4B[a\u00CAW}\u00FEg\u00C2_\u00C0W\u00FDl\u00F9~<\u00FC\u00F7\u00F5\u00E0\u00BE\u00E2$\u00812]\u0081G\x04\u00F8\u00E0\u00C2\u00CC\u00F4L\u00A5\x1C\u00CF\u0092\t\u0084b\u00DC\u00E6\u008FG\u00FC\u00B7\x0B\u00FF\u00FC\x1D\u00D3\"\u00C4Ib\u00B9X*\x14\u00E3Q\x12q\u008ED\u009A\u008C\u00F32\u00A5\"\u0089B\u0092)\u00C5%\u00D2\u00FFd\u00E2\u00DF,\u00FB\x03>\u00DF5\x00\u00B0j>\x01{\u0091-\u00A8]c\x03\u00F6K'\x10Xt\u00C0\u00E2\u00F7\x00\x00\u00F2\u00BBo\u00C1\u00D4(\b\x03\u0080h\u0083\u00E1\u00CFw\u00FF\u00EF?\u00FDG\u00A0%\x00\u0080fI\u0092q\x00\x00^D$.T\u00CA\u00B3?\u00C7\b\x00\x00D\u00A0\u0081*\u00B0A\x1B\u00F4\u00C1\x18,\u00C0\x06\x1C\u00C1\x05\u00DC\u00C1\x0B\u00FC`6\u0084B$\u00C4\u00C2B\x10B\nd\u0080\x1Cr`)\u00AC\u0082B(\u0086\u00CD\u00B0\x1D*`/\u00D4@\x1D4\u00C0Qh\u0086\u0093p\x0E.\u00C2U\u00B8\x0E=p\x0F\u00FAa\b\u009E\u00C1(\u00BC\u0081\t\x04A\u00C8\b\x13a!\u00DA\u0088\x01b\u008AX#\u008E\b\x17\u0099\u0085\u00F8!\u00C1H\x04\x12\u008B$ \u00C9\u0088\x14Q\"K\u00915H1R\u008AT UH\x1D\u00F2=r\x029\u0087\\F\u00BA\u0091;\u00C8\x002\u0082\u00FC\u0086\u00BCG1\u0094\u0081\u00B2Q=\u00D4\f\u00B5C\u00B9\u00A87\x1A\u0084F\u00A2\x0B\u00D0dt1\u009A\u008F\x16\u00A0\u009B\u00D0r\u00B4\x1A=\u008C6\u00A1\u00E7\u00D0\u00ABh\x0F\u00DA\u008F>C\u00C70\u00C0\u00E8\x18\x073\u00C4l0.\u00C6\u00C3B\u00B18,\t\u0093c\u00CB\u00B1\"\u00AC\f\u00AB\u00C6\x1A\u00B0V\u00AC\x03\u00BB\u0089\u00F5c\u00CF\u00B1w\x04\x12\u0081E\u00C0\t6\x04wB a\x1EAHXLXN\u00D8H\u00A8 \x1C$4\x11\u00DA\t7\t\x03\u0084Q\u00C2'\"\u0093\u00A8K\u00B4&\u00BA\x11\u00F9\u00C4\x18b21\u0087XH,#\u00D6\x12\u008F\x13/\x10{\u0088C\u00C47$\x12\u0089C2'\u00B9\u0090\x02I\u00B1\u00A4T\u00D2\x12\u00D2F\u00D2nR#\u00E9,\u00A9\u009B4H\x1A#\u0093\u00C9\u00DAdk\u00B2\x079\u0094, +\u00C8\u0085\u00E4\u009D\u00E4\u00C3\u00E43\u00E4\x1B\u00E4!\u00F2[\n\u009Db@q\u00A4\u00F8S\u00E2(R\u00CAjJ\x19\u00E5\x10\u00E54\u00E5\x06e\u00982AU\u00A3\u009AR\u00DD\u00A8\u00A1T\x115\u008FZB\u00AD\u00A1\u00B6R\u00AFQ\u0087\u00A8\x134u\u009A9\u00CD\u0083\x16IK\u00A5\u00AD\u00A2\u0095\u00D3\x1Ah\x17h\u00F7i\u00AF\u00E8t\u00BA\x11\u00DD\u0095\x1EN\u0097\u00D0W\u00D2\u00CB\u00E9G\u00E8\u0097\u00E8\x03\u00F4w\f\r\u0086\x15\u0083\u00C7\u0088g(\x19\u009B\x18\x07\x18g\x19w\x18\u00AF\u0098L\u00A6\x19\u00D3\u008B\x19\u00C7T071\u00EB\u0098\u00E7\u0099\x0F\u0099oUX*\u00B6*|\x15\u0091\u00CA\n\u0095J\u0095&\u0095\x1B*/T\u00A9\u00AA\u00A6\u00AA\u00DE\u00AA\x0BU\u00F3U\u00CBT\u008F\u00A9^S}\u00AEFU3S\u00E3\u00A9\t\u00D4\u0096\u00ABU\u00AA\u009DP\u00EBS\x1BSg\u00A9;\u00A8\u0087\u00AAg\u00A8oT?\u00A4~Y\u00FD\u0089\x06Y\u00C3L\u00C3OC\u00A4Q\u00A0\u00B1_\u00E3\u00BC\u00C6 \x0Bc\x19\u00B3x,!k\r\u00AB\u0086u\u00815\u00C4&\u00B1\u00CD\u00D9|v*\u00BB\u0098\u00FD\x1D\u00BB\u008B=\u00AA\u00A9\u00A19C3J3W\u00B3R\u00F3\u0094f?\x07\u00E3\u0098q\u00F8\u009CtN\t\u00E7(\u00A7\u0097\u00F3~\u008A\u00DE\x14\u00EF)\u00E2)\x1B\u00A64L\u00B91e\\k\u00AA\u0096\u0097\u0096X\u00ABH\u00ABQ\u00ABG\u00EB\u00BD6\u00AE\u00ED\u00A7\u009D\u00A6\u00BDE\u00BBY\u00FB\u0081\x0EA\u00C7J'\\'Gg\u008F\u00CE\x05\u009D\u00E7S\u00D9S\u00DD\u00A7\n\u00A7\x16M=:\u00F5\u00AE.\u00AAk\u00A5\x1B\u00A1\u00BBDw\u00BFn\u00A7\u00EE\u0098\u009E\u00BE^\u0080\u009ELo\u00A7\u00DEy\u00BD\u00E7\u00FA\x1C}/\u00FDT\u00FDm\u00FA\u00A7\u00F5G\fX\x06\u00B3\f$\x06\u00DB\f\u00CE\x18<\u00C55qo<\x1D/\u00C7\u00DB\u00F1QC]\u00C3@C\u00A5a\u0095a\u0097\u00E1\u0084\u0091\u00B9\u00D1<\u00A3\u00D5F\u008DF\x0F\u008Ci\u00C6\\\u00E3$\u00E3m\u00C6m\u00C6\u00A3&\x06&!&KM\u00EAM\u00EE\u009ARM\u00B9\u00A6)\u00A6;L;L\u00C7\u00CD\u00CC\u00CD\u00A2\u00CD\u00D6\u00995\u009B=1\u00D72\u00E7\u009B\u00E7\u009B\u00D7\u009B\u00DF\u00B7`ZxZ,\u00B6\u00A8\u00B6\u00B8eI\u00B2\u00E4Z\u00A6Y\u00EE\u00B6\u00BCn\u0085Z9Y\u00A5XUZ]\u00B3F\u00AD\u009D\u00AD%\u00D6\u00BB\u00AD\u00BB\u00A7\x11\u00A7\u00B9N\u0093N\u00AB\u009E\u00D6g\u00C3\u00B0\u00F1\u00B6\u00C9\u00B6\u00A9\u00B7\x19\u00B0\u00E5\u00D8\x06\u00DB\u00AE\u00B6m\u00B6}agb\x17g\u00B7\u00C5\u00AE\u00C3\u00EE\u0093\u00BD\u0093}\u00BA}\u008D\u00FD=\x07\r\u0087\u00D9\x0E\u00AB\x1DZ\x1D~s\u00B4r\x14:V:\u00DE\u009A\u00CE\u009C\u00EE?}\u00C5\u00F4\u0096\u00E9/gX\u00CF\x10\u00CF\u00D83\u00E3\u00B6\x13\u00CB)\u00C4i\u009DS\u009B\u00D3Gg\x17g\u00B9s\u0083\u00F3\u0088\u008B\u0089K\u0082\u00CB.\u0097>.\u009B\x1B\u00C6\u00DD\u00C8\u00BD\u00E4Jt\u00F5q]\u00E1z\u00D2\u00F5\u009D\u009B\u00B3\u009B\u00C2\u00ED\u00A8\u00DB\u00AF\u00EE6\u00EEi\u00EE\u0087\u00DC\u009F\u00CC4\u009F)\u009EY3s\u00D0\u00C3\u00C8C\u00E0Q\u00E5\u00D1?\x0B\u009F\u00950k\u00DF\u00AC~OCO\u0081g\u00B5\u00E7#/c/\u0091W\u00AD\u00D7\u00B0\u00B7\u00A5w\u00AA\u00F7a\u00EF\x17>\u00F6>r\u009F\u00E3>\u00E3<7\u00DE2\u00DEY_\u00CC7\u00C0\u00B7\u00C8\u00B7\u00CBO\u00C3o\u009E_\u0085\u00DFC\x7F#\u00FFd\u00FFz\u00FF\u00D1\x00\u00A7\u0080%\x01g\x03\u0089\u0081A\u0081[\x02\u00FB\u00F8z|!\u00BF\u008E?:\u00DBe\u00F6\u00B2\u00D9\u00EDA\u008C\u00A0\u00B9A\x15A\u008F\u0082\u00AD\u0082\u00E5\u00C1\u00AD!h\u00C8\u00EC\u0090\u00AD!\u00F7\u00E7\u0098\u00CE\u0091\u00CEi\x0E\u0085P~\u00E8\u00D6\u00D0\x07a\u00E6a\u008B\u00C3~\f'\u0085\u0087\u0085W\u0086?\u008Ep\u0088X\x1A\u00D11\u00975w\u00D1\u00DCCs\u00DFD\u00FAD\u0096D\u00DE\u009Bg1O9\u00AF-J5*>\u00AA.j<\u00DA7\u00BA4\u00BA?\u00C6.fY\u00CC\u00D5X\u009DXIlK\x1C9.*\u00AE6nl\u00BE\u00DF\u00FC\u00ED\u00F3\u0087\u00E2\u009D\u00E2\x0B\u00E3{\x17\u0098/\u00C8]py\u00A1\u00CE\u00C2\u00F4\u0085\u00A7\x16\u00A9.\x12,:\u0096@L\u0088N8\u0094\u00F0A\x10*\u00A8\x16\u008C%\u00F2\x13w%\u008E\ny\u00C2\x1D\u00C2g\"/\u00D16\u00D1\u0088\u00D8C\\*\x1EN\u00F2H*Mz\u0092\u00EC\u0091\u00BC5y$\u00C53\u00A5,\u00E5\u00B9\u0084'\u00A9\u0090\u00BCL\rL\u00DD\u009B:\u009E\x16\u009Av m2=:\u00BD1\u0083\u0092\u0091\u0090qB\u00AA!M\u0093\u00B6g\u00EAg\u00E6fv\u00CB\u00ACe\u0085\u00B2\u00FE\u00C5n\u008B\u00B7/\x1E\u0095\x07\u00C9k\u00B3\u0090\u00AC\x05Y-\n\u00B6B\u00A6\u00E8TZ(\u00D7*\x07\u00B2geWf\u00BF\u00CD\u0089\u00CA9\u0096\u00AB\u009E+\u00CD\u00ED\u00CC\u00B3\u00CA\u00DB\u00907\u009C\u00EF\u009F\u00FF\u00ED\x12\u00C2\x12\u00E1\u0092\u00B6\u00A5\u0086KW-\x1DX\u00E6\u00BD\u00ACj9\u00B2<qy\u00DB\n\u00E3\x15\x05+\u0086V\x06\u00AC<\u00B8\u008A\u00B6*m\u00D5O\u00AB\u00EDW\u0097\u00AE~\u00BD&zMk\u0081^\u00C1\u00CA\u0082\u00C1\u00B5\x01k\u00EB\x0BU\n\u00E5\u0085}\u00EB\u00DC\u00D7\u00ED]OX/Y\u00DF\u00B5a\u00FA\u0086\u009D\x1B>\x15\u0089\u008A\u00AE\x14\u00DB\x17\u0097\x15\x7F\u00D8(\u00DCx\u00E5\x1B\u0087o\u00CA\u00BF\u0099\u00DC\u0094\u00B4\u00A9\u00AB\u00C4\u00B9d\u00CFf\u00D2f\u00E9\u00E6\u00DE-\u009E[\x0E\u0096\u00AA\u0097\u00E6\u0097\x0En\r\u00D9\u00DA\u00B4\r\u00DFV\u00B4\u00ED\u00F5\u00F6E\u00DB/\u0097\u00CD(\u00DB\u00BB\u0083\u00B6C\u00B9\u00A3\u00BF<\u00B8\u00BCe\u00A7\u00C9\u00CE\u00CD;?T\u00A4T\u00F4T\u00FAT6\u00EE\u00D2\u00DD\u00B5a\u00D7\u00F8n\u00D1\u00EE\x1B{\u00BC\u00F64\u00EC\u00D5\u00DB[\u00BC\u00F7\u00FD>\u00C9\u00BE\u00DBU\x01UM\u00D5f\u00D5e\u00FBI\u00FB\u00B3\u00F7?\u00AE\u0089\u00AA\u00E9\u00F8\u0096\u00FBm]\u00ADNmq\u00ED\u00C7\x03\u00D2\x03\u00FD\x07#\x0E\u00B6\u00D7\u00B9\u00D4\u00D5\x1D\u00D2=TR\u008F\u00D6+\u00EBG\x0E\u00C7\x1F\u00BE\u00FE\u009D\u00EFw-\r6\rU\u008D\u009C\u00C6\u00E2#pDy\u00E4\u00E9\u00F7\t\u00DF\u00F7\x1E\r:\u00DAv\u008C{\u00AC\u00E1\x07\u00D3\x1Fv\x1Dg\x1D/jB\u009A\u00F2\u009AF\u009BS\u009A\u00FB[b[\u00BAO\u00CC>\u00D1\u00D6\u00EA\u00DEz\u00FCG\u00DB\x1F\x0F\u009C4<YyJ\u00F3T\u00C9i\u00DA\u00E9\u0082\u00D3\u0093g\u00F2\u00CF\u008C\u009D\u0095\u009D}~.\u00F9\u00DC`\u00DB\u00A2\u00B6{\u00E7c\u00CE\u00DFj\x0Fo\u00EF\u00BA\x10t\u00E1\u00D2E\u00FF\u008B\u00E7;\u00BC;\u00CE\\\u00F2\u00B8t\u00F2\u00B2\u00DB\u00E5\x13W\u00B8W\u009A\u00AF:_m\u00EAt\u00EA<\u00FE\u0093\u00D3O\u00C7\u00BB\u009C\u00BB\u009A\u00AE\u00B9\\k\u00B9\u00EEz\u00BD\u00B5{f\u00F7\u00E9\x1B\u009E7\u00CE\u00DD\u00F4\u00BDy\u00F1\x16\u00FF\u00D6\u00D5\u009E9=\u00DD\u00BD\u00F3zo\u00F7\u00C5\u00F7\u00F5\u00DF\x16\u00DD~r'\u00FD\u00CE\u00CB\u00BB\u00D9w'\u00EE\u00AD\u00BCO\u00BC_\u00F4@\u00EDA\u00D9C\u00DD\u0087\u00D5?[\u00FE\u00DC\u00D8\u00EF\u00DC\x7Fj\u00C0w\u00A0\u00F3\u00D1\u00DCG\u00F7\x06\u0085\u0083\u00CF\u00FE\u0091\u00F5\u008F\x0FC\x05\u008F\u0099\u008F\u00CB\u0086\r\u0086\u00EB\u009E8>99\u00E2?r\u00FD\u00E9\u00FC\u00A7C\u00CFd\u00CF&\u009E\x17\u00FE\u00A2\u00FE\u00CB\u00AE\x17\x16/~\u00F8\u00D5\u00EB\u00D7\u00CE\u00D1\u0098\u00D1\u00A1\u0097\u00F2\u0097\u0093\u00BFm|\u00A5\u00FD\u00EA\u00C0\u00EB\x19\u00AF\u00DB\u00C6\u00C2\u00C6\x1E\u00BE\u00C9x31^\u00F4V\u00FB\u00ED\u00C1w\u00DCw\x1D\u00EF\u00A3\u00DF\x0FO\u00E4| \x7F(\u00FFh\u00F9\u00B1\u00F5S\u00D0\u00A7\u00FB\u0093\x19\u0093\u0093\u00FF\x04\x03\u0098\u00F3\u00FCc3-\u00DB\x00\x00\x00 cHRM\x00\x00z%\x00\x00\u0080\u0083\x00\x00\u00F9\u00FF\x00\x00\u0080\u00E9\x00\x00u0\x00\x00\u00EA`\x00\x00:\u0098\x00\x00\x17o\u0092_\u00C5F\x00\x00\x00IIDATx\u00DA\u0094\u0091A\n\x000\b\u00C3\u00EA\u00F0\u00FF_\u00EEN\u0083\u00CA\u00C4u\u00BD)\u00C4\u0088\x06IbNh\u0091]Sr\r[x\u0087\n:@\u00BB\x12L\u0093e(\u00A6\x1F\u00A0\u00AC\u00C4\x1F \x04\n\u00D7\x00\u00D7\u0094\u00CD\u00F9FS\u00BA\x1F>\u00D9\x03\x00\u00B6i\r!\u00A4\u00C1\u0088\u00E8\x00\x00\x00\x00IEND\u00AEB`\u0082",
"\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\f\x00\x00\x00\f\b\x06\x00\x00\x00Vu\\\u00E7\x00\x00\x00\tpHYs\x00\x00\x0B\x13\x00\x00\x0B\x13\x01\x00\u009A\u009C\x18\x00\x00\nOiCCPPhotoshop ICC profile\x00\x00x\u00DA\u009DSgTS\u00E9\x16=\u00F7\u00DE\u00F4BK\u0088\u0080\u0094KoR\x15\b RB\u008B\u0080\x14\u0091&*!\t\x10J\u0088!\u00A1\u00D9\x15Q\u00C1\x11EE\x04\x1B\u00C8\u00A0\u0088\x03\u008E\u008E\u0080\u008C\x15Q,\f\u008A\n\u00D8\x07\u00E4!\u00A2\u008E\u0083\u00A3\u0088\u008A\u00CA\u00FB\u00E1{\u00A3k\u00D6\u00BC\u00F7\u00E6\u00CD\u00FE\u00B5\u00D7>\u00E7\u00AC\u00F3\u009D\u00B3\u00CF\x07\u00C0\b\f\u0096H3Q5\u0080\f\u00A9B\x1E\x11\u00E0\u0083\u00C7\u00C4\u00C6\u00E1\u00E4.@\u0081\n$p\x00\x10\b\u00B3d!s\u00FD#\x01\x00\u00F8~<<+\"\u00C0\x07\u00BE\x00\x01x\u00D3\x0B\b\x00\u00C0M\u009B\u00C00\x1C\u0087\u00FF\x0F\u00EAB\u0099\\\x01\u0080\u0084\x01\u00C0t\u00918K\b\u0080\x14\x00@z\u008EB\u00A6\x00@F\x01\u0080\u009D\u0098&S\x00\u00A0\x04\x00`\u00CBcb\u00E3\x00P-\x00`'\x7F\u00E6\u00D3\x00\u0080\u009D\u00F8\u0099{\x01\x00[\u0094!\x15\x01\u00A0\u0091\x00 \x13e\u0088D\x00h;\x00\u00AC\u00CFV\u008AE\x00X0\x00\x14fK\u00C49\x00\u00D8-\x000IWfH\x00\u00B0\u00B7\x00\u00C0\u00CE\x10\x0B\u00B2\x00\b\f\x000Q\u0088\u0085)\x00\x04{\x00`\u00C8##x\x00\u0084\u0099\x00\x14F\u00F2W<\u00F1+\u00AE\x10\u00E7*\x00\x00x\u0099\u00B2<\u00B9$9E\u0081[\b-q\x07WW.\x1E(\u00CEI\x17+\x146a\x02a\u009A@.\u00C2y\u0099\x192\u00814\x0F\u00E0\u00F3\u00CC\x00\x00\u00A0\u0091\x15\x11\u00E0\u0083\u00F3\u00FDx\u00CE\x0E\u00AE\u00CE\u00CE6\u008E\u00B6\x0E_-\u00EA\u00BF\x06\u00FF\"bb\u00E3\u00FE\u00E5\u00CF\u00ABp@\x00\x00\u00E1t~\u00D1\u00FE,/\u00B3\x1A\u0080;\x06\u0080m\u00FE\u00A2%\u00EE\x04h^\x0B\u00A0u\u00F7\u008Bf\u00B2\x0F@\u00B5\x00\u00A0\u00E9\u00DAW\u00F3p\u00F8~<<E\u00A1\u0090\u00B9\u00D9\u00D9\u00E5\u00E4\u00E4\u00D8J\u00C4B[a\u00CAW}\u00FEg\u00C2_\u00C0W\u00FDl\u00F9~<\u00FC\u00F7\u00F5\u00E0\u00BE\u00E2$\u00812]\u0081G\x04\u00F8\u00E0\u00C2\u00CC\u00F4L\u00A5\x1C\u00CF\u0092\t\u0084b\u00DC\u00E6\u008FG\u00FC\u00B7\x0B\u00FF\u00FC\x1D\u00D3\"\u00C4Ib\u00B9X*\x14\u00E3Q\x12q\u008ED\u009A\u008C\u00F32\u00A5\"\u0089B\u0092)\u00C5%\u00D2\u00FFd\u00E2\u00DF,\u00FB\x03>\u00DF5\x00\u00B0j>\x01{\u0091-\u00A8]c\x03\u00F6K'\x10Xt\u00C0\u00E2\u00F7\x00\x00\u00F2\u00BBo\u00C1\u00D4(\b\x03\u0080h\u0083\u00E1\u00CFw\u00FF\u00EF?\u00FDG\u00A0%\x00\u0080fI\u0092q\x00\x00^D$.T\u00CA\u00B3?\u00C7\b\x00\x00D\u00A0\u0081*\u00B0A\x1B\u00F4\u00C1\x18,\u00C0\x06\x1C\u00C1\x05\u00DC\u00C1\x0B\u00FC`6\u0084B$\u00C4\u00C2B\x10B\nd\u0080\x1Cr`)\u00AC\u0082B(\u0086\u00CD\u00B0\x1D*`/\u00D4@\x1D4\u00C0Qh\u0086\u0093p\x0E.\u00C2U\u00B8\x0E=p\x0F\u00FAa\b\u009E\u00C1(\u00BC\u0081\t\x04A\u00C8\b\x13a!\u00DA\u0088\x01b\u008AX#\u008E\b\x17\u0099\u0085\u00F8!\u00C1H\x04\x12\u008B$ \u00C9\u0088\x14Q\"K\u00915H1R\u008AT UH\x1D\u00F2=r\x029\u0087\\F\u00BA\u0091;\u00C8\x002\u0082\u00FC\u0086\u00BCG1\u0094\u0081\u00B2Q=\u00D4\f\u00B5C\u00B9\u00A87\x1A\u0084F\u00A2\x0B\u00D0dt1\u009A\u008F\x16\u00A0\u009B\u00D0r\u00B4\x1A=\u008C6\u00A1\u00E7\u00D0\u00ABh\x0F\u00DA\u008F>C\u00C70\u00C0\u00E8\x18\x073\u00C4l0.\u00C6\u00C3B\u00B18,\t\u0093c\u00CB\u00B1\"\u00AC\f\u00AB\u00C6\x1A\u00B0V\u00AC\x03\u00BB\u0089\u00F5c\u00CF\u00B1w\x04\x12\u0081E\u00C0\t6\x04wB a\x1EAHXLXN\u00D8H\u00A8 \x1C$4\x11\u00DA\t7\t\x03\u0084Q\u00C2'\"\u0093\u00A8K\u00B4&\u00BA\x11\u00F9\u00C4\x18b21\u0087XH,#\u00D6\x12\u008F\x13/\x10{\u0088C\u00C47$\x12\u0089C2'\u00B9\u0090\x02I\u00B1\u00A4T\u00D2\x12\u00D2F\u00D2nR#\u00E9,\u00A9\u009B4H\x1A#\u0093\u00C9\u00DAdk\u00B2\x079\u0094, +\u00C8\u0085\u00E4\u009D\u00E4\u00C3\u00E43\u00E4\x1B\u00E4!\u00F2[\n\u009Db@q\u00A4\u00F8S\u00E2(R\u00CAjJ\x19\u00E5\x10\u00E54\u00E5\x06e\u00982AU\u00A3\u009AR\u00DD\u00A8\u00A1T\x115\u008FZB\u00AD\u00A1\u00B6R\u00AFQ\u0087\u00A8\x134u\u009A9\u00CD\u0083\x16IK\u00A5\u00AD\u00A2\u0095\u00D3\x1Ah\x17h\u00F7i\u00AF\u00E8t\u00BA\x11\u00DD\u0095\x1EN\u0097\u00D0W\u00D2\u00CB\u00E9G\u00E8\u0097\u00E8\x03\u00F4w\f\r\u0086\x15\u0083\u00C7\u0088g(\x19\u009B\x18\x07\x18g\x19w\x18\u00AF\u0098L\u00A6\x19\u00D3\u008B\x19\u00C7T071\u00EB\u0098\u00E7\u0099\x0F\u0099oUX*\u00B6*|\x15\u0091\u00CA\n\u0095J\u0095&\u0095\x1B*/T\u00A9\u00AA\u00A6\u00AA\u00DE\u00AA\x0BU\u00F3U\u00CBT\u008F\u00A9^S}\u00AEFU3S\u00E3\u00A9\t\u00D4\u0096\u00ABU\u00AA\u009DP\u00EBS\x1BSg\u00A9;\u00A8\u0087\u00AAg\u00A8oT?\u00A4~Y\u00FD\u0089\x06Y\u00C3L\u00C3OC\u00A4Q\u00A0\u00B1_\u00E3\u00BC\u00C6 \x0Bc\x19\u00B3x,!k\r\u00AB\u0086u\u00815\u00C4&\u00B1\u00CD\u00D9|v*\u00BB\u0098\u00FD\x1D\u00BB\u008B=\u00AA\u00A9\u00A19C3J3W\u00B3R\u00F3\u0094f?\x07\u00E3\u0098q\u00F8\u009CtN\t\u00E7(\u00A7\u0097\u00F3~\u008A\u00DE\x14\u00EF)\u00E2)\x1B\u00A64L\u00B91e\\k\u00AA\u0096\u0097\u0096X\u00ABH\u00ABQ\u00ABG\u00EB\u00BD6\u00AE\u00ED\u00A7\u009D\u00A6\u00BDE\u00BBY\u00FB\u0081\x0EA\u00C7J'\\'Gg\u008F\u00CE\x05\u009D\u00E7S\u00D9S\u00DD\u00A7\n\u00A7\x16M=:\u00F5\u00AE.\u00AAk\u00A5\x1B\u00A1\u00BBDw\u00BFn\u00A7\u00EE\u0098\u009E\u00BE^\u0080\u009ELo\u00A7\u00DEy\u00BD\u00E7\u00FA\x1C}/\u00FDT\u00FDm\u00FA\u00A7\u00F5G\fX\x06\u00B3\f$\x06\u00DB\f\u00CE\x18<\u00C55qo<\x1D/\u00C7\u00DB\u00F1QC]\u00C3@C\u00A5a\u0095a\u0097\u00E1\u0084\u0091\u00B9\u00D1<\u00A3\u00D5F\u008DF\x0F\u008Ci\u00C6\\\u00E3$\u00E3m\u00C6m\u00C6\u00A3&\x06&!&KM\u00EAM\u00EE\u009ARM\u00B9\u00A6)\u00A6;L;L\u00C7\u00CD\u00CC\u00CD\u00A2\u00CD\u00D6\u00995\u009B=1\u00D72\u00E7\u009B\u00E7\u009B\u00D7\u009B\u00DF\u00B7`ZxZ,\u00B6\u00A8\u00B6\u00B8eI\u00B2\u00E4Z\u00A6Y\u00EE\u00B6\u00BCn\u0085Z9Y\u00A5XUZ]\u00B3F\u00AD\u009D\u00AD%\u00D6\u00BB\u00AD\u00BB\u00A7\x11\u00A7\u00B9N\u0093N\u00AB\u009E\u00D6g\u00C3\u00B0\u00F1\u00B6\u00C9\u00B6\u00A9\u00B7\x19\u00B0\u00E5\u00D8\x06\u00DB\u00AE\u00B6m\u00B6}agb\x17g\u00B7\u00C5\u00AE\u00C3\u00EE\u0093\u00BD\u0093}\u00BA}\u008D\u00FD=\x07\r\u0087\u00D9\x0E\u00AB\x1DZ\x1D~s\u00B4r\x14:V:\u00DE\u009A\u00CE\u009C\u00EE?}\u00C5\u00F4\u0096\u00E9/gX\u00CF\x10\u00CF\u00D83\u00E3\u00B6\x13\u00CB)\u00C4i\u009DS\u009B\u00D3Gg\x17g\u00B9s\u0083\u00F3\u0088\u008B\u0089K\u0082\u00CB.\u0097>.\u009B\x1B\u00C6\u00DD\u00C8\u00BD\u00E4Jt\u00F5q]\u00E1z\u00D2\u00F5\u009D\u009B\u00B3\u009B\u00C2\u00ED\u00A8\u00DB\u00AF\u00EE6\u00EEi\u00EE\u0087\u00DC\u009F\u00CC4\u009F)\u009EY3s\u00D0\u00C3\u00C8C\u00E0Q\u00E5\u00D1?\x0B\u009F\u00950k\u00DF\u00AC~OCO\u0081g\u00B5\u00E7#/c/\u0091W\u00AD\u00D7\u00B0\u00B7\u00A5w\u00AA\u00F7a\u00EF\x17>\u00F6>r\u009F\u00E3>\u00E3<7\u00DE2\u00DEY_\u00CC7\u00C0\u00B7\u00C8\u00B7\u00CBO\u00C3o\u009E_\u0085\u00DFC\x7F#\u00FFd\u00FFz\u00FF\u00D1\x00\u00A7\u0080%\x01g\x03\u0089\u0081A\u0081[\x02\u00FB\u00F8z|!\u00BF\u008E?:\u00DBe\u00F6\u00B2\u00D9\u00EDA\u008C\u00A0\u00B9A\x15A\u008F\u0082\u00AD\u0082\u00E5\u00C1\u00AD!h\u00C8\u00EC\u0090\u00AD!\u00F7\u00E7\u0098\u00CE\u0091\u00CEi\x0E\u0085P~\u00E8\u00D6\u00D0\x07a\u00E6a\u008B\u00C3~\f'\u0085\u0087\u0085W\u0086?\u008Ep\u0088X\x1A\u00D11\u00975w\u00D1\u00DCCs\u00DFD\u00FAD\u0096D\u00DE\u009Bg1O9\u00AF-J5*>\u00AA.j<\u00DA7\u00BA4\u00BA?\u00C6.fY\u00CC\u00D5X\u009DXIlK\x1C9.*\u00AE6nl\u00BE\u00DF\u00FC\u00ED\u00F3\u0087\u00E2\u009D\u00E2\x0B\u00E3{\x17\u0098/\u00C8]py\u00A1\u00CE\u00C2\u00F4\u0085\u00A7\x16\u00A9.\x12,:\u0096@L\u0088N8\u0094\u00F0A\x10*\u00A8\x16\u008C%\u00F2\x13w%\u008E\ny\u00C2\x1D\u00C2g\"/\u00D16\u00D1\u0088\u00D8C\\*\x1EN\u00F2H*Mz\u0092\u00EC\u0091\u00BC5y$\u00C53\u00A5,\u00E5\u00B9\u0084'\u00A9\u0090\u00BCL\rL\u00DD\u009B:\u009E\x16\u009Av m2=:\u00BD1\u0083\u0092\u0091\u0090qB\u00AA!M\u0093\u00B6g\u00EAg\u00E6fv\u00CB\u00ACe\u0085\u00B2\u00FE\u00C5n\u008B\u00B7/\x1E\u0095\x07\u00C9k\u00B3\u0090\u00AC\x05Y-\n\u00B6B\u00A6\u00E8TZ(\u00D7*\x07\u00B2geWf\u00BF\u00CD\u0089\u00CA9\u0096\u00AB\u009E+\u00CD\u00ED\u00CC\u00B3\u00CA\u00DB\u00907\u009C\u00EF\u009F\u00FF\u00ED\x12\u00C2\x12\u00E1\u0092\u00B6\u00A5\u0086KW-\x1DX\u00E6\u00BD\u00ACj9\u00B2<qy\u00DB\n\u00E3\x15\x05+\u0086V\x06\u00AC<\u00B8\u008A\u00B6*m\u00D5O\u00AB\u00EDW\u0097\u00AE~\u00BD&zMk\u0081^\u00C1\u00CA\u0082\u00C1\u00B5\x01k\u00EB\x0BU\n\u00E5\u0085}\u00EB\u00DC\u00D7\u00ED]OX/Y\u00DF\u00B5a\u00FA\u0086\u009D\x1B>\x15\u0089\u008A\u00AE\x14\u00DB\x17\u0097\x15\x7F\u00D8(\u00DCx\u00E5\x1B\u0087o\u00CA\u00BF\u0099\u00DC\u0094\u00B4\u00A9\u00AB\u00C4\u00B9d\u00CFf\u00D2f\u00E9\u00E6\u00DE-\u009E[\x0E\u0096\u00AA\u0097\u00E6\u0097\x0En\r\u00D9\u00DA\u00B4\r\u00DFV\u00B4\u00ED\u00F5\u00F6E\u00DB/\u0097\u00CD(\u00DB\u00BB\u0083\u00B6C\u00B9\u00A3\u00BF<\u00B8\u00BCe\u00A7\u00C9\u00CE\u00CD;?T\u00A4T\u00F4T\u00FAT6\u00EE\u00D2\u00DD\u00B5a\u00D7\u00F8n\u00D1\u00EE\x1B{\u00BC\u00F64\u00EC\u00D5\u00DB[\u00BC\u00F7\u00FD>\u00C9\u00BE\u00DBU\x01UM\u00D5f\u00D5e\u00FBI\u00FB\u00B3\u00F7?\u00AE\u0089\u00AA\u00E9\u00F8\u0096\u00FBm]\u00ADNmq\u00ED\u00C7\x03\u00D2\x03\u00FD\x07#\x0E\u00B6\u00D7\u00B9\u00D4\u00D5\x1D\u00D2=TR\u008F\u00D6+\u00EBG\x0E\u00C7\x1F\u00BE\u00FE\u009D\u00EFw-\r6\rU\u008D\u009C\u00C6\u00E2#pDy\u00E4\u00E9\u00F7\t\u00DF\u00F7\x1E\r:\u00DAv\u008C{\u00AC\u00E1\x07\u00D3\x1Fv\x1Dg\x1D/jB\u009A\u00F2\u009AF\u009BS\u009A\u00FB[b[\u00BAO\u00CC>\u00D1\u00D6\u00EA\u00DEz\u00FCG\u00DB\x1F\x0F\u009C4<YyJ\u00F3T\u00C9i\u00DA\u00E9\u0082\u00D3\u0093g\u00F2\u00CF\u008C\u009D\u0095\u009D}~.\u00F9\u00DC`\u00DB\u00A2\u00B6{\u00E7c\u00CE\u00DFj\x0Fo\u00EF\u00BA\x10t\u00E1\u00D2E\u00FF\u008B\u00E7;\u00BC;\u00CE\\\u00F2\u00B8t\u00F2\u00B2\u00DB\u00E5\x13W\u00B8W\u009A\u00AF:_m\u00EAt\u00EA<\u00FE\u0093\u00D3O\u00C7\u00BB\u009C\u00BB\u009A\u00AE\u00B9\\k\u00B9\u00EEz\u00BD\u00B5{f\u00F7\u00E9\x1B\u009E7\u00CE\u00DD\u00F4\u00BDy\u00F1\x16\u00FF\u00D6\u00D5\u009E9=\u00DD\u00BD\u00F3zo\u00F7\u00C5\u00F7\u00F5\u00DF\x16\u00DD~r'\u00FD\u00CE\u00CB\u00BB\u00D9w'\u00EE\u00AD\u00BCO\u00BC_\u00F4@\u00EDA\u00D9C\u00DD\u0087\u00D5?[\u00FE\u00DC\u00D8\u00EF\u00DC\x7Fj\u00C0w\u00A0\u00F3\u00D1\u00DCG\u00F7\x06\u0085\u0083\u00CF\u00FE\u0091\u00F5\u008F\x0FC\x05\u008F\u0099\u008F\u00CB\u0086\r\u0086\u00EB\u009E8>99\u00E2?r\u00FD\u00E9\u00FC\u00A7C\u00CFd\u00CF&\u009E\x17\u00FE\u00A2\u00FE\u00CB\u00AE\x17\x16/~\u00F8\u00D5\u00EB\u00D7\u00CE\u00D1\u0098\u00D1\u00A1\u0097\u00F2\u0097\u0093\u00BFm|\u00A5\u00FD\u00EA\u00C0\u00EB\x19\u00AF\u00DB\u00C6\u00C2\u00C6\x1E\u00BE\u00C9x31^\u00F4V\u00FB\u00ED\u00C1w\u00DCw\x1D\u00EF\u00A3\u00DF\x0FO\u00E4| \x7F(\u00FFh\u00F9\u00B1\u00F5S\u00D0\u00A7\u00FB\u0093\x19\u0093\u0093\u00FF\x04\x03\u0098\u00F3\u00FCc3-\u00DB\x00\x00\x00 cHRM\x00\x00z%\x00\x00\u0080\u0083\x00\x00\u00F9\u00FF\x00\x00\u0080\u00E9\x00\x00u0\x00\x00\u00EA`\x00\x00:\u0098\x00\x00\x17o\u0092_\u00C5F\x00\x00\x006IDATx\u00DAb\u00FC\u00FF\u00FF?\x03\x03\x03\u00C3\x7F\x06\x06\x06F\x06\b\u00C0\u00CBf\u00FC\x0F\u00D5A,`B2\u0081\u0091\x186\x13\x03\u0089`\u00D4I\u0083\u00C3I\x00\x00\x00\x00\u00FF\u00FF\x03\x00\u0084\u00B1\x17!V\u00F1\b\u0087\x00\x00\x00\x00IEND\u00AEB`\u0082",
"\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\f\x00\x00\x00\x0B\b\x06\x00\x00\x00Kpl_\x00\x00\x00\x19tEXtSoftware\x00Adobe ImageReadyq\u00C9e<\x00\x00\x03fiTXtXML:com.adobe.xmp\x00\x00\x00\x00\x00<?xpacket begin=\"\u00EF\u00BB\u00BF\" id=\"W5M0MpCehiHzreSzNTczkc9d\"?> <x:xmpmeta xmlns:x=\"adobe:ns:meta/\" x:xmptk=\"Adobe XMP Core 5.3-c011 66.145661, 2012/02/06-14:56:27        \"> <rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"> <rdf:Description rdf:about=\"\" xmlns:xmpMM=\"http://ns.adobe.com/xap/1.0/mm/\" xmlns:stRef=\"http://ns.adobe.com/xap/1.0/sType/ResourceRef#\" xmlns:xmp=\"http://ns.adobe.com/xap/1.0/\" xmpMM:OriginalDocumentID=\"xmp.did:7E1F471DB7DDE2119E70AA3EF412306F\" xmpMM:DocumentID=\"xmp.did:5D47E0FDE17811E2B345DBA83DBE4275\" xmpMM:InstanceID=\"xmp.iid:5D47E0FCE17811E2B345DBA83DBE4275\" xmp:CreatorTool=\"Adobe Photoshop CS6 (Windows)\"> <xmpMM:DerivedFrom stRef:instanceID=\"xmp.iid:76DA024754E1E21199638D58CE36839B\" stRef:documentID=\"xmp.did:7E1F471DB7DDE2119E70AA3EF412306F\"/> </rdf:Description> </rdf:RDF> </x:xmpmeta> <?xpacket end=\"r\"?>\u00B3\u00C2\u00D0@\x00\x00\x00PIDATx\u00DA\u009C\u0091\u00DB\n\x00 \bCU\u00FC\u00FF_^\x04\x15\u00A3\u008BY\x03_\x14\u008Fc*\x00\u00D9\u00A86u70y\u0094%\u00E9h%\u009E\u00802\x00\u0096\u00F5\u00DE\u00E5\x07\u00A2\u00D0\u00A2r\u00CF\x03:\u00A6\u00A5kJL^R\u00BAz\u00FF\u00FE\u0083\u00D3Y\x04\u00B1\x0E\x15\x01\x06\x00\u008C\u00BD\x13\x17?\u00DF\b?\x00\x00\x00\x00IEND\u00AEB`\u0082",
"\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\x0B\x00\x00\x00\f\b\x06\x00\x00\x00\u00B4\u00A9G\u009E\x00\x00\x00\x19tEXtSoftware\x00Adobe ImageReadyq\u00C9e<\x00\x00\x03fiTXtXML:com.adobe.xmp\x00\x00\x00\x00\x00<?xpacket begin=\"\u00EF\u00BB\u00BF\" id=\"W5M0MpCehiHzreSzNTczkc9d\"?> <x:xmpmeta xmlns:x=\"adobe:ns:meta/\" x:xmptk=\"Adobe XMP Core 5.3-c011 66.145661, 2012/02/06-14:56:27        \"> <rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"> <rdf:Description rdf:about=\"\" xmlns:xmpMM=\"http://ns.adobe.com/xap/1.0/mm/\" xmlns:stRef=\"http://ns.adobe.com/xap/1.0/sType/ResourceRef#\" xmlns:xmp=\"http://ns.adobe.com/xap/1.0/\" xmpMM:OriginalDocumentID=\"xmp.did:7E1F471DB7DDE2119E70AA3EF412306F\" xmpMM:DocumentID=\"xmp.did:5DC50212E17811E2896483AB2835CF29\" xmpMM:InstanceID=\"xmp.iid:5DC50211E17811E2896483AB2835CF29\" xmp:CreatorTool=\"Adobe Photoshop CS6 (Windows)\"> <xmpMM:DerivedFrom stRef:instanceID=\"xmp.iid:76DA024754E1E21199638D58CE36839B\" stRef:documentID=\"xmp.did:7E1F471DB7DDE2119E70AA3EF412306F\"/> </rdf:Description> </rdf:RDF> </x:xmpmeta> <?xpacket end=\"r\"?>b\u0094C\u00F3\x00\x00\x00WIDATx\u00DA\u00A4P\u00D1\n\x001\b\u00CA\u00F0\u00FF\x7F\u00B9A\u00B0\u00A3\u0085\u00F5r>:u\x1A\"\u00C2\x1A*\u0081\u00FA@!\u00840&\u00E7\u008B\u00F0\u008ApM\x14\u00C2_5\u00BEt\u00B7\x19Q+\u00A8d\u00F4Q\x15>\u0088\u00A0jqH\u00ED\x03\u00D3\u00C4\u00E6\u00C6\u00B2!\u0093\u00B7\u009E\x0FO\u00F1\u009DMw>\x02\f\x00\u008A\u0092\x18,\f\u00A6\u00F9\x07\x00\x00\x00\x00IEND\u00AEB`\u0082",
"\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\f\x00\x00\x00\f\b\x06\x00\x00\x00Vu\\\u00E7\x00\x00\x00\x19tEXtSoftware\x00Adobe ImageReadyq\u00C9e<\x00\x00\x03fiTXtXML:com.adobe.xmp\x00\x00\x00\x00\x00<?xpacket begin=\"\u00EF\u00BB\u00BF\" id=\"W5M0MpCehiHzreSzNTczkc9d\"?> <x:xmpmeta xmlns:x=\"adobe:ns:meta/\" x:xmptk=\"Adobe XMP Core 5.3-c011 66.145661, 2012/02/06-14:56:27        \"> <rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"> <rdf:Description rdf:about=\"\" xmlns:xmpMM=\"http://ns.adobe.com/xap/1.0/mm/\" xmlns:stRef=\"http://ns.adobe.com/xap/1.0/sType/ResourceRef#\" xmlns:xmp=\"http://ns.adobe.com/xap/1.0/\" xmpMM:OriginalDocumentID=\"xmp.did:7E1F471DB7DDE2119E70AA3EF412306F\" xmpMM:DocumentID=\"xmp.did:5E41D506E17811E29BF4AB5A7FB04209\" xmpMM:InstanceID=\"xmp.iid:5E41D505E17811E29BF4AB5A7FB04209\" xmp:CreatorTool=\"Adobe Photoshop CS6 (Windows)\"> <xmpMM:DerivedFrom stRef:instanceID=\"xmp.iid:76DA024754E1E21199638D58CE36839B\" stRef:documentID=\"xmp.did:7E1F471DB7DDE2119E70AA3EF412306F\"/> </rdf:Description> </rdf:RDF> </x:xmpmeta> <?xpacket end=\"r\"?>v\u00AC0U\x00\x00\x00SIDATx\u00DA\u0094Q\u00CB\n\x00 \f\u00CA\u00D8\u00FF\u00FF\u00B2At\x18\u00A2T\u00C2\x0E\u0085\u00AF\x16H\x0E\u0081^\u00A0\x1F\u00CA\x10\x11\f\u00D0\x054DM\u00D8\u009C2\u0084k%\u00AA\u008B1\u00C0\x19\u00CEP\u0083&i#\t\"\u00EA\u00F2P+\u0080\u00F6\u00FC\u00DD\x12^*\u00E1\u00F7\u00E34:&.\x01\x06\x00w\x1E\x15,\u00DA\u00BA\u00B0\u0089\x00\x00\x00\x00IEND\u00AEB`\u0082",
"\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\f\x00\x00\x00\f\b\x06\x00\x00\x00Vu\\\u00E7\x00\x00\x00\x19tEXtSoftware\x00Adobe ImageReadyq\u00C9e<\x00\x00\x03fiTXtXML:com.adobe.xmp\x00\x00\x00\x00\x00<?xpacket begin=\"\u00EF\u00BB\u00BF\" id=\"W5M0MpCehiHzreSzNTczkc9d\"?> <x:xmpmeta xmlns:x=\"adobe:ns:meta/\" x:xmptk=\"Adobe XMP Core 5.3-c011 66.145661, 2012/02/06-14:56:27        \"> <rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"> <rdf:Description rdf:about=\"\" xmlns:xmpMM=\"http://ns.adobe.com/xap/1.0/mm/\" xmlns:stRef=\"http://ns.adobe.com/xap/1.0/sType/ResourceRef#\" xmlns:xmp=\"http://ns.adobe.com/xap/1.0/\" xmpMM:OriginalDocumentID=\"xmp.did:7E1F471DB7DDE2119E70AA3EF412306F\" xmpMM:DocumentID=\"xmp.did:5EC3D82DE17811E28D229197F8AA60FA\" xmpMM:InstanceID=\"xmp.iid:5EC3D82CE17811E28D229197F8AA60FA\" xmp:CreatorTool=\"Adobe Photoshop CS6 (Windows)\"> <xmpMM:DerivedFrom stRef:instanceID=\"xmp.iid:76DA024754E1E21199638D58CE36839B\" stRef:documentID=\"xmp.did:7E1F471DB7DDE2119E70AA3EF412306F\"/> </rdf:Description> </rdf:RDF> </x:xmpmeta> <?xpacket end=\"r\"?>\u00B1\u008D\u00D5*\x00\x00\x00QIDATx\u00DA\u009CQ[\n\x00 \bK\u00F1\u00FEW^\x10\x04\u00B24\u00B3\u00FD\u00A9s\u00F3!\x00\x06\u0081\x13\u00E2\x03\x0B\u0088\u0092\b\u0088o@@d\u0087\u00C5\u00D1\u00D1\u0084\x16\u00EA\u00EC\x04K\u008A\u00B89\u00B4`\u00C5\u00A2\u0087\u00B3\u00EE\u00D9\x1E\u00C4\u00FF\u00AEd\u00FE\x02\u009D\u00C7\u00F1\u0083\u00D2}\u00A6\x00\x03\x00\u00C7\u00F5\x11#=S)(\x00\x00\x00\x00IEND\u00AEB`\u0082",
]

gridder.buildGUI(gridder);