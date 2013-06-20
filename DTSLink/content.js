/*	DTSLink
	By Samuel Colburn
	http://samuelcolburn.com/DTSLink/
	
	This file is part of DTSLink.

    DTSLink is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    DTSLink is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with DTSLink.  If not, see <http://www.gnu.org/licenses/>.
*/

$.ajaxSetup({ timeout: 600 });

var debug;
var disablett;
var oldFontFix;
var overrideFont;
var overrideSize;
var performance;
var cache = [];
var pending_list = [];
var interval = 2000;
var step_interval;
var processing = false;
var threshold;

$(function()
{
	get_settings();
});

function get_settings()
{
	chrome.storage.sync.get(["DTSLink_debug","DTSLink_disablett","DTSLink_performance","DTSLink_threshold",'DTSLink_oldFontFix','DTSLink_overrideFont','DTSLink_overrideSize'], function(val)
	{
		debug=val['DTSLink_debug'];
		disablett=val['DTSLink_disablett'];
		performance=val['DTSLink_performance'];
		threshold=val['DTSLink_threshold'];
		oldFontFix=val['DTSLink_oldFontFix'];
		overrideFont=val['DTSLink_overrideFont'];
		overrideSize=val['DTSLink_overrideSize'];


		
		if(typeof threshold == "undefined")
			threshold = 350;
		if(typeof disablett == "undefined")
			disablett = false;
		if(typeof debug == "undefined")
			debug = false;
			
		if(typeof oldFontFix == "undefined")
		{
			oldFontFix = true;
			overrideFont = "Courier New";
			overrideSize = "175%";
		}
		
		if (performance == "high")
			step_interval = 5;
		else if (performance == "medium")
			step_interval = 50;
		else if (performance == "low")
			step_interval = 125;
		else if (performance == "vlow")
			step_interval = 650;
		else
			step_interval = 50;

		if(debug) console.log('DTSLink: Option debug loaded as '+val['DTSLink_debug']+".");
		if(debug) console.log('DTSLink: Option disablett loaded as '+val['DTSLink_disablett']+".");
		if(debug) console.log('DTSLink: Option performance loaded as '+val['DTSLink_performance']+".");
		if(debug) console.log('DTSLink: Option threshold loaded as '+val['DTSLink_threshold']+".");
		if(debug) console.log('DTSLink: Option oldFontFix loaded as '+val['DTSLink_oldFontFix']+".");
		if(debug) console.log('DTSLink: Option overrideFont loaded as '+val['DTSLink_overrideFont']+".");
		if(debug) console.log('DTSLink: Option overrideSize loaded as '+val['DTSLink_overrideSize']+".");

		go();
	});
}

function go()
{
	if(debug) console.log('We are GO!');
	if(valid_page())
	{
		search_for_text();
		if(disablett == false)
		{
			populate_pending();
			if (pending_list.length > threshold && threshold > 0)
			{
				pending_list.length = 0;
				if(debug) console.log("Broke threshold; clearing list.");
			}
			if (pending_list.length > 0)
				process_next_pending();
		}
	}
	if(dts_page() & oldFontFix)
		fix_old_dts_font()
	
	$(document.body).bind('DOMSubtreeModified',DOMModificationHandler);
}

function DOMModificationHandler()
{
    $(this).unbind('DOMSubtreeModified');
    setTimeout(function(){
		go();
    },interval);
}

function search_for_text()
{
	var D=document;
	D.body.normalize();
	search_node(D.body);
	function search_node(n)
	{
		
		var u,A,M,MM,R,c,x;
		if(n.nodeType==3)
		{
			uu=$('<div/>').html(n.data).text();
			
			//u=uu.search(/((CS|MG|FOC)(\s|\xA0)(LAB|RAD|RAD\.T|ITS|SCH|REG|ADM|OM|MIS|PHA|BAR|ABS|QM|ARM|HIM|NUR|PCS|DTS|NPR|NMI)|DDP|PROPOSAL|TASK)(\s|\xA0)#?[0-9]+/i);
			u=uu.search(/((CS|MG|FOC)(\s|\xA0)(ABS|ADM|AMB|AP|APR|ARM|BAR|CA|CM|CMG|CMS|CWS|DR|DSR|DTS|EAR|EDM|EMR|EMRT|EPS|ESS|FA|FOC|FSC|GL|HIM|HIS|HR|HRP|HUB|HUBS|HWS|ICS|ITS|LAB|LIS|LSI|MAM|MC|MIG|MIM|MIS|MM|MOX|MRI|MRM|NMI|NPR|NUR|OA|OE|OM|ONC|PBR|PCI|PCM|PCS|PHA|PHM|PIC|POC|POM|PP|PPH|PRV|PTE|PWM|QM|QRM|RAD|RAD\.T|RADRW|RD|REF|REG|RM|RTA|RXM|SCH|SPAN|SPAN|SS|SUR|SYS|UI|UNV|UPT)|DDP|PROPOSAL|TASK)(\s|\xA0)#?[0-9]+/i);
			if(u>=0)
			{
				M=n.splitText(u);
				
				R=M.splitText(RegExp.lastMatch.length);
					
				A=document.createElement("A");

				jQuery(A).addClass( 'hidden' );
				
				if (M.data.substr(0,4).toUpperCase()=="TASK")
				{
					MM=M.data.substr(5,M.length-5).replace("#","");
					A.href="http://cc_machine/mypage/task_view.html?task="+MM;
					add_to_pending(A,"T");
					A.appendChild(M);
				}
				else if(M.data.substr(0,3).toUpperCase()=="DDP")
				{
					MM=M.data.substr(4,M.length-4).replace("#","");
					A.href="http://magicweb/dts/PROJECTS/"+MM+".htm";
					add_to_pending(A,"D");
					A.appendChild(M);
				}
				else if(M.data.substr(0,8).toUpperCase()=="PROPOSAL")
				{
					MM=M.data.substr(9,M.length-9).replace("#","");
					A.href="http://magicweb/dts/PROPOSALS/"+MM+".htm";
					add_to_pending(A,"P");
					A.appendChild(M);
				}
				else
				{
					A.href="http://magicweb/dts/REQUESTS/"+M.data.replace(/(\s|\xA0)/g,"/").replace("#","")+".htm";
					add_to_pending(A,"R");
					A.appendChild(M);
				}

				R.parentNode.insertBefore(A,R);
			}
		}
		else if(n.tagName!="STYLE" && n.tagName!="SCRIPT" && n.tagName!="A" && valid_node(n))
		{
			for(c=0;x=n.childNodes[c];++c)search_node(x);
		}
		if (disablett == false && processing == false)
			process_next_pending()
	}
}

function process_next_pending()
{
	processing = true;
	if (pending_list.length > 0)
	{
		var AQ = pending_list.splice(0,1)[0];
		if(elementInDocument(AQ["A"]))
		{
			get_tooltip(AQ["A"],AQ["ty"]);
		}
		else
		{
			if(debug) console.log("Item was not part of the document! Clearing pending list.");
			pending_list.length = 0;
			populate_pending();
			if (pending_list.length > 0)
				setTimeout(function(){ process_next_pending(); },step_interval);
			else
			{
				if(debug) console.log("Done processing links.");
				processing = false;
			}
		}
	}
	else
	{
		processing = false;
	}
}

function populate_pending()
{
	$('A[href*="http://magicweb/dts/REQUESTS/"]:not(A[title])').each(function(i) {
		var A = this;
		var ty = "R";
		add_to_pending(A,ty);
	});
	
	$('A[href*="cc_machine/mypage/task_view.html"]:not(A[title])').each(function(i) {
		var A = this;
		var ty = "T";
		add_to_pending(A,ty);
	});
	
	$('A[href*="http://magicweb/dts/PROPOSALS/"]:not(A[title])').each(function(i) {
		var A = this;
		var ty = "P";
		add_to_pending(A,ty);
	});
	
	$('A[href*="http://magicweb/dts/PROJECTS/"]:not(A[title])').each(function(i) {
		var A = this;
		var ty = "D";
		add_to_pending(A,ty);
	});
}

function elementInDocument(element) {
	if(typeof element == "undefined")
		return false;
		
    while (element = element.parentNode) {
        if (element == document) {
            return true;
        }
    }
    return false;
}

function get_tooltip(A,ty)
{
		if (!get_from_cache(A))
		{
			if(debug) console.log("Tooltip of type "+ty+" requested from web...");
			generate_tooltip(A,ty);
		}
		else
		{
			if(debug) console.log("Tooltip of type "+ty+" pulled from cache.");
			setTimeout(function(){ process_next_pending(); },step_interval);
		}
}

function add_to_pending(A,ty)
{
	var AQ = [];
	AQ["A"] = A;
	AQ["ty"] = ty;
	pending_list.push(AQ);
	if(debug) console.log("Adding link to pending list of type "+ty+", total: "+pending_list.length);
}

function get_delay(i)
{
	if(i > 15)
		return i*250;
	else
		return i;
}

function get_from_cache(A)
{
	var now = +new Date();
	if(typeof cache[A.href] === "undefined")
		return false;
	else if (cache[A.href]['time']-now > 150000)
		return false;
	else
	{
		A.title = cache[A.href]['tooltip'];
		if (debug) { A.style.color = "green"; }
		return true;
	}
}

function generate_tooltip(A,ty)
{
	if(ty=="T")
	{
/*		var request = $.ajax({
		  url: A.href,
		  dataType: "html"
		});
		 
		request.done(function(data) {
			var tooltip="{"+(get_task_field(data,"Site").split("<")[1].split(">")[0]);
			tooltip+="} "+get_task_field(data,"Description");
			tooltip+="\n[Mod:"+get_task_field(data,"Module").split("-")[0];
			tooltip+=" Type:"+get_task_field(data,"Request Type").split("-")[0];
			tooltip+=" Pri:"+get_task_field(data,"Priority").split("-")[0];
			tooltip+=" Status:"+get_task_field(data,"Status").split("-")[0].split(" ")[0];
			tooltip+="]\n"+get_task_field(data,"Assigned to");
			tooltip=$('<div/>').html(tooltip).text();
			save_tooltip(A,tooltip);
			A.title = tooltip;
			if (debug) { A.style.color = "red"; }
			if(debug) console.log("Response from web received.");
			setTimeout(function(){ process_next_pending(); },step_interval);
		});
		 
		request.fail(function(data, textStatus) {
			if(debug) console.log("Response from web failed.");
			setTimeout(function(){ process_next_pending(); },step_interval);
		});
*/
		tooltip="Task tooltips not availble";
		save_tooltip(A,tooltip);
		A.title = tooltip;
		setTimeout(function(){ process_next_pending(); },step_interval);
	}
	else if(ty=="D")
	{
		var request = $.ajax({
		  url: A.href,
		  dataType: "html"
		});
		 
		request.done(function(data) {
			var tooltip=get_meta(data,"description").replace(" <b><i>Status:</i></b> ","\n[").replace(" <b><i>Applications:</i></b> ","]\n");
			tooltip=$('<div/>').html(tooltip).text();
			save_tooltip(A,tooltip);
			A.title = tooltip;
			if (debug) { A.style.color = "red"; }
			if(debug) console.log("Response from web received.");
			setTimeout(function(){ process_next_pending(); },step_interval);
		});
		 
		request.fail(function(data, textStatus) {
			if(debug) console.log("Response from web failed.");
			setTimeout(function(){ process_next_pending(); },step_interval);
		});
		
	}
	else if(ty=="P")
	{
		var request = $.ajax({
		  url: A.href,
		  dataType: "html"
		});
		 
		request.done(function(data) {
			var tooltip=get_meta(data,"DDPprodlines");
			tooltip+="\n["+get_meta(data,"description")+"]";
			tooltip=$('<div/>').html(tooltip).text();
			save_tooltip(A,tooltip);
			A.title = tooltip;
			if (debug) { A.style.color = "red"; }
			if(debug) console.log("Response from web received.");
			setTimeout(function(){ process_next_pending(); },step_interval);
		});
		 
		request.fail(function(data, textStatus) {
			if(debug) console.log("Response from web failed.");
			setTimeout(function(){ process_next_pending(); },step_interval);
		});
	}
	else if(ty=="R")
	{
		var request = $.ajax({
		  url: A.href,
		  dataType: "html"
		});
		 
		request.done(function(data) {
			var tooltip=get_meta(data,"description").slice(0, -4);
			tooltip+="\n[P"+get_meta(data,"DTSpriority");
			tooltip+=" "+get_meta(data,"DTSbugorenh").replace("Enh","Enhancement").replace("Des","Design Omission");
			tooltip+=": "+get_meta(data,"DTSstatus").replace("Com","Completed").replace("Rej","Rejected").replace("Dra","Draft").replace("Sub","Submitted").replace("Tes","Tested").replace("Uni","Unit Tested").replace("Rec","Reclass").replace("Que","Queue")+"]";
			tooltip=$('<div/>').html(tooltip).text();
			save_tooltip(A,tooltip);
			A.title = tooltip;
			if (debug) { A.style.color = "red"; }
			if(debug) console.log("Response from web received.");
			setTimeout(function(){ process_next_pending(); },step_interval);
		});
		 
		request.fail(function(data, textStatus) {
			if(debug) console.log("Response from web failed.");
			setTimeout(function(){ process_next_pending(); },step_interval);
		});
	}
}

function save_tooltip(A,tt)
{
	if(tt.length > 0)
	{
		var now = +new Date();
		cache[A.href]=[];
		cache[A.href]['time']=now;
		cache[A.href]['tooltip']=tt;
	}
}

function get_meta(data,field)
{
	var filter='meta[name*="'+field+'"]';
	return $(data).filter(filter).attr("content");
}

function get_task_field(data,field)
{
	var Ab,Abl,ret;
	var pattern = "\074td\\sclass\075\042label\042\\scolspan\075\042\\d*\042\076"+field+"\074\057td\076\\n*\\s*\074td\\sclass\075\042value\042\\scolspan\075\042\\d*\042\\n*\\s*\076";
	var value = "[^\074]*";
	Ab=data.search(new RegExp(pattern+value,"i"));
	Abl=RegExp.lastMatch.length;
	ret=data.substr(Ab,Abl).replace(new RegExp(pattern,"i"),"");
	ret=$('<div/>').html(ret).text();
	return ret;
}

function fix_old_dts_font()
{
	if(debug) console.log('DTSLink: Fixing fonts...');
	var count = 0;
	$('table.caption pre').each(function(i) {
		count = count + 1;
		if(debug) console.log('DTSLink: Found PRE #'+count);
		var ff = this.style.getPropertyValue('font-family');
		var fs = this.style.getPropertyValue('font-size');
		var fp = this.style.getPropertyPriority('font-family');
		var sp = this.style.getPropertyPriority('font-size');
		if((ff == "'Andale Mono'") && (fs == "110%"))
		{
			if (overrideFont)
				this.style.setProperty('font-family',"'"+overrideFont+"'",fp);
			if (overrideSize)
				this.style.setProperty('font-size',overrideSize,sp);
		}
	});

}

function valid_page()
{
	var u = document.URL;
	var valid = true;
	if(u.substr(0,36).toLowerCase()=="https://docs.google.com/spreadsheet/")
		valid = false;
	if(valid && u.substr(0,51).toLowerCase()=="https://docs.google.com/a/meditech.com/spreadsheet/")
		valid = false;
	return valid;
}

function dts_page()
{
	if(debug) console.log('DTSLink: Valid DTS Page');
	var u = document.URL;
	var valid = false;
	if(u.substr(0,28).toLowerCase()=="http://magicweb/dts/requests")
		valid = true;
	return valid;
}

function valid_node(no)
{
	var valid = true;
	
	var attrs = no.attributes
	if(attrs != null)
	{
		var editable = attrs.getNamedItem("g_editable");
		if (editable != null)
			if(editable.textContent = "true")
				valid = false;
	}

	return valid;
}

/*
	|_|O|_|
	|_|_|O|
	|O|O|O|
*/