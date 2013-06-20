// Saves options to localStorage.
function save_options() {
  save_select_option("DTSLink_performance");
  save_checkbox_option("DTSLink_debug");
  save_checkbox_option("DTSLink_disablett");
  save_checkbox_option("DTSLink_oldFontFix");
  save_text_option("DTSLink_threshold");
  save_text_option("DTSLink_overrideFont");
  save_text_option("DTSLink_overrideSize");

  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved.";
  setTimeout(function() {
    status.innerHTML = "";
  }, 750);
}

function save_select_option(option)
{
	var select = document.getElementById(option);
	var option_val = select.children[select.selectedIndex].value;
	store(option,option_val);
}

function save_checkbox_option(option)
{
	var select = document.getElementById(option);
	var option_val = select.checked;
	store(option,option_val);
}

function save_text_option(option)
{
	var text = document.getElementById(option);
	var option_val = text.value;
	store(option,option_val);
}


// Restores select box state to saved value from localStorage.
function restore_options() {
	get_select("DTSLink_performance");
	get_checkbox("DTSLink_debug");
	get_checkbox("DTSLink_disablett");
	get_checkbox("DTSLink_oldFontFix");
	get_text("DTSLink_threshold");
	get_text("DTSLink_overrideFont");
	get_text("DTSLink_overrideSize");
}

function restore_select_option(option,option_val)
{
  if (!option_val) {
    return;
  }
  var select = document.getElementById(option);
  for (var i = 0; i < select.children.length; i++) {
    var child = select.children[i];
    if (child.value == option_val) {
      child.selected = "true";
      break;
    }
  }
}

function restore_checkbox_option(option,option_val)
{
  if (!option_val) {
    return;
  }
  var select = document.getElementById(option);
  select.checked = option_val;
}

function restore_text_option(option,option_val)
{
  if (!option_val) {
    return;
  }
  var select = document.getElementById(option);
  select.value = option_val;
}

function store(option,value)
{
	var obj = {};
	obj[option]=value;
	chrome.storage.sync.set(obj, function() {
    console.log('DTSLink: Option '+option+" set to "+value+".");
  });
}

function get_select(option)
{
	chrome.storage.sync.get(option, function(val) {
		restore_select_option(option,val[option]);
		console.log('DTSLink: Option '+option+" loaded as "+val[option]+".");
	});
}

function get_checkbox(option)
{
	chrome.storage.sync.get(option, function(val) {
		restore_checkbox_option(option,val[option]);
		console.log('DTSLink: Option '+option+" loaded as "+val[option]+".");
	});
}

function get_text(option)
{
	chrome.storage.sync.get(option, function(val) {
		restore_text_option(option,val[option]);
		console.log('DTSLink: Option '+option+" loaded as "+val[option]+".");
	});
}


document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);