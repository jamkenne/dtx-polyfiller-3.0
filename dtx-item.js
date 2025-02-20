/*
    dtx-item.js
     This file handles extra features added to the adding time feature/page.
     For example: Standard time in UK
*/




// Global variables
var checkboxChanged = false; // Flag to block context menu showing



// Builds a DTX-themed separator line to split up button groups
function buildMenuBarSeparator() {
	let separatorImg = document.createElement("img");
	separatorImg.src = "./images/separator.gif";
	separatorImg.border = "0";
	let separatorCell = document.createElement("td");
	separatorCell.valign = "middle";
	separatorCell.align = "center";
	separatorCell.appendChild(separatorImg);
	return separatorCell;
}

// Adds container to hold custom buttons in menubar for calender pages
// e.g. Select mode, auto fill etc
function injectCustomButtonsContainer() {
	// Get menu bar
	let buttonRow = document.querySelector("#SubMenuUC1_SubMenu_div1 > table > tbody > tr");
	
	// Add separator
	buttonRow.appendChild(buildMenuBarSeparator());
	
	// Add custom section
	let customButtonsContainer = document.createElement("div");
	customButtonsContainer.id = "customButtonsContainer";
	buttonRow.appendChild(customButtonsContainer);
}



// Sets a checkbox's checked state based off the input it's representing
function updateCheckedDisplay(input, checkbox, selectHours) {
	let inputHours = parseFloat(input.value) || 0;
	checkbox.checked = inputHours === selectHours;

	// Highlight checkboxes that have work hours but not a full day
	if (inputHours !== selectHours && inputHours !== 0) {
		checkbox.classList.add("semiChecked");
	} else {
		checkbox.classList.remove("semiChecked");
	}
}



// Adds toggle-able checkbox selection of work days to auto-fill with 7.5 (default) hours
function loadSelectMode(defaultMode, selectHours) {
	
	injectScript(`
		document.addEventListener('callCalculateTotalsFunc', () => {
			if (typeof CalculateTotals == "function") CalculateTotals("cell");
		});
	`);
	
	// Add toggle select mode button to menubar
	let selectModeCheckboxName = "toggleMode";
	let selectModeCheckbox = document.createElement("input");
    selectModeCheckbox.type = "checkbox";
	selectModeCheckbox.id = selectModeCheckboxName;
    selectModeCheckbox.checked = defaultMode;
	
	let inputs = [...document.querySelectorAll("#calDates_tabCalendar > tbody input")];
	let checkboxes = inputs.map(input => {
		// Disable inputs being dragged
		input.parentElement.ondragstart = function() { return false };
		
		let checkbox = document.createElement("input");
		checkbox.setAttribute("type", "checkbox");
		checkbox.classList.add("polyfillerCheckbox");
		checkbox.style.display = "none";
		
		// Darken weekend checkboxes
		if (input.style["background-color"] === "rgb(225, 225, 225)") {
			input.classList.add("weekend");
			checkbox.classList.add("weekend");
		}
		
		// Highlight bank holiday checkboxes
		if (input.classList.contains("bankHolidayDay")) {
			checkbox.classList.add("bankHolidayDay");
		}
		
		// Add checkbox to calender
		input.insertAdjacentElement('afterend', checkbox);
		
		// Handler for when checkbox is changed
		function checkboxChangedHandler(checkbox) {
			input.value = checkbox.checked ? selectHours : "";
			updateCheckedDisplay(input, checkbox, selectHours);
			
			// Call site function to update "Quantity" (total hrs) field
			let evt = new Event("callCalculateTotalsFunc", {"bubbles":true, "cancelable":false});
			document.dispatchEvent(evt); // Fire the event
		}
		
		// Register click hanlder for checkbox container (parent & children)
		//  This makes it easier to select checkboxes, as you can click
		//  the surrounding area or date label to toggle the checkbox
		checkbox.parentNode.addEventListener("click", (event) => {
			// Check that select mode is enabled
			if (selectModeCheckbox.checked) {
				if (event.target !== checkbox) checkbox.checked = !checkbox.checked; // Change checked state (if user didn't click checkbox)
				checkboxChangedHandler(checkbox); // Fire handler
			}
		});
		
		// Register right-click handler to make single-tap right clicks uncheck
		// checkboxes
		checkbox.parentNode.addEventListener('contextmenu', (event) => {
			event.preventDefault(); // Block right-click menu showing
			
			// Check that select mode is enabled
			if (selectModeCheckbox.checked) {
				checkbox.checked = false; // Untick checkbox
				checkboxChangedHandler(checkbox); // Fire handler
			}
			
			return false; // Block default right-click behaviour
		}, false);
		
		
		// Credit to https://stackoverflow.com/questions/36754940/check-multiple-checkboxes-with-click-drag
		// Credit to http://stackoverflow.com/questions/322378/javascript-check-if-mouse-button-down
		function check(checkbox) {
			if (!selectModeCheckbox.checked) return; // Don't run when checkboxes are disabled
			
			if (lmbDown) {
				//checkbox.checked = !box.checked; // toggle check state
				checkbox.checked = 1;
			} else if (rmbDown) {
				checkbox.checked = 0;
				checkboxChanged = true;
			}
			
			// Stop if neither button is pressed
			if (!lmbDown && !rmbDown) return;
			
			// Run checkbox changed handler to effect input underneath
			checkboxChangedHandler(checkbox);
			
			// Update checkboxes being selected flag
			selectingCheckboxes = true;
		}
		
		// Add hover handler to all checkboxes' parents (for easier selection) on page
		checkbox.parentNode.addEventListener("mouseover", (event) => {
			check(checkbox)
		})
		
		return checkbox;
	});
	
	// Changes UI between select mode and manual input
	function changeSelectMode(enabled) {
		// Show & hide checkboxes or text input fields
		checkboxes.forEach(combo => combo.style.display = enabled ? "block" : "none");
		inputs.forEach(combo => combo.style.display = enabled ? "none" : "block");
		
		if (enabled) {
			document.getElementById("calDates_tabCalendar").classList.add("selectionTooltip");
			
			inputs.forEach(function(input, index) {
				let checkbox = input.nextElementSibling;
				updateCheckedDisplay(input, checkbox, selectHours);
			});
		} else {
			// Add tip to tell user how to quickly change multiple checkboxes
			document.getElementById("calDates_tabCalendar").classList.remove("selectionTooltip");
		}
	}
	
	selectModeCheckbox.addEventListener('change', (event) => {
		changeSelectMode(event.target.checked);
	});
	if (defaultMode) changeSelectMode(true);
	
	let selectModeLabel = document.createElement('label');
    selectModeLabel.htmlFor = selectModeCheckboxName; /* Link clicks to checkbox element */
    selectModeLabel.innerText = "Select mode";
	
	let customButtonsContainer = document.getElementById("customButtonsContainer");
	customButtonsContainer.appendChild(buildMenuBarSeparator()); // Add separator before checkbox
	customButtonsContainer.appendChild(selectModeCheckbox);
	customButtonsContainer.appendChild(selectModeLabel);
}



// Event handler to update flags that represent which mouse buttons are pressed
var lmbDown = false;
var rmbDown = false;
var selectingCheckboxes = false; // Flag to disable text selection during checkbox selection
function setLeftButtonState(e) {
	lmbDown = e.buttons === undefined 
		? e.which === 1 
		: e.buttons === 1;
	
	rmbDown = e.buttons === undefined 
			? e.which === 3
			: e.buttons === 2;
	
	// If both buttons are released, checkboxes are no longer being selected
	if (!lmbDown && !rmbDown) selectingCheckboxes = false;
}


// Disable text selection while selecting checkboxes
function disableSelect(event) {
	if (selectingCheckboxes) {
		event.preventDefault();
	}
}

// Allows user to click and drag to select/deselect checkboxes using
// left and right mouse buttons
function injectDraggingCheckboxSelection() {
	// Setup mouse click events
	document.body.onmousedown = setLeftButtonState;
	document.body.onmousemove = setLeftButtonState;
	document.body.onmouseup = setLeftButtonState;
	
	window.addEventListener('selectstart', disableSelect);

	// Block right-click menu if deselecting checkboxes
	document.oncontextmenu = function(e){
		if (checkboxChanged) {
			checkboxChanged = false;
			event.preventDefault();
			return false;
		}
	}
}




// Injects a button into calender views to select work days in a pattern
// Func is async, it returns 1 when it completes
async function injectPatternFill(patternFill_startDay, patternFill_daysOn, patternFill_daysOff, patternFill_includeBankHolidays, selectHours) {
	const response = await fetch(chrome.extension.getURL("pattern-fill/pattern-fill.html"));
	const patternFillHTML = await response.text();

	// Add autofill button to menubar
	let customButtonsContainer = document.getElementById("customButtonsContainer");
	customButtonsContainer.insertAdjacentHTML('beforeend', patternFillHTML);

	// Set default settings from Chrome storage
	document.getElementById("patternFillStartDay").value = patternFill_startDay;
    document.getElementById("patternFillDaysOn").value = patternFill_daysOn;
    document.getElementById("patternFillDaysOff").value = patternFill_daysOff;
    document.getElementById("patternFillSelectHours").value = selectHours;
	document.getElementById("patternFillIncludeBankHolidays").checked = patternFill_includeBankHolidays;

	return Promise.resolve(1);
}



// Injects a button into calender views to quick-select multiple days
const fillModes = Object.freeze({"businessdays":0, "all":1, "none":2});
function injectAutoFillButton(selectHours) {
	
	// Create fill button
	let autoFillButton = document.createElement("button");
	autoFillButton.type = "button"; // Stop submit running on click
	autoFillButton.innerText = "Auto-fill";
	autoFillButton.id = "autoFillButton";
	
	let fillModeIndex = 0;
	autoFillButton.addEventListener('click', () => {
		let inputs = [...document.querySelectorAll("#calDates_tabCalendar > tbody input")];
		inputs.forEach((input) => {
			let inputIsWeekend = input.classList.contains("weekend");
			let inputIsBankHoliday = input.classList.contains("bankHolidayDay");
			
			let shouldSelect = true;
			let fillMode = Object.values(fillModes)[fillModeIndex];
			
			switch(fillMode) {
				case fillModes.all:
					break;
				case fillModes.businessdays:
					shouldSelect = !inputIsBankHoliday && !inputIsWeekend;
					break;
				default:
					shouldSelect = false;
			}
			
			// Auto-complete inputs
			if (input.type == "checkbox") {
				input.checked = shouldSelect;
				input.classList.remove("semiChecked");
			} else {
				input.value = shouldSelect ? selectHours : "";
			}
		});
		
		// Change to next fill mode for next click
		fillModeIndex++;
		if (fillModeIndex > Object.keys(fillModes).length - 1) fillModeIndex = 0;
	});
	
	// Add autofill button to menubar
	let customButtonsContainer = document.getElementById("customButtonsContainer");	
	customButtonsContainer.appendChild(autoFillButton);
}



// Attempts to fill tasknumber with user's default if nothing is entered yet
function autoFillTaskNumber(taskNumber) {
	let taskInput = document.getElementById("txtTaskNumber");
	if (!!taskInput && taskInput.value == "") taskInput.value = taskNumber;
}
// Attempts to fill project code with user's default if nothing is entered yet
function autoFillProjectCode(projectCode) {
	let projectInput = document.getElementById("drpProjectCode_input");
	if (!!projectInput && projectInput.value == "") projectInput.value = projectCode;
	
	// Trigger DTX project code change handler
	const leftArrow = 37; // Fire left arrow as it's harmless and won't change the field value
	projectInput.dispatchEvent(new KeyboardEvent('keydown', { keyCode: leftArrow } ));
}


// Characters like "&" are blocked from the "Task ID" field, despite being allowed in Win DTX
// Strangely, they're also only blocked onkeydown and can be easily copy-pasted in by anyone
function bypassBlockedNonAlphanumericChars() {
	injectScript(`returnTextNumeric = function() { return true }`);
}



async function ItemPageScripts(items) {
    injectCustomButtonsContainer();
    injectAutoFillButton(items.selectHours);

    // Inject pattern filler and wait completion before continuing
    await injectPatternFill(
        items.patternFill_startDay,
        items.patternFill_daysOn,
        items.patternFill_daysOff,
        items.patternFill_includeBankHolidays,
        items.selectHours
	);
	
	bypassBlockedNonAlphanumericChars();

    if (items.autoFillFields) {
        autoFillTaskNumber(items.autoFillTaskNumber);
        autoFillProjectCode(items.autoFillProjectCode);
	}

	loadSelectMode(items.selectMode, items.selectHours); // Inject checkbox mode
	injectDraggingCheckboxSelection();
}

// Load settings from storage and run login scripts
LoadExtensionSettings((items) => ItemPageScripts(items));