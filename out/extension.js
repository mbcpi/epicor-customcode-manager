"use strict";var ne=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports);var Pn=ne(Te=>{"use strict";var gi=Te&&Te.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),bi=Te&&Te.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),Dr=Te&&Te.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&gi(n,e,r[o]);return bi(n,e),n}})();Object.defineProperty(Te,"__esModule",{value:!0});Te.EpicorClient=void 0;var wr=Dr(require("https")),Er=Dr(require("http")),Mn=class t{constructor(e){this.config=e}getHeaders(){let n={"Content-Type":"application/json",Authorization:`Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64")}`};return this.config.apiKey&&(n["x-api-key"]=this.config.apiKey),n}getDesignerUrl(e){return`${this.config.serverUrl.replace(/\/$/,"")}/api/v2/odata/${this.config.company}/Ice.LIB.EfxLibraryDesignerSvc/${e}`}getEfxUrl(e,n,r,o=!1){let i=this.config.serverUrl.replace(/\/$/,""),a=r||this.config.company;return o?`${i}/api/v2/efx/staging/${a}/${e}/${n}`:`${i}/api/v2/efx/${a}/${e}/${n}`}async request(e,n){let r=await this.requestRaw(e,typeof n=="string"?n:JSON.stringify(n));try{return r?JSON.parse(r):{}}catch{return r}}async requestGet(e){return new Promise((n,r)=>{let o=new URL(e),i=o.protocol==="https:",a=i?wr:Er,c={hostname:o.hostname,port:o.port||(i?443:80),path:o.pathname+o.search,method:"GET",headers:this.getHeaders(),rejectUnauthorized:!1},u=a.request(c,s=>{let m="";s.on("data",h=>{m+=h}),s.on("end",()=>{if(s.statusCode&&s.statusCode>=200&&s.statusCode<300)try{n(m?JSON.parse(m):{})}catch{n(m)}else{let h=`HTTP ${s.statusCode}`;try{let g=JSON.parse(m);h=g.ErrorMessage||g.error?.message||JSON.stringify(g,null,2)}catch{h=m||h}r(new Error(h))}})});u.on("error",r),u.end()})}async getUserCompanies(){let e=this.config.serverUrl.replace(/\/$/,""),n=encodeURIComponent(this.config.username),r=`${e}/api/v2/odata/${this.config.company}/Ice.BO.UserFileSvc/UserFiles('${n}')/UserComps?$select=Company,Name`,o=await this.requestGet(r);return(Array.isArray(o?.value)?o.value:[]).map(a=>a.Company).filter(Boolean)}async requestRaw(e,n){return new Promise((r,o)=>{let i=new URL(e),a=i.protocol==="https:",c=a?wr:Er,u={hostname:i.hostname,port:i.port||(a?443:80),path:i.pathname+i.search,method:"POST",headers:{...this.getHeaders(),"Content-Length":Buffer.byteLength(n)},rejectUnauthorized:!1},s=c.request(u,m=>{let h="";m.on("data",g=>{h+=g}),m.on("end",()=>{if(m.statusCode&&m.statusCode>=200&&m.statusCode<300)r(h);else{let g=`HTTP ${m.statusCode}`;try{let l=JSON.parse(h);g=l.ErrorMessage||l.error?.message||JSON.stringify(l,null,2)}catch{g=h||g}console.error("EFx HTTP failure status:",m.statusCode),console.error("EFx HTTP failure body:",h),o(new Error(g))}})});s.on("error",o),s.write(n),s.end()})}async getLibraryList(){return(await this.request(this.getDesignerUrl("GetLibraryList"),{options:{kind:0,startsWith:"",rollOutMode:2,status:0}})).returnObj?.EfxLibraryList||[]}async getLibrary(e){return(await this.request(this.getDesignerUrl("GetLibrary"),{libraryId:e})).returnObj}async getDefaults(){return(await this.request(this.getDesignerUrl("GetDefaults"),{})).returnObj}async getDefaultsRaw(){let e=await this.requestRaw(this.getDesignerUrl("GetDefaults"),"{}"),n=e.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);return n?n[1]:e}async getLibraryRaw(e){let n=await this.requestRaw(this.getDesignerUrl("GetLibrary"),JSON.stringify({libraryId:e})),r=n.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);return r?r[1]:n}async applyChangesRaw(e){let n=`{"libraryTableset":${e}}`,r=await this.requestRaw(this.getDesignerUrl("ApplyChangesWithDiagnostics"),n);try{let o=JSON.parse(r);return{diagnostics:o.returnObj?.diagnostics||o.parameters?.diagnostics||[]}}catch{return{diagnostics:[]}}}async applyChanges(e){let n=await this.request(this.getDesignerUrl("ApplyChangesWithDiagnostics"),{libraryTableset:e});return{tableset:n.returnObj?.libraryTableset||n.parameters?.libraryTableset||e,diagnostics:n.returnObj?.diagnostics||n.parameters?.diagnostics||[]}}async promoteToProduction(e){await this.request(this.getDesignerUrl("PromoteToProduction"),{libraryID:e})}async regenerateLibrary(e){let n=await this.request(this.getDesignerUrl("RegenerateLibrary"),{libraryID:e});return console.log("EFx Regenerate raw result:",JSON.stringify(n,null,2)),{errors:n.returnObj?.BOUpdError||n.returnObj?.BOUpdErrorList||n.returnObj?.BOUpdErrorTableset?.BOUpdError||n.parameters?.result?.BOUpdError||n.parameters?.result?.BOUpdErrorList||n.parameters?.result?.BOUpdErrorTableset?.BOUpdError||n.parameters?.errors||n.errors||[],raw:n}}async demoteFromProduction(e){await this.request(this.getDesignerUrl("DemoteFromProduction"),{libraryID:e})}async lockLibrary(e){await this.request(this.getDesignerUrl("LockLibrary"),{libraryID:e})}async releaseLibrary(e){await this.request(this.getDesignerUrl("ReleaseLibrary"),{libraryID:e})}async validateFunctionRaw(e,n,r,o){let i=await this.getLibraryRaw(e),a=t.packCode(r,o||""),u=`{"libraryTableset":${this._patchFunctionBody(i,n,a,"U")}}`,s=await this.requestRaw(this.getDesignerUrl("ApplyChangesWithDiagnostics"),u);try{let m=JSON.parse(s),h=m.returnObj?.diagnostics||m.parameters?.diagnostics||[],g=h.some(l=>typeof l=="object"?(l.Severity??2)>=2:/\berror\b/i.test(String(l)));return{diagnostics:h,saved:!g,newBody:a}}catch{return{diagnostics:[],saved:!1,newBody:a}}}async validateFunctionViaWrapper(e,n,r,o,i="Utilities",a="ApplyChangesWithDiagnostics",c=null){let u=c;if((!u?.EfxLibrary?.[0]||!u.EfxFunction?.some(x=>x.FunctionID===n))&&(u=await this.getLibrary(e)),!u?.EfxLibrary?.[0]){let x=`Library '${e}' not found`;return{saved:!1,diagnostics:[{Severity:2,Message:x}],errors:[x],outResult:"",outMsg:"",raw:null,newBody:null}}let s=u.EfxFunction?.find(x=>x.FunctionID===n);if(!s){let x=`Function '${n}' not found in library '${e}'`;return{saved:!1,diagnostics:[{Severity:2,Message:x}],errors:[x],outResult:"",outMsg:"",raw:null,newBody:null}}let m={...u.EfxLibrary[0],RowMod:"U"},h={...s,Code:r,Usings:o||"",Body:"",RowMod:"U"},g={EfxLibrary:[m],EfxFunction:[h]},l;try{l=await this.request(this.getEfxUrl(i,a),{inFunctionID:n,inDS:g})}catch(x){if(/HTTP 404/.test(x.message))try{let S=await this.validateFunctionRaw(e,n,r,o);return{saved:S.saved,diagnostics:S.diagnostics||[],errors:S.saved?[]:S.diagnostics?.map(B=>B.Message||String(B))||["Save failed"],outResult:S.saved?"Success":"",outMsg:S.saved?"Saved Successfully":"Save failed",raw:null,newBody:S.saved?S.newBody:null}}catch(S){let B=S.message||String(S);return{saved:!1,diagnostics:[{Severity:2,Message:B}],errors:[B],outResult:"",outMsg:B,raw:null,newBody:null}}throw x}let p=l?.outMsg??l?.parameters?.outMsg??"",d=l?.outResult??l?.parameters?.outResult??"",y=l?.outSuccess??l?.parameters?.outSuccess??!1,v=[],w=new Set,b=x=>{let S=x.trim();S&&!w.has(S)&&(w.add(S),v.push(S))};for(let x of String(p).split(/\r?\n/)){let S=x.match(/^Error:\s*(.+)$/i);if(S){b(S[1]);continue}/\(\d+,\d+\):\s*(?:error|warning)\s+CS/i.test(x)&&b(x)}let D=v.filter(x=>!/\(\d+,\d+\):\s*warning\s+CS/i.test(x)),E=y===!0||D.length===0&&/Saved Successfully/i.test(p),C=v.map(x=>{let S=x.match(/\((\d+),(\d+)\):\s*(?:error|warning)/i)||x.match(/\((\d+),(\d+)\)/)||x.match(/\bline\s+(\d+)/i);return{Severity:/\(\d+,\d+\):\s*warning\s+CS/i.test(x)?1:2,Message:x,Line:S?parseInt(S[1],10):void 0,Column:S&&S[2]!==void 0?parseInt(S[2],10):void 0}}),A=String(r).split(/\r?\n/),T=new Map;for(let x of C){if(!x.Line||!x.Column)continue;let S=x.Message.match(/'([^']+)'/);if(!(!S||!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(S[1]))){for(let B=0;B<A.length;B++)if(A[B].slice(x.Column-1).startsWith(S[1])){let P=x.Line-(B+1);P>=0&&T.set(P,(T.get(P)||0)+1)}}}let I=0,k=0,q=!1;for(let[x,S]of T)S>k?(k=S,I=x,q=!1):S===k&&x!==I&&(q=!0);if(k>0&&!q&&I>0)for(let x of C)x.Line&&(x.Line=Math.max(1,x.Line-I));return{saved:E,diagnostics:C,errors:v,outResult:d,outMsg:p,raw:l,newBody:t.packCode(r,o||"")}}_patchFunctionBody(e,n,r,o){let i=`"FunctionID":${JSON.stringify(n)}`,a=JSON.stringify(r),c=this._setParentLibraryRowMod(e,o),u=c.indexOf('"EfxFunction":[');if(u<0)throw new Error("EfxFunction array not found");let m=c.indexOf("[",u)+1;for(;m<c.length;){let h=c.indexOf("{",m);if(h<0)break;let g=this._findJsonObjectEnd(c,h,"EfxFunction row"),l=c.slice(h,g+1);if(!l.includes(i)){m=g+1;continue}let p=this._replaceJsonStringValue(l,"Body",a);return p=this._replaceJsonStringValue(p,"RowMod",JSON.stringify(o)),c.slice(0,h)+p+c.slice(g+1)}throw new Error(`Function ${n} not found in raw tableset`)}_setParentLibraryRowMod(e,n){let r=e.indexOf('"EfxLibrary":[');if(r<0)throw new Error("EfxLibrary array not found");let o=e.indexOf("[",r),i=e.indexOf("{",o);if(i<0)throw new Error("No EfxLibrary row found");let a=this._findJsonObjectEnd(e,i,"EfxLibrary row"),c=e.slice(i,a+1),u=this._replaceJsonStringValue(c,"RowMod",JSON.stringify(n));return e.slice(0,i)+u+e.slice(a+1)}_findJsonObjectEnd(e,n,r){let o=0,i=!1,a=!1;for(let c=n;c<e.length;c++){let u=e[c];if(i){if(a){a=!1;continue}if(u==="\\"){a=!0;continue}u==='"'&&(i=!1);continue}if(u==='"'){i=!0;continue}if(u==="{")o++;else if(u==="}"&&(o--,o===0))return c}throw new Error(`Malformed ${r}`)}_replaceJsonStringValue(e,n,r){let o=`"${n}":`,i=e.lastIndexOf(o);if(i<0)throw new Error(`${n} not found in object`);let a=i+o.length;for(;/\s/.test(e[a]||"");)a++;if(e[a]!=='"')throw new Error(`${n} value is not a JSON string`);let c=a+1,u=!1;for(;c<e.length;c++){let s=e[c];if(u){u=!1;continue}if(s==="\\"){u=!0;continue}if(s==='"')break}return e.slice(0,a)+r+e.slice(c+1)}async executeFunction(e,n,r,o,i=!1){let a=this.getEfxUrl(e,n,o,i);return this.request(a,r)}async saveSignatures(e,n,r){let o=await this.getLibraryRaw(e),i=JSON.parse(o);if(!i?.EfxLibrary?.[0])throw new Error(`Library '${e}' not found`);if(!i.EfxFunction?.find(b=>b.FunctionID===n))throw new Error(`Function '${n}' not found in library '${e}'`);let a=(i.EfxFunctionSignature||[]).filter(b=>b.FunctionID===n),c=(i.EfxFunctionSignature||[]).reduce((b,D)=>Math.max(b,D.ParameterID||0),0)+1,s=o.indexOf('"EfxFunctionSignature":[');if(s<0)throw new Error("EfxFunctionSignature array not found");let m=o.indexOf("[",s),h=this._rawFindClose(o,m,"[","]"),g=[],l=m+1;for(;l<h;){let b=o.indexOf("{",l);if(b<0||b>=h)break;let D=this._rawFindClose(o,b,"{","}");if(D<0||D>=h)break;let E=o.slice(b,D+1),C=null;try{C=JSON.parse(E)}catch{}g.push({objStr:E,sigData:C}),l=D+1}let p=[];for(let{objStr:b,sigData:D}of g)(!D||D.FunctionID!==n)&&p.push(b);for(let b of r){let D=a.find(E=>E.ArgumentName===b.ArgumentName&&!!E.Response==!!b.Response);if(D){let{objStr:E}=g.find(A=>A.sigData?.ArgumentName===D.ArgumentName&&!!A.sigData?.Response==!!D.Response)||{};if(!E)continue;if(!(D.DataType!==(b.DataType??D.DataType)||D.DataTypeInfo!==(b.DataTypeInfo??D.DataTypeInfo)||!!D.Optional!=!!(b.Optional??D.Optional)||D.DefaultValue!==(b.DefaultValue??D.DefaultValue)||D.Order!==(b.Order??D.Order)))p.push(E);else{let A=E;A=this._rawSetStringProp(A,"DataType",b.DataType??D.DataType),A=this._rawSetStringProp(A,"DataTypeInfo",b.DataTypeInfo??D.DataTypeInfo??""),A=this._rawSetBoolProp(A,"Optional",b.Optional??D.Optional??!1),A=this._rawSetStringProp(A,"DefaultValue",b.DefaultValue??D.DefaultValue??""),A=this._rawSetIntProp(A,"Order",b.Order??D.Order),A=this._rawSetStringProp(A,"RowMod","U"),p.push(E),p.push(A)}}else{let E={LibraryID:e,FunctionID:n,Response:!!b.Response,ParameterID:c++,ArgumentName:b.ArgumentName,Order:b.Order??p.length,DataType:b.DataType||"System.String",DataTypeInfo:b.DataTypeInfo||"",Optional:b.Optional??!1,DefaultValue:b.DefaultValue??"",SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",BitFlag:0,RowMod:"A"};p.push(JSON.stringify(E))}}for(let b of a)if(!r.some(E=>E.ArgumentName===b.ArgumentName&&!!E.Response==!!b.Response)){let{objStr:E}=g.find(A=>A.sigData?.ArgumentName===b.ArgumentName&&!!A.sigData?.Response==!!b.Response)||{};if(!E)continue;let C=this._rawSetStringProp(E,"RowMod","D");p.push(E),p.push(C)}let d=o.slice(0,m+1)+p.join(",")+o.slice(h);d=this._setParentLibraryRowMod(d,"U"),d=this._setEfxFunctionRowMod(d,n,"U"),JSON.parse(d);let y=await this.applyChangesRaw(d),v=(y.diagnostics||[]).some(b=>typeof b=="object"?(b.Severity??2)>=2:/\berror\b/i.test(String(b))),w=r.map((b,D)=>{let E=a.find(C=>C.ArgumentName===b.ArgumentName&&!!C.Response==!!b.Response);return E?{...E,DataType:b.DataType??E.DataType,DataTypeInfo:b.DataTypeInfo??E.DataTypeInfo??"",Optional:b.Optional??E.Optional??!1,DefaultValue:b.DefaultValue??E.DefaultValue??"",Order:b.Order??D}:{LibraryID:e,FunctionID:n,Response:!!b.Response,ArgumentName:b.ArgumentName,DataType:b.DataType||"System.String",DataTypeInfo:b.DataTypeInfo||"",Optional:b.Optional??!1,DefaultValue:b.DefaultValue??"",Order:b.Order??D}});return{saved:!v,diagnostics:y.diagnostics||[],updatedSigs:w}}_rawFindClose(e,n,r,o){let i=0,a=!1,c=!1;for(let u=n;u<e.length;u++){let s=e[u];if(a){if(c){c=!1;continue}if(s==="\\"){c=!0;continue}s==='"'&&(a=!1);continue}if(s==='"'){a=!0;continue}if(s===r)i++;else if(s===o&&(i--,i===0))return u}return-1}_rawSetStringProp(e,n,r){let o=`"${n}":`,i=e.indexOf(o);if(i<0)throw new Error(`Property "${n}" not found`);let a=i+o.length;for(;e[a]===" ";)a++;let c;if(e[a]==='"'){c=a+1;let u=!1;for(;c<e.length;c++){let s=e[c];if(u){u=!1;continue}if(s==="\\"){u=!0;continue}if(s==='"'){c++;break}}}else for(c=a;c<e.length&&e[c]!==","&&e[c]!=="}"&&e[c]!==" "&&e[c]!==`
`&&e[c]!=="\r";)c++;return e.slice(0,a)+JSON.stringify(r)+e.slice(c)}_rawSetBoolProp(e,n,r){let o=`"${n}":`,i=e.indexOf(o);if(i<0)throw new Error(`Property "${n}" not found`);let a=i+o.length;for(;e[a]===" ";)a++;let c=a;for(;c<e.length&&e[c]!==","&&e[c]!=="}"&&e[c]!==" ";)c++;return e.slice(0,a)+(r?"true":"false")+e.slice(c)}_rawSetIntProp(e,n,r){let o=`"${n}":`,i=e.indexOf(o);if(i<0)throw new Error(`Property "${n}" not found`);let a=i+o.length;for(;e[a]===" ";)a++;let c=a;for(;c<e.length&&e[c]!==","&&e[c]!=="}"&&e[c]!==" ";)c++;return e.slice(0,a)+String(Math.floor(r))+e.slice(c)}_setEfxFunctionRowMod(e,n,r){let o=`"FunctionID":${JSON.stringify(n)}`,i=e.indexOf('"EfxFunction":[');if(i<0)throw new Error("EfxFunction array not found");let c=e.indexOf("[",i)+1;for(;c<e.length;){let u=e.indexOf("{",c);if(u<0)break;let s=this._findJsonObjectEnd(e,u,"EfxFunction row"),m=e.slice(u,s+1);if(m.includes(o)){let h=this._replaceJsonStringValue(m,"RowMod",JSON.stringify(r));return e.slice(0,u)+h+e.slice(s+1)}c=s+1}throw new Error(`EfxFunction row for '${n}' not found`)}static extractCode(e){try{let n=JSON.parse(e);return{code:n.Code||"",usings:n.Usings||""}}catch{return{code:e,usings:""}}}static packCode(e,n=""){return JSON.stringify({Code:e,Usings:n})}};Te.EpicorClient=Mn});var Cr=ne(ue=>{"use strict";var yi=ue&&ue.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),vi=ue&&ue.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),wi=ue&&ue.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&yi(n,e,r[o]);return vi(n,e),n}})();Object.defineProperty(ue,"__esModule",{value:!0});ue.EfxTreeProvider=ue.FunctionNode=ue.LibraryNode=void 0;var G=wi(require("vscode")),At=class extends G.TreeItem{constructor(e){super(e.LibraryID,G.TreeItemCollapsibleState.Collapsed),this.library=e;let n=[];e.Published?n.push("$(cloud) Promoted"):n.push("Unpromoted / Editable"),e.Disabled&&n.push("$(circle-slash) Disabled"),e.LockedBy&&n.push(`$(lock) ${e.LockedBy}`),e.OwnedByCompany&&n.push(e.OwnedByCompany),this.description=e.Description||"",this.tooltip=[e.LibraryID,e.Description||"",`Status: ${e.Published?"Promoted":"Unpromoted / Editable"}`,e.LockedBy?`Locked by: ${e.LockedBy}`:"Unlocked",e.Disabled?"DISABLED":"",`Company: ${e.OwnedByCompany||"System"}`].filter(Boolean).join(`
`),this.contextValue=e.Published?"library-promoted":"library-unpromoted",e.Published?this.iconPath=new G.ThemeIcon("cloud",new G.ThemeColor("charts.green")):e.Disabled?this.iconPath=new G.ThemeIcon("circle-slash",new G.ThemeColor("charts.red")):e.LockedBy?this.iconPath=new G.ThemeIcon("lock",new G.ThemeColor("charts.yellow")):this.iconPath=new G.ThemeIcon("package")}};ue.LibraryNode=At;var Qt=class extends G.TreeItem{constructor(e,n,r){super(n.FunctionID,G.TreeItemCollapsibleState.None),this.libraryId=e,this.func=n,this.signatures=r;let o=r.filter(a=>!a.Response).map(a=>a.ArgumentName),i=r.filter(a=>a.Response).map(a=>a.ArgumentName);this.description=n.Description||"",this.tooltip=[`${n.LibraryID}.${n.FunctionID}`,n.Description||"",`Kind: ${n.Kind===2?"Code-based":n.Kind===1?"Widget + Code":"Widget"}`,o.length?`Request: ${o.join(", ")}`:"Request: (none)",`Response: ${i.join(", ")}`,n.Disabled?"DISABLED":"",n.Invalid?"INVALID":""].filter(Boolean).join(`
`),this.contextValue="function",this.iconPath=new G.ThemeIcon(n.Invalid?"warning":n.Disabled?"circle-slash":"symbol-function"),this.command={command:"efx.pullFunction",title:"Pull Function",arguments:[{libraryId:this.libraryId,func:this.func,signatures:this.signatures}]}}},Zt=class extends G.TreeItem{constructor(e,n){super(`Functions (${n})`,G.TreeItemCollapsibleState.Collapsed),this.libraryId=e,this.contextValue="function-group",this.iconPath=new G.ThemeIcon("symbol-function")}},Ge=class extends G.TreeItem{constructor(e,n,r,o){super(`${r} (${o})`,G.TreeItemCollapsibleState.Collapsed),this.libraryId=e,this.kind=n,this.contextValue=`reference-group-${n}`;let i={tables:"database",services:"server",libraries:"library",assemblies:"package"};this.iconPath=new G.ThemeIcon(i[n]||"references")}},tt=class extends G.TreeItem{constructor(e,n){let r="",o="",i="",a="references";e==="tables"?(r=n.TableID,o=n.Updatable?"Updatable":"Read-only",i=[n.TableID,`Updatable: ${n.Updatable?"Yes":"No"}`,`SysRowID: ${n.SysRowID||""}`].join(`
`),a=n.Updatable?"edit":"lock"):e==="services"?(r=n.ServiceID,o="Service",i=[n.ServiceID,`SysRowID: ${n.SysRowID||""}`].join(`
`),a="server"):e==="libraries"?(r=n.LibraryRef,o=n.Mode===1?"Read-only":n.Mode===2?"Hidden":"Normal",i=[n.LibraryRef,`Mode: ${n.Mode}`,`SysRowID: ${n.SysRowID||""}`].join(`
`),a="library"):e==="assemblies"&&(r=n.Assembly,o="Assembly",i=[n.Assembly,`SysRowID: ${n.SysRowID||""}`].join(`
`),a="package"),super(r||"(unknown)",G.TreeItemCollapsibleState.None),this.kind=e,this.row=n,this.description=o,this.tooltip=i,this.contextValue=`reference-item-${e}`,this.iconPath=new G.ThemeIcon(a)}};ue.FunctionNode=Qt;var Rn=class{constructor(e){this.client=e,this._onDidChangeTreeData=new G.EventEmitter,this.onDidChangeTreeData=this._onDidChangeTreeData.event,this.libraries=[],this.libraryCache=new Map}setClient(e){this.client=e}async refresh(){if(!this.client){G.window.showWarningMessage("EFx: Configure connection first (gear icon)");return}try{this.libraries=await this.client.getLibraryList(),this.libraryCache.clear(),this._onDidChangeTreeData.fire(void 0),G.window.showInformationMessage(`EFx: Loaded ${this.libraries.length} libraries`)}catch(e){G.window.showErrorMessage(`EFx: Failed to load libraries: ${e.message}`)}}async getLibraryTableset(e){if(this.client){if(this.libraryCache.has(e))return this.libraryCache.get(e);try{let n=await this.client.getLibrary(e);return this.libraryCache.set(e,n),n}catch(n){G.window.showErrorMessage(`EFx: Failed to load ${e}: ${n.message}`);return}}}invalidateCache(e){this.libraryCache.delete(e)}getTreeItem(e){return e}async getChildren(e){if(!this.client)return[];if(!e)return this.libraries.sort((n,r)=>n.LibraryID.localeCompare(r.LibraryID)).map(n=>new At(n));if(e instanceof At){let n=await this.getLibraryTableset(e.library.LibraryID);if(!n)return[];let r=[],o=(n.EfxFunction||[]).filter(s=>s.Kind===2||s.Kind===1),i=n.EfxRefTable||[],a=n.EfxRefService||[],c=n.EfxRefLibrary||[],u=n.EfxRefAssembly||[];return o.length>0,o.length>0&&r.push(new Zt(e.library.LibraryID,o.length)),r.push(new Ge(e.library.LibraryID,"tables","Tables",i.length)),r.push(new Ge(e.library.LibraryID,"services","Services",a.length)),r.push(new Ge(e.library.LibraryID,"libraries","Libraries",c.length)),r.push(new Ge(e.library.LibraryID,"assemblies","Assemblies",u.length)),r}if(e instanceof Zt){let n=await this.getLibraryTableset(e.libraryId);return n?(n.EfxFunction||[]).filter(r=>r.Kind===2||r.Kind===1).sort((r,o)=>r.FunctionID.localeCompare(o.FunctionID)).map(r=>{let o=(n.EfxFunctionSignature||[]).filter(i=>i.FunctionID===r.FunctionID);return new Qt(e.libraryId,r,o)}):[]}if(e instanceof Ge){let n=await this.getLibraryTableset(e.libraryId);return n?e.kind==="tables"?(n.EfxRefTable||[]).sort((r,o)=>r.TableID.localeCompare(o.TableID)).map(r=>new tt("tables",r)):e.kind==="services"?(n.EfxRefService||[]).sort((r,o)=>r.ServiceID.localeCompare(o.ServiceID)).map(r=>new tt("services",r)):e.kind==="libraries"?(n.EfxRefLibrary||[]).sort((r,o)=>r.LibraryRef.localeCompare(o.LibraryRef)).map(r=>new tt("libraries",r)):e.kind==="assemblies"?(n.EfxRefAssembly||[]).sort((r,o)=>r.Assembly.localeCompare(o.Assembly)).map(r=>new tt("assemblies",r)):[]:[]}return[]}};ue.EfxTreeProvider=Rn});var Ar=ne(Se=>{"use strict";var Ei=Se&&Se.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),Di=Se&&Se.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),Ci=Se&&Se.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&Ei(n,e,r[o]);return Di(n,e),n}})();Object.defineProperty(Se,"__esModule",{value:!0});Se.ExecuteViewProvider=void 0;var Ai=Ci(require("vscode")),$n=class{constructor(){this.view=null,this.loaded=!1,this.client=null,this.libraryId="",this.functionId="",this.signatures=[],this.companies=[],this.defaultCompany="",this.treeProvider=null,this.staging=!1}resolveWebviewView(e){this.view=e,e.webview.options={enableScripts:!0},e.webview.onDidReceiveMessage(async n=>{this.loaded&&(n.command==="execute"&&await this.execute(n.payload,n.company),n.command==="saveSignatures"&&await this.saveSignatures(n.signatures))}),e.onDidDispose(()=>{this.view=null}),e.webview.html=this.loaded?this.getHtml():this.getEmptyHtml()}async load(e,n,r,o,i,a,c,u=!1){this.client=e,this.libraryId=n,this.functionId=r,this.signatures=o,this.companies=Array.isArray(i)&&i.length>0?i:a?[a]:[],this.defaultCompany=a||this.companies[0]||"",this.treeProvider=c||null,this.staging=u,this.loaded=!0,await Ai.commands.executeCommand("efxExecuteView.focus"),this.view&&(this.view.webview.html=this.getHtml())}async execute(e,n){this.view.webview.postMessage({command:"executing"});try{let r=await this.client.executeFunction(this.libraryId,this.functionId,e,n||void 0,this.staging);this.view.webview.postMessage({command:"result",data:JSON.stringify(r,null,2),success:!0})}catch(r){this.view.webview.postMessage({command:"result",data:r.message,success:!1})}}async saveSignatures(e){this.view.webview.postMessage({command:"sigSaving"});try{let{saved:n,diagnostics:r,updatedSigs:o}=await this.client.saveSignatures(this.libraryId,this.functionId,e);if(!n){let a=(r||[]).map(c=>typeof c=="object"?c.Message||JSON.stringify(c):String(c));this.view.webview.postMessage({command:"sigError",error:a.join(`
`)||"Epicor rejected the signature change"});return}let i=this.signatures.filter(a=>a.FunctionID!==this.functionId);this.signatures=[...i,...o],this.treeProvider&&this.treeProvider.invalidateCache(this.libraryId),this.view.webview.postMessage({command:"sigSaved",signatures:o})}catch(n){this.view.webview.postMessage({command:"sigError",error:n.message})}}getHtml(){let e=this.signatures.filter(g=>!g.Response),n=this.signatures.filter(g=>g.Response),r={};for(let g of e)g.DataType.includes("Int")||g.DataType.includes("Decimal")||g.DataType.includes("Double")?r[g.ArgumentName]=0:g.DataType.includes("Boolean")?r[g.ArgumentName]=!1:g.DataType.includes("DataSet")||g.DataType.includes("DataTable")?r[g.ArgumentName]={}:r[g.ArgumentName]="";let o=e.map(g=>`<span class="param">${g.ArgumentName} <span class="type">${g.DataType.split(".").pop()}${g.Optional?"?":""}</span></span>`).join("")||'<span class="param none">No request parameters</span>',i=n.map(g=>`<span class="param">${g.ArgumentName} <span class="type">${g.DataType.split(".").pop()}</span></span>`).join(""),a=(this.companies||[]).map(g=>`<option value="${g}"${g===this.defaultCompany?" selected":""}>${g}</option>`).join(""),c=this.companies&&this.companies.length>0?`<div class="company-row">
        <label for="companySelect">Company</label>
        <select id="companySelect">${a}</select>
        <button class="btn-secondary" id="toggleSigBtn" onclick="toggleSigEditor()">\u2699 Edit Signatures</button>
    </div>`:`<div class="company-row">
        <button class="btn-secondary" id="toggleSigBtn" onclick="toggleSigEditor()">\u2699 Edit Signatures</button>
    </div>`,u=g=>({ArgumentName:g.ArgumentName,DataType:g.DataType||"System.String",Optional:!!g.Optional,Response:!!g.Response,Order:g.Order??0}),s=JSON.stringify(e.map(u)),m=JSON.stringify(n.map(u)),h=[["System.String","String"],["System.Int32","Int32"],["System.Int64","Int64"],["System.Decimal","Decimal"],["System.Double","Double"],["System.Boolean","Boolean"],["System.DateTime","DateTime"],["System.Data.DataSet","DataSet"],["System.Data.DataTable","DataTable"]].map(([g,l])=>`<option value="${g}">${l}</option>`).join("")+'<option value="__custom__">Custom\u2026</option>';return`<!DOCTYPE html>
<html>
<head>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        color: var(--vscode-foreground);
        background: var(--vscode-editor-background);
        padding: 12px 14px;
    }
    .main-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 14px;
        align-items: start;
    }
    .left-col { min-width: 0; }
    .right-col {
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 0;
    }
    .panel-box {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        padding: 10px 12px;
    }
    /* Stack into one column when the panel is too narrow for two. */
    @media (max-width: 720px) {
        .main-grid { grid-template-columns: 1fr; }
    }
    h2 {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--vscode-foreground);
    }
    .header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--vscode-panel-border);
    }
    .header h1 {
        font-size: 16px;
        font-weight: 600;
    }
    .header .lib {
        color: var(--vscode-descriptionForeground);
        font-size: 13px;
    }
    .company-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
    }
    .company-row label {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .company-row select {
        background: var(--vscode-dropdown-background);
        color: var(--vscode-dropdown-foreground);
        border: 1px solid var(--vscode-dropdown-border);
        border-radius: 3px;
        padding: 4px 8px;
        font-size: 13px;
        font-family: var(--vscode-font-family);
        cursor: pointer;
        min-width: 120px;
    }
    .company-row select:focus {
        outline: 1px solid var(--vscode-focusBorder);
    }
    .section {
        margin-bottom: 16px;
    }
    .params {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 8px;
    }
    .param {
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 12px;
    }
    .param .type {
        opacity: 0.7;
        font-style: italic;
    }
    .param.none {
        opacity: 0.5;
        font-style: italic;
    }
    textarea {
        width: 100%;
        min-height: 110px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
        padding: 8px;
        font-family: var(--vscode-editor-font-family);
        font-size: var(--vscode-editor-font-size);
        resize: vertical;
    }
    textarea:focus {
        outline: 1px solid var(--vscode-focusBorder);
    }
    button {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 8px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        margin-top: 8px;
    }
    button:hover {
        background: var(--vscode-button-hoverBackground);
    }
    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .response-area {
        margin-top: 16px;
    }
    pre {
        background: var(--vscode-textCodeBlock-background);
        padding: 12px;
        border-radius: 4px;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: var(--vscode-editor-font-family);
        font-size: var(--vscode-editor-font-size);
        max-height: 260px;
        overflow-y: auto;
    }
    .error { color: var(--vscode-errorForeground); }
    .success { color: var(--vscode-testing-iconPassed); }
    .spinner { display: none; opacity: 0.7; }
    .spinner.active { display: inline; }
    .btn-secondary {
        background: var(--vscode-button-secondaryBackground, #3a3d41);
        color: var(--vscode-button-secondaryForeground, #ccc);
        border: none; border-radius: 4px; padding: 4px 10px;
        font-size: 12px; font-weight: 600; cursor: pointer; margin-top: 0;
    }
    .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground, #45494e); }
    .btn-secondary.active { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    .sig-editor { display: none; border: 1px solid var(--vscode-panel-border); border-radius: 4px; margin-bottom: 12px; overflow: hidden; }
    .sig-editor.open { display: block; }
    .sig-tabs { display: flex; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-sideBarSectionHeader-background, rgba(255,255,255,0.04)); }
    .sig-tab { padding: 6px 16px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; background: transparent; color: var(--vscode-descriptionForeground); border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .sig-tab:hover { color: var(--vscode-foreground); }
    .sig-tab.active { color: var(--vscode-foreground); border-bottom-color: var(--vscode-button-background); }
    .sig-col-headers { display: grid; grid-template-columns: 1fr 150px 65px auto; gap: 6px; padding: 5px 10px 3px; border-bottom: 1px solid var(--vscode-panel-border); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; color: var(--vscode-descriptionForeground); }
    .sig-rows { padding: 6px 8px; display: flex; flex-direction: column; gap: 5px; min-height: 30px; }
    .sig-row { display: grid; grid-template-columns: 1fr 150px 65px auto; gap: 6px; align-items: start; }
    .sig-row input, .sig-row select { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 3px; padding: 3px 6px; font-size: 12px; font-family: var(--vscode-font-family); width: 100%; }
    .sig-row input:focus, .sig-row select:focus { outline: 1px solid var(--vscode-focusBorder); }
    .type-cell { display: flex; flex-direction: column; gap: 3px; }
    .opt-label { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--vscode-descriptionForeground); padding-top: 4px; cursor: pointer; }
    .sig-empty { font-size: 12px; color: var(--vscode-descriptionForeground); padding: 10px; font-style: italic; }
    .sig-footer { padding: 7px 8px; border-top: 1px solid var(--vscode-panel-border); display: flex; gap: 6px; align-items: center; flex-wrap: wrap; background: var(--vscode-sideBarSectionHeader-background, rgba(255,255,255,0.03)); }
    .sig-footer input, .sig-footer select { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 3px; padding: 3px 7px; font-size: 12px; font-family: var(--vscode-font-family); }
    #newArgName { flex: 1; min-width: 90px; }
    #newDataType { min-width: 120px; }
    #newCustomType { flex: 1.5; min-width: 100px; display: none; }
    .add-btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; padding: 3px 10px; font-size: 13px; font-weight: bold; cursor: pointer; }
    .add-btn:hover { background: var(--vscode-button-hoverBackground); }
    .btn-icon { background: transparent; color: var(--vscode-foreground); border: none; padding: 2px 5px; font-size: 13px; border-radius: 3px; opacity: 0.65; cursor: pointer; }
    .btn-icon:hover { opacity: 1; background: var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.1)); }
    .sig-save-bar { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-top: 1px solid var(--vscode-panel-border); flex-wrap: wrap; }
    .sig-status { font-size: 12px; flex: 1; }
    .sig-status.ok { color: var(--vscode-testing-iconPassed); }
    .sig-status.err { color: var(--vscode-errorForeground); }
    .sig-status.saving { color: var(--vscode-descriptionForeground); font-style: italic; }
    .btn-save { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; padding: 5px 14px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn-save:hover { background: var(--vscode-button-hoverBackground); }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .staging-badge {
        background: var(--vscode-statusBarItem-warningBackground, #cc6600);
        color: var(--vscode-statusBarItem-warningForeground, #fff);
        font-size: 10px; font-weight: 700; padding: 2px 7px;
        border-radius: 3px; letter-spacing: 0.4px; text-transform: uppercase;
    }
    .response-header {
        display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
    }
    .response-header h2 { margin-bottom: 0; }
    .btn-copy {
        background: transparent;
        color: var(--vscode-descriptionForeground);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px; padding: 2px 8px; font-size: 11px; font-weight: 600;
        cursor: pointer; margin-top: 0;
    }
    .btn-copy:hover { color: var(--vscode-foreground); background: var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.1)); }
    .btn-copy.copied { color: var(--vscode-testing-iconPassed); border-color: var(--vscode-testing-iconPassed); }
    .dataset-table-wrap {
        margin-top: 8px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; overflow: hidden;
    }
    .grid-box .dataset-table-wrap { margin-top: 8px; }
    .grid-box .dataset-empty { margin-top: 8px; padding: 8px 2px; }
    .dataset-tabs {
        display: flex; background: var(--vscode-sideBarSectionHeader-background, rgba(255,255,255,0.04));
        border-bottom: 1px solid var(--vscode-panel-border); flex-wrap: wrap;
    }
    .dataset-tab {
        padding: 5px 14px; font-size: 11px; font-weight: 600; cursor: pointer;
        border: none; background: transparent; color: var(--vscode-descriptionForeground);
        border-bottom: 2px solid transparent; margin-bottom: -1px;
    }
    .dataset-tab.active { color: var(--vscode-foreground); border-bottom-color: var(--vscode-button-background); }
    .dataset-table-container { overflow-x: auto; max-height: 300px; overflow-y: auto; }
    table.dataset-table { border-collapse: collapse; font-size: 12px; width: 100%; }
    table.dataset-table th {
        background: var(--vscode-sideBarSectionHeader-background, rgba(255,255,255,0.06));
        padding: 5px 10px; text-align: left; font-weight: 600; font-size: 11px;
        border-bottom: 1px solid var(--vscode-panel-border);
        white-space: nowrap; position: sticky; top: 0;
    }
    table.dataset-table td {
        padding: 4px 10px; border-bottom: 1px solid var(--vscode-panel-border, rgba(255,255,255,0.06));
        max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        font-family: var(--vscode-editor-font-family); font-size: 12px;
    }
    table.dataset-table tr:last-child td { border-bottom: none; }
    table.dataset-table tr:hover td { background: var(--vscode-list-hoverBackground); }
    .dataset-empty { padding: 10px; font-size: 12px; color: var(--vscode-descriptionForeground); font-style: italic; }
</style>
</head>
<body>
    <div class="header">
        <h1>\u25B6 ${this.functionId}</h1>
        <span class="lib">${this.libraryId}</span>
        ${this.staging?'<span class="staging-badge">staging</span>':""}
    </div>

    <div class="main-grid">
        <div class="left-col">
            ${c}

            <div class="sig-editor" id="sigEditor">
                <div class="sig-tabs">
                    <button class="sig-tab active" id="tabReq"  onclick="switchTab('request')">Request Params</button>
                    <button class="sig-tab"        id="tabResp" onclick="switchTab('response')">Response Params</button>
                </div>
                <div class="sig-col-headers"><span>Argument Name</span><span>Data Type</span><span>Optional</span><span></span></div>
                <div class="sig-rows" id="sigRows"></div>
                <div class="sig-footer">
                    <input  id="newArgName"    placeholder="ArgumentName" />
                    <select id="newDataType">${h}</select>
                    <input  id="newCustomType" placeholder="Full .NET type name" />
                    <button class="add-btn" onclick="addSigRow()">\uFF0B Add</button>
                </div>
                <div class="sig-save-bar">
                    <span class="sig-status" id="sigStatus"></span>
                    <button class="btn-save" id="saveBtn" onclick="saveSignatures()">\u{1F4BE} Save to Epicor</button>
                </div>
            </div>

            <div class="section">
                <h2>Request Parameters</h2>
                <div class="params">${o}</div>
                <textarea id="payload" spellcheck="false">${JSON.stringify(r,null,2)}</textarea>
            </div>

            ${i?`<div class="section">
                <h2>Response Parameters</h2>
                <div class="params">${i}</div>
            </div>`:""}

            <button id="executeBtn" onclick="doExecute()">
                Execute
            </button>
            <span class="spinner" id="spinner">\u23F3 Running...</span>
        </div>

        <div class="right-col">
            <div class="panel-box response-box">
                <div class="response-header">
                    <h2>Response Object</h2>
                    <button class="btn-copy" id="copyBtn" onclick="copyResponse()" title="Copy response to clipboard">\u2398 Copy</button>
                </div>
                <pre id="response">\u2014 No response yet \u2014</pre>
            </div>
            <div class="panel-box grid-box">
                <h2>Rendered Grid</h2>
                <div id="datasetWrap" class="dataset-table-wrap" style="display:none"></div>
                <div id="datasetEmpty" class="dataset-empty">\u2014 Run a function that returns tabular data \u2014</div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const staging = ${this.staging?"true":"false"};

        let reqSigs  = ${s};
        let respSigs = ${m};
        let activeTab  = 'request';
        let editorOpen = false;

        function toggleSigEditor() {
            editorOpen = !editorOpen;
            document.getElementById('sigEditor').className  = 'sig-editor' + (editorOpen ? ' open' : '');
            document.getElementById('toggleSigBtn').className = 'btn-secondary' + (editorOpen ? ' active' : '');
            if (editorOpen) renderSigRows();
        }
        function switchTab(tab) {
            activeTab = tab;
            document.getElementById('tabReq').className  = 'sig-tab' + (tab === 'request'  ? ' active' : '');
            document.getElementById('tabResp').className = 'sig-tab' + (tab === 'response' ? ' active' : '');
            renderSigRows();
        }
        const knownTypes = [
            'System.String','System.Int32','System.Int64','System.Decimal',
            'System.Double','System.Boolean','System.DateTime',
            'System.Data.DataSet','System.Data.DataTable'
        ];
        function renderSigRows() {
            const sigs = activeTab === 'request' ? reqSigs : respSigs;
            const container = document.getElementById('sigRows');
            container.innerHTML = '';
            if (sigs.length === 0) { container.innerHTML = '<div class="sig-empty">No parameters \u2014 use \uFF0B Add below.</div>'; return; }
            sigs.forEach((sig, idx) => {
                const row = document.createElement('div');
                row.className = 'sig-row';
                const nameInput = document.createElement('input');
                nameInput.value = sig.ArgumentName;
                nameInput.addEventListener('change', () => { sig.ArgumentName = nameInput.value.trim(); setSigStatus(''); });
                const isKnown = knownTypes.includes(sig.DataType);
                const typeCell = document.createElement('div');
                typeCell.className = 'type-cell';
                const typeSelect = document.createElement('select');
                knownTypes.forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t.replace('System.Data.','').replace('System.',''); if (t === sig.DataType) o.selected = true; typeSelect.appendChild(o); });
                const customOpt = document.createElement('option'); customOpt.value = '__custom__'; customOpt.textContent = isKnown ? 'Custom\u2026' : sig.DataType; if (!isKnown) customOpt.selected = true; typeSelect.appendChild(customOpt);
                const customInput = document.createElement('input'); customInput.placeholder = 'Full .NET type'; customInput.value = isKnown ? '' : sig.DataType; customInput.style.display = isKnown ? 'none' : '';
                customInput.addEventListener('change', () => { if (customInput.value.trim()) sig.DataType = customInput.value.trim(); setSigStatus(''); });
                typeSelect.addEventListener('change', () => { if (typeSelect.value === '__custom__') { customInput.style.display = ''; customInput.focus(); } else { customInput.style.display = 'none'; sig.DataType = typeSelect.value; setSigStatus(''); } });
                typeCell.appendChild(typeSelect); typeCell.appendChild(customInput);
                const optLabel = document.createElement('label'); optLabel.className = 'opt-label';
                const optCheck = document.createElement('input'); optCheck.type = 'checkbox'; optCheck.checked = !!sig.Optional;
                optCheck.addEventListener('change', () => { sig.Optional = optCheck.checked; setSigStatus(''); });
                optLabel.appendChild(optCheck); optLabel.appendChild(document.createTextNode(' Optional'));
                const removeBtn = document.createElement('button'); removeBtn.className = 'btn-icon'; removeBtn.textContent = '\u2715'; removeBtn.title = 'Remove';
                removeBtn.addEventListener('click', () => { (activeTab === 'request' ? reqSigs : respSigs).splice(idx, 1); renderSigRows(); setSigStatus(''); });
                row.appendChild(nameInput); row.appendChild(typeCell); row.appendChild(optLabel); row.appendChild(removeBtn);
                container.appendChild(row);
            });
        }
        function addSigRow() {
            const nameInput = document.getElementById('newArgName');
            const typeSelect = document.getElementById('newDataType');
            const customInput = document.getElementById('newCustomType');
            const name = nameInput.value.trim();
            if (!name) { nameInput.focus(); return; }
            const dataType = typeSelect.value === '__custom__' ? (customInput.value.trim() || 'System.String') : typeSelect.value;
            const sigs = activeTab === 'request' ? reqSigs : respSigs;
            sigs.push({ ArgumentName: name, DataType: dataType, Optional: false, Response: activeTab === 'response', Order: sigs.length });
            nameInput.value = ''; customInput.value = ''; customInput.style.display = 'none'; typeSelect.value = 'System.String';
            renderSigRows(); setSigStatus(''); nameInput.focus();
        }
        document.getElementById('newArgName').addEventListener('keydown', e => { if (e.key === 'Enter') addSigRow(); });
        document.getElementById('newDataType').addEventListener('change', function() {
            const ci = document.getElementById('newCustomType');
            ci.style.display = this.value === '__custom__' ? '' : 'none';
            if (this.value === '__custom__') ci.focus();
        });
        function saveSignatures() {
            reqSigs.forEach((s, i) => { s.Order = i; s.Response = false; });
            respSigs.forEach((s, i) => { s.Order = i; s.Response = true; });
            document.getElementById('saveBtn').disabled = true;
            setSigStatus('Saving to Epicor\u2026', 'saving');
            vscode.postMessage({ command: 'saveSignatures', signatures: [...reqSigs, ...respSigs] });
        }
        function setSigStatus(msg, kind) {
            const el = document.getElementById('sigStatus');
            el.textContent = msg;
            el.className = 'sig-status' + (kind ? ' ' + kind : '');
        }

        // \u2500\u2500 Copy response to clipboard \u2500\u2500
        function copyResponse() {
            const text = document.getElementById('response').textContent;
            if (!text || text === '\u2014 No response yet \u2014') return;
            navigator.clipboard.writeText(text).then(() => {
                const btn = document.getElementById('copyBtn');
                btn.textContent = '\u2713 Copied';
                btn.classList.add('copied');
                setTimeout(() => { btn.textContent = '\u2398 Copy'; btn.classList.remove('copied'); }, 1500);
            });
        }

        // \u2500\u2500 DataSet / tableset table renderer \u2500\u2500
        function looksLikeDataSet(obj) {
            if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
            // Check at any depth for an array-of-objects
            function hasTableAnywhere(o, depth) {
                if (depth > 5) return false;
                for (const v of Object.values(o)) {
                    if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') return true;
                    if (v && typeof v === 'object' && !Array.isArray(v) && hasTableAnywhere(v, depth + 1)) return true;
                }
                return false;
            }
            return hasTableAnywhere(obj, 0);
        }

        // Recursively find all array-of-objects, using dot-path keys (e.g. "ds.Parts")
        function extractTables(obj, prefix, depth) {
            if (depth === undefined) depth = 0;
            if (prefix === undefined) prefix = '';
            if (depth > 5) return {};
            const tables = {};
            for (const [k, v] of Object.entries(obj)) {
                const key = prefix ? prefix + '.' + k : k;
                if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') {
                    tables[key] = v;
                } else if (v && typeof v === 'object' && !Array.isArray(v)) {
                    Object.assign(tables, extractTables(v, key, depth + 1));
                }
            }
            return tables;
        }

        // Toggle the rendered-grid area vs. its empty placeholder.
        function setGridVisible(show) {
            document.getElementById('datasetWrap').style.display = show ? '' : 'none';
            document.getElementById('datasetEmpty').style.display = show ? 'none' : '';
        }

        let activeDatasetTab = null;
        function renderDatasetTables(obj) {
            const wrap = document.getElementById('datasetWrap');
            const tables = extractTables(obj);
            const keys = Object.keys(tables);
            if (keys.length === 0) { setGridVisible(false); return; }
            setGridVisible(true);
            activeDatasetTab = activeDatasetTab && tables[activeDatasetTab] ? activeDatasetTab : keys[0];

            const tabHtml = keys.map(k =>
                \`<button class="dataset-tab\${k === activeDatasetTab ? ' active' : ''}" onclick="switchDatasetTab('\${k}')">\${k} <span style="opacity:.55;font-weight:400;">(\${tables[k].length})</span></button>\`
            ).join('');

            const rows = tables[activeDatasetTab];
            const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
            const colHeaders = cols.map(c => \`<th>\${c}</th>\`).join('');
            const bodyRows = rows.map(r =>
                \`<tr>\${cols.map(c => {
                    const val = r[c];
                    const display = val === null || val === undefined ? '<span style="opacity:.4">null</span>'
                        : typeof val === 'object' ? JSON.stringify(val)
                        : String(val);
                    return \`<td title="\${String(val ?? '').replace(/"/g,'&quot;')}">\${display}</td>\`;
                }).join('')}</tr>\`
            ).join('');

            wrap.innerHTML = \`
                <div class="dataset-tabs">\${tabHtml}</div>
                <div class="dataset-table-container">
                    \${cols.length > 0
                        ? \`<table class="dataset-table"><thead><tr>\${colHeaders}</tr></thead><tbody>\${bodyRows}</tbody></table>\`
                        : '<div class="dataset-empty">No rows</div>'}
                </div>\`;
        }

        function switchDatasetTab(key) {
            activeDatasetTab = key;
            try {
                const obj = JSON.parse(document.getElementById('response').textContent);
                renderDatasetTables(obj);
            } catch(e) {}
        }

        function doExecute() {
            const textarea = document.getElementById('payload');
            let payload;
            try {
                payload = JSON.parse(textarea.value);
            } catch(e) {
                document.getElementById('response').textContent = 'Invalid JSON: ' + e.message;
                document.getElementById('response').className = 'error';
                return;
            }
            const selectEl = document.getElementById('companySelect');
            const company = selectEl ? selectEl.value : '';
            vscode.postMessage({ command: 'execute', payload, company });
        }

        window.addEventListener('message', (event) => {
            const msg = event.data;
            const btn = document.getElementById('executeBtn');
            const spinner = document.getElementById('spinner');
            const response = document.getElementById('response');
            const datasetWrap = document.getElementById('datasetWrap');

            if (msg.command === 'executing') {
                btn.disabled = true;
                spinner.className = 'spinner active';
                response.textContent = '\u23F3 Executing...';
                response.className = '';
                setGridVisible(false);
            }
            if (msg.command === 'result') {
                btn.disabled = false;
                spinner.className = 'spinner';
                response.textContent = msg.data;
                response.className = msg.success ? 'success' : 'error';
                // Try to parse and render as DataSet table
                if (msg.success) {
                    try {
                        const parsed = JSON.parse(msg.data);
                        activeDatasetTab = null;
                        if (looksLikeDataSet(parsed)) {
                            renderDatasetTables(parsed);
                        } else {
                            setGridVisible(false);
                        }
                    } catch(e) {
                        setGridVisible(false);
                    }
                } else {
                    setGridVisible(false);
                }
            }
            if (msg.command === 'sigSaving') {
                setSigStatus('Saving to Epicor\u2026', 'saving');
            }
            if (msg.command === 'sigSaved') {
                document.getElementById('saveBtn').disabled = false;
                reqSigs  = (msg.signatures || []).filter(s => !s.Response);
                respSigs = (msg.signatures || []).filter(s =>  s.Response);
                renderSigRows();
                setSigStatus('\u2713 Saved to Epicor', 'ok');
            }
            if (msg.command === 'sigError') {
                document.getElementById('saveBtn').disabled = false;
                setSigStatus('\u2717 ' + (msg.error || 'Save failed'), 'err');
            }
        });
    </script>
</body>
</html>`}getEmptyHtml(){return`<!DOCTYPE html>
<html>
<head>
<style>
    body {
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        color: var(--vscode-descriptionForeground);
        background: var(--vscode-editor-background);
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
        text-align: center;
        padding: 16px;
    }
    .hint { max-width: 340px; line-height: 1.5; }
    .hint .cta { color: var(--vscode-foreground); font-weight: 600; margin-bottom: 4px; }
</style>
</head>
<body>
    <div class="hint">
        <div class="cta">No function loaded</div>
        Right-click a function in the EFx Libraries tree and choose
        <em>Execute Function</em> to run it here.
    </div>
</body>
</html>`}};Se.ExecuteViewProvider=$n});var en=ne(ve=>{"use strict";Object.defineProperty(ve,"__esModule",{value:!0});ve.BpmClient=void 0;var xi={PRE:1,BASE:2,POST:3};ve.DIRECTIVE_TYPE=xi;function xr(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\t/g,"&#x9;").replace(/\r\n/g,"&#xA;").replace(/\n/g,"&#xA;").replace(/\r/g,"&#xA;")}function Tr(t){return t.replace(/&#xA;/gi,`
`).replace(/&#xD;/gi,"\r").replace(/&#x9;/gi,"	").replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")}ve.xmlDecode=Tr;ve.xmlEncode=xr;function Ti(t){if(!t)return{code:"",hasCustomCode:!1};let e=t.indexOf("CustomCodeAction");if(e<0)return{code:"",hasCustomCode:!1};let n='Code="',r=t.indexOf(n,e);if(r<0)return{code:"",hasCustomCode:!1};let o=r+n.length,i=o;for(;i<t.length&&t[i]!=='"';){if(t[i]==="&"){let c=t.indexOf(";",i);if(c<0)break;i=c+1;continue}i++}let a=t.slice(o,i);return{code:Tr(a),hasCustomCode:!0}}ve.extractBpmCode=Ti;function Sr(t,e){let n=t.indexOf("CustomCodeAction");if(n<0)throw new Error("No CustomCodeAction found in directive body");let r='Code="',o=t.indexOf(r,n);if(o<0)throw new Error("No Code= attribute found in CustomCodeAction");let i=o+r.length,a=i;for(;a<t.length&&t[a]!=='"';){if(t[a]==="&"){let c=t.indexOf(";",a);if(c<0)break;a=c+1;continue}a++}return t.slice(0,i)+xr(e)+t.slice(a)}ve.replaceBpmCode=Sr;function Si(t){return t?String(t).replace(/></g,`>
<`):""}ve.formatBpmBodyXaml=Si;function Ii(t,e,n){let o=t.indexOf('"BpDirective":[');if(o<0)throw new Error("BpDirective array not found in raw tableset");let i=t.indexOf("[",o),a=`"DirectiveID":"${e}"`,c=i+1;for(;c<t.length;){let u=t.indexOf("{",c);if(u<0)break;let s=0,m=!1,h=!1,g=-1;for(let p=u;p<t.length;p++){let d=t[p];if(m){if(h){h=!1;continue}if(d==="\\"){h=!0;continue}d==='"'&&(m=!1);continue}if(d==='"'){m=!0;continue}if(d==="{")s++;else if(d==="}"&&(s--,s===0)){g=p;break}}if(g<0)throw new Error("Malformed BpDirective object in raw tableset");let l=t.slice(u,g+1);if(l.includes(a)){let p='"Body":"',d=l.indexOf(p);if(d<0)throw new Error("Body field not found in BpDirective row");let y=d+p.length,v=y,w=!1;for(;v<l.length;){let P=l[v];if(w){w=!1,v++;continue}if(P==="\\"){w=!0,v++;continue}if(P==='"')break;v++}if(v>=l.length)throw new Error("Body string value did not terminate");let b=v,D='"'+l.slice(y,b)+'"',E;try{E=JSON.parse(D)}catch(P){throw new Error("Failed to JSON-parse Body value: "+P.message)}let C=Sr(E,n),A=JSON.stringify(C).slice(1,-1),T=l.slice(0,y)+A+l.slice(b),I=t.slice(0,u)+l+","+T+t.slice(g+1),k='"BitFlag":0,"RowMod":""',q='"BitFlag":0,"RowMod":"U"',x=u+l.length+1,S=x+T.length,B=I.indexOf(k,x);if(B<0||B>S)throw new Error(`BitFlag/RowMod anchor not found for directive ${e}`);return I.slice(0,B)+q+I.slice(B+k.length)}c=g+1}throw new Error(`Directive ${e} not found in raw tableset`)}ve.updateRawBpmDirective=Ii;var Un=class{constructor(e){this._client=e}getBpmUrl(e){return`${this._client.config.serverUrl.replace(/\/$/,"")}/api/v2/odata/${this._client.config.company}/Ice.BO.BpMethodSvc/${e}`}async request(e,n){return this._client.request(e,n)}async requestRaw(e,n){return this._client.requestRaw(e,n)}async getBpmServices(){return(await this.request(this.getBpmUrl("GetBpmDirectiveServicesTS"),{})).returnObj?.BpDirectiveService||[]}async getBpmMethodsByService(e,n,r){let i=(await this.request(this.getBpmUrl("GetRowsEx"),{source:"BO",whereClauseBpMethod:`SystemCode = '${e}' and ObjectNS = '${n}' and BusinessObject = '${r}'`,whereClauseBpDirective:"",pageSize:500,absolutePage:1})).returnObj;return{methods:i?.BpMethod||[],directives:i?.BpDirective||[]}}async getBpmMethod(e,n){return(await this.request(this.getBpmUrl("GetByIDBpMethod"),{source:e,bpMethodCode:n})).returnObj}async getBpmMethodRaw(e,n){let r=await this.requestRaw(this.getBpmUrl("GetByIDBpMethod"),JSON.stringify({source:e,bpMethodCode:n})),o=r.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);return o?o[1]:r}async updateBpmRaw(e){let n=`{"ds":${e}}`,r=await this.requestRaw(this.getBpmUrl("Update"),n);try{return JSON.parse(r)}catch{return{}}}async validateCustomCode(e,n){let r=JSON.stringify({Code:e,IsCondition:!1});return(await this.request(this.getBpmUrl("ValidateCustomCode"),{codeSnippetWithScope:r,functionDefinition:JSON.stringify(n),isAsync:!1})).returnObj?.diagnostics||null}};ve.BpmClient=Un;function Ni(t,e){let n=t.SystemCode||"Erp",r=n.charAt(0).toUpperCase()+n.slice(1).toLowerCase(),o={INPUT:0,OUTPUT:1,"INPUT-OUTPUT":2};return{FunctionKind:0,Target:{kind:0,id:t.BpMethodCode,alias:t.BpMethodCode,productCode:{value:r},name:t.BusinessObject,method:t.Name,hasRootTransaction:t.HasRootTransaction},SupportsAdvancedFeatures:!0,SupportsDbAccessInCode:0,DebugMode:t.DebugMode||!1,Arguments:(e||[]).map(i=>({Name:i.BpArgumentName,Type:i.TypeInfo,TypeName:i.Type,Direction:o[i.Direction]??2,Kind:o[i.Direction]??2})),LocalVariables:[],CustomReferences:[{Name:"Assemblies",IsStandard:!1,IsEditable:!0,References:{}},{Name:"Externals",IsStandard:!1,IsEditable:!0,References:{}},{Name:"Standard",IsStandard:!0,IsEditable:!0,References:{}}],CustomUsings:""}}ve.buildFunctionDefinition=Ni});var Ir=ne(ge=>{"use strict";var Bi=ge&&ge.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&Li(n,e,r[o]);return Oi(n,e),n}})(),Li=ge&&ge.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),Oi=ge&&ge.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e});Object.defineProperty(ge,"__esModule",{value:!0});ge.BpmTreeProvider=void 0;var W=Bi(require("vscode")),_i=en(),xt=class extends W.TreeItem{constructor(e){let n=`${e.SystemCode}.${e.ServiceKind}.${e.ServiceName}`;super(n,W.TreeItemCollapsibleState.Collapsed),this.svc=e,this.contextValue="bpm-service",this.iconPath=new W.ThemeIcon("server"),this.tooltip=`${e.SystemCode} / ${e.ServiceKind} / ${e.ServiceName}`}},Tt=class extends W.TreeItem{constructor(e,n){super(e.Name,W.TreeItemCollapsibleState.Collapsed),this.method=e,this.directives=n,this.contextValue="bpm-method";let r=[];e.HasPreProcessing&&r.push("Pre"),e.HasBaseProcessing&&r.push("Base"),e.HasPostProcessing&&r.push("Post"),e.Disabled&&r.push("Disabled"),e.HasOutdatedDirectives&&r.push("\u26A0 Outdated"),this.description=r.join(" \xB7 ")||"No directives",this.tooltip=[`${e.BpMethodCode}`,`Source: ${e.Source}`,r.length?`Flags: ${r.join(", ")}`:""].filter(Boolean).join(`
`),e.Disabled?this.iconPath=new W.ThemeIcon("circle-slash",new W.ThemeColor("charts.red")):e.HasOutdatedDirectives?this.iconPath=new W.ThemeIcon("warning",new W.ThemeColor("charts.yellow")):r.length>0?this.iconPath=new W.ThemeIcon("symbol-event",new W.ThemeColor("charts.blue")):this.iconPath=new W.ThemeIcon("symbol-event")}},tn=class extends W.TreeItem{constructor(e){super(e.Name,W.TreeItemCollapsibleState.None),this.directive=e;let n=e.DirectiveType===1?"Pre":e.DirectiveType===3?"Post":e.DirectiveType===2?"Base":`Type${e.DirectiveType}`,{hasCustomCode:r}=_i.extractBpmCode(e.Body);this.description=[n,e.IsEnabled?"":"Disabled",r?"":"No code",e.DirectiveGroup?`[${e.DirectiveGroup}]`:""].filter(Boolean).join(" \xB7 "),this.contextValue=r?"bpm-directive-code":"bpm-directive-nocode",r||(this.command={command:"efx.bpm.openWidgetPanel",title:"Open Widget Panel",arguments:[{directive:e}]}),this.tooltip=[e.Name,`Type: ${n}`,`Enabled: ${e.IsEnabled}`,`Group: ${e.DirectiveGroup||"(none)"}`,r?"Has custom C# code":"No custom code (widget/condition only)",e.CompilerDiagnostics?`Diagnostics: ${e.CompilerDiagnostics}`:""].filter(Boolean).join(`
`),e.IsEnabled?r?e.DirectiveType===1?this.iconPath=new W.ThemeIcon("arrow-up",new W.ThemeColor("charts.blue")):e.DirectiveType===3?this.iconPath=new W.ThemeIcon("arrow-down",new W.ThemeColor("charts.green")):this.iconPath=new W.ThemeIcon("symbol-event"):this.iconPath=new W.ThemeIcon("gear"):this.iconPath=new W.ThemeIcon("circle-slash",new W.ThemeColor("charts.red")),r&&(this.command={command:"efx.bpm.pullDirective",title:"Pull Directive Code",arguments:[{directive:e}]})}};ge.BpmServiceNode=xt;ge.BpmMethodNode=Tt;ge.BpmDirectiveNode=tn;var qn=class{constructor(e){this.bpmClient=e,this._onDidChangeTreeData=new W.EventEmitter,this.onDidChangeTreeData=this._onDidChangeTreeData.event,this.services=[],this.methodCache=new Map}setClient(e){this.bpmClient=e}async refresh(){if(!this.bpmClient){W.window.showWarningMessage("BPM: Configure EFx connection first");return}try{this.services=await this.bpmClient.getBpmServices(),this.methodCache.clear(),this._onDidChangeTreeData.fire(void 0),W.window.showInformationMessage(`BPM: Loaded ${this.services.length} services`)}catch(e){W.window.showErrorMessage(`BPM: Failed to load services: ${e.message}`)}}invalidateService(e,n,r){let o=`${e}.${n}.${r}`;this.methodCache.delete(o)}getTreeItem(e){return e}async getChildren(e){if(!this.bpmClient)return[];if(!e)return this.services.sort((n,r)=>{let o=`${n.SystemCode}.${n.ServiceKind}.${n.ServiceName}`,i=`${r.SystemCode}.${r.ServiceKind}.${r.ServiceName}`;return o.localeCompare(i)}).map(n=>new xt(n));if(e instanceof xt){let{SystemCode:n,ServiceKind:r,ServiceName:o}=e.svc,i=`${n}.${r}.${o}`,a=this.methodCache.get(i);if(!a)try{a=await this.bpmClient.getBpmMethodsByService(n,r,o),this.methodCache.set(i,a)}catch(s){return W.window.showErrorMessage(`BPM: Failed to load methods: ${s.message}`),[]}let{methods:c,directives:u}=a;return c.sort((s,m)=>s.Name.localeCompare(m.Name)).map(s=>{let m=u.filter(h=>h.BpMethodCode===s.BpMethodCode);return new Tt(s,m)})}if(e instanceof Tt){let n=e.directives;return!n||n.length===0?[]:n.sort((r,o)=>r.DirectiveType!==o.DirectiveType?r.DirectiveType-o.DirectiveType:(r.Order||0)-(o.Order||0)).map(r=>new tn(r))}return[]}};ge.BpmTreeProvider=qn});var Ke=ne(oe=>{"use strict";function ki(t,e,n){if(n===void 0&&(n=Array.prototype),t&&typeof n.find=="function")return n.find.call(t,e);for(var r=0;r<t.length;r++)if(Ye(t,r)){var o=t[r];if(e.call(void 0,o,r,t))return o}}function nt(t,e){return e===void 0&&(e=Object),e&&typeof e.getOwnPropertyDescriptors=="function"&&(t=e.create(null,e.getOwnPropertyDescriptors(t))),e&&typeof e.freeze=="function"?e.freeze(t):t}function Ye(t,e){return Object.prototype.hasOwnProperty.call(t,e)}function Fi(t,e){if(t===null||typeof t!="object")throw new TypeError("target is not an object");for(var n in e)Ye(e,n)&&(t[n]=e[n]);return t}var Nr=nt({allowfullscreen:!0,async:!0,autofocus:!0,autoplay:!0,checked:!0,controls:!0,default:!0,defer:!0,disabled:!0,formnovalidate:!0,hidden:!0,ismap:!0,itemscope:!0,loop:!0,multiple:!0,muted:!0,nomodule:!0,novalidate:!0,open:!0,playsinline:!0,readonly:!0,required:!0,reversed:!0,selected:!0});function Mi(t){return Ye(Nr,t.toLowerCase())}var Br=nt({area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function Pi(t){return Ye(Br,t.toLowerCase())}var St=nt({script:!1,style:!1,textarea:!0,title:!0});function Ri(t){var e=t.toLowerCase();return Ye(St,e)&&!St[e]}function $i(t){var e=t.toLowerCase();return Ye(St,e)&&St[e]}function Lr(t){return t===It.HTML}function Ui(t){return Lr(t)||t===It.XML_XHTML_APPLICATION}var It=nt({HTML:"text/html",XML_APPLICATION:"application/xml",XML_TEXT:"text/xml",XML_XHTML_APPLICATION:"application/xhtml+xml",XML_SVG_IMAGE:"image/svg+xml"}),qi=Object.keys(It).map(function(t){return It[t]});function ji(t){return qi.indexOf(t)>-1}var Hi=nt({HTML:"http://www.w3.org/1999/xhtml",SVG:"http://www.w3.org/2000/svg",XML:"http://www.w3.org/XML/1998/namespace",XMLNS:"http://www.w3.org/2000/xmlns/"});oe.assign=Fi;oe.find=ki;oe.freeze=nt;oe.HTML_BOOLEAN_ATTRIBUTES=Nr;oe.HTML_RAW_TEXT_ELEMENTS=St;oe.HTML_VOID_ELEMENTS=Br;oe.hasDefaultHTMLNamespace=Ui;oe.hasOwn=Ye;oe.isHTMLBooleanAttribute=Mi;oe.isHTMLRawTextElement=Ri;oe.isHTMLEscapableRawTextElement=$i;oe.isHTMLMimeType=Lr;oe.isHTMLVoidElement=Pi;oe.isValidMimeType=ji;oe.MIME_TYPE=It;oe.NAMESPACE=Hi});var _t=ne(Ot=>{"use strict";var Vi=Ke();function _r(t,e){t.prototype=Object.create(Error.prototype,{constructor:{value:t},name:{value:t.name,enumerable:!0,writable:e}})}var Bt=Vi.freeze({Error:"Error",IndexSizeError:"IndexSizeError",DomstringSizeError:"DomstringSizeError",HierarchyRequestError:"HierarchyRequestError",WrongDocumentError:"WrongDocumentError",InvalidCharacterError:"InvalidCharacterError",NoDataAllowedError:"NoDataAllowedError",NoModificationAllowedError:"NoModificationAllowedError",NotFoundError:"NotFoundError",NotSupportedError:"NotSupportedError",InUseAttributeError:"InUseAttributeError",InvalidStateError:"InvalidStateError",SyntaxError:"SyntaxError",InvalidModificationError:"InvalidModificationError",NamespaceError:"NamespaceError",InvalidAccessError:"InvalidAccessError",ValidationError:"ValidationError",TypeMismatchError:"TypeMismatchError",SecurityError:"SecurityError",NetworkError:"NetworkError",AbortError:"AbortError",URLMismatchError:"URLMismatchError",QuotaExceededError:"QuotaExceededError",TimeoutError:"TimeoutError",InvalidNodeTypeError:"InvalidNodeTypeError",DataCloneError:"DataCloneError",EncodingError:"EncodingError",NotReadableError:"NotReadableError",UnknownError:"UnknownError",ConstraintError:"ConstraintError",DataError:"DataError",TransactionInactiveError:"TransactionInactiveError",ReadOnlyError:"ReadOnlyError",VersionError:"VersionError",OperationError:"OperationError",NotAllowedError:"NotAllowedError",OptOutError:"OptOutError"}),kr=Object.keys(Bt);function Fr(t){return typeof t=="number"&&t>=1&&t<=25}function zi(t){return typeof t=="string"&&t.substring(t.length-Bt.Error.length)===Bt.Error}function Lt(t,e){Fr(t)?(this.name=kr[t],this.message=e||""):(this.message=t,this.name=zi(e)?e:Bt.Error),Error.captureStackTrace&&Error.captureStackTrace(this,Lt)}_r(Lt,!0);Object.defineProperties(Lt.prototype,{code:{enumerable:!0,get:function(){var t=kr.indexOf(this.name);return Fr(t)?t:0}}});var Mr={INDEX_SIZE_ERR:1,DOMSTRING_SIZE_ERR:2,HIERARCHY_REQUEST_ERR:3,WRONG_DOCUMENT_ERR:4,INVALID_CHARACTER_ERR:5,NO_DATA_ALLOWED_ERR:6,NO_MODIFICATION_ALLOWED_ERR:7,NOT_FOUND_ERR:8,NOT_SUPPORTED_ERR:9,INUSE_ATTRIBUTE_ERR:10,INVALID_STATE_ERR:11,SYNTAX_ERR:12,INVALID_MODIFICATION_ERR:13,NAMESPACE_ERR:14,INVALID_ACCESS_ERR:15,VALIDATION_ERR:16,TYPE_MISMATCH_ERR:17,SECURITY_ERR:18,NETWORK_ERR:19,ABORT_ERR:20,URL_MISMATCH_ERR:21,QUOTA_EXCEEDED_ERR:22,TIMEOUT_ERR:23,INVALID_NODE_TYPE_ERR:24,DATA_CLONE_ERR:25},jn=Object.entries(Mr);for(Nt=0;Nt<jn.length;Nt++)Or=jn[Nt][0],Lt[Or]=jn[Nt][1];var Or,Nt;function Hn(t,e){this.message=t,this.locator=e,Error.captureStackTrace&&Error.captureStackTrace(this,Hn)}_r(Hn);Ot.DOMException=Lt;Ot.DOMExceptionName=Bt;Ot.ExceptionCode=Mr;Ot.ParseError=Hn});var Jn=ne(F=>{"use strict";function Hr(t){try{typeof t!="function"&&(t=RegExp);var e=new t("\u{1D306}","u").exec("\u{1D306}");return!!e&&e[0].length===2}catch{}return!1}var it=Hr();function $e(t){if(t.source[0]!=="[")throw new Error(t+" can not be used with chars");return t.source.slice(1,t.source.lastIndexOf("]"))}function rt(t,e){if(t.source[0]!=="[")throw new Error("/"+t.source+"/ can not be used with chars_without");if(!e||typeof e!="string")throw new Error(JSON.stringify(e)+" is not a valid search");if(t.source.indexOf(e)===-1)throw new Error('"'+e+'" is not is /'+t.source+"/");if(e==="-"&&t.source.indexOf(e)!==1)throw new Error('"'+e+'" is not at the first postion of /'+t.source+"/");return new RegExp(t.source.replace(e,""),it?"u":"")}function R(t){var e=this;return new RegExp(Array.prototype.slice.call(arguments).map(function(n){var r=typeof n=="string";if(r&&e===void 0&&n==="|")throw new Error("use regg instead of reg to wrap expressions with `|`!");return r?n:n.source}).join(""),it?"mu":"m")}function _(t){if(arguments.length===0)throw new Error("no parameters provided");return R.apply(_,["(?:"].concat(Array.prototype.slice.call(arguments),[")"]))}var Wi="\uFFFD",Ue=/[-\x09\x0A\x0D\x20-\x2C\x2E-\uD7FF\uE000-\uFFFD]/;it&&(Ue=R("[",$e(Ue),"\\u{10000}-\\u{10FFFF}","]"));var Gi=new RegExp("[^"+$e(Ue)+"]",it?"u":""),zn=/[\x20\x09\x0D\x0A]/,Yi=$e(zn),z=R(zn,"+"),K=R(zn,"*"),kt=/[:_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;it&&(kt=R("[",$e(kt),"\\u{10000}-\\u{10FFFF}","]"));var Ki=$e(kt),Wn=R("[",Ki,$e(/[-.0-9\xB7]/),$e(/[\u0300-\u036F\u203F-\u2040]/),"]"),we=R(kt,Wn,"*"),Pr=R(Wn,"+"),Ji=R("&",we,";"),Xi=_(/&#[0-9]+;|&#x[0-9a-fA-F]+;/),Ft=_(Ji,"|",Xi),Mt=R("%",we,";"),Gn=_(R('"',_(/[^%&"]/,"|",Mt,"|",Ft),"*",'"'),"|",R("'",_(/[^%&']/,"|",Mt,"|",Ft),"*","'")),Qi=_('"',_(/[^<&"]/,"|",Ft),"*",'"',"|","'",_(/[^<&']/,"|",Ft),"*","'"),Zi=rt(kt,":"),ea=rt(Wn,":"),Rr=R(Zi,ea,"*"),Pt=R(Rr,_(":",Rr),"?"),ta=R("^",Pt,"$"),na=R("(",Pt,")"),ot=_(/"[^"]*"|'[^']*'/),ra=R(/^<\?/,"(",we,")",_(z,"(",Ue,"*?)"),"?",/\?>/),$r=/[\x20\x0D\x0Aa-zA-Z0-9-'()+,./:=?;!*#@$_%]/,Rt=_('"',$r,'*"',"|","'",rt($r,"'"),"*'"),Vr="<!--",zr="-->",oa=R(Vr,_(rt(Ue,"-"),"|",R("-",rt(Ue,"-"))),"*",zr),Ur="#PCDATA",ia=_(R(/\(/,K,Ur,_(K,/\|/,K,Pt),"*",K,/\)\*/),"|",R(/\(/,K,Ur,K,/\)/)),aa=/[?*+]?/,sa=R(/\([^>]+\)/,aa),ca=_("EMPTY","|","ANY","|",ia,"|",sa),la="<!ELEMENT",ua=R(la,z,_(Pt,"|",Mt),z,_(ca,"|",Mt),K,">"),da=R("NOTATION",z,/\(/,K,we,_(K,/\|/,K,we),"*",K,/\)/),pa=R(/\(/,K,Pr,_(K,/\|/,K,Pr),"*",K,/\)/),fa=_(da,"|",pa),ma=_(/CDATA|ID|IDREF|IDREFS|ENTITY|ENTITIES|NMTOKEN|NMTOKENS/,"|",fa),ha=_(/#REQUIRED|#IMPLIED/,"|",_(_("#FIXED",z),"?",Qi)),ga=_(z,we,z,ma,z,ha),ba="<!ATTLIST",ya=R(ba,z,we,ga,"*",K,">"),Vn="about:legacy-compat",va=_('"'+Vn+'"',"|","'"+Vn+"'"),Yn="SYSTEM",nn="PUBLIC",rn=_(_(Yn,z,ot),"|",_(nn,z,Rt,z,ot)),wa=R("^",_(_(Yn,z,"(?<SystemLiteralOnly>",ot,")"),"|",_(nn,z,"(?<PubidLiteral>",Rt,")",z,"(?<SystemLiteral>",ot,")"))),Ea=R("^",Rt,"$"),Da=R("^",ot,"$"),Ca=_(z,"NDATA",z,we),Aa=_(Gn,"|",_(rn,Ca,"?")),Wr="<!ENTITY",xa=R(Wr,z,we,z,Aa,K,">"),Ta=_(Gn,"|",rn),Sa=R(Wr,z,"%",z,we,z,Ta,K,">"),Ia=_(xa,"|",Sa),Na=R(nn,z,Rt),Ba=R("<!NOTATION",z,we,z,_(rn,"|",Na),K,">"),Kn=R(K,"=",K),qr=/1[.]\d+/,La=R(z,"version",Kn,_("'",qr,"'","|",'"',qr,'"')),jr=/[A-Za-z][-A-Za-z0-9._]*/,Oa=_(z,"encoding",Kn,_('"',jr,'"',"|","'",jr,"'")),_a=_(z,"standalone",Kn,_("'",_("yes","|","no"),"'","|",'"',_("yes","|","no"),'"')),ka=R(/^<\?xml/,La,Oa,"?",_a,"?",K,/\?>/),Fa="<!DOCTYPE",Ma="<![CDATA[",Pa="]]>",Ra=/<!\[CDATA\[/,$a=/\]\]>/,Ua=R(Ue,"*?",$a),qa=R(Ra,Ua);F.chars=$e;F.chars_without=rt;F.detectUnicodeSupport=Hr;F.reg=R;F.regg=_;F.ABOUT_LEGACY_COMPAT=Vn;F.ABOUT_LEGACY_COMPAT_SystemLiteral=va;F.AttlistDecl=ya;F.CDATA_START=Ma;F.CDATA_END=Pa;F.CDSect=qa;F.Char=Ue;F.Comment=oa;F.COMMENT_START=Vr;F.COMMENT_END=zr;F.DOCTYPE_DECL_START=Fa;F.elementdecl=ua;F.EntityDecl=Ia;F.EntityValue=Gn;F.ExternalID=rn;F.ExternalID_match=wa;F.Name=we;F.NotationDecl=Ba;F.Reference=Ft;F.PEReference=Mt;F.PI=ra;F.PUBLIC=nn;F.PubidLiteral=Rt;F.PubidLiteral_match=Ea;F.QName=Pt;F.QName_exact=ta;F.QName_group=na;F.S=z;F.SChar_s=Yi;F.S_OPT=K;F.SYSTEM=Yn;F.SystemLiteral=ot;F.SystemLiteral_match=Da;F.InvalidChar=Gi;F.UNICODE_REPLACEMENT_CHARACTER=Wi;F.UNICODE_SUPPORT=it;F.XMLDecl=ka});var or=ne(X=>{"use strict";var Ce=Ke(),Ne=Ce.find,ja=Ce.hasDefaultHTMLNamespace,st=Ce.hasOwn,Ha=Ce.isHTMLMimeType,Va=Ce.isHTMLRawTextElement,za=Ce.isHTMLVoidElement,$t=Ce.MIME_TYPE,Be=Ce.NAMESPACE,ce=Symbol(),Zr=_t(),N=Zr.DOMException,Ee=Zr.DOMExceptionName,ie=Jn();function de(t){if(t!==ce)throw new TypeError("Illegal constructor")}function Wa(t){return t!==""}function Ga(t){return t?t.split(/[\t\n\f\r ]+/).filter(Wa):[]}function Ya(t,e){return st(t,e)||(t[e]=!0),t}function Gr(t){if(!t)return[];var e=Ga(t);return Object.keys(e.reduce(Ya,{}))}function Ka(t){return function(e){return t&&t.indexOf(e)!==-1}}function eo(t){if(!ie.QName_exact.test(t))throw new N(N.INVALID_CHARACTER_ERR,'invalid character in qualified name "'+t+'"')}function Qn(t,e){eo(e),t=t||null;var n=null,r=e;if(e.indexOf(":")>=0){var o=e.split(":");n=o[0],r=o[1]}if(n!==null&&t===null)throw new N(N.NAMESPACE_ERR,"prefix is non-null and namespace is null");if(n==="xml"&&t!==Ce.NAMESPACE.XML)throw new N(N.NAMESPACE_ERR,'prefix is "xml" and namespace is not the XML namespace');if((n==="xmlns"||e==="xmlns")&&t!==Ce.NAMESPACE.XMLNS)throw new N(N.NAMESPACE_ERR,'either qualifiedName or prefix is "xmlns" and namespace is not the XMLNS namespace');if(t===Ce.NAMESPACE.XMLNS&&n!=="xmlns"&&e!=="xmlns")throw new N(N.NAMESPACE_ERR,'namespace is the XMLNS namespace and neither qualifiedName nor prefix is "xmlns"');return[t,n,r]}function ut(t,e){for(var n in t)st(t,n)&&(e[n]=t[n])}function pe(t,e){var n=t.prototype;if(!(n instanceof e)){let r=function(){};r.prototype=e.prototype,r=new r,ut(n,r),t.prototype=n=r}n.constructor!=t&&(typeof t!="function"&&console.error("unknown Class:"+t),n.constructor=t)}var fe={},De=fe.ELEMENT_NODE=1,ct=fe.ATTRIBUTE_NODE=2,sn=fe.TEXT_NODE=3,to=fe.CDATA_SECTION_NODE=4,no=fe.ENTITY_REFERENCE_NODE=5,Ja=fe.ENTITY_NODE=6,Zn=fe.PROCESSING_INSTRUCTION_NODE=7,er=fe.COMMENT_NODE=8,at=fe.DOCUMENT_NODE=9,ro=fe.DOCUMENT_TYPE_NODE=10,qe=fe.DOCUMENT_FRAGMENT_NODE=11,Xa=fe.NOTATION_NODE=12,J=Ce.freeze({DOCUMENT_POSITION_DISCONNECTED:1,DOCUMENT_POSITION_PRECEDING:2,DOCUMENT_POSITION_FOLLOWING:4,DOCUMENT_POSITION_CONTAINS:8,DOCUMENT_POSITION_CONTAINED_BY:16,DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:32});function oo(t,e){if(e.length<t.length)return oo(e,t);var n=null;for(var r in t){if(t[r]!==e[r])return n;n=t[r]}return n}function Yr(t){return t.guid||(t.guid=Math.random()),t.guid}function ee(){}ee.prototype={length:0,item:function(t){return t>=0&&t<this.length?this[t]:null},toString:function(t){var e;typeof t=="function"?e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:t}:t?e={requireWellFormed:!!t.requireWellFormed,splitCDATASections:t.splitCDATASections!==!1,nodeFilter:t.nodeFilter||null}:e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:null};for(var n=[],r=0;r<this.length;r++)rr(this[r],n,null,e);return n.join("")},filter:function(t){return Array.prototype.filter.call(this,t)},indexOf:function(t){return Array.prototype.indexOf.call(this,t)}};ee.prototype[Symbol.iterator]=function(){var t=this,e=0;return{next:function(){return e<t.length?{value:t[e++],done:!1}:{done:!0}},return:function(){return{done:!0}}}};function Ie(t,e){this._node=t,this._refresh=e,ln(this)}function ln(t){var e=t._node._inc||t._node.ownerDocument._inc;if(t._inc!==e){var n=t._refresh(t._node);if(bo(t,"length",n.length),!t.$$length||n.length<t.$$length)for(var r=n.length;r in t;r++)st(t,r)&&delete t[r];ut(n,t),t._inc=e}}Ie.prototype.item=function(t){return ln(this),this[t]||null};pe(Ie,ee);function lt(){}function io(t,e){for(var n=0;n<t.length;){if(t[n]===e)return n;n++}}function Qa(t,e,n,r){if(r?e[io(e,r)]=n:(e[e.length]=n,e.length++),t){n.ownerElement=t;var o=t.ownerDocument;o&&(r&&co(o,t,r),Za(o,t,n))}}function Kr(t,e,n){var r=io(e,n);if(r>=0){for(var o=e.length-1;r<=o;)e[r]=e[++r];if(e.length=o,t){var i=t.ownerDocument;i&&co(i,t,n),n.ownerElement=null}}}lt.prototype={length:0,item:ee.prototype.item,getNamedItem:function(t){this._ownerElement&&this._ownerElement._isInHTMLDocumentAndNamespace()&&(t=t.toLowerCase());for(var e=0;e<this.length;){var n=this[e];if(n.nodeName===t)return n;e++}return null},setNamedItem:function(t){var e=t.ownerElement;if(e&&e!==this._ownerElement)throw new N(N.INUSE_ATTRIBUTE_ERR);var n=this.getNamedItemNS(t.namespaceURI,t.localName);return n===t?t:(Qa(this._ownerElement,this,t,n),n)},setNamedItemNS:function(t){return this.setNamedItem(t)},removeNamedItem:function(t){var e=this.getNamedItem(t);if(!e)throw new N(N.NOT_FOUND_ERR,t);return Kr(this._ownerElement,this,e),e},removeNamedItemNS:function(t,e){var n=this.getNamedItemNS(t,e);if(!n)throw new N(N.NOT_FOUND_ERR,t?t+" : "+e:e);return Kr(this._ownerElement,this,n),n},getNamedItemNS:function(t,e){t||(t=null);for(var n=0;n<this.length;){var r=this[n];if(r.localName===e&&r.namespaceURI===t)return r;n++}return null}};lt.prototype[Symbol.iterator]=function(){var t=this,e=0;return{next:function(){return e<t.length?{value:t[e++],done:!1}:{done:!0}},return:function(){return{done:!0}}}};function ao(){}ao.prototype={hasFeature:function(t,e){return!0},createDocument:function(t,e,n){var r=$t.XML_APPLICATION;t===Be.HTML?r=$t.XML_XHTML_APPLICATION:t===Be.SVG&&(r=$t.XML_SVG_IMAGE);var o=new Me(ce,{contentType:r});if(o.implementation=this,o.childNodes=new ee,o.doctype=n||null,n&&o.appendChild(n),e){var i=o.createElementNS(t,e);o.appendChild(i)}return o},createDocumentType:function(t,e,n,r){eo(t);var o=new pn(ce);return o.name=t,o.nodeName=t,o.publicId=e||"",o.systemId=n||"",o.internalSubset=r||"",o.childNodes=new ee,o},createHTMLDocument:function(t){var e=new Me(ce,{contentType:$t.HTML});if(e.implementation=this,e.childNodes=new ee,t!==!1){e.doctype=this.createDocumentType("html"),e.doctype.ownerDocument=e,e.appendChild(e.doctype);var n=e.createElement("html");e.appendChild(n);var r=e.createElement("head");if(n.appendChild(r),typeof t=="string"){var o=e.createElement("title");o.appendChild(e.createTextNode(t)),r.appendChild(o)}n.appendChild(e.createElement("body"))}return e}};function j(t){de(t)}j.prototype={firstChild:null,lastChild:null,previousSibling:null,nextSibling:null,parentNode:null,get parentElement(){return this.parentNode&&this.parentNode.nodeType===this.ELEMENT_NODE?this.parentNode:null},childNodes:null,ownerDocument:null,nodeValue:null,namespaceURI:null,prefix:null,localName:null,baseURI:"about:blank",get isConnected(){var t=this.getRootNode();return t&&t.nodeType===t.DOCUMENT_NODE},contains:function(t){if(!t)return!1;var e=t;do{if(this===e)return!0;e=e.parentNode}while(e);return!1},getRootNode:function(t){var e=this;do{if(!e.parentNode)return e;e=e.parentNode}while(e)},isEqualNode:function(t){if(!t)return!1;for(var e=[{node:this,other:t}];e.length>0;){var n=e.pop(),r=n.node,o=n.other;if(r.nodeType!==o.nodeType)return!1;switch(r.nodeType){case r.DOCUMENT_TYPE_NODE:if(r.name!==o.name||r.publicId!==o.publicId||r.systemId!==o.systemId)return!1;break;case r.ELEMENT_NODE:if(r.namespaceURI!==o.namespaceURI||r.prefix!==o.prefix||r.localName!==o.localName||r.attributes.length!==o.attributes.length)return!1;for(var i=0;i<r.attributes.length;i++){var a=r.attributes.item(i),c=o.getAttributeNodeNS(a.namespaceURI,a.localName);if(!c)return!1;e.push({node:a,other:c})}break;case r.ATTRIBUTE_NODE:if(r.namespaceURI!==o.namespaceURI||r.localName!==o.localName||r.value!==o.value)return!1;break;case r.PROCESSING_INSTRUCTION_NODE:if(r.target!==o.target||r.data!==o.data)return!1;break;case r.TEXT_NODE:case r.CDATA_SECTION_NODE:case r.COMMENT_NODE:if(r.data!==o.data)return!1;break}if(r.childNodes.length!==o.childNodes.length)return!1;for(var i=r.childNodes.length-1;i>=0;i--)e.push({node:r.childNodes[i],other:o.childNodes[i]})}return!0},isSameNode:function(t){return this===t},insertBefore:function(t,e){return cn(this,t,e)},replaceChild:function(t,e){cn(this,t,e,fo),e&&this.removeChild(e)},removeChild:function(t){return uo(this,t)},appendChild:function(t){return this.insertBefore(t,null)},hasChildNodes:function(){return this.firstChild!=null},cloneNode:function(t){return go(this.ownerDocument||this,this,t)},normalize:function(){ae(this,null,{enter:function(t){for(var e=t.firstChild;e;){var n=e.nextSibling;n!==null&&n.nodeType===sn&&e.nodeType===sn?(t.removeChild(n),e.appendData(n.data)):e=n}return!0}})},isSupported:function(t,e){return this.ownerDocument.implementation.hasFeature(t,e)},lookupPrefix:function(t){for(var e=this;e;){var n=e._nsMap;if(n){for(var r in n)if(st(n,r)&&n[r]===t)return r}e=e.nodeType==ct?e.ownerDocument:e.parentNode}return null},lookupNamespaceURI:function(t){for(var e=this;e;){var n=e._nsMap;if(n&&st(n,t))return n[t];e=e.nodeType==ct?e.ownerDocument:e.parentNode}return null},isDefaultNamespace:function(t){var e=this.lookupPrefix(t);return e==null},compareDocumentPosition:function(t){if(this===t)return 0;var e=t,n=this,r=null,o=null;if(e instanceof Je&&(r=e,e=r.ownerElement),n instanceof Je&&(o=n,n=o.ownerElement,r&&e&&n===e))for(var i=0,a;a=n.attributes[i];i++){if(a===r)return J.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC+J.DOCUMENT_POSITION_PRECEDING;if(a===o)return J.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC+J.DOCUMENT_POSITION_FOLLOWING}if(!e||!n||n.ownerDocument!==e.ownerDocument)return J.DOCUMENT_POSITION_DISCONNECTED+J.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC+(Yr(n.ownerDocument)>Yr(e.ownerDocument)?J.DOCUMENT_POSITION_FOLLOWING:J.DOCUMENT_POSITION_PRECEDING);if(o&&e===n)return J.DOCUMENT_POSITION_CONTAINS+J.DOCUMENT_POSITION_PRECEDING;if(r&&e===n)return J.DOCUMENT_POSITION_CONTAINED_BY+J.DOCUMENT_POSITION_FOLLOWING;for(var c=[],u=e.parentNode;u;){if(!o&&u===n)return J.DOCUMENT_POSITION_CONTAINED_BY+J.DOCUMENT_POSITION_FOLLOWING;c.push(u),u=u.parentNode}c.reverse();for(var s=[],m=n.parentNode;m;){if(!r&&m===e)return J.DOCUMENT_POSITION_CONTAINS+J.DOCUMENT_POSITION_PRECEDING;s.push(m),m=m.parentNode}s.reverse();var h=oo(c,s);for(var g in h.childNodes){var l=h.childNodes[g];if(l===n)return J.DOCUMENT_POSITION_FOLLOWING;if(l===e)return J.DOCUMENT_POSITION_PRECEDING;if(s.indexOf(l)>=0)return J.DOCUMENT_POSITION_FOLLOWING;if(c.indexOf(l)>=0)return J.DOCUMENT_POSITION_PRECEDING}return 0}};function so(t){return t=="<"&&"&lt;"||t==">"&&"&gt;"||t=="&"&&"&amp;"||t=='"'&&"&quot;"||"&#"+t.charCodeAt()+";"}ut(fe,j);ut(fe,j.prototype);ut(J,j);ut(J,j.prototype);function an(t,e){ae(t,null,{enter:function(n){return e(n)?ae.STOP:!0}})}function ae(t,e,n){for(var r=[{node:t,context:e,phase:ae.ENTER}];r.length>0;){var o=r.pop();if(o.phase===ae.ENTER){var i=n.enter(o.node,o.context);if(i===ae.STOP)return ae.STOP;if(r.push({node:o.node,context:i,phase:ae.EXIT}),i==null)continue;for(var a=o.node.lastChild;a;)r.push({node:a,context:i,phase:ae.ENTER}),a=a.previousSibling}else n.exit&&n.exit(o.node,o.context)}}ae.STOP=Symbol("walkDOM.STOP");ae.ENTER=0;ae.EXIT=1;function Me(t,e){de(t);var n=e||{};this.ownerDocument=this,this.contentType=n.contentType||$t.XML_APPLICATION,this.type=Ha(this.contentType)?"html":"xml"}function Za(t,e,n){t&&t._inc++;var r=n.namespaceURI;r===Be.XMLNS&&(e._nsMap[n.prefix?n.localName:""]=n.value)}function co(t,e,n,r){t&&t._inc++;var o=n.namespaceURI;o===Be.XMLNS&&delete e._nsMap[n.prefix?n.localName:""]}function lo(t,e,n){if(t&&t._inc){t._inc++;var r=e.childNodes;if(n&&!n.nextSibling)r[r.length++]=n;else{for(var o=e.firstChild,i=0;o;)r[i++]=o,o=o.nextSibling;r.length=i,delete r[r.length]}}}function uo(t,e){if(t!==e.parentNode)throw new N(N.NOT_FOUND_ERR,"child's parent is not parent");var n=e.previousSibling,r=e.nextSibling;return n?n.nextSibling=r:t.firstChild=r,r?r.previousSibling=n:t.lastChild=n,lo(t.ownerDocument,t),e.parentNode=null,e.previousSibling=null,e.nextSibling=null,e}function es(t){return t&&(t.nodeType===j.DOCUMENT_NODE||t.nodeType===j.DOCUMENT_FRAGMENT_NODE||t.nodeType===j.ELEMENT_NODE)}function ts(t){return t&&(t.nodeType===j.CDATA_SECTION_NODE||t.nodeType===j.COMMENT_NODE||t.nodeType===j.DOCUMENT_FRAGMENT_NODE||t.nodeType===j.DOCUMENT_TYPE_NODE||t.nodeType===j.ELEMENT_NODE||t.nodeType===j.PROCESSING_INSTRUCTION_NODE||t.nodeType===j.TEXT_NODE)}function je(t){return t&&t.nodeType===j.DOCUMENT_TYPE_NODE}function Fe(t){return t&&t.nodeType===j.ELEMENT_NODE}function po(t){return t&&t.nodeType===j.TEXT_NODE}function Jr(t,e){var n=t.childNodes||[];if(Ne(n,Fe)||je(e))return!1;var r=Ne(n,je);return!(e&&r&&n.indexOf(r)>n.indexOf(e))}function Xr(t,e){var n=t.childNodes||[];function r(i){return Fe(i)&&i!==e}if(Ne(n,r))return!1;var o=Ne(n,je);return!(e&&o&&n.indexOf(o)>n.indexOf(e))}function ns(t,e,n){if(!es(t))throw new N(N.HIERARCHY_REQUEST_ERR,"Unexpected parent node type "+t.nodeType);if(n&&n.parentNode!==t)throw new N(N.NOT_FOUND_ERR,"child not in parent");if(!ts(e)||je(e)&&t.nodeType!==j.DOCUMENT_NODE)throw new N(N.HIERARCHY_REQUEST_ERR,"Unexpected node type "+e.nodeType+" for parent node type "+t.nodeType)}function rs(t,e,n){var r=t.childNodes||[],o=e.childNodes||[];if(e.nodeType===j.DOCUMENT_FRAGMENT_NODE){var i=o.filter(Fe);if(i.length>1||Ne(o,po))throw new N(N.HIERARCHY_REQUEST_ERR,"More than one element or text in fragment");if(i.length===1&&!Jr(t,n))throw new N(N.HIERARCHY_REQUEST_ERR,"Element in fragment can not be inserted before doctype")}if(Fe(e)&&!Jr(t,n))throw new N(N.HIERARCHY_REQUEST_ERR,"Only one element can be added and only after doctype");if(je(e)){if(Ne(r,je))throw new N(N.HIERARCHY_REQUEST_ERR,"Only one doctype is allowed");var a=Ne(r,Fe);if(n&&r.indexOf(a)<r.indexOf(n))throw new N(N.HIERARCHY_REQUEST_ERR,"Doctype can only be inserted before an element");if(!n&&a)throw new N(N.HIERARCHY_REQUEST_ERR,"Doctype can not be appended since element is present")}}function fo(t,e,n){var r=t.childNodes||[],o=e.childNodes||[];if(e.nodeType===j.DOCUMENT_FRAGMENT_NODE){var i=o.filter(Fe);if(i.length>1||Ne(o,po))throw new N(N.HIERARCHY_REQUEST_ERR,"More than one element or text in fragment");if(i.length===1&&!Xr(t,n))throw new N(N.HIERARCHY_REQUEST_ERR,"Element in fragment can not be inserted before doctype")}if(Fe(e)&&!Xr(t,n))throw new N(N.HIERARCHY_REQUEST_ERR,"Only one element can be added and only after doctype");if(je(e)){if(Ne(r,function(u){return je(u)&&u!==n}))throw new N(N.HIERARCHY_REQUEST_ERR,"Only one doctype is allowed");var a=Ne(r,Fe);if(n&&r.indexOf(a)<r.indexOf(n))throw new N(N.HIERARCHY_REQUEST_ERR,"Doctype can only be inserted before an element")}}function cn(t,e,n,r){ns(t,e,n),t.nodeType===j.DOCUMENT_NODE&&(r||rs)(t,e,n);var o=e.parentNode;if(o&&o.removeChild(e),e.nodeType===qe){var i=e.firstChild;if(i==null)return e;var a=e.lastChild}else i=a=e;var c=n?n.previousSibling:t.lastChild;i.previousSibling=c,a.nextSibling=n,c?c.nextSibling=i:t.firstChild=i,n==null?t.lastChild=a:n.previousSibling=a;do i.parentNode=t;while(i!==a&&(i=i.nextSibling));return lo(t.ownerDocument||t,t,e),e.nodeType==qe&&(e.firstChild=e.lastChild=null),e}Me.prototype={implementation:null,nodeName:"#document",nodeType:at,doctype:null,documentElement:null,_inc:1,insertBefore:function(t,e){if(t.nodeType===qe){for(var n=t.firstChild;n;){var r=n.nextSibling;this.insertBefore(n,e),n=r}return t}return cn(this,t,e),t.ownerDocument=this,this.documentElement===null&&t.nodeType===De&&(this.documentElement=t),t},removeChild:function(t){var e=uo(this,t);return e===this.documentElement&&(this.documentElement=null),e},replaceChild:function(t,e){cn(this,t,e,fo),t.ownerDocument=this,e&&this.removeChild(e),Fe(t)&&(this.documentElement=t)},importNode:function(t,e){return os(this,t,e)},getElementById:function(t){var e=null;return an(this.documentElement,function(n){if(n.nodeType==De&&n.getAttribute("id")==t)return e=n,!0}),e},createElement:function(t){var e=new Pe(ce);e.ownerDocument=this,this.type==="html"&&(t=t.toLowerCase()),ja(this.contentType)&&(e.namespaceURI=Be.HTML),e.nodeName=t,e.tagName=t,e.localName=t,e.childNodes=new ee;var n=e.attributes=new lt;return n._ownerElement=e,e},createDocumentFragment:function(){var t=new pt(ce);return t.ownerDocument=this,t.childNodes=new ee,t},createTextNode:function(t){var e=new Ut(ce);return e.ownerDocument=this,e.childNodes=new ee,e.appendData(t),e},createComment:function(t){var e=new un(ce);return e.ownerDocument=this,e.childNodes=new ee,e.appendData(t),e},createCDATASection:function(t){if(t.indexOf("]]>")!==-1)throw new N(N.INVALID_CHARACTER_ERR,'data contains "]]>"');var e=new dn(ce);return e.ownerDocument=this,e.childNodes=new ee,e.appendData(t),e},createProcessingInstruction:function(t,e){var n=new mn(ce);return n.ownerDocument=this,n.childNodes=new ee,n.nodeName=n.target=t,n.nodeValue=n.data=e,n},createAttribute:function(t){if(!ie.QName_exact.test(t))throw new N(N.INVALID_CHARACTER_ERR,'invalid character in name "'+t+'"');return this.type==="html"&&(t=t.toLowerCase()),this._createAttribute(t)},_createAttribute:function(t){var e=new Je(ce);return e.ownerDocument=this,e.childNodes=new ee,e.name=t,e.nodeName=t,e.localName=t,e.specified=!0,e},createEntityReference:function(t){if(!ie.Name.test(t))throw new N(N.INVALID_CHARACTER_ERR,'not a valid xml name "'+t+'"');if(this.type==="html")throw new N("document is an html document",Ee.NotSupportedError);var e=new fn(ce);return e.ownerDocument=this,e.childNodes=new ee,e.nodeName=t,e},createElementNS:function(t,e){var n=Qn(t,e),r=new Pe(ce),o=r.attributes=new lt;return r.childNodes=new ee,r.ownerDocument=this,r.nodeName=e,r.tagName=e,r.namespaceURI=n[0],r.prefix=n[1],r.localName=n[2],o._ownerElement=r,r},createAttributeNS:function(t,e){var n=Qn(t,e),r=new Je(ce);return r.ownerDocument=this,r.childNodes=new ee,r.nodeName=e,r.name=e,r.specified=!0,r.namespaceURI=n[0],r.prefix=n[1],r.localName=n[2],r}};pe(Me,j);function Pe(t){de(t),this._nsMap=Object.create(null)}Pe.prototype={nodeType:De,attributes:null,getQualifiedName:function(){return this.prefix?this.prefix+":"+this.localName:this.localName},_isInHTMLDocumentAndNamespace:function(){return this.ownerDocument.type==="html"&&this.namespaceURI===Be.HTML},hasAttributes:function(){return!!(this.attributes&&this.attributes.length)},hasAttribute:function(t){return!!this.getAttributeNode(t)},getAttribute:function(t){var e=this.getAttributeNode(t);return e?e.value:null},getAttributeNode:function(t){return this._isInHTMLDocumentAndNamespace()&&(t=t.toLowerCase()),this.attributes.getNamedItem(t)},setAttribute:function(t,e){this._isInHTMLDocumentAndNamespace()&&(t=t.toLowerCase());var n=this.getAttributeNode(t);n?n.value=n.nodeValue=""+e:(n=this.ownerDocument._createAttribute(t),n.value=n.nodeValue=""+e,this.setAttributeNode(n))},removeAttribute:function(t){var e=this.getAttributeNode(t);e&&this.removeAttributeNode(e)},setAttributeNode:function(t){return this.attributes.setNamedItem(t)},setAttributeNodeNS:function(t){return this.attributes.setNamedItemNS(t)},removeAttributeNode:function(t){return this.attributes.removeNamedItem(t.nodeName)},removeAttributeNS:function(t,e){var n=this.getAttributeNodeNS(t,e);n&&this.removeAttributeNode(n)},hasAttributeNS:function(t,e){return this.getAttributeNodeNS(t,e)!=null},getAttributeNS:function(t,e){var n=this.getAttributeNodeNS(t,e);return n?n.value:null},setAttributeNS:function(t,e,n){var r=Qn(t,e),o=r[2],i=this.getAttributeNodeNS(t,o);i?i.value=i.nodeValue=""+n:(i=this.ownerDocument.createAttributeNS(t,e),i.value=i.nodeValue=""+n,this.setAttributeNode(i))},getAttributeNodeNS:function(t,e){return this.attributes.getNamedItemNS(t,e)},getElementsByClassName:function(t){var e=Gr(t);return new Ie(this,function(n){var r=[];return e.length>0&&an(n,function(o){if(o!==n&&o.nodeType===De){var i=o.getAttribute("class");if(i){var a=t===i;if(!a){var c=Gr(i);a=e.every(Ka(c))}a&&r.push(o)}}}),r})},getElementsByTagName:function(t){var e=(this.nodeType===at?this:this.ownerDocument).type==="html",n=t.toLowerCase();return new Ie(this,function(r){var o=[];return an(r,function(i){if(!(i===r||i.nodeType!==De))if(t==="*")o.push(i);else{var a=i.getQualifiedName(),c=e&&i.namespaceURI===Be.HTML?n:t;a===c&&o.push(i)}}),o})},getElementsByTagNameNS:function(t,e){return new Ie(this,function(n){var r=[];return an(n,function(o){o!==n&&o.nodeType===De&&(t==="*"||o.namespaceURI===t)&&(e==="*"||o.localName==e)&&r.push(o)}),r})}};Me.prototype.getElementsByClassName=Pe.prototype.getElementsByClassName;Me.prototype.getElementsByTagName=Pe.prototype.getElementsByTagName;Me.prototype.getElementsByTagNameNS=Pe.prototype.getElementsByTagNameNS;pe(Pe,j);function Je(t){de(t),this.namespaceURI=null,this.prefix=null,this.ownerElement=null}Je.prototype.nodeType=ct;pe(Je,j);function dt(t){de(t)}dt.prototype={data:"",substringData:function(t,e){return this.data.substring(t,t+e)},appendData:function(t){t=this.data+t,this.nodeValue=this.data=t,this.length=t.length},insertData:function(t,e){this.replaceData(t,0,e)},deleteData:function(t,e){this.replaceData(t,e,"")},replaceData:function(t,e,n){var r=this.data.substring(0,t),o=this.data.substring(t+e);n=r+n+o,this.nodeValue=this.data=n,this.length=n.length}};pe(dt,j);function Ut(t){de(t)}Ut.prototype={nodeName:"#text",nodeType:sn,splitText:function(t){var e=this.data,n=e.substring(t);e=e.substring(0,t),this.data=this.nodeValue=e,this.length=e.length;var r=this.ownerDocument.createTextNode(n);return this.parentNode&&this.parentNode.insertBefore(r,this.nextSibling),r}};pe(Ut,dt);function un(t){de(t)}un.prototype={nodeName:"#comment",nodeType:er};pe(un,dt);function dn(t){de(t)}dn.prototype={nodeName:"#cdata-section",nodeType:to};pe(dn,Ut);function pn(t){de(t)}pn.prototype.nodeType=ro;pe(pn,j);function tr(t){de(t)}tr.prototype.nodeType=Xa;pe(tr,j);function nr(t){de(t)}nr.prototype.nodeType=Ja;pe(nr,j);function fn(t){de(t)}fn.prototype.nodeType=no;pe(fn,j);function pt(t){de(t)}pt.prototype.nodeName="#document-fragment";pt.prototype.nodeType=qe;pe(pt,j);function mn(t){de(t)}mn.prototype.nodeType=Zn;pe(mn,dt);function mo(){}mo.prototype.serializeToString=function(t,e){return ho.call(t,e)};j.prototype.toString=ho;function ho(t){var e;typeof t=="function"?e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:t}:t!=null?e={requireWellFormed:!!t.requireWellFormed,splitCDATASections:t.splitCDATASections!==!1,nodeFilter:t.nodeFilter||null}:e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:null};var n=[],r=this.nodeType===at&&this.documentElement||this,o=r.prefix,i=r.namespaceURI;if(i&&o==null){var o=r.lookupPrefix(i);if(o==null)var a=[{namespace:i,prefix:null}]}return rr(this,n,a,e),n.join("")}function Qr(t,e,n){var r=t.prefix||"",o=t.namespaceURI;if(!o||r==="xml"&&o===Be.XML||o===Be.XMLNS)return!1;for(var i=n.length;i--;){var a=n[i];if(a.prefix===r)return a.namespace!==o}return!0}function on(t,e,n){t.push(" ",e,'="',n.replace(/[<>&"\t\n\r]/g,so),'"')}function rr(t,e,n,r){n||(n=[]);var o=r.nodeFilter,i=r.requireWellFormed,a=r.splitCDATASections,c=t.nodeType===at?t:t.ownerDocument,u=c.type==="html";ae(t,{ns:n},{enter:function(s,m){var h=m.ns;if(o)if(s=o(s),s){if(typeof s=="string")return e.push(s),null}else return null;switch(s.nodeType){case De:var g=s.attributes,l=g.length,p=s.tagName,d=p;if(!u&&!s.prefix&&s.namespaceURI){for(var y,v=0;v<g.length;v++)if(g.item(v).name==="xmlns"){y=g.item(v).value;break}if(!y)for(var w=h.length-1;w>=0;w--){var b=h[w];if(b.prefix===""&&b.namespace===s.namespaceURI){y=b.namespace;break}}if(y!==s.namespaceURI)for(var w=h.length-1;w>=0;w--){var b=h[w];if(b.namespace===s.namespaceURI){b.prefix&&(d=b.prefix+":"+p);break}}}e.push("<",d);for(var D=h.slice(),E=0;E<l;E++){var C=g.item(E);C.prefix=="xmlns"?D.push({prefix:C.localName,namespace:C.value}):C.nodeName=="xmlns"&&D.push({prefix:"",namespace:C.value})}for(var E=0;E<l;E++){var C=g.item(E);if(Qr(C,u,D)){var A=C.prefix||"",T=C.namespaceURI;on(e,A?"xmlns:"+A:"xmlns",T),D.push({prefix:A,namespace:T})}var I=o?o(C):C;I&&(typeof I=="string"?e.push(I):on(e,I.name,I.value))}if(p===d&&Qr(s,u,D)){var k=s.prefix||"",T=s.namespaceURI;on(e,k?"xmlns:"+k:"xmlns",T),D.push({prefix:k,namespace:T})}var q=!s.firstChild;if(q&&(u||s.namespaceURI===Be.HTML)&&(q=za(p)),q)return e.push("/>"),null;if(e.push(">"),u&&Va(p)){for(var x=s.firstChild;x;)x.data?e.push(x.data):rr(x,e,D.slice(),r),x=x.nextSibling;return e.push("</",d,">"),null}return{ns:D,tag:d};case at:case qe:if(i&&s.nodeType===at&&s.documentElement==null)throw new N("The Document has no documentElement",Ee.InvalidStateError);return{ns:h};case ct:return on(e,s.name,s.value),null;case sn:if(i&&ie.InvalidChar.test(s.data))throw new N("The Text node data contains characters outside the XML Char production",Ee.InvalidStateError);return e.push(s.data.replace(/[<&>]/g,so)),null;case to:if(i&&s.data.indexOf("]]>")!==-1)throw new N('The CDATASection data contains "]]>"',Ee.InvalidStateError);return a?e.push(ie.CDATA_START,s.data.replace(/]]>/g,"]]]]><![CDATA[>"),ie.CDATA_END):e.push(ie.CDATA_START,s.data,ie.CDATA_END),null;case er:if(i){if(ie.InvalidChar.test(s.data))throw new N("The comment node data contains characters outside the XML Char production",Ee.InvalidStateError);if(s.data.indexOf("--")!==-1||s.data[s.data.length-1]==="-")throw new N('The comment node data contains "--" or ends with "-"',Ee.InvalidStateError)}return e.push(ie.COMMENT_START,s.data,ie.COMMENT_END),null;case ro:var S=s.publicId,B=s.systemId;if(i){if(S&&!ie.PubidLiteral_match.test(S))throw new N("DocumentType publicId is not a valid PubidLiteral",Ee.InvalidStateError);if(B&&B!=="."&&!ie.SystemLiteral_match.test(B))throw new N("DocumentType systemId is not a valid SystemLiteral",Ee.InvalidStateError);if(s.internalSubset&&s.internalSubset.indexOf("]>")!==-1)throw new N('DocumentType internalSubset contains "]>"',Ee.InvalidStateError)}return e.push(ie.DOCTYPE_DECL_START," ",s.name),S?(e.push(" ",ie.PUBLIC," ",S),B&&B!=="."&&e.push(" ",B)):B&&B!=="."&&e.push(" ",ie.SYSTEM," ",B),s.internalSubset&&e.push(" [",s.internalSubset,"]"),e.push(">"),null;case Zn:if(i){if(s.target.indexOf(":")!==-1||s.target.toLowerCase()==="xml")throw new N("The ProcessingInstruction target is not well-formed",Ee.InvalidStateError);if(ie.InvalidChar.test(s.data))throw new N("The ProcessingInstruction data contains characters outside the XML Char production",Ee.InvalidStateError);if(s.data.indexOf("?>")!==-1)throw new N('The ProcessingInstruction data contains "?>"',Ee.InvalidStateError)}return e.push("<?",s.target," ",s.data,"?>"),null;case no:return e.push("&",s.nodeName,";"),null;default:return e.push("??",s.nodeName),null}},exit:function(s,m){m&&m.tag&&e.push("</",m.tag,">")}})}function os(t,e,n){var r;return ae(e,null,{enter:function(o,i){var a=o.cloneNode(!1);a.ownerDocument=t,a.parentNode=null,i===null?r=a:i.appendChild(a);var c=o.nodeType===ct||n;return c?a:null}}),r}function go(t,e,n){var r;return ae(e,null,{enter:function(o,i){var a=new o.constructor(ce);for(var c in o)if(st(o,c)){var u=o[c];typeof u!="object"&&u!=a[c]&&(a[c]=u)}o.childNodes&&(a.childNodes=new ee),a.ownerDocument=t;var s=n;switch(a.nodeType){case De:var m=o.attributes,h=a.attributes=new lt,g=m.length;h._ownerElement=a;for(var l=0;l<g;l++)a.setAttributeNode(go(t,m.item(l),!0));break;case ct:s=!0}return i!==null?i.appendChild(a):r=a,s?a:null}}),r}function bo(t,e,n){t[e]=n}function Xn(t){for(var e=[],n=t.firstChild;n;)n.nodeType===De&&e.push(n),n=n.nextSibling;return e}try{Object.defineProperty&&(Object.defineProperty(Ie.prototype,"length",{get:function(){return ln(this),this.$$length}}),Object.defineProperty(j.prototype,"textContent",{get:function(){if(this.nodeType===De||this.nodeType===qe){var t=[];return ae(this,null,{enter:function(e){if(e.nodeType===De||e.nodeType===qe)return!0;if(e.nodeType===Zn||e.nodeType===er)return null;t.push(e.nodeValue)}}),t.join("")}return this.nodeValue},set:function(t){switch(this.nodeType){case De:case qe:for(;this.firstChild;)this.removeChild(this.firstChild);(t||String(t))&&this.appendChild(this.ownerDocument.createTextNode(t));break;default:this.data=t,this.value=t,this.nodeValue=t}}}),Object.defineProperty(Pe.prototype,"children",{get:function(){return new Ie(this,Xn)}}),Object.defineProperty(Me.prototype,"children",{get:function(){return new Ie(this,Xn)}}),Object.defineProperty(pt.prototype,"children",{get:function(){return new Ie(this,Xn)}}),bo=function(t,e,n){t["$$"+e]=n})}catch{}X._updateLiveList=ln;X.Attr=Je;X.CDATASection=dn;X.CharacterData=dt;X.Comment=un;X.Document=Me;X.DocumentFragment=pt;X.DocumentType=pn;X.DOMImplementation=ao;X.Element=Pe;X.Entity=nr;X.EntityReference=fn;X.LiveNodeList=Ie;X.NamedNodeMap=lt;X.Node=j;X.NodeList=ee;X.Notation=tr;X.Text=Ut;X.ProcessingInstruction=mn;X.walkDOM=ae;X.XMLSerializer=mo});var vo=ne(qt=>{"use strict";var yo=Ke().freeze;qt.XML_ENTITIES=yo({amp:"&",apos:"'",gt:">",lt:"<",quot:'"'});qt.HTML_ENTITIES=yo({Aacute:"\xC1",aacute:"\xE1",Abreve:"\u0102",abreve:"\u0103",ac:"\u223E",acd:"\u223F",acE:"\u223E\u0333",Acirc:"\xC2",acirc:"\xE2",acute:"\xB4",Acy:"\u0410",acy:"\u0430",AElig:"\xC6",aelig:"\xE6",af:"\u2061",Afr:"\u{1D504}",afr:"\u{1D51E}",Agrave:"\xC0",agrave:"\xE0",alefsym:"\u2135",aleph:"\u2135",Alpha:"\u0391",alpha:"\u03B1",Amacr:"\u0100",amacr:"\u0101",amalg:"\u2A3F",AMP:"&",amp:"&",And:"\u2A53",and:"\u2227",andand:"\u2A55",andd:"\u2A5C",andslope:"\u2A58",andv:"\u2A5A",ang:"\u2220",ange:"\u29A4",angle:"\u2220",angmsd:"\u2221",angmsdaa:"\u29A8",angmsdab:"\u29A9",angmsdac:"\u29AA",angmsdad:"\u29AB",angmsdae:"\u29AC",angmsdaf:"\u29AD",angmsdag:"\u29AE",angmsdah:"\u29AF",angrt:"\u221F",angrtvb:"\u22BE",angrtvbd:"\u299D",angsph:"\u2222",angst:"\xC5",angzarr:"\u237C",Aogon:"\u0104",aogon:"\u0105",Aopf:"\u{1D538}",aopf:"\u{1D552}",ap:"\u2248",apacir:"\u2A6F",apE:"\u2A70",ape:"\u224A",apid:"\u224B",apos:"'",ApplyFunction:"\u2061",approx:"\u2248",approxeq:"\u224A",Aring:"\xC5",aring:"\xE5",Ascr:"\u{1D49C}",ascr:"\u{1D4B6}",Assign:"\u2254",ast:"*",asymp:"\u2248",asympeq:"\u224D",Atilde:"\xC3",atilde:"\xE3",Auml:"\xC4",auml:"\xE4",awconint:"\u2233",awint:"\u2A11",backcong:"\u224C",backepsilon:"\u03F6",backprime:"\u2035",backsim:"\u223D",backsimeq:"\u22CD",Backslash:"\u2216",Barv:"\u2AE7",barvee:"\u22BD",Barwed:"\u2306",barwed:"\u2305",barwedge:"\u2305",bbrk:"\u23B5",bbrktbrk:"\u23B6",bcong:"\u224C",Bcy:"\u0411",bcy:"\u0431",bdquo:"\u201E",becaus:"\u2235",Because:"\u2235",because:"\u2235",bemptyv:"\u29B0",bepsi:"\u03F6",bernou:"\u212C",Bernoullis:"\u212C",Beta:"\u0392",beta:"\u03B2",beth:"\u2136",between:"\u226C",Bfr:"\u{1D505}",bfr:"\u{1D51F}",bigcap:"\u22C2",bigcirc:"\u25EF",bigcup:"\u22C3",bigodot:"\u2A00",bigoplus:"\u2A01",bigotimes:"\u2A02",bigsqcup:"\u2A06",bigstar:"\u2605",bigtriangledown:"\u25BD",bigtriangleup:"\u25B3",biguplus:"\u2A04",bigvee:"\u22C1",bigwedge:"\u22C0",bkarow:"\u290D",blacklozenge:"\u29EB",blacksquare:"\u25AA",blacktriangle:"\u25B4",blacktriangledown:"\u25BE",blacktriangleleft:"\u25C2",blacktriangleright:"\u25B8",blank:"\u2423",blk12:"\u2592",blk14:"\u2591",blk34:"\u2593",block:"\u2588",bne:"=\u20E5",bnequiv:"\u2261\u20E5",bNot:"\u2AED",bnot:"\u2310",Bopf:"\u{1D539}",bopf:"\u{1D553}",bot:"\u22A5",bottom:"\u22A5",bowtie:"\u22C8",boxbox:"\u29C9",boxDL:"\u2557",boxDl:"\u2556",boxdL:"\u2555",boxdl:"\u2510",boxDR:"\u2554",boxDr:"\u2553",boxdR:"\u2552",boxdr:"\u250C",boxH:"\u2550",boxh:"\u2500",boxHD:"\u2566",boxHd:"\u2564",boxhD:"\u2565",boxhd:"\u252C",boxHU:"\u2569",boxHu:"\u2567",boxhU:"\u2568",boxhu:"\u2534",boxminus:"\u229F",boxplus:"\u229E",boxtimes:"\u22A0",boxUL:"\u255D",boxUl:"\u255C",boxuL:"\u255B",boxul:"\u2518",boxUR:"\u255A",boxUr:"\u2559",boxuR:"\u2558",boxur:"\u2514",boxV:"\u2551",boxv:"\u2502",boxVH:"\u256C",boxVh:"\u256B",boxvH:"\u256A",boxvh:"\u253C",boxVL:"\u2563",boxVl:"\u2562",boxvL:"\u2561",boxvl:"\u2524",boxVR:"\u2560",boxVr:"\u255F",boxvR:"\u255E",boxvr:"\u251C",bprime:"\u2035",Breve:"\u02D8",breve:"\u02D8",brvbar:"\xA6",Bscr:"\u212C",bscr:"\u{1D4B7}",bsemi:"\u204F",bsim:"\u223D",bsime:"\u22CD",bsol:"\\",bsolb:"\u29C5",bsolhsub:"\u27C8",bull:"\u2022",bullet:"\u2022",bump:"\u224E",bumpE:"\u2AAE",bumpe:"\u224F",Bumpeq:"\u224E",bumpeq:"\u224F",Cacute:"\u0106",cacute:"\u0107",Cap:"\u22D2",cap:"\u2229",capand:"\u2A44",capbrcup:"\u2A49",capcap:"\u2A4B",capcup:"\u2A47",capdot:"\u2A40",CapitalDifferentialD:"\u2145",caps:"\u2229\uFE00",caret:"\u2041",caron:"\u02C7",Cayleys:"\u212D",ccaps:"\u2A4D",Ccaron:"\u010C",ccaron:"\u010D",Ccedil:"\xC7",ccedil:"\xE7",Ccirc:"\u0108",ccirc:"\u0109",Cconint:"\u2230",ccups:"\u2A4C",ccupssm:"\u2A50",Cdot:"\u010A",cdot:"\u010B",cedil:"\xB8",Cedilla:"\xB8",cemptyv:"\u29B2",cent:"\xA2",CenterDot:"\xB7",centerdot:"\xB7",Cfr:"\u212D",cfr:"\u{1D520}",CHcy:"\u0427",chcy:"\u0447",check:"\u2713",checkmark:"\u2713",Chi:"\u03A7",chi:"\u03C7",cir:"\u25CB",circ:"\u02C6",circeq:"\u2257",circlearrowleft:"\u21BA",circlearrowright:"\u21BB",circledast:"\u229B",circledcirc:"\u229A",circleddash:"\u229D",CircleDot:"\u2299",circledR:"\xAE",circledS:"\u24C8",CircleMinus:"\u2296",CirclePlus:"\u2295",CircleTimes:"\u2297",cirE:"\u29C3",cire:"\u2257",cirfnint:"\u2A10",cirmid:"\u2AEF",cirscir:"\u29C2",ClockwiseContourIntegral:"\u2232",CloseCurlyDoubleQuote:"\u201D",CloseCurlyQuote:"\u2019",clubs:"\u2663",clubsuit:"\u2663",Colon:"\u2237",colon:":",Colone:"\u2A74",colone:"\u2254",coloneq:"\u2254",comma:",",commat:"@",comp:"\u2201",compfn:"\u2218",complement:"\u2201",complexes:"\u2102",cong:"\u2245",congdot:"\u2A6D",Congruent:"\u2261",Conint:"\u222F",conint:"\u222E",ContourIntegral:"\u222E",Copf:"\u2102",copf:"\u{1D554}",coprod:"\u2210",Coproduct:"\u2210",COPY:"\xA9",copy:"\xA9",copysr:"\u2117",CounterClockwiseContourIntegral:"\u2233",crarr:"\u21B5",Cross:"\u2A2F",cross:"\u2717",Cscr:"\u{1D49E}",cscr:"\u{1D4B8}",csub:"\u2ACF",csube:"\u2AD1",csup:"\u2AD0",csupe:"\u2AD2",ctdot:"\u22EF",cudarrl:"\u2938",cudarrr:"\u2935",cuepr:"\u22DE",cuesc:"\u22DF",cularr:"\u21B6",cularrp:"\u293D",Cup:"\u22D3",cup:"\u222A",cupbrcap:"\u2A48",CupCap:"\u224D",cupcap:"\u2A46",cupcup:"\u2A4A",cupdot:"\u228D",cupor:"\u2A45",cups:"\u222A\uFE00",curarr:"\u21B7",curarrm:"\u293C",curlyeqprec:"\u22DE",curlyeqsucc:"\u22DF",curlyvee:"\u22CE",curlywedge:"\u22CF",curren:"\xA4",curvearrowleft:"\u21B6",curvearrowright:"\u21B7",cuvee:"\u22CE",cuwed:"\u22CF",cwconint:"\u2232",cwint:"\u2231",cylcty:"\u232D",Dagger:"\u2021",dagger:"\u2020",daleth:"\u2138",Darr:"\u21A1",dArr:"\u21D3",darr:"\u2193",dash:"\u2010",Dashv:"\u2AE4",dashv:"\u22A3",dbkarow:"\u290F",dblac:"\u02DD",Dcaron:"\u010E",dcaron:"\u010F",Dcy:"\u0414",dcy:"\u0434",DD:"\u2145",dd:"\u2146",ddagger:"\u2021",ddarr:"\u21CA",DDotrahd:"\u2911",ddotseq:"\u2A77",deg:"\xB0",Del:"\u2207",Delta:"\u0394",delta:"\u03B4",demptyv:"\u29B1",dfisht:"\u297F",Dfr:"\u{1D507}",dfr:"\u{1D521}",dHar:"\u2965",dharl:"\u21C3",dharr:"\u21C2",DiacriticalAcute:"\xB4",DiacriticalDot:"\u02D9",DiacriticalDoubleAcute:"\u02DD",DiacriticalGrave:"`",DiacriticalTilde:"\u02DC",diam:"\u22C4",Diamond:"\u22C4",diamond:"\u22C4",diamondsuit:"\u2666",diams:"\u2666",die:"\xA8",DifferentialD:"\u2146",digamma:"\u03DD",disin:"\u22F2",div:"\xF7",divide:"\xF7",divideontimes:"\u22C7",divonx:"\u22C7",DJcy:"\u0402",djcy:"\u0452",dlcorn:"\u231E",dlcrop:"\u230D",dollar:"$",Dopf:"\u{1D53B}",dopf:"\u{1D555}",Dot:"\xA8",dot:"\u02D9",DotDot:"\u20DC",doteq:"\u2250",doteqdot:"\u2251",DotEqual:"\u2250",dotminus:"\u2238",dotplus:"\u2214",dotsquare:"\u22A1",doublebarwedge:"\u2306",DoubleContourIntegral:"\u222F",DoubleDot:"\xA8",DoubleDownArrow:"\u21D3",DoubleLeftArrow:"\u21D0",DoubleLeftRightArrow:"\u21D4",DoubleLeftTee:"\u2AE4",DoubleLongLeftArrow:"\u27F8",DoubleLongLeftRightArrow:"\u27FA",DoubleLongRightArrow:"\u27F9",DoubleRightArrow:"\u21D2",DoubleRightTee:"\u22A8",DoubleUpArrow:"\u21D1",DoubleUpDownArrow:"\u21D5",DoubleVerticalBar:"\u2225",DownArrow:"\u2193",Downarrow:"\u21D3",downarrow:"\u2193",DownArrowBar:"\u2913",DownArrowUpArrow:"\u21F5",DownBreve:"\u0311",downdownarrows:"\u21CA",downharpoonleft:"\u21C3",downharpoonright:"\u21C2",DownLeftRightVector:"\u2950",DownLeftTeeVector:"\u295E",DownLeftVector:"\u21BD",DownLeftVectorBar:"\u2956",DownRightTeeVector:"\u295F",DownRightVector:"\u21C1",DownRightVectorBar:"\u2957",DownTee:"\u22A4",DownTeeArrow:"\u21A7",drbkarow:"\u2910",drcorn:"\u231F",drcrop:"\u230C",Dscr:"\u{1D49F}",dscr:"\u{1D4B9}",DScy:"\u0405",dscy:"\u0455",dsol:"\u29F6",Dstrok:"\u0110",dstrok:"\u0111",dtdot:"\u22F1",dtri:"\u25BF",dtrif:"\u25BE",duarr:"\u21F5",duhar:"\u296F",dwangle:"\u29A6",DZcy:"\u040F",dzcy:"\u045F",dzigrarr:"\u27FF",Eacute:"\xC9",eacute:"\xE9",easter:"\u2A6E",Ecaron:"\u011A",ecaron:"\u011B",ecir:"\u2256",Ecirc:"\xCA",ecirc:"\xEA",ecolon:"\u2255",Ecy:"\u042D",ecy:"\u044D",eDDot:"\u2A77",Edot:"\u0116",eDot:"\u2251",edot:"\u0117",ee:"\u2147",efDot:"\u2252",Efr:"\u{1D508}",efr:"\u{1D522}",eg:"\u2A9A",Egrave:"\xC8",egrave:"\xE8",egs:"\u2A96",egsdot:"\u2A98",el:"\u2A99",Element:"\u2208",elinters:"\u23E7",ell:"\u2113",els:"\u2A95",elsdot:"\u2A97",Emacr:"\u0112",emacr:"\u0113",empty:"\u2205",emptyset:"\u2205",EmptySmallSquare:"\u25FB",emptyv:"\u2205",EmptyVerySmallSquare:"\u25AB",emsp:"\u2003",emsp13:"\u2004",emsp14:"\u2005",ENG:"\u014A",eng:"\u014B",ensp:"\u2002",Eogon:"\u0118",eogon:"\u0119",Eopf:"\u{1D53C}",eopf:"\u{1D556}",epar:"\u22D5",eparsl:"\u29E3",eplus:"\u2A71",epsi:"\u03B5",Epsilon:"\u0395",epsilon:"\u03B5",epsiv:"\u03F5",eqcirc:"\u2256",eqcolon:"\u2255",eqsim:"\u2242",eqslantgtr:"\u2A96",eqslantless:"\u2A95",Equal:"\u2A75",equals:"=",EqualTilde:"\u2242",equest:"\u225F",Equilibrium:"\u21CC",equiv:"\u2261",equivDD:"\u2A78",eqvparsl:"\u29E5",erarr:"\u2971",erDot:"\u2253",Escr:"\u2130",escr:"\u212F",esdot:"\u2250",Esim:"\u2A73",esim:"\u2242",Eta:"\u0397",eta:"\u03B7",ETH:"\xD0",eth:"\xF0",Euml:"\xCB",euml:"\xEB",euro:"\u20AC",excl:"!",exist:"\u2203",Exists:"\u2203",expectation:"\u2130",ExponentialE:"\u2147",exponentiale:"\u2147",fallingdotseq:"\u2252",Fcy:"\u0424",fcy:"\u0444",female:"\u2640",ffilig:"\uFB03",fflig:"\uFB00",ffllig:"\uFB04",Ffr:"\u{1D509}",ffr:"\u{1D523}",filig:"\uFB01",FilledSmallSquare:"\u25FC",FilledVerySmallSquare:"\u25AA",fjlig:"fj",flat:"\u266D",fllig:"\uFB02",fltns:"\u25B1",fnof:"\u0192",Fopf:"\u{1D53D}",fopf:"\u{1D557}",ForAll:"\u2200",forall:"\u2200",fork:"\u22D4",forkv:"\u2AD9",Fouriertrf:"\u2131",fpartint:"\u2A0D",frac12:"\xBD",frac13:"\u2153",frac14:"\xBC",frac15:"\u2155",frac16:"\u2159",frac18:"\u215B",frac23:"\u2154",frac25:"\u2156",frac34:"\xBE",frac35:"\u2157",frac38:"\u215C",frac45:"\u2158",frac56:"\u215A",frac58:"\u215D",frac78:"\u215E",frasl:"\u2044",frown:"\u2322",Fscr:"\u2131",fscr:"\u{1D4BB}",gacute:"\u01F5",Gamma:"\u0393",gamma:"\u03B3",Gammad:"\u03DC",gammad:"\u03DD",gap:"\u2A86",Gbreve:"\u011E",gbreve:"\u011F",Gcedil:"\u0122",Gcirc:"\u011C",gcirc:"\u011D",Gcy:"\u0413",gcy:"\u0433",Gdot:"\u0120",gdot:"\u0121",gE:"\u2267",ge:"\u2265",gEl:"\u2A8C",gel:"\u22DB",geq:"\u2265",geqq:"\u2267",geqslant:"\u2A7E",ges:"\u2A7E",gescc:"\u2AA9",gesdot:"\u2A80",gesdoto:"\u2A82",gesdotol:"\u2A84",gesl:"\u22DB\uFE00",gesles:"\u2A94",Gfr:"\u{1D50A}",gfr:"\u{1D524}",Gg:"\u22D9",gg:"\u226B",ggg:"\u22D9",gimel:"\u2137",GJcy:"\u0403",gjcy:"\u0453",gl:"\u2277",gla:"\u2AA5",glE:"\u2A92",glj:"\u2AA4",gnap:"\u2A8A",gnapprox:"\u2A8A",gnE:"\u2269",gne:"\u2A88",gneq:"\u2A88",gneqq:"\u2269",gnsim:"\u22E7",Gopf:"\u{1D53E}",gopf:"\u{1D558}",grave:"`",GreaterEqual:"\u2265",GreaterEqualLess:"\u22DB",GreaterFullEqual:"\u2267",GreaterGreater:"\u2AA2",GreaterLess:"\u2277",GreaterSlantEqual:"\u2A7E",GreaterTilde:"\u2273",Gscr:"\u{1D4A2}",gscr:"\u210A",gsim:"\u2273",gsime:"\u2A8E",gsiml:"\u2A90",Gt:"\u226B",GT:">",gt:">",gtcc:"\u2AA7",gtcir:"\u2A7A",gtdot:"\u22D7",gtlPar:"\u2995",gtquest:"\u2A7C",gtrapprox:"\u2A86",gtrarr:"\u2978",gtrdot:"\u22D7",gtreqless:"\u22DB",gtreqqless:"\u2A8C",gtrless:"\u2277",gtrsim:"\u2273",gvertneqq:"\u2269\uFE00",gvnE:"\u2269\uFE00",Hacek:"\u02C7",hairsp:"\u200A",half:"\xBD",hamilt:"\u210B",HARDcy:"\u042A",hardcy:"\u044A",hArr:"\u21D4",harr:"\u2194",harrcir:"\u2948",harrw:"\u21AD",Hat:"^",hbar:"\u210F",Hcirc:"\u0124",hcirc:"\u0125",hearts:"\u2665",heartsuit:"\u2665",hellip:"\u2026",hercon:"\u22B9",Hfr:"\u210C",hfr:"\u{1D525}",HilbertSpace:"\u210B",hksearow:"\u2925",hkswarow:"\u2926",hoarr:"\u21FF",homtht:"\u223B",hookleftarrow:"\u21A9",hookrightarrow:"\u21AA",Hopf:"\u210D",hopf:"\u{1D559}",horbar:"\u2015",HorizontalLine:"\u2500",Hscr:"\u210B",hscr:"\u{1D4BD}",hslash:"\u210F",Hstrok:"\u0126",hstrok:"\u0127",HumpDownHump:"\u224E",HumpEqual:"\u224F",hybull:"\u2043",hyphen:"\u2010",Iacute:"\xCD",iacute:"\xED",ic:"\u2063",Icirc:"\xCE",icirc:"\xEE",Icy:"\u0418",icy:"\u0438",Idot:"\u0130",IEcy:"\u0415",iecy:"\u0435",iexcl:"\xA1",iff:"\u21D4",Ifr:"\u2111",ifr:"\u{1D526}",Igrave:"\xCC",igrave:"\xEC",ii:"\u2148",iiiint:"\u2A0C",iiint:"\u222D",iinfin:"\u29DC",iiota:"\u2129",IJlig:"\u0132",ijlig:"\u0133",Im:"\u2111",Imacr:"\u012A",imacr:"\u012B",image:"\u2111",ImaginaryI:"\u2148",imagline:"\u2110",imagpart:"\u2111",imath:"\u0131",imof:"\u22B7",imped:"\u01B5",Implies:"\u21D2",in:"\u2208",incare:"\u2105",infin:"\u221E",infintie:"\u29DD",inodot:"\u0131",Int:"\u222C",int:"\u222B",intcal:"\u22BA",integers:"\u2124",Integral:"\u222B",intercal:"\u22BA",Intersection:"\u22C2",intlarhk:"\u2A17",intprod:"\u2A3C",InvisibleComma:"\u2063",InvisibleTimes:"\u2062",IOcy:"\u0401",iocy:"\u0451",Iogon:"\u012E",iogon:"\u012F",Iopf:"\u{1D540}",iopf:"\u{1D55A}",Iota:"\u0399",iota:"\u03B9",iprod:"\u2A3C",iquest:"\xBF",Iscr:"\u2110",iscr:"\u{1D4BE}",isin:"\u2208",isindot:"\u22F5",isinE:"\u22F9",isins:"\u22F4",isinsv:"\u22F3",isinv:"\u2208",it:"\u2062",Itilde:"\u0128",itilde:"\u0129",Iukcy:"\u0406",iukcy:"\u0456",Iuml:"\xCF",iuml:"\xEF",Jcirc:"\u0134",jcirc:"\u0135",Jcy:"\u0419",jcy:"\u0439",Jfr:"\u{1D50D}",jfr:"\u{1D527}",jmath:"\u0237",Jopf:"\u{1D541}",jopf:"\u{1D55B}",Jscr:"\u{1D4A5}",jscr:"\u{1D4BF}",Jsercy:"\u0408",jsercy:"\u0458",Jukcy:"\u0404",jukcy:"\u0454",Kappa:"\u039A",kappa:"\u03BA",kappav:"\u03F0",Kcedil:"\u0136",kcedil:"\u0137",Kcy:"\u041A",kcy:"\u043A",Kfr:"\u{1D50E}",kfr:"\u{1D528}",kgreen:"\u0138",KHcy:"\u0425",khcy:"\u0445",KJcy:"\u040C",kjcy:"\u045C",Kopf:"\u{1D542}",kopf:"\u{1D55C}",Kscr:"\u{1D4A6}",kscr:"\u{1D4C0}",lAarr:"\u21DA",Lacute:"\u0139",lacute:"\u013A",laemptyv:"\u29B4",lagran:"\u2112",Lambda:"\u039B",lambda:"\u03BB",Lang:"\u27EA",lang:"\u27E8",langd:"\u2991",langle:"\u27E8",lap:"\u2A85",Laplacetrf:"\u2112",laquo:"\xAB",Larr:"\u219E",lArr:"\u21D0",larr:"\u2190",larrb:"\u21E4",larrbfs:"\u291F",larrfs:"\u291D",larrhk:"\u21A9",larrlp:"\u21AB",larrpl:"\u2939",larrsim:"\u2973",larrtl:"\u21A2",lat:"\u2AAB",lAtail:"\u291B",latail:"\u2919",late:"\u2AAD",lates:"\u2AAD\uFE00",lBarr:"\u290E",lbarr:"\u290C",lbbrk:"\u2772",lbrace:"{",lbrack:"[",lbrke:"\u298B",lbrksld:"\u298F",lbrkslu:"\u298D",Lcaron:"\u013D",lcaron:"\u013E",Lcedil:"\u013B",lcedil:"\u013C",lceil:"\u2308",lcub:"{",Lcy:"\u041B",lcy:"\u043B",ldca:"\u2936",ldquo:"\u201C",ldquor:"\u201E",ldrdhar:"\u2967",ldrushar:"\u294B",ldsh:"\u21B2",lE:"\u2266",le:"\u2264",LeftAngleBracket:"\u27E8",LeftArrow:"\u2190",Leftarrow:"\u21D0",leftarrow:"\u2190",LeftArrowBar:"\u21E4",LeftArrowRightArrow:"\u21C6",leftarrowtail:"\u21A2",LeftCeiling:"\u2308",LeftDoubleBracket:"\u27E6",LeftDownTeeVector:"\u2961",LeftDownVector:"\u21C3",LeftDownVectorBar:"\u2959",LeftFloor:"\u230A",leftharpoondown:"\u21BD",leftharpoonup:"\u21BC",leftleftarrows:"\u21C7",LeftRightArrow:"\u2194",Leftrightarrow:"\u21D4",leftrightarrow:"\u2194",leftrightarrows:"\u21C6",leftrightharpoons:"\u21CB",leftrightsquigarrow:"\u21AD",LeftRightVector:"\u294E",LeftTee:"\u22A3",LeftTeeArrow:"\u21A4",LeftTeeVector:"\u295A",leftthreetimes:"\u22CB",LeftTriangle:"\u22B2",LeftTriangleBar:"\u29CF",LeftTriangleEqual:"\u22B4",LeftUpDownVector:"\u2951",LeftUpTeeVector:"\u2960",LeftUpVector:"\u21BF",LeftUpVectorBar:"\u2958",LeftVector:"\u21BC",LeftVectorBar:"\u2952",lEg:"\u2A8B",leg:"\u22DA",leq:"\u2264",leqq:"\u2266",leqslant:"\u2A7D",les:"\u2A7D",lescc:"\u2AA8",lesdot:"\u2A7F",lesdoto:"\u2A81",lesdotor:"\u2A83",lesg:"\u22DA\uFE00",lesges:"\u2A93",lessapprox:"\u2A85",lessdot:"\u22D6",lesseqgtr:"\u22DA",lesseqqgtr:"\u2A8B",LessEqualGreater:"\u22DA",LessFullEqual:"\u2266",LessGreater:"\u2276",lessgtr:"\u2276",LessLess:"\u2AA1",lesssim:"\u2272",LessSlantEqual:"\u2A7D",LessTilde:"\u2272",lfisht:"\u297C",lfloor:"\u230A",Lfr:"\u{1D50F}",lfr:"\u{1D529}",lg:"\u2276",lgE:"\u2A91",lHar:"\u2962",lhard:"\u21BD",lharu:"\u21BC",lharul:"\u296A",lhblk:"\u2584",LJcy:"\u0409",ljcy:"\u0459",Ll:"\u22D8",ll:"\u226A",llarr:"\u21C7",llcorner:"\u231E",Lleftarrow:"\u21DA",llhard:"\u296B",lltri:"\u25FA",Lmidot:"\u013F",lmidot:"\u0140",lmoust:"\u23B0",lmoustache:"\u23B0",lnap:"\u2A89",lnapprox:"\u2A89",lnE:"\u2268",lne:"\u2A87",lneq:"\u2A87",lneqq:"\u2268",lnsim:"\u22E6",loang:"\u27EC",loarr:"\u21FD",lobrk:"\u27E6",LongLeftArrow:"\u27F5",Longleftarrow:"\u27F8",longleftarrow:"\u27F5",LongLeftRightArrow:"\u27F7",Longleftrightarrow:"\u27FA",longleftrightarrow:"\u27F7",longmapsto:"\u27FC",LongRightArrow:"\u27F6",Longrightarrow:"\u27F9",longrightarrow:"\u27F6",looparrowleft:"\u21AB",looparrowright:"\u21AC",lopar:"\u2985",Lopf:"\u{1D543}",lopf:"\u{1D55D}",loplus:"\u2A2D",lotimes:"\u2A34",lowast:"\u2217",lowbar:"_",LowerLeftArrow:"\u2199",LowerRightArrow:"\u2198",loz:"\u25CA",lozenge:"\u25CA",lozf:"\u29EB",lpar:"(",lparlt:"\u2993",lrarr:"\u21C6",lrcorner:"\u231F",lrhar:"\u21CB",lrhard:"\u296D",lrm:"\u200E",lrtri:"\u22BF",lsaquo:"\u2039",Lscr:"\u2112",lscr:"\u{1D4C1}",Lsh:"\u21B0",lsh:"\u21B0",lsim:"\u2272",lsime:"\u2A8D",lsimg:"\u2A8F",lsqb:"[",lsquo:"\u2018",lsquor:"\u201A",Lstrok:"\u0141",lstrok:"\u0142",Lt:"\u226A",LT:"<",lt:"<",ltcc:"\u2AA6",ltcir:"\u2A79",ltdot:"\u22D6",lthree:"\u22CB",ltimes:"\u22C9",ltlarr:"\u2976",ltquest:"\u2A7B",ltri:"\u25C3",ltrie:"\u22B4",ltrif:"\u25C2",ltrPar:"\u2996",lurdshar:"\u294A",luruhar:"\u2966",lvertneqq:"\u2268\uFE00",lvnE:"\u2268\uFE00",macr:"\xAF",male:"\u2642",malt:"\u2720",maltese:"\u2720",Map:"\u2905",map:"\u21A6",mapsto:"\u21A6",mapstodown:"\u21A7",mapstoleft:"\u21A4",mapstoup:"\u21A5",marker:"\u25AE",mcomma:"\u2A29",Mcy:"\u041C",mcy:"\u043C",mdash:"\u2014",mDDot:"\u223A",measuredangle:"\u2221",MediumSpace:"\u205F",Mellintrf:"\u2133",Mfr:"\u{1D510}",mfr:"\u{1D52A}",mho:"\u2127",micro:"\xB5",mid:"\u2223",midast:"*",midcir:"\u2AF0",middot:"\xB7",minus:"\u2212",minusb:"\u229F",minusd:"\u2238",minusdu:"\u2A2A",MinusPlus:"\u2213",mlcp:"\u2ADB",mldr:"\u2026",mnplus:"\u2213",models:"\u22A7",Mopf:"\u{1D544}",mopf:"\u{1D55E}",mp:"\u2213",Mscr:"\u2133",mscr:"\u{1D4C2}",mstpos:"\u223E",Mu:"\u039C",mu:"\u03BC",multimap:"\u22B8",mumap:"\u22B8",nabla:"\u2207",Nacute:"\u0143",nacute:"\u0144",nang:"\u2220\u20D2",nap:"\u2249",napE:"\u2A70\u0338",napid:"\u224B\u0338",napos:"\u0149",napprox:"\u2249",natur:"\u266E",natural:"\u266E",naturals:"\u2115",nbsp:"\xA0",nbump:"\u224E\u0338",nbumpe:"\u224F\u0338",ncap:"\u2A43",Ncaron:"\u0147",ncaron:"\u0148",Ncedil:"\u0145",ncedil:"\u0146",ncong:"\u2247",ncongdot:"\u2A6D\u0338",ncup:"\u2A42",Ncy:"\u041D",ncy:"\u043D",ndash:"\u2013",ne:"\u2260",nearhk:"\u2924",neArr:"\u21D7",nearr:"\u2197",nearrow:"\u2197",nedot:"\u2250\u0338",NegativeMediumSpace:"\u200B",NegativeThickSpace:"\u200B",NegativeThinSpace:"\u200B",NegativeVeryThinSpace:"\u200B",nequiv:"\u2262",nesear:"\u2928",nesim:"\u2242\u0338",NestedGreaterGreater:"\u226B",NestedLessLess:"\u226A",NewLine:`
`,nexist:"\u2204",nexists:"\u2204",Nfr:"\u{1D511}",nfr:"\u{1D52B}",ngE:"\u2267\u0338",nge:"\u2271",ngeq:"\u2271",ngeqq:"\u2267\u0338",ngeqslant:"\u2A7E\u0338",nges:"\u2A7E\u0338",nGg:"\u22D9\u0338",ngsim:"\u2275",nGt:"\u226B\u20D2",ngt:"\u226F",ngtr:"\u226F",nGtv:"\u226B\u0338",nhArr:"\u21CE",nharr:"\u21AE",nhpar:"\u2AF2",ni:"\u220B",nis:"\u22FC",nisd:"\u22FA",niv:"\u220B",NJcy:"\u040A",njcy:"\u045A",nlArr:"\u21CD",nlarr:"\u219A",nldr:"\u2025",nlE:"\u2266\u0338",nle:"\u2270",nLeftarrow:"\u21CD",nleftarrow:"\u219A",nLeftrightarrow:"\u21CE",nleftrightarrow:"\u21AE",nleq:"\u2270",nleqq:"\u2266\u0338",nleqslant:"\u2A7D\u0338",nles:"\u2A7D\u0338",nless:"\u226E",nLl:"\u22D8\u0338",nlsim:"\u2274",nLt:"\u226A\u20D2",nlt:"\u226E",nltri:"\u22EA",nltrie:"\u22EC",nLtv:"\u226A\u0338",nmid:"\u2224",NoBreak:"\u2060",NonBreakingSpace:"\xA0",Nopf:"\u2115",nopf:"\u{1D55F}",Not:"\u2AEC",not:"\xAC",NotCongruent:"\u2262",NotCupCap:"\u226D",NotDoubleVerticalBar:"\u2226",NotElement:"\u2209",NotEqual:"\u2260",NotEqualTilde:"\u2242\u0338",NotExists:"\u2204",NotGreater:"\u226F",NotGreaterEqual:"\u2271",NotGreaterFullEqual:"\u2267\u0338",NotGreaterGreater:"\u226B\u0338",NotGreaterLess:"\u2279",NotGreaterSlantEqual:"\u2A7E\u0338",NotGreaterTilde:"\u2275",NotHumpDownHump:"\u224E\u0338",NotHumpEqual:"\u224F\u0338",notin:"\u2209",notindot:"\u22F5\u0338",notinE:"\u22F9\u0338",notinva:"\u2209",notinvb:"\u22F7",notinvc:"\u22F6",NotLeftTriangle:"\u22EA",NotLeftTriangleBar:"\u29CF\u0338",NotLeftTriangleEqual:"\u22EC",NotLess:"\u226E",NotLessEqual:"\u2270",NotLessGreater:"\u2278",NotLessLess:"\u226A\u0338",NotLessSlantEqual:"\u2A7D\u0338",NotLessTilde:"\u2274",NotNestedGreaterGreater:"\u2AA2\u0338",NotNestedLessLess:"\u2AA1\u0338",notni:"\u220C",notniva:"\u220C",notnivb:"\u22FE",notnivc:"\u22FD",NotPrecedes:"\u2280",NotPrecedesEqual:"\u2AAF\u0338",NotPrecedesSlantEqual:"\u22E0",NotReverseElement:"\u220C",NotRightTriangle:"\u22EB",NotRightTriangleBar:"\u29D0\u0338",NotRightTriangleEqual:"\u22ED",NotSquareSubset:"\u228F\u0338",NotSquareSubsetEqual:"\u22E2",NotSquareSuperset:"\u2290\u0338",NotSquareSupersetEqual:"\u22E3",NotSubset:"\u2282\u20D2",NotSubsetEqual:"\u2288",NotSucceeds:"\u2281",NotSucceedsEqual:"\u2AB0\u0338",NotSucceedsSlantEqual:"\u22E1",NotSucceedsTilde:"\u227F\u0338",NotSuperset:"\u2283\u20D2",NotSupersetEqual:"\u2289",NotTilde:"\u2241",NotTildeEqual:"\u2244",NotTildeFullEqual:"\u2247",NotTildeTilde:"\u2249",NotVerticalBar:"\u2224",npar:"\u2226",nparallel:"\u2226",nparsl:"\u2AFD\u20E5",npart:"\u2202\u0338",npolint:"\u2A14",npr:"\u2280",nprcue:"\u22E0",npre:"\u2AAF\u0338",nprec:"\u2280",npreceq:"\u2AAF\u0338",nrArr:"\u21CF",nrarr:"\u219B",nrarrc:"\u2933\u0338",nrarrw:"\u219D\u0338",nRightarrow:"\u21CF",nrightarrow:"\u219B",nrtri:"\u22EB",nrtrie:"\u22ED",nsc:"\u2281",nsccue:"\u22E1",nsce:"\u2AB0\u0338",Nscr:"\u{1D4A9}",nscr:"\u{1D4C3}",nshortmid:"\u2224",nshortparallel:"\u2226",nsim:"\u2241",nsime:"\u2244",nsimeq:"\u2244",nsmid:"\u2224",nspar:"\u2226",nsqsube:"\u22E2",nsqsupe:"\u22E3",nsub:"\u2284",nsubE:"\u2AC5\u0338",nsube:"\u2288",nsubset:"\u2282\u20D2",nsubseteq:"\u2288",nsubseteqq:"\u2AC5\u0338",nsucc:"\u2281",nsucceq:"\u2AB0\u0338",nsup:"\u2285",nsupE:"\u2AC6\u0338",nsupe:"\u2289",nsupset:"\u2283\u20D2",nsupseteq:"\u2289",nsupseteqq:"\u2AC6\u0338",ntgl:"\u2279",Ntilde:"\xD1",ntilde:"\xF1",ntlg:"\u2278",ntriangleleft:"\u22EA",ntrianglelefteq:"\u22EC",ntriangleright:"\u22EB",ntrianglerighteq:"\u22ED",Nu:"\u039D",nu:"\u03BD",num:"#",numero:"\u2116",numsp:"\u2007",nvap:"\u224D\u20D2",nVDash:"\u22AF",nVdash:"\u22AE",nvDash:"\u22AD",nvdash:"\u22AC",nvge:"\u2265\u20D2",nvgt:">\u20D2",nvHarr:"\u2904",nvinfin:"\u29DE",nvlArr:"\u2902",nvle:"\u2264\u20D2",nvlt:"<\u20D2",nvltrie:"\u22B4\u20D2",nvrArr:"\u2903",nvrtrie:"\u22B5\u20D2",nvsim:"\u223C\u20D2",nwarhk:"\u2923",nwArr:"\u21D6",nwarr:"\u2196",nwarrow:"\u2196",nwnear:"\u2927",Oacute:"\xD3",oacute:"\xF3",oast:"\u229B",ocir:"\u229A",Ocirc:"\xD4",ocirc:"\xF4",Ocy:"\u041E",ocy:"\u043E",odash:"\u229D",Odblac:"\u0150",odblac:"\u0151",odiv:"\u2A38",odot:"\u2299",odsold:"\u29BC",OElig:"\u0152",oelig:"\u0153",ofcir:"\u29BF",Ofr:"\u{1D512}",ofr:"\u{1D52C}",ogon:"\u02DB",Ograve:"\xD2",ograve:"\xF2",ogt:"\u29C1",ohbar:"\u29B5",ohm:"\u03A9",oint:"\u222E",olarr:"\u21BA",olcir:"\u29BE",olcross:"\u29BB",oline:"\u203E",olt:"\u29C0",Omacr:"\u014C",omacr:"\u014D",Omega:"\u03A9",omega:"\u03C9",Omicron:"\u039F",omicron:"\u03BF",omid:"\u29B6",ominus:"\u2296",Oopf:"\u{1D546}",oopf:"\u{1D560}",opar:"\u29B7",OpenCurlyDoubleQuote:"\u201C",OpenCurlyQuote:"\u2018",operp:"\u29B9",oplus:"\u2295",Or:"\u2A54",or:"\u2228",orarr:"\u21BB",ord:"\u2A5D",order:"\u2134",orderof:"\u2134",ordf:"\xAA",ordm:"\xBA",origof:"\u22B6",oror:"\u2A56",orslope:"\u2A57",orv:"\u2A5B",oS:"\u24C8",Oscr:"\u{1D4AA}",oscr:"\u2134",Oslash:"\xD8",oslash:"\xF8",osol:"\u2298",Otilde:"\xD5",otilde:"\xF5",Otimes:"\u2A37",otimes:"\u2297",otimesas:"\u2A36",Ouml:"\xD6",ouml:"\xF6",ovbar:"\u233D",OverBar:"\u203E",OverBrace:"\u23DE",OverBracket:"\u23B4",OverParenthesis:"\u23DC",par:"\u2225",para:"\xB6",parallel:"\u2225",parsim:"\u2AF3",parsl:"\u2AFD",part:"\u2202",PartialD:"\u2202",Pcy:"\u041F",pcy:"\u043F",percnt:"%",period:".",permil:"\u2030",perp:"\u22A5",pertenk:"\u2031",Pfr:"\u{1D513}",pfr:"\u{1D52D}",Phi:"\u03A6",phi:"\u03C6",phiv:"\u03D5",phmmat:"\u2133",phone:"\u260E",Pi:"\u03A0",pi:"\u03C0",pitchfork:"\u22D4",piv:"\u03D6",planck:"\u210F",planckh:"\u210E",plankv:"\u210F",plus:"+",plusacir:"\u2A23",plusb:"\u229E",pluscir:"\u2A22",plusdo:"\u2214",plusdu:"\u2A25",pluse:"\u2A72",PlusMinus:"\xB1",plusmn:"\xB1",plussim:"\u2A26",plustwo:"\u2A27",pm:"\xB1",Poincareplane:"\u210C",pointint:"\u2A15",Popf:"\u2119",popf:"\u{1D561}",pound:"\xA3",Pr:"\u2ABB",pr:"\u227A",prap:"\u2AB7",prcue:"\u227C",prE:"\u2AB3",pre:"\u2AAF",prec:"\u227A",precapprox:"\u2AB7",preccurlyeq:"\u227C",Precedes:"\u227A",PrecedesEqual:"\u2AAF",PrecedesSlantEqual:"\u227C",PrecedesTilde:"\u227E",preceq:"\u2AAF",precnapprox:"\u2AB9",precneqq:"\u2AB5",precnsim:"\u22E8",precsim:"\u227E",Prime:"\u2033",prime:"\u2032",primes:"\u2119",prnap:"\u2AB9",prnE:"\u2AB5",prnsim:"\u22E8",prod:"\u220F",Product:"\u220F",profalar:"\u232E",profline:"\u2312",profsurf:"\u2313",prop:"\u221D",Proportion:"\u2237",Proportional:"\u221D",propto:"\u221D",prsim:"\u227E",prurel:"\u22B0",Pscr:"\u{1D4AB}",pscr:"\u{1D4C5}",Psi:"\u03A8",psi:"\u03C8",puncsp:"\u2008",Qfr:"\u{1D514}",qfr:"\u{1D52E}",qint:"\u2A0C",Qopf:"\u211A",qopf:"\u{1D562}",qprime:"\u2057",Qscr:"\u{1D4AC}",qscr:"\u{1D4C6}",quaternions:"\u210D",quatint:"\u2A16",quest:"?",questeq:"\u225F",QUOT:'"',quot:'"',rAarr:"\u21DB",race:"\u223D\u0331",Racute:"\u0154",racute:"\u0155",radic:"\u221A",raemptyv:"\u29B3",Rang:"\u27EB",rang:"\u27E9",rangd:"\u2992",range:"\u29A5",rangle:"\u27E9",raquo:"\xBB",Rarr:"\u21A0",rArr:"\u21D2",rarr:"\u2192",rarrap:"\u2975",rarrb:"\u21E5",rarrbfs:"\u2920",rarrc:"\u2933",rarrfs:"\u291E",rarrhk:"\u21AA",rarrlp:"\u21AC",rarrpl:"\u2945",rarrsim:"\u2974",Rarrtl:"\u2916",rarrtl:"\u21A3",rarrw:"\u219D",rAtail:"\u291C",ratail:"\u291A",ratio:"\u2236",rationals:"\u211A",RBarr:"\u2910",rBarr:"\u290F",rbarr:"\u290D",rbbrk:"\u2773",rbrace:"}",rbrack:"]",rbrke:"\u298C",rbrksld:"\u298E",rbrkslu:"\u2990",Rcaron:"\u0158",rcaron:"\u0159",Rcedil:"\u0156",rcedil:"\u0157",rceil:"\u2309",rcub:"}",Rcy:"\u0420",rcy:"\u0440",rdca:"\u2937",rdldhar:"\u2969",rdquo:"\u201D",rdquor:"\u201D",rdsh:"\u21B3",Re:"\u211C",real:"\u211C",realine:"\u211B",realpart:"\u211C",reals:"\u211D",rect:"\u25AD",REG:"\xAE",reg:"\xAE",ReverseElement:"\u220B",ReverseEquilibrium:"\u21CB",ReverseUpEquilibrium:"\u296F",rfisht:"\u297D",rfloor:"\u230B",Rfr:"\u211C",rfr:"\u{1D52F}",rHar:"\u2964",rhard:"\u21C1",rharu:"\u21C0",rharul:"\u296C",Rho:"\u03A1",rho:"\u03C1",rhov:"\u03F1",RightAngleBracket:"\u27E9",RightArrow:"\u2192",Rightarrow:"\u21D2",rightarrow:"\u2192",RightArrowBar:"\u21E5",RightArrowLeftArrow:"\u21C4",rightarrowtail:"\u21A3",RightCeiling:"\u2309",RightDoubleBracket:"\u27E7",RightDownTeeVector:"\u295D",RightDownVector:"\u21C2",RightDownVectorBar:"\u2955",RightFloor:"\u230B",rightharpoondown:"\u21C1",rightharpoonup:"\u21C0",rightleftarrows:"\u21C4",rightleftharpoons:"\u21CC",rightrightarrows:"\u21C9",rightsquigarrow:"\u219D",RightTee:"\u22A2",RightTeeArrow:"\u21A6",RightTeeVector:"\u295B",rightthreetimes:"\u22CC",RightTriangle:"\u22B3",RightTriangleBar:"\u29D0",RightTriangleEqual:"\u22B5",RightUpDownVector:"\u294F",RightUpTeeVector:"\u295C",RightUpVector:"\u21BE",RightUpVectorBar:"\u2954",RightVector:"\u21C0",RightVectorBar:"\u2953",ring:"\u02DA",risingdotseq:"\u2253",rlarr:"\u21C4",rlhar:"\u21CC",rlm:"\u200F",rmoust:"\u23B1",rmoustache:"\u23B1",rnmid:"\u2AEE",roang:"\u27ED",roarr:"\u21FE",robrk:"\u27E7",ropar:"\u2986",Ropf:"\u211D",ropf:"\u{1D563}",roplus:"\u2A2E",rotimes:"\u2A35",RoundImplies:"\u2970",rpar:")",rpargt:"\u2994",rppolint:"\u2A12",rrarr:"\u21C9",Rrightarrow:"\u21DB",rsaquo:"\u203A",Rscr:"\u211B",rscr:"\u{1D4C7}",Rsh:"\u21B1",rsh:"\u21B1",rsqb:"]",rsquo:"\u2019",rsquor:"\u2019",rthree:"\u22CC",rtimes:"\u22CA",rtri:"\u25B9",rtrie:"\u22B5",rtrif:"\u25B8",rtriltri:"\u29CE",RuleDelayed:"\u29F4",ruluhar:"\u2968",rx:"\u211E",Sacute:"\u015A",sacute:"\u015B",sbquo:"\u201A",Sc:"\u2ABC",sc:"\u227B",scap:"\u2AB8",Scaron:"\u0160",scaron:"\u0161",sccue:"\u227D",scE:"\u2AB4",sce:"\u2AB0",Scedil:"\u015E",scedil:"\u015F",Scirc:"\u015C",scirc:"\u015D",scnap:"\u2ABA",scnE:"\u2AB6",scnsim:"\u22E9",scpolint:"\u2A13",scsim:"\u227F",Scy:"\u0421",scy:"\u0441",sdot:"\u22C5",sdotb:"\u22A1",sdote:"\u2A66",searhk:"\u2925",seArr:"\u21D8",searr:"\u2198",searrow:"\u2198",sect:"\xA7",semi:";",seswar:"\u2929",setminus:"\u2216",setmn:"\u2216",sext:"\u2736",Sfr:"\u{1D516}",sfr:"\u{1D530}",sfrown:"\u2322",sharp:"\u266F",SHCHcy:"\u0429",shchcy:"\u0449",SHcy:"\u0428",shcy:"\u0448",ShortDownArrow:"\u2193",ShortLeftArrow:"\u2190",shortmid:"\u2223",shortparallel:"\u2225",ShortRightArrow:"\u2192",ShortUpArrow:"\u2191",shy:"\xAD",Sigma:"\u03A3",sigma:"\u03C3",sigmaf:"\u03C2",sigmav:"\u03C2",sim:"\u223C",simdot:"\u2A6A",sime:"\u2243",simeq:"\u2243",simg:"\u2A9E",simgE:"\u2AA0",siml:"\u2A9D",simlE:"\u2A9F",simne:"\u2246",simplus:"\u2A24",simrarr:"\u2972",slarr:"\u2190",SmallCircle:"\u2218",smallsetminus:"\u2216",smashp:"\u2A33",smeparsl:"\u29E4",smid:"\u2223",smile:"\u2323",smt:"\u2AAA",smte:"\u2AAC",smtes:"\u2AAC\uFE00",SOFTcy:"\u042C",softcy:"\u044C",sol:"/",solb:"\u29C4",solbar:"\u233F",Sopf:"\u{1D54A}",sopf:"\u{1D564}",spades:"\u2660",spadesuit:"\u2660",spar:"\u2225",sqcap:"\u2293",sqcaps:"\u2293\uFE00",sqcup:"\u2294",sqcups:"\u2294\uFE00",Sqrt:"\u221A",sqsub:"\u228F",sqsube:"\u2291",sqsubset:"\u228F",sqsubseteq:"\u2291",sqsup:"\u2290",sqsupe:"\u2292",sqsupset:"\u2290",sqsupseteq:"\u2292",squ:"\u25A1",Square:"\u25A1",square:"\u25A1",SquareIntersection:"\u2293",SquareSubset:"\u228F",SquareSubsetEqual:"\u2291",SquareSuperset:"\u2290",SquareSupersetEqual:"\u2292",SquareUnion:"\u2294",squarf:"\u25AA",squf:"\u25AA",srarr:"\u2192",Sscr:"\u{1D4AE}",sscr:"\u{1D4C8}",ssetmn:"\u2216",ssmile:"\u2323",sstarf:"\u22C6",Star:"\u22C6",star:"\u2606",starf:"\u2605",straightepsilon:"\u03F5",straightphi:"\u03D5",strns:"\xAF",Sub:"\u22D0",sub:"\u2282",subdot:"\u2ABD",subE:"\u2AC5",sube:"\u2286",subedot:"\u2AC3",submult:"\u2AC1",subnE:"\u2ACB",subne:"\u228A",subplus:"\u2ABF",subrarr:"\u2979",Subset:"\u22D0",subset:"\u2282",subseteq:"\u2286",subseteqq:"\u2AC5",SubsetEqual:"\u2286",subsetneq:"\u228A",subsetneqq:"\u2ACB",subsim:"\u2AC7",subsub:"\u2AD5",subsup:"\u2AD3",succ:"\u227B",succapprox:"\u2AB8",succcurlyeq:"\u227D",Succeeds:"\u227B",SucceedsEqual:"\u2AB0",SucceedsSlantEqual:"\u227D",SucceedsTilde:"\u227F",succeq:"\u2AB0",succnapprox:"\u2ABA",succneqq:"\u2AB6",succnsim:"\u22E9",succsim:"\u227F",SuchThat:"\u220B",Sum:"\u2211",sum:"\u2211",sung:"\u266A",Sup:"\u22D1",sup:"\u2283",sup1:"\xB9",sup2:"\xB2",sup3:"\xB3",supdot:"\u2ABE",supdsub:"\u2AD8",supE:"\u2AC6",supe:"\u2287",supedot:"\u2AC4",Superset:"\u2283",SupersetEqual:"\u2287",suphsol:"\u27C9",suphsub:"\u2AD7",suplarr:"\u297B",supmult:"\u2AC2",supnE:"\u2ACC",supne:"\u228B",supplus:"\u2AC0",Supset:"\u22D1",supset:"\u2283",supseteq:"\u2287",supseteqq:"\u2AC6",supsetneq:"\u228B",supsetneqq:"\u2ACC",supsim:"\u2AC8",supsub:"\u2AD4",supsup:"\u2AD6",swarhk:"\u2926",swArr:"\u21D9",swarr:"\u2199",swarrow:"\u2199",swnwar:"\u292A",szlig:"\xDF",Tab:"	",target:"\u2316",Tau:"\u03A4",tau:"\u03C4",tbrk:"\u23B4",Tcaron:"\u0164",tcaron:"\u0165",Tcedil:"\u0162",tcedil:"\u0163",Tcy:"\u0422",tcy:"\u0442",tdot:"\u20DB",telrec:"\u2315",Tfr:"\u{1D517}",tfr:"\u{1D531}",there4:"\u2234",Therefore:"\u2234",therefore:"\u2234",Theta:"\u0398",theta:"\u03B8",thetasym:"\u03D1",thetav:"\u03D1",thickapprox:"\u2248",thicksim:"\u223C",ThickSpace:"\u205F\u200A",thinsp:"\u2009",ThinSpace:"\u2009",thkap:"\u2248",thksim:"\u223C",THORN:"\xDE",thorn:"\xFE",Tilde:"\u223C",tilde:"\u02DC",TildeEqual:"\u2243",TildeFullEqual:"\u2245",TildeTilde:"\u2248",times:"\xD7",timesb:"\u22A0",timesbar:"\u2A31",timesd:"\u2A30",tint:"\u222D",toea:"\u2928",top:"\u22A4",topbot:"\u2336",topcir:"\u2AF1",Topf:"\u{1D54B}",topf:"\u{1D565}",topfork:"\u2ADA",tosa:"\u2929",tprime:"\u2034",TRADE:"\u2122",trade:"\u2122",triangle:"\u25B5",triangledown:"\u25BF",triangleleft:"\u25C3",trianglelefteq:"\u22B4",triangleq:"\u225C",triangleright:"\u25B9",trianglerighteq:"\u22B5",tridot:"\u25EC",trie:"\u225C",triminus:"\u2A3A",TripleDot:"\u20DB",triplus:"\u2A39",trisb:"\u29CD",tritime:"\u2A3B",trpezium:"\u23E2",Tscr:"\u{1D4AF}",tscr:"\u{1D4C9}",TScy:"\u0426",tscy:"\u0446",TSHcy:"\u040B",tshcy:"\u045B",Tstrok:"\u0166",tstrok:"\u0167",twixt:"\u226C",twoheadleftarrow:"\u219E",twoheadrightarrow:"\u21A0",Uacute:"\xDA",uacute:"\xFA",Uarr:"\u219F",uArr:"\u21D1",uarr:"\u2191",Uarrocir:"\u2949",Ubrcy:"\u040E",ubrcy:"\u045E",Ubreve:"\u016C",ubreve:"\u016D",Ucirc:"\xDB",ucirc:"\xFB",Ucy:"\u0423",ucy:"\u0443",udarr:"\u21C5",Udblac:"\u0170",udblac:"\u0171",udhar:"\u296E",ufisht:"\u297E",Ufr:"\u{1D518}",ufr:"\u{1D532}",Ugrave:"\xD9",ugrave:"\xF9",uHar:"\u2963",uharl:"\u21BF",uharr:"\u21BE",uhblk:"\u2580",ulcorn:"\u231C",ulcorner:"\u231C",ulcrop:"\u230F",ultri:"\u25F8",Umacr:"\u016A",umacr:"\u016B",uml:"\xA8",UnderBar:"_",UnderBrace:"\u23DF",UnderBracket:"\u23B5",UnderParenthesis:"\u23DD",Union:"\u22C3",UnionPlus:"\u228E",Uogon:"\u0172",uogon:"\u0173",Uopf:"\u{1D54C}",uopf:"\u{1D566}",UpArrow:"\u2191",Uparrow:"\u21D1",uparrow:"\u2191",UpArrowBar:"\u2912",UpArrowDownArrow:"\u21C5",UpDownArrow:"\u2195",Updownarrow:"\u21D5",updownarrow:"\u2195",UpEquilibrium:"\u296E",upharpoonleft:"\u21BF",upharpoonright:"\u21BE",uplus:"\u228E",UpperLeftArrow:"\u2196",UpperRightArrow:"\u2197",Upsi:"\u03D2",upsi:"\u03C5",upsih:"\u03D2",Upsilon:"\u03A5",upsilon:"\u03C5",UpTee:"\u22A5",UpTeeArrow:"\u21A5",upuparrows:"\u21C8",urcorn:"\u231D",urcorner:"\u231D",urcrop:"\u230E",Uring:"\u016E",uring:"\u016F",urtri:"\u25F9",Uscr:"\u{1D4B0}",uscr:"\u{1D4CA}",utdot:"\u22F0",Utilde:"\u0168",utilde:"\u0169",utri:"\u25B5",utrif:"\u25B4",uuarr:"\u21C8",Uuml:"\xDC",uuml:"\xFC",uwangle:"\u29A7",vangrt:"\u299C",varepsilon:"\u03F5",varkappa:"\u03F0",varnothing:"\u2205",varphi:"\u03D5",varpi:"\u03D6",varpropto:"\u221D",vArr:"\u21D5",varr:"\u2195",varrho:"\u03F1",varsigma:"\u03C2",varsubsetneq:"\u228A\uFE00",varsubsetneqq:"\u2ACB\uFE00",varsupsetneq:"\u228B\uFE00",varsupsetneqq:"\u2ACC\uFE00",vartheta:"\u03D1",vartriangleleft:"\u22B2",vartriangleright:"\u22B3",Vbar:"\u2AEB",vBar:"\u2AE8",vBarv:"\u2AE9",Vcy:"\u0412",vcy:"\u0432",VDash:"\u22AB",Vdash:"\u22A9",vDash:"\u22A8",vdash:"\u22A2",Vdashl:"\u2AE6",Vee:"\u22C1",vee:"\u2228",veebar:"\u22BB",veeeq:"\u225A",vellip:"\u22EE",Verbar:"\u2016",verbar:"|",Vert:"\u2016",vert:"|",VerticalBar:"\u2223",VerticalLine:"|",VerticalSeparator:"\u2758",VerticalTilde:"\u2240",VeryThinSpace:"\u200A",Vfr:"\u{1D519}",vfr:"\u{1D533}",vltri:"\u22B2",vnsub:"\u2282\u20D2",vnsup:"\u2283\u20D2",Vopf:"\u{1D54D}",vopf:"\u{1D567}",vprop:"\u221D",vrtri:"\u22B3",Vscr:"\u{1D4B1}",vscr:"\u{1D4CB}",vsubnE:"\u2ACB\uFE00",vsubne:"\u228A\uFE00",vsupnE:"\u2ACC\uFE00",vsupne:"\u228B\uFE00",Vvdash:"\u22AA",vzigzag:"\u299A",Wcirc:"\u0174",wcirc:"\u0175",wedbar:"\u2A5F",Wedge:"\u22C0",wedge:"\u2227",wedgeq:"\u2259",weierp:"\u2118",Wfr:"\u{1D51A}",wfr:"\u{1D534}",Wopf:"\u{1D54E}",wopf:"\u{1D568}",wp:"\u2118",wr:"\u2240",wreath:"\u2240",Wscr:"\u{1D4B2}",wscr:"\u{1D4CC}",xcap:"\u22C2",xcirc:"\u25EF",xcup:"\u22C3",xdtri:"\u25BD",Xfr:"\u{1D51B}",xfr:"\u{1D535}",xhArr:"\u27FA",xharr:"\u27F7",Xi:"\u039E",xi:"\u03BE",xlArr:"\u27F8",xlarr:"\u27F5",xmap:"\u27FC",xnis:"\u22FB",xodot:"\u2A00",Xopf:"\u{1D54F}",xopf:"\u{1D569}",xoplus:"\u2A01",xotime:"\u2A02",xrArr:"\u27F9",xrarr:"\u27F6",Xscr:"\u{1D4B3}",xscr:"\u{1D4CD}",xsqcup:"\u2A06",xuplus:"\u2A04",xutri:"\u25B3",xvee:"\u22C1",xwedge:"\u22C0",Yacute:"\xDD",yacute:"\xFD",YAcy:"\u042F",yacy:"\u044F",Ycirc:"\u0176",ycirc:"\u0177",Ycy:"\u042B",ycy:"\u044B",yen:"\xA5",Yfr:"\u{1D51C}",yfr:"\u{1D536}",YIcy:"\u0407",yicy:"\u0457",Yopf:"\u{1D550}",yopf:"\u{1D56A}",Yscr:"\u{1D4B4}",yscr:"\u{1D4CE}",YUcy:"\u042E",yucy:"\u044E",Yuml:"\u0178",yuml:"\xFF",Zacute:"\u0179",zacute:"\u017A",Zcaron:"\u017D",zcaron:"\u017E",Zcy:"\u0417",zcy:"\u0437",Zdot:"\u017B",zdot:"\u017C",zeetrf:"\u2128",ZeroWidthSpace:"\u200B",Zeta:"\u0396",zeta:"\u03B6",Zfr:"\u2128",zfr:"\u{1D537}",ZHcy:"\u0416",zhcy:"\u0436",zigrarr:"\u21DD",Zopf:"\u2124",zopf:"\u{1D56B}",Zscr:"\u{1D4B5}",zscr:"\u{1D4CF}",zwj:"\u200D",zwnj:"\u200C"});qt.entityMap=qt.HTML_ENTITIES});var Bo=ne(gn=>{"use strict";var gt=Ke(),M=Jn(),Ao=_t(),is=gt.isHTMLEscapableRawTextElement,as=gt.isHTMLMimeType,ss=gt.isHTMLRawTextElement,zt=gt.hasOwn,wo=gt.NAMESPACE,Eo=Ao.ParseError,cs=Ao.DOMException,jt=0,He=1,ft=2,Ht=3,mt=4,ht=5,Vt=6,hn=7;function xo(){}xo.prototype={parse:function(t,e,n){var r=this.domBuilder;r.startDocument(),To(e,e=Object.create(null)),ls(t,e,n,r,this.errorHandler),r.endDocument()}};var ir=/&#?\w+;?/g;function ls(t,e,n,r,o){var i=as(r.mimeType);t.indexOf(M.UNICODE_REPLACEMENT_CHARACTER)>=0&&o.warning("Unicode replacement character detected, source encoding issues?");function a(O){if(O>65535){O-=65536;var Y=55296+(O>>10),he=56320+(O&1023);return String.fromCharCode(Y,he)}else return String.fromCharCode(O)}function c(O){var Y=O[O.length-1]===";"?O:O+";";if(!i&&Y!==O)return o.error("EntityRef: expecting ;"),O;var he=M.Reference.exec(Y);if(!he||he[0].length!==Y.length)return o.error("entity not matching Reference production: "+O),O;var xe=Y.slice(1,-1);return zt(n,xe)?n[xe]:xe.charAt(0)==="#"?a(parseInt(xe.substring(1).replace("x","0x"))):(o.error("entity not found:"+O),O)}function u(O){if(O>y){var Y=t.substring(y,O).replace(ir,c);g&&l(y),r.characters(Y,0,O-y),y=O}}var s=0,m=0,h=/\r\n?|\n|$/g,g=r.locator;function l(O,Y){for(;O>=m&&(Y=h.exec(t));)s=m,m=Y.index+Y[0].length,g.lineNumber++;g.columnNumber=O-s+1}for(var p=[{currentNSMap:e}],d=[],y=0;;){try{var v=t.indexOf("<",y);if(v<0){if(!i&&d.length>0)return o.fatalError("unclosed xml tag(s): "+d.join(", "));if(!t.substring(y).match(/^\s*$/)){var w=r.doc,b=w.createTextNode(t.substring(y));if(w.documentElement)return o.error("Extra content at the end of the document");w.appendChild(b),r.currentElement=b}return}if(v>y){var D=t.substring(y,v);!i&&d.length===0&&(D=D.replace(new RegExp(M.S_OPT.source,"g"),""),D&&o.error("Unexpected content outside root element: '"+D+"'")),u(v)}switch(t.charAt(v+1)){case"/":var B=t.indexOf(">",v+2),E=t.substring(v+2,B>0?B:void 0);if(!E)return o.fatalError("end tag name missing");var C=B>0&&M.reg("^",M.QName_group,M.S_OPT,"$").exec(E);if(!C)return o.fatalError('end tag name contains invalid characters: "'+E+'"');if(!r.currentElement&&!r.doc.documentElement)return;var A=d[d.length-1]||r.currentElement.tagName||r.doc.documentElement.tagName||"";if(A!==C[1]){var T=C[1].toLowerCase();if(!i||A.toLowerCase()!==T)return o.fatalError('Opening and ending tag mismatch: "'+A+'" != "'+E+'"')}var I=p.pop();d.pop();var k=I.localNSMap;if(r.endElement(I.uri,I.localName,A),k)for(var q in k)zt(k,q)&&r.endPrefixMapping(q);B++;break;case"?":g&&l(v),B=fs(t,v,r,o);break;case"!":g&&l(v),B=Io(t,v,r,o,i);break;default:g&&l(v);var x=new No,S=p[p.length-1].currentNSMap,B=us(t,v,x,S,c,o,i),P=x.length;if(x.closed||(i&&gt.isHTMLVoidElement(x.tagName)?x.closed=!0:d.push(x.tagName)),g&&P){for(var U=Do(g,{}),ke=0;ke<P;ke++){var re=x[ke];l(re.offset),re.locator=Do(g,{})}r.locator=U,Co(x,r,S)&&p.push(x),r.locator=g}else Co(x,r,S)&&p.push(x);i&&!x.closed?B=ds(t,B,x.tagName,c,r):B++}}catch(O){if(O instanceof Eo)throw O;if(O instanceof cs)throw new Eo(O.name+": "+O.message,r.locator,O);o.error("element parse error: "+O),B=-1}B>y?y=B:u(Math.max(v,y)+1)}}function Do(t,e){return e.lineNumber=t.lineNumber,e.columnNumber=t.columnNumber,e}function us(t,e,n,r,o,i,a){function c(l,p,d){if(zt(n.attributeNames,l))return i.fatalError("Attribute "+l+" redefined");if(!a&&p.indexOf("<")>=0)return i.fatalError("Unescaped '<' not allowed in attributes values");n.addValue(l,p.replace(/[\t\n\r]/g," ").replace(ir,o),d)}for(var u,s,m=++e,h=jt;;){var g=t.charAt(m);switch(g){case"=":if(h===He)u=t.slice(e,m),h=Ht;else if(h===ft)h=Ht;else throw new Error("attribute equal must after attrName");break;case"'":case'"':if(h===Ht||h===He)if(h===He&&(i.warning('attribute value must after "="'),u=t.slice(e,m)),e=m+1,m=t.indexOf(g,e),m>0)s=t.slice(e,m),c(u,s,e-1),h=ht;else throw new Error("attribute value no end '"+g+"' match");else if(h==mt)s=t.slice(e,m),c(u,s,e),i.warning('attribute "'+u+'" missed start quot('+g+")!!"),e=m+1,h=ht;else throw new Error('attribute value must after "="');break;case"/":switch(h){case jt:n.setTagName(t.slice(e,m));case ht:case Vt:case hn:h=hn,n.closed=!0;case mt:case He:break;case ft:n.closed=!0;break;default:throw new Error("attribute invalid close char('/')")}break;case"":return i.error("unexpected end of input"),h==jt&&n.setTagName(t.slice(e,m)),m;case">":switch(h){case jt:n.setTagName(t.slice(e,m));case ht:case Vt:case hn:break;case mt:case He:s=t.slice(e,m),s.slice(-1)==="/"&&(n.closed=!0,s=s.slice(0,-1));case ft:h===ft&&(s=u),h==mt?(i.warning('attribute "'+s+'" missed quot(")!'),c(u,s,e)):(a||i.warning('attribute "'+s+'" missed value!! "'+s+'" instead!!'),c(s,s,e));break;case Ht:if(!a)return i.fatalError(`AttValue: ' or " expected`)}return m;case"\x80":g=" ";default:if(g<=" ")switch(h){case jt:n.setTagName(t.slice(e,m)),h=Vt;break;case He:u=t.slice(e,m),h=ft;break;case mt:var s=t.slice(e,m);i.warning('attribute "'+s+'" missed quot(")!!'),c(u,s,e);case ht:h=Vt;break}else switch(h){case ft:a||i.warning('attribute "'+u+'" missed value!! "'+u+'" instead2!!'),c(u,u,e),e=m,h=He;break;case ht:i.warning('attribute space is required"'+u+'"!!');case Vt:h=He,e=m;break;case Ht:h=mt,e=m;break;case hn:throw new Error("elements closed character '/' and '>' must be connected to")}}m++}}function Co(t,e,n){for(var r=t.tagName,o=null,h=t.length;h--;){var i=t[h],a=i.qName,c=i.value,g=a.indexOf(":");if(g>0)var u=i.prefix=a.slice(0,g),s=a.slice(g+1),m=u==="xmlns"&&s;else s=a,u=null,m=a==="xmlns"&&"";i.localName=s,m!==!1&&(o==null&&(o=Object.create(null),To(n,n=Object.create(null))),n[m]=o[m]=c,i.uri=wo.XMLNS,e.startPrefixMapping(m,c))}for(var h=t.length;h--;)i=t[h],i.prefix&&(i.prefix==="xml"&&(i.uri=wo.XML),i.prefix!=="xmlns"&&(i.uri=n[i.prefix]));var g=r.indexOf(":");g>0?(u=t.prefix=r.slice(0,g),s=t.localName=r.slice(g+1)):(u=null,s=t.localName=r);var l=t.uri=n[u||""];if(e.startElement(l,s,r,t),t.closed){if(e.endElement(l,s,r),o)for(u in o)zt(o,u)&&e.endPrefixMapping(u)}else return t.currentNSMap=n,t.localNSMap=o,!0}function ds(t,e,n,r,o){var i=is(n);if(i||ss(n)){var a=t.indexOf("</"+n+">",e),c=t.substring(e+1,a);return i&&(c=c.replace(ir,r)),o.characters(c,0,c.length),a}return e+1}function To(t,e){for(var n in t)zt(t,n)&&(e[n]=t[n])}function So(t,e){var n=e;function r(m){return m=m||0,t.charAt(n+m)}function o(m){m=m||1,n+=m}function i(){for(var m=0;n<t.length;){var h=r();if(h!==" "&&h!==`
`&&h!=="	"&&h!=="\r")return m;m++,o()}return-1}function a(){return t.substring(n)}function c(m){return t.substring(n,n+m.length)===m}function u(m){return t.substring(n,n+m.length).toUpperCase()===m.toUpperCase()}function s(m){var h=M.reg("^",m),g=h.exec(a());return g?(o(g[0].length),g[0]):null}return{char:r,getIndex:function(){return n},getMatch:s,getSource:function(){return t},skip:o,skipBlanks:i,substringFromIndex:a,substringStartsWith:c,substringStartsWithCaseInsensitive:u}}function ps(t,e){function n(c,u){var s=M.PI.exec(c.substringFromIndex());return s?s[1].toLowerCase()==="xml"?u.fatalError("xml declaration is only allowed at the start of the document, but found at position "+c.getIndex()):(c.skip(s[0].length),s[0]):u.fatalError("processing instruction is not well-formed at position "+c.getIndex())}var r=t.getSource();if(t.char()==="["){t.skip(1);for(var o=t.getIndex();t.getIndex()<r.length;){if(t.skipBlanks(),t.char()==="]"){var i=r.substring(o,t.getIndex());return t.skip(1),i}var a=null;if(t.char()==="<"&&t.char(1)==="!")switch(t.char(2)){case"E":t.char(3)==="L"?a=t.getMatch(M.elementdecl):t.char(3)==="N"&&(a=t.getMatch(M.EntityDecl));break;case"A":a=t.getMatch(M.AttlistDecl);break;case"N":a=t.getMatch(M.NotationDecl);break;case"-":a=t.getMatch(M.Comment);break}else if(t.char()==="<"&&t.char(1)==="?")a=n(t,e);else if(t.char()==="%")a=t.getMatch(M.PEReference);else return e.fatalError("Error detected in Markup declaration");if(!a)return e.fatalError("Error in internal subset at position "+t.getIndex())}return e.fatalError("doctype internal subset is not well-formed, missing ]")}}function Io(t,e,n,r,o){var i=So(t,e);switch(o?i.char(2).toUpperCase():i.char(2)){case"-":var a=i.getMatch(M.Comment);return a?(n.comment(a,M.COMMENT_START.length,a.length-M.COMMENT_START.length-M.COMMENT_END.length),i.getIndex()):r.fatalError("comment is not well-formed at position "+i.getIndex());case"[":var c=i.getMatch(M.CDSect);return c?!o&&!n.currentElement?r.fatalError("CDATA outside of element"):(n.startCDATA(),n.characters(c,M.CDATA_START.length,c.length-M.CDATA_START.length-M.CDATA_END.length),n.endCDATA(),i.getIndex()):r.fatalError("Invalid CDATA starting at position "+e);case"D":{if(n.doc&&n.doc.documentElement)return r.fatalError("Doctype not allowed inside or after documentElement at position "+i.getIndex());if(o?!i.substringStartsWithCaseInsensitive(M.DOCTYPE_DECL_START):!i.substringStartsWith(M.DOCTYPE_DECL_START))return r.fatalError("Expected "+M.DOCTYPE_DECL_START+" at position "+i.getIndex());if(i.skip(M.DOCTYPE_DECL_START.length),i.skipBlanks()<1)return r.fatalError("Expected whitespace after "+M.DOCTYPE_DECL_START+" at position "+i.getIndex());var u={name:void 0,publicId:void 0,systemId:void 0,internalSubset:void 0};if(u.name=i.getMatch(M.Name),!u.name)return r.fatalError("doctype name missing or contains unexpected characters at position "+i.getIndex());if(o&&u.name.toLowerCase()!=="html"&&r.warning("Unexpected DOCTYPE in HTML document at position "+i.getIndex()),i.skipBlanks(),i.substringStartsWith(M.PUBLIC)||i.substringStartsWith(M.SYSTEM)){var s=M.ExternalID_match.exec(i.substringFromIndex());if(!s)return r.fatalError("doctype external id is not well-formed at position "+i.getIndex());s.groups.SystemLiteralOnly!==void 0?u.systemId=s.groups.SystemLiteralOnly:(u.systemId=s.groups.SystemLiteral,u.publicId=s.groups.PubidLiteral),i.skip(s[0].length)}else if(o&&i.substringStartsWithCaseInsensitive(M.SYSTEM)){if(i.skip(M.SYSTEM.length),i.skipBlanks()<1)return r.fatalError("Expected whitespace after "+M.SYSTEM+" at position "+i.getIndex());if(u.systemId=i.getMatch(M.ABOUT_LEGACY_COMPAT_SystemLiteral),!u.systemId)return r.fatalError("Expected "+M.ABOUT_LEGACY_COMPAT+" in single or double quotes after "+M.SYSTEM+" at position "+i.getIndex())}return o&&u.systemId&&!M.ABOUT_LEGACY_COMPAT_SystemLiteral.test(u.systemId)&&r.warning("Unexpected doctype.systemId in HTML document at position "+i.getIndex()),o||(i.skipBlanks(),u.internalSubset=ps(i,r)),i.skipBlanks(),i.char()!==">"?r.fatalError("doctype not terminated with > at position "+i.getIndex()):(i.skip(1),n.startDTD(u.name,u.publicId,u.systemId,u.internalSubset),n.endDTD(),i.getIndex())}default:return r.fatalError('Not well-formed XML starting with "<!" at position '+e)}}function fs(t,e,n,r){var o=t.substring(e).match(M.PI);if(!o)return r.fatalError("Invalid processing instruction starting at position "+e);if(o[1].toLowerCase()==="xml"){if(e>0)return r.fatalError("processing instruction at position "+e+" is an xml declaration which is only at the start of the document");if(!M.XMLDecl.test(t.substring(e)))return r.fatalError("xml declaration is not well-formed")}return n.processingInstruction(o[1],o[2]),e+o[0].length}function No(){this.attributeNames=Object.create(null)}No.prototype={setTagName:function(t){if(!M.QName_exact.test(t))throw new Error("invalid tagName:"+t);this.tagName=t},addValue:function(t,e,n){if(!M.QName_exact.test(t))throw new Error("invalid attribute:"+t);this.attributeNames[t]=this.length,this[this.length++]={qName:t,value:e,offset:n}},length:0,getLocalName:function(t){return this[t].localName},getLocator:function(t){return this[t].locator},getQName:function(t){return this[t].qName},getURI:function(t){return this[t].uri},getValue:function(t){return this[t].value}};gn.XMLReader=xo;gn.parseUtils=So;gn.parseDoctypeCommentOrCData=Io});var Po=ne(yt=>{"use strict";var Xe=Ke(),ms=or(),hs=_t(),Lo=vo(),gs=Bo(),bs=ms.DOMImplementation,ys=Xe.hasDefaultHTMLNamespace,vs=Xe.isHTMLMimeType,ws=Xe.isValidMimeType,ko=Xe.MIME_TYPE,ar=Xe.NAMESPACE,Oo=hs.ParseError,Es=gs.XMLReader;function Fo(t){return t.replace(/\r[\n\u0085]/g,`
`).replace(/[\r\u0085\u2028\u2029]/g,`
`)}function Mo(t){if(t=t||{},t.locator===void 0&&(t.locator=!0),this.assign=t.assign||Xe.assign,this.domHandler=t.domHandler||yn,this.onError=t.onError||t.errorHandler,t.errorHandler&&typeof t.errorHandler!="function")throw new TypeError("errorHandler object is no longer supported, switch to onError!");t.errorHandler&&t.errorHandler("warning","The `errorHandler` option has been deprecated, use `onError` instead!",this),this.normalizeLineEndings=t.normalizeLineEndings||Fo,this.locator=!!t.locator,this.xmlns=this.assign(Object.create(null),t.xmlns)}Mo.prototype.parseFromString=function(t,e){if(!ws(e))throw new TypeError('DOMParser.parseFromString: the provided mimeType "'+e+'" is not valid.');var n=this.assign(Object.create(null),this.xmlns),r=Lo.XML_ENTITIES,o=n[""]||null;ys(e)?(r=Lo.HTML_ENTITIES,o=ar.HTML):e===ko.XML_SVG_IMAGE&&(o=ar.SVG),n[""]=o,n.xml=n.xml||ar.XML;var i=new this.domHandler({mimeType:e,defaultNamespace:o,onError:this.onError}),a=this.locator?{}:void 0;this.locator&&i.setDocumentLocator(a);var c=new Es;c.errorHandler=i,c.domBuilder=i;var u=!Xe.isHTMLMimeType(e);return u&&typeof t!="string"&&c.errorHandler.fatalError("source is not a string"),c.parse(this.normalizeLineEndings(String(t)),n,r),i.doc.documentElement||c.errorHandler.fatalError("missing root element"),i.doc};function yn(t){var e=t||{};this.mimeType=e.mimeType||ko.XML_APPLICATION,this.defaultNamespace=e.defaultNamespace||null,this.cdata=!1,this.currentElement=void 0,this.doc=void 0,this.locator=void 0,this.onError=e.onError}function bt(t,e){e.lineNumber=t.lineNumber,e.columnNumber=t.columnNumber}yn.prototype={startDocument:function(){var t=new bs;this.doc=vs(this.mimeType)?t.createHTMLDocument(!1):t.createDocument(this.defaultNamespace,"")},startElement:function(t,e,n,r){var o=this.doc,i=o.createElementNS(t,n||e),a=r.length;bn(this,i),this.currentElement=i,this.locator&&bt(this.locator,i);for(var c=0;c<a;c++){var t=r.getURI(c),u=r.getValue(c),n=r.getQName(c),s=o.createAttributeNS(t,n);this.locator&&bt(r.getLocator(c),s),s.value=s.nodeValue=u,i.setAttributeNode(s)}},endElement:function(t,e,n){this.currentElement=this.currentElement.parentNode},startPrefixMapping:function(t,e){},endPrefixMapping:function(t){},processingInstruction:function(t,e){var n=this.doc.createProcessingInstruction(t,e);this.locator&&bt(this.locator,n),bn(this,n)},ignorableWhitespace:function(t,e,n){},characters:function(t,e,n){if(t=_o.apply(this,arguments),t){if(this.cdata)var r=this.doc.createCDATASection(t);else var r=this.doc.createTextNode(t);this.currentElement?this.currentElement.appendChild(r):/^\s*$/.test(t)&&this.doc.appendChild(r),this.locator&&bt(this.locator,r)}},skippedEntity:function(t){},endDocument:function(){this.doc.normalize()},setDocumentLocator:function(t){t&&(t.lineNumber=0),this.locator=t},comment:function(t,e,n){t=_o.apply(this,arguments);var r=this.doc.createComment(t);this.locator&&bt(this.locator,r),bn(this,r)},startCDATA:function(){this.cdata=!0},endCDATA:function(){this.cdata=!1},startDTD:function(t,e,n,r){var o=this.doc.implementation;if(o&&o.createDocumentType){var i=o.createDocumentType(t,e,n,r);this.locator&&bt(this.locator,i),bn(this,i),this.doc.doctype=i}},reportError:function(t,e){if(typeof this.onError=="function")try{this.onError(t,e,this)}catch(n){throw new Oo("Reporting "+t+' "'+e+'" caused '+n,this.locator)}else console.error("[xmldom "+t+"]	"+e,Ds(this.locator))},warning:function(t){this.reportError("warning",t)},error:function(t){this.reportError("error",t)},fatalError:function(t){throw this.reportError("fatalError",t),new Oo(t,this.locator)}};function Ds(t){if(t)return`
@#[line:`+t.lineNumber+",col:"+t.columnNumber+"]"}function _o(t,e,n){return typeof t=="string"?t.substr(e,n):t.length>=e+n||e?new java.lang.String(t,e,n)+"":t}"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g,function(t){yn.prototype[t]=function(){return null}});function bn(t,e){t.currentElement?t.currentElement.appendChild(e):t.doc.appendChild(e)}function Cs(t){if(t==="error")throw"onErrorStopParsing"}function As(){throw"onWarningStopParsing"}yt.__DOMHandler=yn;yt.DOMParser=Mo;yt.normalizeLineEndings=Fo;yt.onErrorStopParsing=Cs;yt.onWarningStopParsing=As});var Ro=ne(H=>{"use strict";var vt=Ke();H.assign=vt.assign;H.hasDefaultHTMLNamespace=vt.hasDefaultHTMLNamespace;H.isHTMLMimeType=vt.isHTMLMimeType;H.isValidMimeType=vt.isValidMimeType;H.MIME_TYPE=vt.MIME_TYPE;H.NAMESPACE=vt.NAMESPACE;var vn=_t();H.DOMException=vn.DOMException;H.DOMExceptionName=vn.DOMExceptionName;H.ExceptionCode=vn.ExceptionCode;H.ParseError=vn.ParseError;var te=or();H.Attr=te.Attr;H.CDATASection=te.CDATASection;H.CharacterData=te.CharacterData;H.Comment=te.Comment;H.Document=te.Document;H.DocumentFragment=te.DocumentFragment;H.DocumentType=te.DocumentType;H.DOMImplementation=te.DOMImplementation;H.Element=te.Element;H.Entity=te.Entity;H.EntityReference=te.EntityReference;H.LiveNodeList=te.LiveNodeList;H.NamedNodeMap=te.NamedNodeMap;H.Node=te.Node;H.NodeList=te.NodeList;H.Notation=te.Notation;H.ProcessingInstruction=te.ProcessingInstruction;H.Text=te.Text;H.XMLSerializer=te.XMLSerializer;var wn=Po();H.DOMParser=wn.DOMParser;H.normalizeLineEndings=wn.normalizeLineEndings;H.onErrorStopParsing=wn.onErrorStopParsing;H.onWarningStopParsing=wn.onWarningStopParsing});var sr=ne((ll,qo)=>{"use strict";var{DOMParser:xs,XMLSerializer:wt}=Ro(),Uo="http://schemas.microsoft.com/winfx/2006/xaml";function $(t,e){for(let n=0;n<t.childNodes.length;n++){let r=t.childNodes[n];if(r.nodeType===1&&r.localName===e)return r}return null}function Le(t){if(!t)return null;for(let e=0;e<t.childNodes.length;e++)if(t.childNodes[e].nodeType===1)return t.childNodes[e];return null}function Ts(t){return t.getAttributeNS(Uo,"Name")||t.getAttribute("x:Name")||null}function Ss(t){return t.getAttributeNS(Uo,"Key")||t.getAttribute("x:Key")||null}function Is(t){let e=$(t,"VisualPropertiesStorage");if(e)return e;for(let n=0;n<t.childNodes.length;n++){let r=t.childNodes[n];if(!(r.nodeType!==1||!r.localName.includes("."))&&(e=$(r,"VisualPropertiesStorage"),e))return e}return null}function Ns(t){let e=Is(t);if(!e)return{x:0,y:0};let n=0,r=0;for(let o=0;o<e.childNodes.length;o++){let i=e.childNodes[o];if(i.nodeType!==1)continue;let a=Ss(i);a==="ElementX"&&(n=parseFloat(i.textContent)||0),a==="ElementY"&&(r=parseFloat(i.textContent)||0)}return{x:n,y:r}}function Qe(t){let e=$(t,"DirectiveStep.Action");if(e)return Le(e);for(let n=0;n<t.childNodes.length;n++){let r=t.childNodes[n];if(r.nodeType===1&&!(r.localName.includes(".")||r.localName==="VisualPropertiesStorage"))return r}return null}function En(t){let e=$(t,"DirectiveCondition.Condition");if(e)return Le(e);for(let n=0;n<t.childNodes.length;n++){let r=t.childNodes[n];if(r.nodeType===1&&!(r.localName.includes(".")||r.localName==="VisualPropertiesStorage"))return r}return null}var Bs={CustomCodeAction:"Execute Custom Code",EnableDirectivesAction:"Enable Post Directive",RaiseExceptionAction:"Raise Exception",SetDataFieldAction:"Set Data Field",CallMethodAction:"Invoke BO Method",CompleteMethodCallAction:"Complete Method Call",SendEmailAction:"Send E-mail",ActivityTrackingAction:"Activity Tracking",LogMessageAction:"Log Message",ShowMessageAction:"Show Message",AttachDataTagAction:"Attach Data Tag",RemoveDataTagAction:"Remove Data Tag",AttachHoldAction:"Attach Hold",RemoveHoldsAction:"Remove Holds",EnablePostDirectiveAction:"Enable Post Directive",InvokeFunctionAction:"Invoke Function",InvokeExternalMethodAction:"Invoke External Method"},Ls={CustomCodeCondition:"C# Condition",FieldCondition:"Field Condition"};function $o(t){if(!t)return null;let e=t.localName,n={};for(let m=0;m<t.attributes.length;m++){let h=t.attributes[m];h.name.startsWith("xmlns")||(n[h.name]=h.value)}let r=t.hasAttribute("Code")?t.getAttribute("Code"):null,o=null,i=Le(t);i&&i.localName==="String"&&(o=i.textContent);let a=null,c=null;if(e==="SetBpmDataFieldAction"){let m=$(t,e+".Expression");if(m){let g=$(m,"ExpressionDefinition");g&&(a=g.getAttribute("Text"))}let h=$(t,e+".Field");if(h){let g=$(h,"ColumnInfo");g&&(c={tableName:g.getAttribute("TableName"),columnName:g.getAttribute("ColumnName")})}}let u=null;if(e==="InvokeEpicorFunctionAction2"||e==="InvokeEpicorFunctionAction"){u=[];for(let m of["InputParameters","OutputParameters"]){let h=$(t,e+"."+m);if(!h)continue;let g=$(h,"Array")||h;for(let l=0;l<g.childNodes.length;l++){let p=g.childNodes[l];if(p.nodeType!==1||p.localName!=="ParameterBinding2")continue;let d=$(p,"ParameterBinding2.BindingTarget"),y=d?$(d,"VariableBindingTarget"):null;u.push({paramName:p.getAttribute("ParameterName")||"",paramDirection:p.getAttribute("ParameterDirection")||"Input",variableName:y&&y.getAttribute("VariableName")||""})}}}let s=null;if(e==="ConditionBlock"){s=[];let h=$(t,"ConditionBlock.Items")||t;for(let g=0;g<h.childNodes.length;g++){let l=h.childNodes[g];if(l.nodeType!==1||l.localName!=="ConditionBlockItem")continue;let p=l.getAttribute("Operator")||"None",d=$(l,"ConditionBlockItem.Condition"),y=d?Le(d):null;if(!y)continue;let v=y.localName,w={};for(let A=0;A<y.attributes.length;A++){let T=y.attributes[A];T.name.startsWith("xmlns")||(w[T.name]=T.value)}let b=null,D=$(y,v+".Expression");if(D){let A=$(D,"ExpressionDefinition");A&&(b=A.getAttribute("Text"))}let E=null,C=$(y,v+".Field");if(C){let A=$(C,"ColumnInfo");A&&(E={tableName:A.getAttribute("TableName"),columnName:A.getAttribute("ColumnName")})}s.push({localName:v,attrs:w,itemOperator:p,expressionText:b,fieldInfo:E})}}return{localName:e,attrs:n,code:r,message:o,conditions:s,actionExpressionText:a,actionFieldInfo:c,paramBindings:u,label:Bs[e]||Ls[e]||e}}function Ve(t){if(!t)return null;let e=new xs({onError:(u,s)=>{if(u==="fatalError")throw new Error(s)}}).parseFromString(t,"text/xml"),n=e.documentElement;if(!n||n.localName!=="DirectiveDefinition2")return null;let r=[],o=[],i=new Set;function a(u,s,m){if(!u||u.localName==="Null"||u.getAttribute("x:Null")!==null)return;let h=Ts(u)||`_node${r.length}`;if(i.has(h)){s!==null&&o.push({from:s,to:h,label:m});return}i.add(h),s!==null&&o.push({from:s,to:h,label:m});let{x:g,y:l}=Ns(u);if(u.localName==="DirectiveCondition"){r.push({id:h,type:"condition",widget:$o(En(u)),x:g,y:l,_el:u});let p=$(u,"DirectiveCondition.True"),d=$(u,"DirectiveCondition.False"),y=p?Le(p):null;y?a(y,h,"True"):o.push({from:h,to:null,label:"True"});let v=u.getAttribute("False"),w=d?Le(d):null;w?a(w,h,"False"):(!v||v==="{x:Null}")&&o.push({from:h,to:null,label:"False"})}else if(u.localName==="DirectiveStep"){r.push({id:h,type:"step",widget:$o(Qe(u)),x:g,y:l,_el:u});let p=$(u,"DirectiveStep.Next");p&&a(Le(p),h,null)}}let c=$(n,"DirectiveDefinition2.StartNode");return c&&a(Le(c),null,null),{nodes:r,edges:o,startNodeId:r[0]?.id??null,doc:e,root:n}}function Os(t,e,n){let r=Ve(t);if(!r)throw new Error("Failed to parse directive XAML");let o=r.nodes.find(a=>a.id===e);if(!o)throw new Error(`Node "${e}" not found`);let i=o.type==="condition"?En(o._el):Qe(o._el);if(!i)throw new Error(`No widget element found in node "${e}"`);if(!i.hasAttribute("Code"))throw new Error(`Widget ${i.localName} has no Code attribute`);return i.setAttribute("Code",n),new wt().serializeToString(r.doc)}function _s(t,e,n){let r=Ve(t);if(!r)throw new Error("Failed to parse directive XAML");let o=r.nodes.find(c=>c.id===e);if(!o||o.type!=="step")throw new Error(`Step node "${e}" not found`);let i=Qe(o._el);if(!i||i.localName!=="RaiseExceptionAction")throw new Error(`Node "${e}" is not a RaiseExceptionAction`);let a=Le(i);return a&&a.localName==="String"&&(a.textContent=n),new wt().serializeToString(r.doc)}function ks(t,e,n){let r=Ve(t);if(!r)throw new Error("Failed to parse directive XAML");let o=r.nodes.find(s=>s.id===e);if(!o)throw new Error(`Node "${e}" not found`);let i=o.type==="condition"?En(o._el):Qe(o._el);if(!i||i.localName!=="ConditionBlock")throw new Error("Not a ConditionBlock node");let c=$(i,"ConditionBlock.Items")||i,u=[];for(let s=0;s<c.childNodes.length;s++){let m=c.childNodes[s];m.nodeType===1&&m.localName==="ConditionBlockItem"&&u.push(m)}for(let{index:s,conditionAttrs:m,expressionText:h,itemOperator:g,fieldInfo:l}of n){let p=u[s];if(!p)continue;g!==void 0&&p.setAttribute("Operator",g);let d=$(p,"ConditionBlockItem.Condition"),y=d?Le(d):null;if(y){if(m)for(let[v,w]of Object.entries(m))y.setAttribute(v,w);if(h!==void 0){let v=$(y,y.localName+".Expression");if(v){let w=$(v,"ExpressionDefinition");w&&w.setAttribute("Text",h)}}if(l){let v=$(y,y.localName+".Field");if(v){let w=$(v,"ColumnInfo");w&&(l.tableName!==void 0&&w.setAttribute("TableName",l.tableName),l.columnName!==void 0&&w.setAttribute("ColumnName",l.columnName))}}}}return new wt().serializeToString(r.doc)}function Fs(t,e,n){let r=Ve(t);if(!r)throw new Error("Failed to parse directive XAML");let o=r.nodes.find(a=>a.id===e);if(!o)throw new Error(`Node "${e}" not found`);let i=o.type==="condition"?En(o._el):Qe(o._el);if(!i)throw new Error(`No widget element found in node "${e}"`);for(let[a,c]of Object.entries(n))i.setAttribute(a,c);return new wt().serializeToString(r.doc)}function Ms(t,e,n,r){let o=Ve(t);if(!o)throw new Error("Failed to parse directive XAML");let i=o.nodes.find(c=>c.id===e);if(!i)throw new Error(`Node "${e}" not found`);let a=Qe(i._el);if(!a)throw new Error(`No action element found in node "${e}"`);for(let[c,u]of Object.entries(n))a.setAttribute(c,u);for(let{paramName:c,variableName:u}of r)for(let s of["InputParameters","OutputParameters"]){let m=$(a,a.localName+"."+s);if(!m)continue;let h=$(m,"Array")||m;for(let g=0;g<h.childNodes.length;g++){let l=h.childNodes[g];if(l.nodeType!==1||l.localName!=="ParameterBinding2"||l.getAttribute("ParameterName")!==c)continue;let p=$(l,"ParameterBinding2.BindingTarget"),d=p?$(p,"VariableBindingTarget"):null;d&&d.setAttribute("VariableName",u)}}return new wt().serializeToString(o.doc)}function Ps(t,e,n,r){let o=Ve(t);if(!o)throw new Error("Failed to parse directive XAML");let i=o.nodes.find(c=>c.id===e);if(!i)throw new Error(`Node "${e}" not found`);let a=Qe(i._el);if(!a)throw new Error(`No action element found in node "${e}"`);if(n!==void 0){let c=$(a,a.localName+".Expression");if(c){let u=$(c,"ExpressionDefinition");u&&u.setAttribute("Text",n)}}if(r){let c=$(a,a.localName+".Field");if(c){let u=$(c,"ColumnInfo");u&&(r.tableName!==void 0&&u.setAttribute("TableName",r.tableName),r.columnName!==void 0&&u.setAttribute("ColumnName",r.columnName))}}return new wt().serializeToString(o.doc)}var Rs=new Set(["Id","ValidationState","IsNewRow","RowMod","BitFlag","SysRevID","SysRowID","Code"]);function $s(t,e){let n=[];if(!t)return n.push(e+"(no widget)"),n;let r=Object.entries(t.attrs||{}).filter(([o])=>!o.startsWith("xmlns")&&!o.startsWith("x:")&&!Rs.has(o)).sort(([o],[i])=>o.localeCompare(i));for(let[o,i]of r)n.push(e+o+" = "+i);t.message!=null&&n.push(e+"Message = "+t.message),t.actionFieldInfo&&n.push(e+"Field = "+(t.actionFieldInfo.tableName||"")+"."+(t.actionFieldInfo.columnName||"")),t.actionExpressionText!=null&&n.push(e+"Expression = "+t.actionExpressionText);for(let o of t.paramBindings||[])n.push(e+"Param "+o.paramDirection+" "+o.paramName+" <-> "+o.variableName);if((t.conditions||[]).forEach((o,i)=>{let a=[];if(i>0&&a.push(o.itemOperator),a.push(o.localName),o.fieldInfo&&a.push((o.fieldInfo.tableName||"")+"."+(o.fieldInfo.columnName||"")),o.attrs&&o.attrs.Operator&&a.push(o.attrs.Operator),o.expressionText!=null&&a.push(o.expressionText),o.attrs&&o.attrs.Filter!==void 0&&a.push("["+o.attrs.Filter+"]"),n.push(e+"Condition "+(i+1)+": "+a.join(" ")),o.attrs&&o.attrs.Code)for(let c of String(o.attrs.Code).split(`
`))n.push(e+"  | "+c)}),t.code!=null){n.push(e+"Code:");for(let o of String(t.code).split(`
`))n.push(e+"  | "+o)}return n}function Us(t){let e;try{e=Ve(t)}catch{return null}if(!e||e.nodes.length===0)return null;let n=new Map(e.nodes.map((i,a)=>[i.id,a+1])),r=i=>i==null?"(end)":"["+(n.get(i)??"?")+"]",o=[];return e.nodes.forEach((i,a)=>{o.push("["+(a+1)+"] "+(i.type==="condition"?"Condition":"Step")+": "+(i.widget?.label||i.widget?.localName||"(unknown)")),o.push(...$s(i.widget,"    "));for(let c of e.edges.filter(u=>u.from===i.id))o.push("    "+(c.label?c.label+" -> ":"-> ")+r(c.to));o.push("")}),o.join(`
`)}qo.exports={parseDirective:Ve,setNodeCode:Os,setRaiseExceptionMessage:_s,setNodeAttrs:Fs,setConditionChildren:ks,setInvokeFunctionAction:Ms,setActionField:Ps,directiveToCanonicalText:Us}});var Ho=ne((ul,jo)=>{"use strict";var Wt=require("vscode"),{parseDirective:qs,setNodeCode:js,setRaiseExceptionMessage:Hs,setNodeAttrs:Vs,setConditionChildren:zs,setInvokeFunctionAction:Ws,setActionField:Gs}=sr(),Dn=new Map;function Ys(t,e,n){let r=n.DirectiveID;if(Dn.has(r)){Dn.get(r).reveal(Wt.ViewColumn.One);return}let o=n.DirectiveType===1?"Pre":n.DirectiveType===3?"Post":n.DirectiveType===2?"Base":"",i=Wt.window.createWebviewPanel("bpmWidgets",`BPM: ${o} ${n.Name}`,Wt.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});Dn.set(r,i),i.onDidDispose(()=>Dn.delete(r),null,t.subscriptions);let a=n.Body;function c(){let s=qs(a);if(!s||s.nodes.length===0){i.webview.html=Js("Could not parse directive XAML, or no widget nodes found.<br>This directive may be a pure C# code directive with no visual widgets.");return}let m={nodes:s.nodes.map(h=>({id:h.id,type:h.type,widget:h.widget?{localName:h.widget.localName,label:h.widget.label,code:h.widget.code,message:h.widget.message,attrs:h.widget.attrs,conditions:h.widget.conditions,paramBindings:h.widget.paramBindings,actionExpressionText:h.widget.actionExpressionText,actionFieldInfo:h.widget.actionFieldInfo}:null,x:h.x,y:h.y})),edges:s.edges};i.webview.html=Xs(n.Name,o,m)}c(),i.webview.onDidReceiveMessage(async s=>{s.type==="saveCode"?await u(s.nodeId,()=>js(a,s.nodeId,s.code)):s.type==="saveMessage"?await u(s.nodeId,()=>Hs(a,s.nodeId,s.message)):s.type==="saveAttrs"?await u(s.nodeId,()=>Vs(a,s.nodeId,s.attrs)):s.type==="saveConditions"?await u(s.nodeId,()=>zs(a,s.nodeId,s.conditions)):s.type==="saveInvokeFunction"?await u(s.nodeId,()=>Ws(a,s.nodeId,s.attrs,s.paramBindings)):s.type==="saveActionField"&&await u(s.nodeId,()=>Gs(a,s.nodeId,s.expressionText,s.fieldInfo))},null,t.subscriptions);async function u(s,m){try{i.webview.postMessage({type:"saving"});let h=m(),g=await e.getBpmMethodRaw("BO",n.BpMethodCode),l=Ks(g,n.DirectiveID,h),d=((await e.updateBpmRaw(l))?.returnObj?.BpMessageSvc||[]).filter(y=>y.Severity>1);if(d.length)throw new Error(d.map(y=>y.Message).join("; "));a=h,n.Body=h,i.webview.postMessage({type:"saved"}),Wt.window.showInformationMessage(`BPM: "${n.Name}" saved.`)}catch(h){i.webview.postMessage({type:"saveError",message:h.message}),Wt.window.showErrorMessage(`BPM Widget push failed: ${h.message}`)}}}function Ks(t,e,n){let r=t.indexOf('"BpDirective":[');if(r<0)throw new Error("BpDirective array not found in tableset");let o=`"DirectiveID":"${e}"`,i=t.indexOf("[",r)+1;for(;i<t.length;){let a=t.indexOf("{",i);if(a<0)break;let c=0,u=!1,s=!1,m=-1;for(let C=a;C<t.length;C++){let A=t[C];if(u){if(s){s=!1;continue}if(A==="\\"){s=!0;continue}A==='"'&&(u=!1);continue}if(A==='"'){u=!0;continue}if(A==="{")c++;else if(A==="}"&&(c--,!c)){m=C;break}}if(m<0)throw new Error("Malformed BpDirective object in tableset");let h=t.slice(a,m+1);if(!h.includes(o)){i=m+1;continue}let g='"Body":"',l=h.indexOf(g);if(l<0)throw new Error("Body field not found in directive row");let p=l+g.length,d=p,y=!1;for(;d<h.length;){let C=h[d];if(y){y=!1,d++;continue}if(C==="\\"){y=!0,d++;continue}if(C==='"')break;d++}let v=JSON.stringify(n).slice(1,-1),w=h.slice(0,p)+v+h.slice(d),b=t.slice(0,a)+h+","+w+t.slice(m+1),D='"BitFlag":0,"RowMod":""',E=b.indexOf(D,a+h.length+1);if(E<0)throw new Error(`RowMod anchor not found for directive ${e}`);return b.slice(0,E)+'"BitFlag":0,"RowMod":"U"'+b.slice(E+D.length)}throw new Error(`Directive ${e} not found in tableset`)}function Js(t){return`<!DOCTYPE html><html><body style="color:#f87171;font-family:sans-serif;padding:24px;background:#1e1e1e;font-size:13px">${t}</body></html>`}function Xs(t,e,n){let r=Qs(),o=JSON.stringify(n),i=JSON.stringify(t),a=JSON.stringify(e);return`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${r}';">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#1e1e1e;color:#d4d4d4;font-family:var(--vscode-font-family,system-ui,sans-serif);font-size:13px;display:flex;flex-direction:column;height:100vh;overflow:hidden}
#hdr{padding:8px 12px;background:#252526;border-bottom:1px solid #3e3e42;display:flex;align-items:center;gap:8px;flex-shrink:0}
#hdr h2{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.badge{background:#0e639c;color:#fff;padding:2px 8px;border-radius:3px;font-size:11px}
#cwrap{flex:1;overflow:auto;position:relative;min-height:150px}
#canvas{position:relative}
#esvg{position:absolute;top:0;left:0;pointer-events:none;overflow:visible}
.nd{position:absolute;border-radius:5px;border:2px solid;padding:6px 10px;cursor:pointer;user-select:none;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:filter .1s}
.nd:hover{filter:brightness(1.25)}
.nd.sel{outline:2px solid rgba(255,255,255,.7);outline-offset:2px}
.nl{font-size:11px;font-weight:600;text-align:center;line-height:1.3}
.ns{font-size:10px;opacity:.6;text-align:center;margin-top:2px}
#props{flex-shrink:0;border-top:1px solid #3e3e42;background:#252526;max-height:260px;overflow-y:auto}
#pi{padding:10px 12px}
#pt{font-weight:600;margin-bottom:6px;font-size:12px;color:#9ca3af}
textarea,input[type=text]{width:100%;background:#1e1e1e;color:#d4d4d4;border:1px solid #3e3e42;border-radius:3px;padding:5px 7px;font-family:'Menlo','Consolas',monospace;font-size:12px}
textarea{resize:vertical;min-height:90px}
button{background:#0e639c;color:#fff;border:none;padding:5px 14px;border-radius:3px;cursor:pointer;font-size:12px;margin-top:6px}
button:hover{background:#1177bb}
button:disabled{opacity:.5;cursor:default}
.ro{color:#6b7280;font-style:italic;font-size:12px}
.ar{font-size:11px;margin:2px 0}.ak{color:#9ca3af}
</style></head><body>
<div id="hdr"><h2 id="dn"></h2><span id="db" class="badge"></span></div>
<div id="cwrap"><div id="canvas">
<svg id="esvg"><defs><marker id="arr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3z" fill="#6b7280"/></marker></defs></svg>
</div></div>
<div id="props"><div id="pi">
<div id="pt">Click a node to inspect or edit</div>
<div id="pb"></div>
</div></div>
<script nonce="${r}">
const vscode=acquireVsCodeApi();
const G=${o},DN=${i},TL=${a};
const NW=160,NH=56,CW=140,CH=70,PAD=60;
const ST={
  CustomCodeAction:        {bg:'#3b1f5e',bd:'#7c3aed',fg:'#e9d5ff'},
  CustomCodeCondition:     {bg:'#1e3a5f',bd:'#2563eb',fg:'#bfdbfe'},
  EnableDirectivesAction:  {bg:'#14532d',bd:'#16a34a',fg:'#bbf7d0'},
  EnablePostDirectiveAction:{bg:'#14532d',bd:'#16a34a',fg:'#bbf7d0'},
  RaiseExceptionAction:    {bg:'#7f1d1d',bd:'#dc2626',fg:'#fecaca'},
  SetDataFieldAction:      {bg:'#164e63',bd:'#0891b2',fg:'#a5f3fc'},
  CallMethodAction:        {bg:'#1a2f5e',bd:'#1d4ed8',fg:'#bfdbfe'},
  CompleteMethodCallAction:{bg:'#14432d',bd:'#059669',fg:'#a7f3d0'},
  SendEmailAction:         {bg:'#1e3040',bd:'#0ea5e9',fg:'#bae6fd'},
  LogMessageAction:        {bg:'#2d2d2d',bd:'#6b7280',fg:'#e5e7eb'},
  ShowMessageAction:       {bg:'#2d2d2d',bd:'#6b7280',fg:'#e5e7eb'},
  InvokeEpicorFunctionAction2:{bg:'#1a2a3a',bd:'#38bdf8',fg:'#7dd3fc'},
  InvokeEpicorFunctionAction: {bg:'#1a2a3a',bd:'#38bdf8',fg:'#7dd3fc'},
  SetBpmDataFieldAction:   {bg:'#1a3040',bd:'#0284c7',fg:'#7dd3fc'},
};
const DS={bg:'#2d2d2d',bd:'#6b7280',fg:'#e5e7eb'};
document.getElementById('dn').textContent=DN;
document.getElementById('db').textContent=TL;
const nm={};G.nodes.forEach(n=>nm[n.id]=n);
// Auto-layout fallback: if all nodes cluster at (0,0) positions weren't parsed
const allZero=G.nodes.every(n=>n.x===0&&n.y===0);
if(allZero&&G.nodes.length>0){
  // BFS from start, assign positions in rows
  const visited=new Set(),queue=[{id:G.nodes[0].id,col:0,row:0}];
  const rowCounts={};
  while(queue.length){
    const {id,row}=queue.shift();
    if(visited.has(id))continue;
    visited.add(id);
    rowCounts[row]=(rowCounts[row]||0);
    const col=rowCounts[row]++;
    const n=nm[id];
    if(n){n.x=PAD+col*200;n.y=PAD+row*120;}
    G.edges.filter(e=>e.from===id&&e.to).forEach(e=>queue.push({id:e.to,col:0,row:row+1}));
  }
}
let mx=400,my=300;
G.nodes.forEach(n=>{const w=n.type==='condition'?CW:NW,h=n.type==='condition'?CH:NH;mx=Math.max(mx,n.x+w+PAD);my=Math.max(my,n.y+h+PAD);});
const cv=document.getElementById('canvas');
cv.style.width=mx+'px';cv.style.height=my+'px';
const sv=document.getElementById('esvg');
sv.setAttribute('width',mx);sv.setAttribute('height',my);
G.nodes.forEach(n=>{
  const w=n.type==='condition'?CW:NW,h=n.type==='condition'?CH:NH;
  const s=ST[n.widget?.localName]||DS;
  const d=document.createElement('div');
  d.className='nd';d.dataset.id=n.id;
  d.style.cssText='left:'+n.x+'px;top:'+n.y+'px;width:'+w+'px;height:'+h+'px;background:'+s.bg+';border-color:'+s.bd+';color:'+s.fg;
  const l=document.createElement('div');l.className='nl';
  l.textContent=n.widget?.label||(n.type==='condition'?'Condition':'Step');
  d.appendChild(l);
  if(n.type==='condition'){const ss=document.createElement('div');ss.className='ns';ss.textContent='True / False';d.appendChild(ss);}
  d.addEventListener('click',()=>sel(n.id));
  cv.appendChild(d);
});
G.edges.forEach(e=>{
  if(!e.from||!e.to)return;
  const s=nm[e.from],d=nm[e.to];if(!s||!d)return;
  const sw=s.type==='condition'?CW:NW,sh=s.type==='condition'?CH:NH,dw=d.type==='condition'?CW:NW;
  const sx=s.x+sw/2,sy=s.y+sh,tx=d.x+dw/2,ty=d.y;
  const c=Math.max(40,Math.abs(ty-sy)*.5);
  const p=document.createElementNS('http://www.w3.org/2000/svg','path');
  p.setAttribute('d','M'+sx+','+sy+' C'+sx+','+(sy+c)+' '+tx+','+(ty-c)+' '+tx+','+ty);
  p.setAttribute('stroke','#6b7280');p.setAttribute('stroke-width','1.5');
  p.setAttribute('fill','none');p.setAttribute('marker-end','url(#arr)');
  sv.appendChild(p);
  if(e.label){
    const t=document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x',(sx+tx)/2+4);t.setAttribute('y',(sy+ty)/2);
    t.setAttribute('fill','#9ca3af');t.setAttribute('font-size','11');
    t.textContent=e.label;sv.appendChild(t);
  }
});
// Structural attrs \u2014 never display or edit these
const STRUCTURAL=new Set(['Id','ValidationState','TerminateOnError','IsNewRow','RowMod','BitFlag','SysRevID','SysRowID']);
// Whitelisted editable attrs per widget type. Multiple candidates per concept
// because Epicor uses slightly different names across versions.
// Only attrs that actually exist on the node element will be shown.
const EDITABLE={
  SetDataFieldAction:        [{k:'TableName'},{k:'FieldName'},{k:'NewValue'},{k:'Value'},{k:'SetValueType'},{k:'ValueType'}],
  EnableDirectivesAction:    [{k:'DirectiveName'},{k:'GroupName'},{k:'DirectiveGroup'}],
  EnablePostDirectiveAction: [{k:'DirectiveName'},{k:'GroupName'},{k:'DirectiveGroup'}],
  FieldCondition:            [{k:'LeftValue'},{k:'Left'},{k:'FieldName'},{k:'Operator'},{k:'RightValue'},{k:'Right'},{k:'CompareValue'}],
  LogMessageAction:          [{k:'Message',rows:3},{k:'Severity'}],
  ShowMessageAction:         [{k:'Message',rows:3},{k:'Title'}],
  CallMethodAction:          [{k:'SvcCode'},{k:'MethodCode'},{k:'BOName'},{k:'MethodName'}],
  CompleteMethodCallAction:  [{k:'SvcCode'},{k:'MethodCode'},{k:'BOName'},{k:'MethodName'}],
  SendEmailAction:           [{k:'To'},{k:'CC'},{k:'From'},{k:'Subject'},{k:'Body',rows:4}],
  ActivityTrackingAction:    [{k:'Description'},{k:'Status'}],
  AttachDataTagAction:       [{k:'TagID'},{k:'DataTagID'}],
  RemoveDataTagAction:       [{k:'TagID'},{k:'DataTagID'}],
  InvokeFunctionAction:      [{k:'FunctionCode'},{k:'LibraryCode'}],
  InvokeExternalMethodAction:[{k:'AssemblyName'},{k:'TypeName'},{k:'MethodName'}],
  BpmDataFormAction:         [{k:'FormId'},{k:'ShowAlways'},{k:'Company'},{k:'CustomizationId'},{k:'CustomizationKey1'},{k:'CustomizationKey3'},{k:'CustomizationTypeCode'}],
  BpmDataFormAction2:        [{k:'FormId'},{k:'ShowAlways'},{k:'Company'},{k:'CustomizationId'},{k:'CustomizationKey1'},{k:'CustomizationKey3'},{k:'CustomizationTypeCode'}],
};
let sid=null;
function addLbl(parent,text){const d=document.createElement('div');d.style.cssText='font-size:11px;color:#9ca3af;margin-top:6px;margin-bottom:2px';d.textContent=text;parent.appendChild(d);}
function addRo(parent,k,v){const d=document.createElement('div');d.className='ar';d.innerHTML='<span class="ak">'+esc(k)+':</span> '+esc(String(v));parent.appendChild(d);}
function mkInput(v,rows){
  if(rows&&rows>1){const t=document.createElement('textarea');t.value=v;t.rows=rows;return t;}
  const i=document.createElement('input');i.type='text';i.value=v;return i;
}
function sel(id){
  document.querySelectorAll('.nd.sel').forEach(e=>e.classList.remove('sel'));
  const el=document.querySelector('.nd[data-id="'+CSS.escape(id)+'"]');
  if(el)el.classList.add('sel');
  sid=id;
  const n=nm[id];if(!n)return;
  const pt=document.getElementById('pt'),pb=document.getElementById('pb');
  pt.textContent=n.widget?.label||n.type;pt.style.color='#d4d4d4';
  pb.innerHTML='';
  const wn=n.widget?.localName||'';
  const attrs=n.widget?.attrs||{};

  if(wn==='CustomCodeAction'||wn==='CustomCodeCondition'){
    addLbl(pb,'C# Code');
    const ta=document.createElement('textarea');ta.value=n.widget.code||'';ta.rows=7;pb.appendChild(ta);
    const btn=mkBtn('Push to Epicor',()=>{btn.disabled=true;btn.textContent='Saving\u2026';vscode.postMessage({type:'saveCode',nodeId:id,code:ta.value});});
    pb.appendChild(btn);
    return;
  }
  if(wn==='RaiseExceptionAction'){
    addLbl(pb,'Exception Message');
    const inp=document.createElement('input');inp.type='text';inp.value=n.widget.message||'';inp.placeholder='Exception message\u2026';pb.appendChild(inp);
    const btn=mkBtn('Push to Epicor',()=>{btn.disabled=true;btn.textContent='Saving\u2026';vscode.postMessage({type:'saveMessage',nodeId:id,message:inp.value});});
    pb.appendChild(btn);
    return;
  }
  if(wn==='ConditionBlock'){
    const conds=n.widget.conditions||[];
    if(!conds.length){const d=document.createElement('div');d.className='ro';d.textContent='No child conditions found in XAML.';pb.appendChild(d);return;}
    // Actual XAML enum values (Epicor uses these, not Equal/NotEqual)
    const COND_OPS=[['EqualsTo','is equal to'],['NotEqualsTo','is not equal to'],['LessThen','is less than'],['LessThenOrEquals','is less or equal to'],['MoreThen','is more than'],['MoreThenOrEquals','is more or equal to'],['BeginsWith','begins with'],['EndsWith','ends with'],['Contains','contains'],['Matches','matches']];
    const ITEM_OPS=[['None','(first)'],['And','AND'],['Or','OR']];
    const condInputMaps=[];
    conds.forEach((cond,ci)=>{
      if(ci>0){const hr=document.createElement('div');hr.style.cssText='margin:10px 0 4px;border-top:1px solid #3e3e42';pb.appendChild(hr);}
      const hdr=document.createElement('div');hdr.style.cssText='font-size:10px;color:#6b7280;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em';
      hdr.textContent=(ci===0?'':'')+'Condition '+(ci+1);pb.appendChild(hdr);
      const im={condAttrs:{},expressionInp:null,itemOpSel:null};

      // AND/OR connector (ConditionBlockItem.Operator)
      if(ci>0){
        addLbl(pb,'Join operator');
        const sel=document.createElement('select');
        sel.style.cssText='width:100%;background:#1e1e1e;color:#d4d4d4;border:1px solid #3e3e42;border-radius:3px;padding:5px 7px;font-size:12px';
        ITEM_OPS.forEach(([val,lbl])=>{const o=document.createElement('option');o.value=val;o.textContent=lbl;if(val===cond.itemOperator)o.selected=true;sel.appendChild(o);});
        pb.appendChild(sel);im.itemOpSel=sel;
      }

      // Field info \u2014 editable (table + column as separate inputs)
      let tableInp=null,colInp=null;
      if(cond.fieldInfo){
        addLbl(pb,'Table');
        tableInp=document.createElement('input');tableInp.type='text';tableInp.value=cond.fieldInfo.tableName||'';pb.appendChild(tableInp);
        addLbl(pb,'Column');
        colInp=document.createElement('input');colInp.type='text';colInp.value=cond.fieldInfo.columnName||'';pb.appendChild(colInp);
      }
      im.tableInp=tableInp;im.colInp=colInp;

      // Condition operator (EqualsTo, MoreThen, etc.)
      const opVal=cond.attrs['Operator']||'';
      if(opVal){
        addLbl(pb,'Operator');
        const sel=document.createElement('select');
        sel.style.cssText='width:100%;background:#1e1e1e;color:#d4d4d4;border:1px solid #3e3e42;border-radius:3px;padding:5px 7px;font-size:12px';
        COND_OPS.forEach(([val,lbl])=>{const o=document.createElement('option');o.value=val;o.textContent=lbl;if(val===opVal)o.selected=true;sel.appendChild(o);});
        if(!COND_OPS.find(([v])=>v===opVal)){const o=document.createElement('option');o.value=opVal;o.textContent=opVal;o.selected=true;sel.appendChild(o);}
        pb.appendChild(sel);im.condAttrs['Operator']=sel;
      }

      // Filter attr (Added/Updated/Changed) if present
      const filterVal=cond.attrs['Filter'];
      if(filterVal!==undefined){
        addLbl(pb,'Filter (row state)');
        const inp=document.createElement('input');inp.type='text';inp.value=filterVal;
        pb.appendChild(inp);im.condAttrs['Filter']=inp;
      }

      // Expression text (the value being compared)
      if(cond.expressionText!==null&&cond.expressionText!==undefined){
        addLbl(pb,'Comparison (C# Expression)');
        const inp=document.createElement('input');inp.type='text';inp.value=cond.expressionText;
        pb.appendChild(inp);im.expressionInp=inp;
      }

      // CustomCodeCondition: show code
      if(cond.localName==='CustomCodeCondition'&&cond.attrs['Code']!==undefined){
        addLbl(pb,'C# Code');
        const ta=document.createElement('textarea');ta.value=cond.attrs['Code']||'';ta.rows=5;
        pb.appendChild(ta);im.condAttrs['Code']=ta;
      }

      condInputMaps.push({index:ci,map:im});
    });
    const btn=mkBtn('Push to Epicor',()=>{
      const updates=condInputMaps.map(({index,map})=>{
        const condAttrs={};
        Object.entries(map.condAttrs).forEach(([k,el])=>{condAttrs[k]=el.value;});
        const u={index,conditionAttrs:condAttrs};
        if(map.expressionInp)u.expressionText=map.expressionInp.value;
        if(map.itemOpSel)u.itemOperator=map.itemOpSel.value;
        if(map.tableInp||map.colInp)u.fieldInfo={tableName:map.tableInp?.value,columnName:map.colInp?.value};
        return u;
      });
      btn.disabled=true;btn.textContent='Saving\u2026';
      vscode.postMessage({type:'saveConditions',nodeId:id,conditions:updates});
    });
    pb.appendChild(btn);
    return;
  }

  if(wn==='InvokeEpicorFunctionAction2'||wn==='InvokeEpicorFunctionAction'){
    addLbl(pb,'Function ID');
    const fidInp=document.createElement('input');fidInp.type='text';fidInp.value=attrs['FunctionId']||'';pb.appendChild(fidInp);
    addLbl(pb,'Library ID');
    const lidInp=document.createElement('input');lidInp.type='text';lidInp.value=attrs['LibraryId']||'';pb.appendChild(lidInp);
    const pbs=n.widget.paramBindings||[];
    const paramInputs={};
    const inputs=pbs.filter(p=>p.paramDirection==='Input');
    const outputs=pbs.filter(p=>p.paramDirection==='Output');
    function secHdr(txt){const d=document.createElement('div');d.style.cssText='font-size:10px;color:#6b7280;margin-top:10px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em';d.textContent=txt;pb.appendChild(d);}
    if(inputs.length){secHdr('Input Parameters');inputs.forEach(p=>{addLbl(pb,p.paramName+' \u2192');const inp=document.createElement('input');inp.type='text';inp.value=p.variableName;pb.appendChild(inp);paramInputs[p.paramName]=inp;});}
    if(outputs.length){secHdr('Output Parameters');outputs.forEach(p=>{addLbl(pb,p.paramName+' \u2190');const inp=document.createElement('input');inp.type='text';inp.value=p.variableName;pb.appendChild(inp);paramInputs[p.paramName]=inp;});}
    const btn=mkBtn('Push to Epicor',()=>{
      const updatedParams=(n.widget.paramBindings||[]).map(p=>({paramName:p.paramName,variableName:paramInputs[p.paramName]?paramInputs[p.paramName].value:p.variableName}));
      btn.disabled=true;btn.textContent='Saving\u2026';
      vscode.postMessage({type:'saveInvokeFunction',nodeId:id,attrs:{FunctionId:fidInp.value,LibraryId:lidInp.value},paramBindings:updatedParams});
    });
    pb.appendChild(btn);
    return;
  }
  if(wn==='SetBpmDataFieldAction'){
    const fi=n.widget.actionFieldInfo||{};
    const et=n.widget.actionExpressionText;
    addLbl(pb,'Table');
    const tblInp=document.createElement('input');tblInp.type='text';tblInp.value=fi.tableName||'';pb.appendChild(tblInp);
    addLbl(pb,'Column');
    const colInp=document.createElement('input');colInp.type='text';colInp.value=fi.columnName||'';pb.appendChild(colInp);
    let expInp=null;
    if(et!==null&&et!==undefined){
      addLbl(pb,'Value (C# Expression)');
      expInp=document.createElement('input');expInp.type='text';expInp.value=et;pb.appendChild(expInp);
    }
    const btn=mkBtn('Push to Epicor',()=>{
      btn.disabled=true;btn.textContent='Saving\u2026';
      vscode.postMessage({type:'saveActionField',nodeId:id,expressionText:expInp?expInp.value:undefined,fieldInfo:{tableName:tblInp.value,columnName:colInp.value}});
    });
    pb.appendChild(btn);
    return;
  }
  // Generic whitelist-driven editor
  const specs=EDITABLE[wn]||[];
  const allPairs=Object.entries(attrs).filter(([k])=>!k.startsWith('xmlns')&&!k.startsWith('x:')&&!STRUCTURAL.has(k));
  const editableKeySet=new Set(specs.map(s=>s.k));
  const editPairs=allPairs.filter(([k])=>editableKeySet.has(k));
  const roPairs  =allPairs.filter(([k])=>!editableKeySet.has(k));

  const inputMap={};
  if(editPairs.length){
    // Render inputs in whitelist order so related fields stay grouped
    specs.filter(s=>editPairs.find(([k])=>k===s.k)).forEach(s=>{
      const pair=editPairs.find(([k])=>k===s.k);if(!pair)return;
      const [k,v]=pair;
      addLbl(pb,k);
      const inp=mkInput(v,s.rows);pb.appendChild(inp);
      inputMap[k]=inp;
    });
    const btn=mkBtn('Push to Epicor',()=>{
      const toSave={};
      Object.entries(inputMap).forEach(([k,inp])=>{toSave[k]=inp.value;});
      btn.disabled=true;btn.textContent='Saving\u2026';
      vscode.postMessage({type:'saveAttrs',nodeId:id,attrs:toSave});
    });
    pb.appendChild(btn);
  } else if(!n.widget){
    const d=document.createElement('div');d.className='ro';d.textContent='No widget data.';pb.appendChild(d);
  } else if(specs.length===0){
    const d=document.createElement('div');d.className='ro';d.textContent='Read-only \u2014 no editable properties defined for '+wn+'.';pb.appendChild(d);
  } else {
    const d=document.createElement('div');d.className='ro';d.textContent='No recognised attributes found on this node. Check read-only attrs below.';pb.appendChild(d);
  }

  if(roPairs.length){
    if(editPairs.length){const hr=document.createElement('div');hr.style.cssText='margin:10px 0 4px;border-top:1px solid #3e3e42';pb.appendChild(hr);}
    const lbl=document.createElement('div');lbl.style.cssText='font-size:10px;color:#6b7280;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em';lbl.textContent='Other attributes (read-only)';pb.appendChild(lbl);
    roPairs.forEach(([k,v])=>addRo(pb,k,v));
  }
}
function mkBtn(t,fn){const b=document.createElement('button');b.textContent=t;b.onclick=fn;return b;}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
window.addEventListener('message',e=>{
  const m=e.data,btn=document.querySelector('button:disabled');
  if(m.type==='saved'&&btn){btn.disabled=false;btn.textContent='Push to Epicor';}
  else if(m.type==='saveError'&&btn){btn.disabled=false;btn.textContent='Retry Push';}
});
</script>
</body></html>`}function Qs(){let t="",e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let n=0;n<32;n++)t+=e[Math.floor(Math.random()*e.length)];return t}jo.exports={openWidgetPanel:Ys}});var Ko=ne(Dt=>{"use strict";var Gt=Dt&&Dt.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&(n[r[o]]=e[r[o]]);return n.default=e,n}})();Object.defineProperty(Dt,"__esModule",{value:!0});Dt.registerUpdateCommand=cc;Dt.checkForUpdatesOnStartup=lc;var Ae=Gt(require("vscode")),zo=Gt(require("https")),Et=Gt(require("fs")),Zs=Gt(require("path")),ec=Gt(require("os")),tc="mbcpi",nc="epicor-customcode-manager",rc="micah-bragg",oc=`https://api.github.com/repos/${tc}/${nc}/releases/latest`,Vo="efx.updateSnoozedVersion";function ic(t,e){let n=s=>String(s||"0").replace(/^v/,"").split(".").map(m=>parseInt(m)||0),[r,o,i]=n(t),[a,c,u]=n(e);return a!==r?a>r:c!==o?c>o:u>i}function Wo(t,e=3){return new Promise((n,r)=>{let o=zo.get(t,{headers:{"User-Agent":"epicor-efx-manager-vscode"}},i=>{if((i.statusCode===301||i.statusCode===302)&&i.headers.location&&e>0)return n(Wo(i.headers.location,e-1));if(i.statusCode!==200)return i.resume(),r(new Error(`GitHub API returned ${i.statusCode}`));let a="";i.on("data",c=>{a+=c}),i.on("end",()=>{try{n(JSON.parse(a))}catch{r(new Error("Failed to parse GitHub API response"))}})});o.on("error",r),o.setTimeout(1e4,()=>{o.destroy(),r(new Error("Update check timed out"))})})}function Go(t,e,n=5){return new Promise((r,o)=>{let i=Et.createWriteStream(e),a=zo.get(t,{headers:{"User-Agent":"epicor-efx-manager-vscode"}},c=>{if((c.statusCode===301||c.statusCode===302)&&c.headers.location&&n>0)return i.close(),Et.unlink(e,()=>{}),r(Go(c.headers.location,e,n-1));if(c.statusCode!==200)return i.close(),Et.unlink(e,()=>{}),o(new Error(`Download failed: HTTP ${c.statusCode}`));c.pipe(i),i.on("finish",()=>i.close(r)),i.on("error",u=>{Et.unlink(e,()=>{}),o(u)})});a.on("error",c=>{Et.unlink(e,()=>{}),o(c)}),a.setTimeout(6e4,()=>{a.destroy(),o(new Error("Download timed out"))})})}async function ac(){let t=await Wo(oc),e=(t.assets||[]).find(n=>n.name&&n.name.endsWith(".vsix"));if(!e)throw new Error("No .vsix asset found in latest GitHub release");return{version:(t.tag_name||"").replace(/^v/,""),tagName:t.tag_name||"",releaseNotes:t.body||"",downloadUrl:e.browser_download_url,assetName:e.name}}async function sc(t){let e=Zs.join(ec.tmpdir(),t.assetName);await Ae.window.withProgress({location:Ae.ProgressLocation.Notification,title:`EFx: Downloading v${t.version}...`,cancellable:!1},async()=>{await Go(t.downloadUrl,e)});let n=Ae.Uri.file(e);await Ae.commands.executeCommand("workbench.extensions.installExtension",n),setTimeout(()=>{try{Et.unlinkSync(e)}catch{}},5e3),await Ae.window.showInformationMessage(`EFx Manager updated to v${t.version}. Reload window to activate?`,"Reload Now","Later")==="Reload Now"&&await Ae.commands.executeCommand("workbench.action.reloadWindow")}async function Yo(t,e=!1){let r=Ae.extensions.getExtension(`${rc}.epicor-efx-manager`)?.packageJSON?.version||"0.0.0",o;try{o=await ac()}catch(c){e||Ae.window.showWarningMessage(`EFx: Update check failed \u2014 ${c.message}`);return}if(!ic(r,o.version)){e||Ae.window.showInformationMessage(`EFx Manager is up to date (v${r})`);return}let i=t.globalState.get(Vo,"");if(e&&i===o.version)return;let a=await Ae.window.showInformationMessage(`EFx Manager v${o.version} is available (you have v${r})`,"Update Now","Later");if(a==="Update Now")try{await sc(o)}catch(c){Ae.window.showErrorMessage(`EFx: Update failed \u2014 ${c.message}`)}else a==="Later"&&await t.globalState.update(Vo,o.version)}function cc(t){t.subscriptions.push(Ae.commands.registerCommand("efx.checkForUpdates",async()=>{await Yo(t,!1)}))}function lc(t){setTimeout(()=>{Yo(t,!0).catch(()=>{})},5e3)}});var cr=ne(Cn=>{"use strict";var Jo=require("https"),Xo=require("http");function Qo(t){let e={layout:"layout",events:"events",dataviews:"dataviews",pages:"pages",rules:"rules",tools:"tools",classicLayout:"classicLayout",orphans:"orphans",properties:"properties"},n={};for(let[r,o]of Object.entries(t||{})){if(!o)continue;let i=r.replace(/\.jsonc?$/,"");if(e[i])try{n[e[i]]=JSON.parse(o)}catch{}}return n}var Yt=class{constructor(e){this.config=e}_getHeaders(){let n={"Content-Type":"application/json",Authorization:`Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64")}`};return this.config.apiKey&&(n["x-api-key"]=this.config.apiKey),n}_methodUrl(e){return`${this.config.serverUrl.replace(/\/$/,"")}/api/v2/odata/${this.config.company}/Ice.LIB.MetaFXSvc/${e}`}_call(e,n){return new Promise((r,o)=>{let i=this._methodUrl(e),a=new URL(i),c=a.protocol==="https:",u=c?Jo:Xo,s=JSON.stringify(n),m={hostname:a.hostname,port:a.port||(c?443:80),path:a.pathname+a.search,method:"POST",headers:{...this._getHeaders(),"Content-Length":Buffer.byteLength(s)},rejectUnauthorized:!1},h=u.request(m,g=>{let l="";g.on("data",p=>{l+=p}),g.on("end",()=>{if(g.statusCode>=200&&g.statusCode<300)try{r(l?JSON.parse(l):null)}catch{r(l)}else{let p=`HTTP ${g.statusCode}`;try{let d=JSON.parse(l);p=d.error?.message||d.ErrorMessage||JSON.stringify(d,null,2)}catch{p=l||p}console.error(`[MetaFX] ${e} failed ${g.statusCode}: body=`,l.slice(0,2e3)),console.error(`[MetaFX] ${e} request body was:`,s.slice(0,1e3)),o(new Error(p))}})});h.on("error",o),h.write(s),h.end()})}_get(e,n){return new Promise((r,o)=>{let i=this._methodUrl(e),a=new URL(i);a.searchParams.set("request",JSON.stringify(n));let c=a.protocol==="https:",u=c?Jo:Xo,s=this._getHeaders();delete s["Content-Type"];let m={hostname:a.hostname,port:a.port||(c?443:80),path:a.pathname+"?"+a.searchParams.toString(),method:"GET",headers:s,rejectUnauthorized:!1},h=u.request(m,g=>{let l="";g.on("data",p=>{l+=p}),g.on("end",()=>{if(g.statusCode>=200&&g.statusCode<300)try{r(l?JSON.parse(l):null)}catch{r(l)}else{let p=`HTTP ${g.statusCode}`;try{let d=JSON.parse(l);p=d.error?.message||d.ErrorMessage||l}catch{p=l||p}console.error(`[MetaFX] GET ${e} failed ${g.statusCode}:`,l.slice(0,1e3)),o(new Error(p))}})});h.on("error",o),h.end()})}async listApps(){let e=await this._call("GetApplications",{request:{Type:"view",SubType:"",SearchText:"",IncludeAllLayers:!0}});return Array.isArray(e?.returnObj)?e.returnObj:[]}async getLayers(e){let n=await this._call("GetLayers",{request:{ViewId:e,IncludeUnpublishedLayers:!0}}),r=n?.returnObj,o=i=>Array.isArray(i)&&i.length>0&&typeof i[0]=="object"&&i[0]!==null&&("LayerName"in i[0]||"LayerDescription"in i[0]||"TypeCode"in i[0]);if(Array.isArray(r))return r;if(r&&typeof r=="object"){let i=["Layers","layers","EpMetaFXLayerForApplicationList","LayerList","value","Value","data","Data","items","Items","Result","result","EpMetaFXLayerList","AppLayerList","LayerDescriptors"];for(let a of i)if(o(r[a]))return r[a];for(let[a,c]of Object.entries(r))if(o(c))return console.error("[MetaFX] GetLayers used layer-shaped fallback key:",a,"shape keys:",Object.keys(r)),c;for(let a of i)if(Array.isArray(r[a])&&r[a].length>0)return r[a];for(let[a,c]of Object.entries(r))if(Array.isArray(c)&&c.length>0)return console.error("[MetaFX] GetLayers used fallback key:",a,"shape keys:",Object.keys(r)),c;for(let a of i)if(Array.isArray(r[a]))return r[a]}return r!=null?console.error("[MetaFX] GetLayers returnObj (no array found):",JSON.stringify(r).slice(0,600)):console.error("[MetaFX] GetLayers result:",JSON.stringify(n).slice(0,600)),[]}async applicationExists(e){return(await this._call("ApplicationExists",{viewId:e}))?.returnObj===!0}async deleteApp(e){await this._call("DeleteApp",{viewId:e})}async exportApp(e){return(await this._call("ExportApp",{viewId:e}))?.returnObj||null}async getAppForLayer(e,n){console.log(`[MetaFX] getAppForLayer \u2192 viewId="${e}" layer="${n}"`);let r={id:e,properties:{deviceType:"Desktop",layers:[n],baseAppVersion:0,layerVersion:0,mode:"AppStudio",applicationType:"view",ignorePersonalization:!1,additionalContext:{doValidation:!0,menuId:"preview",inPreviewMode:!0},checkDuplicateIds:!1,debug:!1}};console.log("[MetaFX] getAppForLayer request:",JSON.stringify(r));try{let o=await this._get("GetApp",r),i=o?.returnObj;return i?(console.log("[MetaFX] getAppForLayer OK \u2014 top-level keys:",Object.keys(i)),i):(console.error("[MetaFX] getAppForLayer: empty returnObj. Full response:",JSON.stringify(o).slice(0,500)),null)}catch(o){throw console.error(`[MetaFX] getAppForLayer failed for layer="${n}":`,o.message),o}}async getApplicationInfo(e){return(await this.listApps()).find(r=>r.Id===e)||null}async getNewApplication(e,n,r){await this._call("GetNewApplication",{request:{Id:e,Type:n,SubType:r}})}_buildLayerInfo(e,n={},r=!0){let o=n.layerDescription||"";return{ViewId:e,LayerDescription:o,LayerName:o,TypeCode:n.typeCode||"KNTCCustLayer",WIP:r,IsNew:n.isNew||!1,Company:n.company||this.config.company||"",DeviceType:"Desktop",CGCCode:"",SystemFlag:!1,HasDraftContent:r,PublishParentLayers:!1,CommentText:n.comment||"",ParentLayers:null,UserName:null,Content:null,ChangedOn:new Date().toISOString().slice(0,10)+"T00:00:00",LayerUpdatedToPropDiffFormat:null,ProcessedInfo:null,LastUpdatedBy:""}}async saveApp(e,n,r={}){let o=Qo(n),i=r.subType||o.layout?.viewType||"Dashboard";return(await this._call("SaveApp",{request:{id:e,viewType:i,...o,applicationType:"view",subApplicationType:i,uxAppVersion:0,commentText:r.comment||"",deviceType:"Desktop",layerInfo:this._buildLayerInfo(e,r,!0)}}))?.returnObj}async publishApp(e,n,r={}){let o=Qo(n),i=r.subType||o.layout?.viewType||"Dashboard";return(await this._call("PublishApp",{request:{id:e,viewType:i,...o,applicationType:"view",subApplicationType:i,uxAppVersion:0,commentText:r.comment||"",deviceType:"Desktop",layerInfo:this._buildLayerInfo(e,r,!1)}}))?.returnObj}async exportLayers(e){return(await this._call("ExportLayers",{apps:e}))?.returnObj??null}async importLayers(e,n=!0){let r=await this._call("ImportLayers",{fileContent:{content:e,overwrite:n}});if(r&&typeof r=="object"){let o=r.error?.message||r.ErrorMessage||r.returnObj?.ErrorMessage||null;if(o)throw new Error(o)}return r}};Cn.KineticMetaFXClient=Yt;Cn.KineticLayerClient=Yt;Cn.KineticAppClient=Yt});var ri=ne(ni=>{"use strict";var le=require("vscode"),{EpicorClient:lr}=Pn(),{BpmClient:Zo,extractBpmCode:uc,formatBpmBodyXaml:dc}=en(),{directiveToCanonicalText:pc}=sr(),{KineticMetaFXClient:fc}=cr();function mc(t){if(!t)return{code:"",usings:""};try{let e=JSON.parse(t);return{code:e.Code||"",usings:e.Usings||""}}catch{return{code:t,usings:""}}}function ei(t){let e=t.EfxFunction||[],n=t.EfxFunctionSignature||[],r=t.EfxLibrary||[],o={};for(let s of n){let m=`${s.LibraryID}|${s.FunctionID}`;o[m]||(o[m]={inputs:[],outputs:[]});let h={name:s.ArgumentName,type:s.DataType,order:s.Order};(s.Response?o[m].outputs:o[m].inputs).push(h)}for(let s of Object.keys(o))o[s].inputs.sort((m,h)=>m.order-h.order),o[s].outputs.sort((m,h)=>m.order-h.order);let i={},a=(s,m,h)=>{(i[s]=i[s]||{})[m]=(i[s]||{})[m]||[],i[s][m].push(h)};for(let s of t.EfxRefLibrary||[])a(s.LibraryID,"libs",s.LibraryRef);for(let s of t.EfxRefAssembly||[])a(s.LibraryID,"assemblies",s.Assembly);for(let s of t.EfxRefService||[])a(s.LibraryID,"services",s.ServiceID);for(let s of t.EfxRefTable||[])a(s.LibraryID,"tables",`${s.TableID} (${s.Updatable?"rw":"ro"})`);let c={};for(let s of r)c[s.LibraryID]=s;let u={};for(let s of e){let{code:m,usings:h}=mc(s.Body);u[s.LibraryID]||(u[s.LibraryID]={}),u[s.LibraryID][s.FunctionID]={...s,_code:m,_usings:h,_sig:o[`${s.LibraryID}|${s.FunctionID}`]||{inputs:[],outputs:[]}}}return{fnMap:u,refMap:i,libDetail:c}}function hc(t,e){let n={},r=!1;for(let[c,u]of[["_code","Code"],["_usings","Usings"]]){let s=t[c]||"",m=e[c]||"",h=s===m;h||(r=!0),n[u]={a:s,b:m,same:h}}for(let c of["Description","Kind","RequireTransaction","SingleRowMode","Private","Disabled"]){let u=String(t[c]??""),s=String(e[c]??""),m=u===s;m||(r=!0),n[c]={a:u,b:s,same:m}}let o=c=>(c||[]).map(u=>`${u.name}: ${u.type}`).join(", "),i=t._sig||{},a=e._sig||{};for(let[c,u]of[["Inputs","inputs"],["Outputs","outputs"]]){let s=o(i[u]),m=o(a[u]),h=s===m;h||(r=!0),n[c]={a:s,b:m,same:h,params_a:i[u]||[],params_b:a[u]||[]}}return n.hasDiff=r,n}var gc=["DirectDBAccess","AllowCustomCodeFunctions","AllowCustomCodeWidgets","Frozen","Disabled"],bc=["Description","Owner","Revision","EpicorVersion","Mode","Notes","Package","PackageVersion","Publisher","LockedBy","LockedOn","DebugMode","DumpSources","AdvTracing"];function yc(t,e,n,r){let o={},i=!1;for(let a of["libs","assemblies","services","tables"]){let c=[...t[a]||[]].sort().join(`
`),u=[...e[a]||[]].sort().join(`
`),s=c===u;s||(i=!0),o[a]={a:c,b:u,same:s}}for(let a of gc){let c=String((n||{})[a]??""),u=String((r||{})[a]??""),s=c===u;s||(i=!0),o[a]={a:c,b:u,same:s}}for(let a of bc){let c=String((n||{})[a]??""),u=String((r||{})[a]??"");o[a]={a:c,b:u,same:c===u,infoOnly:!0}}return o.hasDiff=i,o}function An(t){return t?{FunctionID:t.FunctionID||"",Description:t.Description||"",Kind:t.Kind,RequireTransaction:t.RequireTransaction,SingleRowMode:t.SingleRowMode,Private:t.Private,Disabled:t.Disabled,_code:t._code||"",_usings:t._usings||"",_sig:t._sig||{inputs:[],outputs:[]}}:null}function vc(t,e,n,r,o,i,a,c){let u=[...new Set([...t.map(m=>m.LibraryID),...e.map(m=>m.LibraryID),...Object.keys(n),...Object.keys(r)])].sort(),s=[];for(let m of u){let h=m in n||m in a,g=m in r||m in c,l=n[m]||{},p=r[m]||{},d=[...new Set([...Object.keys(l),...Object.keys(p)])].sort(),y=[];for(let b of d){let D=l[b],E=p[b];if(!D)y.push({fnID:b,status:"only-b",fa:null,fb:An(E)});else if(!E)y.push({fnID:b,status:"only-a",fa:An(D),fb:null});else{let C=hc(D,E);y.push({fnID:b,status:C.hasDiff?"diff":"match",fa:An(D),fb:An(E),fields:C})}}let v=yc(o[m]||{},i[m]||{},a[m],c[m]),w;h?g?y.some(b=>b.status!=="match")||v.hasDiff?w="diff":w="match":w="only-a":w="only-b",s.push({libID:m,status:w,inA:h,inB:g,libDiff:v,fnDiffs:y})}return s}function wc(t,e){let n={},r=!1,o=t._code||"",i=e._code||"",a=o===i;a||(r=!0),n.Code={a:o,b:i,same:a};let c=t._bodyNorm||"",u=e._bodyNorm||"",s=c===u;s||(r=!0),n.Xaml=s?{a:"",b:"",same:!0}:{a:c,b:u,same:!1};for(let m of["DirectiveType","IsEnabled","Sequence"]){let h=String(t[m]??""),g=String(e[m]??""),l=h===g;l||(r=!0),n[m]={a:h,b:g,same:l}}return n.hasDiff=r,n}function xn(t){return t?{name:t.Name||"",DirectiveType:t.DirectiveType,IsEnabled:t.IsEnabled,Sequence:t.Sequence,hasCode:t.hasCode||!1,_code:t._code||""}:null}function Ec(t,e,n,r){let o={},i={};for(let g of t)o[g.BpMethodCode]=g;for(let g of n)i[g.BpMethodCode]=g;let a={},c={};for(let g of e)a[g.BpMethodCode]||(a[g.BpMethodCode]={}),a[g.BpMethodCode][g.Name]=g;for(let g of r)c[g.BpMethodCode]||(c[g.BpMethodCode]={}),c[g.BpMethodCode][g.Name]=g;let u=[...new Set([...Object.keys(o),...Object.keys(i)])].sort(),s={};for(let g of u){let l=o[g]||i[g],p=`${l.SystemCode||"Erp"}:${l.BusinessObject||g}`;s[p]||(s[p]={systemCode:l.SystemCode||"Erp",businessObject:l.BusinessObject||g,methods:[]});let d=a[g]||{},y=c[g]||{},v=[...new Set([...Object.keys(d),...Object.keys(y)])].sort(),w=[];for(let C of v){let A=d[C],T=y[C];if(!A)w.push({name:C,status:"only-b",da:null,db:xn(T)});else if(!T)w.push({name:C,status:"only-a",da:xn(A),db:null});else{let I=wc(A,T);w.push({name:C,status:I.hasDiff?"diff":"match",da:xn(A),db:xn(T),fields:I})}}let b=g in o,D=g in i,E=b?D?w.some(C=>C.status!=="match")?"diff":"match":"only-a":"only-b";s[p].methods.push({methodCode:g,methodName:l.Name||g,status:E,inA:b,inB:D,dirDiffs:w})}let m=Object.entries(s).map(([g,l])=>{let p=l.methods.reduce((y,v)=>y+v.dirDiffs.filter(w=>w.status!=="match").length,0),d=l.methods.some(y=>y.status!=="match")?"diff":"match";return{svcKey:g,systemCode:l.systemCode,businessObject:l.businessObject,status:d,diffCount:p,methods:l.methods}});m.sort((g,l)=>{let p={diff:0,"only-a":1,"only-b":2,match:3};return(p[g.status]??4)-(p[l.status]??4)||g.businessObject.localeCompare(l.businessObject)});let h={match:0,diff:0};for(let g of m)h[g.status]=(h[g.status]||0)+1;return{services:m,counts:h,total:m.length}}function ur(t){return Array.isArray(t)?t.map(ur):t&&typeof t=="object"?Object.keys(t).sort().reduce((e,n)=>(e[n]=ur(t[n]),e),{}):t}function ti(t){if(!t||!t.trim())return t||"";try{return JSON.stringify(ur(JSON.parse(t)),null,2)}catch{return t}}var Kt=class t{constructor(e,n){this.panel=e,this.context=n,this.disposed=!1,e.webview.onDidReceiveMessage(async r=>{try{switch(r.command){case"ready":this._postProfiles();break;case"runCompare":await this._runFunctionsCompare(r);break;case"runBpmCompare":await this._runBpmCompare(r);break;case"runLayersCompare":await this._runLayersCompare(r);break;case"fetchLayerList":await this._fetchLayerList(r);break;case"fetchLayerContent":await this._fetchLayerContent(r);break;case"openNativeDiff":await this._openNativeDiff(r);break;case"applyFunction":await this._applyFunction(r);break}}catch(o){this._post({command:"error",message:o.message})}}),e.onDidDispose(()=>{this.disposed=!0,t.panels.delete(t.KEY)}),e.webview.html=this.getHtml()}static show(e){let n=t.panels.get(t.KEY);if(n&&!n.disposed){n.panel.reveal();return}let r=le.window.createWebviewPanel("efxCompare","Compare",le.ViewColumn.Two,{enableScripts:!0,retainContextWhenHidden:!0});t.panels.set(t.KEY,new t(r,e))}_post(e){this.disposed||this.panel.webview.postMessage(e)}_postProfiles(){let e=le.workspace.getConfiguration().get("efx.profiles")||[],n=le.workspace.getConfiguration().get("efx.activeProfile")||"",r=le.workspace.getConfiguration().get("efx.activeCompany")||"";this._post({command:"profiles",data:e.map(o=>({name:o.name,companies:o.companies||[]})),activeProfile:n,activeCompany:r})}async _secrets(e){let n=await this.context.secrets.get(`efx.profile.${e}.password`)||"",r=await this.context.secrets.get(`efx.profile.${e}.apiKey`)||"";if(!n)throw new Error(`No password stored for profile "${e}" \u2014 open Manage Profiles and re-enter it.`);return{password:n,apiKey:r}}async _efxClient(e,n){let o=(le.workspace.getConfiguration().get("efx.profiles")||[]).find(c=>c.name===e);if(!o)throw new Error(`Profile "${e}" not found`);let{password:i,apiKey:a}=await this._secrets(e);return new lr({serverUrl:o.serverUrl,company:n,username:o.username,password:i,apiKey:a})}async _metafxClient(e,n){let o=(le.workspace.getConfiguration().get("efx.profiles")||[]).find(c=>c.name===e);if(!o)throw new Error(`Profile "${e}" not found`);let{password:i,apiKey:a}=await this._secrets(e);return new fc({serverUrl:o.serverUrl,company:n,username:o.username,password:i,apiKey:a})}async _runFunctionsCompare({profileA:e,companyA:n,profileB:r,companyB:o}){this._post({command:"status",text:"Building clients\u2026"}),this._post({command:"compareStarted"});try{let[i,a]=await Promise.all([this._efxClient(e,n),this._efxClient(r,o)]);this._post({command:"status",text:"Fetching library lists\u2026"});let[c,u]=await Promise.all([i.getLibraryList(),a.getLibraryList()]),s=[...new Set([...c.map(C=>C.LibraryID),...u.map(C=>C.LibraryID)])];this._post({command:"status",text:`Fetching ${s.length} libraries from both environments\u2026`});let[m,h]=await Promise.all([i.request(i.getDesignerUrl("GetLibraries"),{libraryIds:s}),a.request(a.getDesignerUrl("GetLibraries"),{libraryIds:s})]);this._post({command:"status",text:"Computing diff\u2026"});for(let[C,A]of[[m,e],[h,r]])if(!C||typeof C!="object")throw new Error(`Unexpected GetLibraries response from ${A} \u2014 expected JSON, got ${typeof C}.`);let g=m.returnObj||m,l=h.returnObj||h,{fnMap:p,refMap:d,libDetail:y}=ei(g),{fnMap:v,refMap:w,libDetail:b}=ei(l),D=vc(c,u,p,v,d,w,y,b),E={match:0,diff:0,"only-a":0,"only-b":0};for(let C of D)E[C.status]=(E[C.status]||0)+1;this._post({command:"functionsReady",data:{meta:{env_a_name:e,env_b_name:r,counts:E,total:D.length},libraries:D}})}catch(i){this._post({command:"error",tab:"functions",message:i.message})}}async _runBpmCompare({profileA:e,companyA:n,profileB:r,companyB:o}){this._post({command:"status",text:"Fetching BPM services\u2026"});try{let[i,a]=await Promise.all([this._efxClient(e,n),this._efxClient(r,o)]),c=new Zo(i),u=new Zo(a),s=async l=>{let p=await l.getBpmServices(),d=6,y=new Array(p.length),v=0,w=async()=>{for(;v<p.length;){let E=v++,{SystemCode:C,ServiceKind:A,ServiceName:T}=p[E];y[E]=await l.getBpmMethodsByService(C,A,T)}};await Promise.all(Array.from({length:Math.min(d,p.length)},w));let b=[],D=[];for(let E of y){b.push(...E.methods);for(let C of E.directives){let{code:A,hasCustomCode:T}=uc(C.Body||""),I=pc(C.Body||"");D.push({BpMethodCode:C.BpMethodCode,Name:C.Name,DirectiveType:C.DirectiveType,IsEnabled:C.IsEnabled,Sequence:C.Sequence,_code:A,hasCode:T,_bodyNorm:I??dc(C.Body||"")})}}return{methods:b,directives:D}};this._post({command:"status",text:"Fetching BPM directives from both environments\u2026"});let[m,h]=await Promise.all([s(c),s(u)]);this._post({command:"status",text:"Computing BPM diff\u2026"});let g=Ec(m.methods,m.directives,h.methods,h.directives);this._post({command:"bpmReady",data:g})}catch(i){this._post({command:"error",tab:"bpm",message:i.message})}}async _runLayersCompare({profileA:e,companyA:n,profileB:r,companyB:o}){this._post({command:"status",text:"Fetching app list\u2026"});try{let[i,a]=await Promise.all([this._metafxClient(e,n),this._metafxClient(r,o)]),[c,u]=await Promise.all([i.listApps(),a.listApps()]),s=c[0]&&Object.entries(c[0]).find(([,d])=>Array.isArray(d)&&d.length>0&&typeof d[0]=="object"&&d[0]!==null&&("LayerName"in d[0]||"LayerDescription"in d[0]));s&&console.log('[comparePanel] GetApplications embeds layers under key "'+s[0]+'" \u2014 GetLayers per app may be skippable');let m=new Map(c.map(d=>[d.Id,d])),h=new Map(u.map(d=>[d.Id,d])),l=[...new Set([...m.keys(),...h.keys()])].sort().map(d=>{let y=m.get(d),v=h.get(d),w=!!y,b=!!v,D=w&&b&&y.LastUpdated!==v.LastUpdated;return{id:d,inA:w,inB:b,status:w?b?"in-both":"only-a":"only-b",timestampsDiffer:D,lastUpdatedA:y?.LastUpdated,lastUpdatedB:v?.LastUpdated,type:(y||v).Type,subType:(y||v).SubType}});l.sort((d,y)=>{let v=w=>w.status==="only-a"?0:w.status==="only-b"?1:w.timestampsDiffer?2:3;return v(d)-v(y)||d.id.localeCompare(y.id)});let p={"only-a":0,"only-b":0,"timestamps-differ":0,"in-both":0};for(let d of l)d.status==="only-a"?p["only-a"]++:d.status==="only-b"?p["only-b"]++:d.timestampsDiffer?p["timestamps-differ"]++:p["in-both"]++;this._post({command:"layersReady",data:{apps:l,counts:p,total:l.length}})}catch(i){this._post({command:"error",tab:"layers",message:i.message})}}async _fetchLayerList({appId:e,profileA:n,companyA:r,profileB:o,companyB:i}){this._post({command:"layerListLoading",appId:e});try{let[a,c]=await Promise.all([this._metafxClient(n,r),this._metafxClient(o,i)]),[u,s]=await Promise.all([a.getLayers(e).then(m=>({layers:m})).catch(m=>(console.error("[layers A]",m.message),{layers:[],error:m.message})),c.getLayers(e).then(m=>({layers:m})).catch(m=>(console.error("[layers B]",m.message),{layers:[],error:m.message}))]);this._post({command:"status",text:`Layers for ${e}: ${n}=${u.error?"ERROR":u.layers.length}, ${o}=${s.error?"ERROR":s.layers.length}`}),this._post({command:"layerListReady",appId:e,layersA:u.layers,layersB:s.layers,errorA:u.error||null,errorB:s.error||null})}catch(a){this._post({command:"layerListError",appId:e,message:a.message})}}async _fetchLayerContent({appId:e,layerKey:n,layerA:r,layerB:o,profileA:i,companyA:a,profileB:c,companyB:u}){this._post({command:"layerContentLoading",appId:e,layerKey:n});try{let[s,m]=await Promise.all([this._metafxClient(i,a),this._metafxClient(c,u)]),h=r?.LayerDescription||r?.LayerName,g=o?.LayerDescription||o?.LayerName;console.log(`[comparePanel] _fetchLayerContent appId="${e}" layerKey="${n}" descA="${h}" descB="${g}"`);let l=(b,D,E)=>D?b.getAppForLayer(e,D).then(C=>({raw:C})).catch(C=>(console.error(`[comparePanel] getAppForLayer ${E} failed:`,C.message),{raw:null,error:C.message})):Promise.resolve({raw:null}),[p,d]=await Promise.all([l(s,h,"A"),l(m,g,"B")]);if(p.error&&d.error)throw new Error(`Could not load layer content from either environment \u2014 ${p.error} / ${d.error}`);if(p.error||d.error){this._post({command:"layerContentError",appId:e,layerKey:n,message:`${p.error?i:c} failed: ${p.error||d.error}`});return}let y=b=>b?JSON.stringify(b,null,2):"",v=ti(y(p.raw)),w=ti(y(d.raw));this._post({command:"layerContentReady",appId:e,layerKey:n,normA:v,normB:w,same:v===w})}catch(s){console.error("[comparePanel] _fetchLayerContent error:",s.message),this._post({command:"layerContentError",appId:e,layerKey:n,message:s.message})}}async _applyFunction({libraryId:e,functionId:n,direction:r,profileA:o,companyA:i,profileB:a,companyB:c}){let u=r==="aToB"?o:a,s=r==="aToB"?i:c,m=r==="aToB"?a:o,h=r==="aToB"?c:i,g=`${e}.${n}`;if(await le.window.showWarningMessage(`Apply ${g} from ${u} \u2192 ${m}?`,{modal:!0},"Apply")!=="Apply"){this._post({command:"applyFnCancelled",libraryId:e,functionId:n});return}this._post({command:"applyFnStarted",libraryId:e,functionId:n});let p=!1,d=null;try{let[y,v]=await Promise.all([this._efxClient(u,s),this._efxClient(m,h)]);d=v,this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Reading ${g} from ${u}\u2026`});let w=await y.getLibrary(e),b=w?.EfxFunction?.find(P=>P.FunctionID===n);if(!b)throw new Error(`${g} not found on ${u}`);let{code:D,usings:E}=lr.extractCode(b.Body);this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Checking ${m}\u2026`});let C=await d.getLibrary(e),A=C?.EfxLibrary?.[0];if(!A)throw new Error(`Library ${e} does not exist on ${m} \u2014 create it there first.`);if(!C.EfxFunction?.some(P=>P.FunctionID===n))throw new Error(`${g} does not exist on ${m} \u2014 this applies changes to existing functions, it cannot create new ones.`);if(A.Frozen===!0){if(!A.Published)throw new Error(`${e} is locked/frozen on ${m}. Unfreeze it in Epicor first.`);if(await le.window.showWarningMessage(`${e} is promoted to production on ${m}. Demote it, apply ${n}, then re-promote?`,{modal:!0},"Demote, Apply, Re-promote")!=="Demote, Apply, Re-promote"){this._post({command:"applyFnCancelled",libraryId:e,functionId:n});return}this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Demoting ${e} on ${m}\u2026`}),await d.demoteFromProduction(e),p=!0}this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Applying to ${m}\u2026`});let T=await d.validateFunctionViaWrapper(e,n,D,E,"Utilities","ApplyChangesWithDiagnostics");if(!T.saved){let P=(T.diagnostics||T.errors||[]).map(U=>typeof U=="object"&&U!==null?[U.Code,U.Message].filter(Boolean).join(": "):String(U));throw new Error(P[0]||T.outMsg||T.outResult||"Apply rejected by Epicor")}this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Verifying on ${m}\u2026`});let I=await d.getLibrary(e),k=I?.EfxFunction?.find(P=>P.FunctionID===n);if(!k)throw new Error(`Verification failed: ${g} not found on ${m} after apply.`);let q=lr.extractCode(k.Body).code,x=P=>String(P||"").replace(/\r\n/g,`
`).trimEnd();if(x(q)!==x(D))throw new Error(`Apply reported success, but ${m} code does not match ${u}.`);let S=P=>JSON.stringify((P?.EfxFunctionSignature||[]).filter(U=>U.FunctionID===n).map(U=>[U.ArgumentName,U.DataType,!!U.Response,!!U.Optional]).sort()),B=S(w)!==S(I);this._post({command:"applyFnDone",libraryId:e,functionId:n}),B?le.window.showWarningMessage(`\u2713 Applied ${g} to ${m} \u2014 but signatures still differ. Code only; edit parameters via Execute \u2192 Edit Signatures.`):le.window.showInformationMessage(`\u2713 Verified ${g} on ${m} \u2014 code matches ${u}`)}catch(y){this._post({command:"applyFnError",libraryId:e,functionId:n,message:y.message})}finally{if(p&&d)try{this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Re-promoting ${e}\u2026`}),await d.promoteToProduction(e),this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:""})}catch(y){le.window.showErrorMessage(`\u26A0 ${e} on ${m} could NOT be re-promoted and is still demoted \u2014 promote it manually. (${y.message})`)}}}async _openNativeDiff({diffId:e,fileName:n,labelA:r,labelB:o,contentA:i,contentB:a}){let c=require("os"),u=require("path"),s=require("fs"),m=require("crypto"),h=i||"",g=a||"",l=(n||"diff").replace(/[^a-zA-Z0-9._-]/g,"_"),p=m.createHash("sha1").update(`${e||""}::${n||""}`).digest("hex").slice(0,12),d=(b,D)=>{let E=String(b||"").replace(/[^a-zA-Z0-9._-]/g,"_")||D,C=u.join(c.tmpdir(),"efx-compare",p,E);return s.mkdirSync(C,{recursive:!0}),C},y=u.join(d(r,"A"),l),v=u.join(d(o,"B"),l);s.writeFileSync(y,h,"utf8"),s.writeFileSync(v,g,"utf8");let w=`${n}: ${r||"A"} \u2194 ${o||"B"}`;await le.commands.executeCommand("vscode.diff",le.Uri.file(y),le.Uri.file(v),w)}getHtml(){return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Compare</title>
<style>
/* \u2500\u2500 Reset & root \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:var(--vscode-font-family);
  font-size:var(--vscode-font-size);
  color:var(--vscode-foreground);
  background:var(--vscode-editor-background);
  height:100vh;display:flex;flex-direction:column;overflow:hidden;
}

/* \u2500\u2500 Semantic diff status colors \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
:root{
  --c-match:   var(--vscode-testing-iconPassed,   #3fb950);
  --c-diff:    var(--vscode-list-warningForeground,#cca700);
  --c-only-a:  var(--vscode-gitDecoration-deletedResourceForeground,  #f85149);
  --c-only-b:  var(--vscode-charts-purple, #bc8cff);
  --c-match-bg:  rgba(63,185,80,  .10);
  --c-diff-bg:   rgba(204,167,0,  .10);
  --c-only-a-bg: rgba(248,81,73,  .10);
  --c-only-b-bg: rgba(188,140,255,.10);
}

/* \u2500\u2500 Header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.top-bar{
  padding:10px 16px;
  border-bottom:1px solid var(--vscode-panel-border);
  background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03));
  flex-shrink:0;
  display:flex;align-items:center;gap:12px;flex-wrap:wrap;
}
.top-bar h1{font-size:14px;font-weight:700;white-space:nowrap}
.picker{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:1}
.env-group{display:flex;align-items:center;gap:6px}
.env-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;
  color:var(--vscode-descriptionForeground);white-space:nowrap}
.env-label.a{color:var(--c-only-a)}
.env-label.b{color:var(--c-only-b)}
select{
  background:var(--vscode-dropdown-background);
  color:var(--vscode-dropdown-foreground);
  border:1px solid var(--vscode-dropdown-border);
  border-radius:3px;padding:4px 6px;
  font-size:12px;font-family:var(--vscode-font-family);cursor:pointer;
}
select:focus{outline:1px solid var(--vscode-focusBorder)}
.vs-sep{color:var(--vscode-descriptionForeground);font-size:11px;font-weight:600}
.run-btn{
  background:var(--vscode-button-background);
  color:var(--vscode-button-foreground);
  border:none;border-radius:3px;padding:5px 14px;
  font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;
}
.run-btn:hover{background:var(--vscode-button-hoverBackground)}
.run-btn:disabled{opacity:.4;cursor:not-allowed}
.status-bar{
  padding:3px 16px;font-size:11px;color:var(--vscode-descriptionForeground);
  font-style:italic;border-bottom:1px solid var(--vscode-panel-border);
  background:var(--vscode-editor-background);flex-shrink:0;min-height:22px;
}

/* \u2500\u2500 Type tabs \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.type-tabs{
  display:flex;border-bottom:2px solid var(--vscode-panel-border);
  background:var(--vscode-sideBar-background,var(--vscode-editor-background));flex-shrink:0;
}
.type-tab{
  background:none;border:none;padding:8px 16px;cursor:pointer;
  font-family:var(--vscode-font-family);font-size:12px;font-weight:700;
  color:var(--vscode-descriptionForeground);
  border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .15s;
}
.type-tab:hover:not(.active){color:var(--vscode-foreground)}
.type-tab.active{color:var(--vscode-foreground);border-bottom-color:var(--vscode-button-background)}
.tab-badge{
  font-size:9px;padding:1px 5px;border-radius:10px;margin-left:5px;font-weight:700;
  background:var(--vscode-badge-background);color:var(--vscode-badge-foreground);
}
.type-tab.active .tab-badge{background:var(--c-only-b-bg);color:var(--c-only-b)}
.type-pane{display:none;flex-direction:column;flex:1;overflow:hidden}
.type-pane.active{display:flex}

/* \u2500\u2500 Summary filter tabs (replaces pills) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.summary{
  display:flex;gap:0;padding:0;
  border-bottom:2px solid var(--vscode-panel-border);
  background:var(--vscode-sideBar-background,var(--vscode-editor-background));
  flex-shrink:0;overflow-x:auto;
}
.chip{
  background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-2px;
  padding:7px 14px;cursor:pointer;
  font-family:var(--vscode-font-family);font-size:11px;font-weight:600;
  color:var(--vscode-descriptionForeground);
  white-space:nowrap;transition:color .15s;user-select:none;
  display:inline-flex;align-items:center;gap:5px;
}
.chip:hover:not(.active){color:var(--vscode-foreground)}
.chip.active{color:var(--vscode-foreground)}
.chip-all.active    {border-bottom-color:var(--vscode-button-background)}
.chip-match.active  {border-bottom-color:var(--c-match)}
.chip-diff.active   {border-bottom-color:var(--c-diff)}
.chip-only-a.active {border-bottom-color:var(--c-only-a)}
.chip-only-b.active {border-bottom-color:var(--c-only-b)}
.chip-count{
  font-size:9px;padding:1px 5px;border-radius:10px;font-weight:700;
  background:var(--vscode-badge-background);color:var(--vscode-badge-foreground);
}

/* \u2500\u2500 Filter bar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.filter-bar{
  padding:6px 16px;border-bottom:1px solid var(--vscode-panel-border);flex-shrink:0;
}
.search{
  background:var(--vscode-input-background);color:var(--vscode-input-foreground);
  border:1px solid var(--vscode-input-border);border-radius:3px;
  padding:4px 8px;font-size:11px;font-family:var(--vscode-editor-font-family);
  outline:none;width:220px;transition:border-color .15s;
}
.search:focus{border-color:var(--vscode-focusBorder)}

/* \u2500\u2500 Split grid \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.split-grid{display:grid;grid-template-columns:280px 1fr;flex:1;overflow:hidden}
.list-col{
  border-right:1px solid var(--vscode-panel-border);overflow-y:auto;
  background:var(--vscode-sideBar-background,var(--vscode-editor-background));
}
.list-col::-webkit-scrollbar{width:4px}
.list-col::-webkit-scrollbar-thumb{background:var(--vscode-scrollbarSlider-background);border-radius:2px}
.detail-col{overflow-y:auto;background:var(--vscode-editor-background)}
.detail-col::-webkit-scrollbar{width:4px}
.detail-col::-webkit-scrollbar-thumb{background:var(--vscode-scrollbarSlider-background);border-radius:2px}

/* \u2500\u2500 List items \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.list-item{
  padding:7px 12px;border-bottom:1px solid var(--vscode-panel-border);
  cursor:pointer;display:flex;align-items:center;gap:7px;transition:background .1s;
}
.list-item:hover{background:var(--vscode-list-hoverBackground)}
.list-item.active{background:var(--vscode-list-activeSelectionBackground);color:var(--vscode-list-activeSelectionForeground)}
.list-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.s-match   .list-dot{background:var(--c-match)}
.s-diff    .list-dot{background:var(--c-diff)}
.s-only-a  .list-dot{background:var(--c-only-a)}
.s-only-b  .list-dot{background:var(--c-only-b)}
.s-in-both .list-dot{background:var(--vscode-descriptionForeground)}
.s-ts-diff .list-dot{background:var(--c-diff)}
.list-name{font-size:11px;font-family:var(--vscode-editor-font-family);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.list-badge{font-size:9px;font-family:var(--vscode-editor-font-family);padding:1px 5px;border-radius:2px;font-weight:700;flex-shrink:0}
.s-match   .list-badge{background:var(--c-match-bg);color:var(--c-match)}
.s-diff    .list-badge{background:var(--c-diff-bg);color:var(--c-diff)}
.s-only-a  .list-badge{background:var(--c-only-a-bg);color:var(--c-only-a)}
.s-only-b  .list-badge{background:var(--c-only-b-bg);color:var(--c-only-b)}
.s-in-both .list-badge{background:var(--vscode-badge-background);color:var(--vscode-badge-foreground)}
.s-ts-diff .list-badge{background:var(--c-diff-bg);color:var(--c-diff)}
.list-delta{font-size:9px;color:var(--vscode-descriptionForeground);font-family:var(--vscode-editor-font-family)}
.no-results{padding:24px;text-align:center;color:var(--vscode-descriptionForeground);font-size:11px}

/* \u2500\u2500 Empty / loading states \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.empty-state{
  height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;
  color:var(--vscode-descriptionForeground);gap:6px;font-size:12px;
}
.load-prompt{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:10px;color:var(--vscode-descriptionForeground);
}
.load-prompt button{
  background:var(--vscode-button-background);color:var(--vscode-button-foreground);
  border:none;border-radius:3px;padding:7px 18px;font-size:12px;font-weight:700;cursor:pointer;
}
.load-prompt button:hover{background:var(--vscode-button-hoverBackground)}
.load-prompt span{font-size:11px;opacity:.7}
.err-banner{
  padding:8px 16px;background:var(--c-only-a-bg);color:var(--c-only-a);
  font-size:12px;border-bottom:1px solid var(--vscode-panel-border);flex-shrink:0;
}

/* \u2500\u2500 Detail header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.detail-hdr{
  padding:14px 20px;border-bottom:1px solid var(--vscode-panel-border);
  background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03));
  position:sticky;top:0;z-index:10;
}
.detail-title{font-size:14px;font-weight:700;font-family:var(--vscode-editor-font-family);margin-bottom:5px}
.detail-meta{display:flex;gap:12px;font-size:11px;color:var(--vscode-descriptionForeground);flex-wrap:wrap;margin-bottom:8px}

/* \u2500\u2500 Collapsible lib info \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.lib-info-wrap{margin:10px 16px;border:1px solid var(--vscode-panel-border);border-radius:3px;overflow:hidden}
.lib-info-toggle{
  display:flex;align-items:center;justify-content:space-between;padding:7px 12px;
  background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03));
  cursor:pointer;user-select:none;
}
.lib-info-toggle:hover{background:var(--vscode-list-hoverBackground)}
.lib-info-label{font-size:11px;font-weight:700;display:flex;align-items:center;gap:6px}
.chevron{font-size:9px;color:var(--vscode-descriptionForeground);transition:transform .15s;flex-shrink:0}
.chevron.open{transform:rotate(90deg)}

/* \u2500\u2500 Tabs (function body / lib info) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.tabs{display:flex;background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03));border-bottom:1px solid var(--vscode-panel-border)}
.tab{
  background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-1px;
  padding:6px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;
  cursor:pointer;color:var(--vscode-descriptionForeground);transition:all .15s;
  font-family:var(--vscode-font-family);
}
.tab:hover:not(.active){color:var(--vscode-foreground)}
.tab.active{color:var(--vscode-foreground);border-bottom-color:var(--vscode-button-background)}
.pane{display:none}.pane.active{display:block}

/* \u2500\u2500 Function sections & rows \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.fn-section{padding:8px 16px 16px}
.section-lbl{
  font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
  font-family:var(--vscode-editor-font-family);
  padding:8px 0 4px;border-bottom:1px solid var(--vscode-panel-border);margin-bottom:4px;
}
.fn-row{border:1px solid var(--vscode-panel-border);border-radius:3px;margin:4px 0;overflow:hidden}
.fn-row-hdr{
  display:flex;align-items:center;gap:8px;padding:7px 10px;
  background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03));
  cursor:pointer;user-select:none;
}
.fn-row-hdr:hover{background:var(--vscode-list-hoverBackground)}
.fn-badge{font-size:9px;font-weight:700;padding:2px 6px;border-radius:2px;font-family:var(--vscode-editor-font-family);flex-shrink:0}
.fn-name{font-family:var(--vscode-editor-font-family);font-size:12px;flex:1}
.fn-changed{font-size:10px;color:var(--vscode-descriptionForeground);font-family:var(--vscode-editor-font-family)}
.fn-body{display:none;border-top:1px solid var(--vscode-panel-border)}
.fn-row.open .fn-body{display:block}
.open-diff-btn{
  background:none;border:1px solid var(--vscode-panel-border);
  color:var(--vscode-descriptionForeground);border-radius:3px;
  padding:1px 6px;font-size:10px;cursor:pointer;flex-shrink:0;line-height:1.6;
}
.open-diff-btn:hover{background:var(--vscode-button-secondaryBackground);color:var(--vscode-foreground)}
.detail-actions{display:flex;gap:6px;flex-shrink:0;align-items:center}
.apply-btn{
  background:var(--vscode-button-background);color:var(--vscode-button-foreground);
  border:none;border-radius:3px;padding:4px 10px;font-size:11px;cursor:pointer;
  font-family:var(--vscode-font-family);font-weight:600;
}
.apply-btn:hover{background:var(--vscode-button-hoverBackground)}
.apply-btn:disabled,.apply-btn-disabled{opacity:.5;cursor:default}

/* \u2500\u2500 Side-by-side diff grid \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.diff-wrap{border:1px solid var(--vscode-panel-border);border-radius:2px;overflow:hidden;margin:0}
.diff-col-hdrs{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--vscode-panel-border)}
.diff-col-hdr{padding:4px 10px;font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;font-family:var(--vscode-font-family)}
.diff-col-hdr.a{background:var(--c-only-a-bg);color:var(--c-only-a);border-right:1px solid var(--vscode-panel-border)}
.diff-col-hdr.b{background:var(--c-only-b-bg);color:var(--c-only-b)}
.diff-scroll{max-height:480px;overflow-y:auto}
.diff-scroll::-webkit-scrollbar{width:4px}
.diff-scroll::-webkit-scrollbar-thumb{background:var(--vscode-scrollbarSlider-background);border-radius:2px}
.diff-grid{display:grid;grid-template-columns:1fr 1fr}
.diff-cell{
  padding:0 10px;line-height:1.55;
  font-family:var(--vscode-editor-font-family);
  font-size:calc(var(--vscode-editor-font-size, 13px) - 1px);
  white-space:pre-wrap;word-break:break-all;min-height:20px;
}
.diff-cell:nth-child(odd){border-right:1px solid var(--vscode-panel-border)}
.diff-cell.ctx{color:var(--vscode-descriptionForeground)}
.diff-cell.add{background:var(--vscode-diffEditor-insertedTextBackground,rgba(63,185,80,.15));color:var(--vscode-foreground)}
.diff-cell.del{background:var(--vscode-diffEditor-removedTextBackground,rgba(248,81,73,.15));color:var(--vscode-foreground)}
.diff-cell.skip{color:var(--vscode-panel-border);font-style:italic;font-family:var(--vscode-font-family);font-size:10px}
.diff-cell.empty{background:var(--vscode-editor-background);opacity:.25}
.ln{
  color:var(--vscode-editorLineNumber-foreground,rgba(150,150,150,.4));
  min-width:30px;display:inline-block;text-align:right;
  margin-right:12px;user-select:none;font-size:9px;
}

/* \u2500\u2500 Inline list diff (refs) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ref-group{border-bottom:1px solid var(--vscode-panel-border)}
.ref-group:last-child{border-bottom:none}
.ref-group-hdr{display:flex;align-items:center;gap:8px;padding:5px 12px;background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03));cursor:pointer;user-select:none}
.ref-group-hdr:hover{background:var(--vscode-list-hoverBackground)}
.ref-group-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--vscode-descriptionForeground);flex:1}

/* \u2500\u2500 Meta / sig tables \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.meta-tbl{width:100%;border-collapse:collapse;font-family:var(--vscode-editor-font-family);font-size:11px}
.meta-tbl th{
  padding:5px 12px;text-align:left;font-size:9px;letter-spacing:1px;text-transform:uppercase;
  color:var(--vscode-descriptionForeground);border-bottom:1px solid var(--vscode-panel-border);
  background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03));font-weight:700;
  font-family:var(--vscode-font-family);
}
.meta-tbl td{padding:5px 12px;border-bottom:1px solid var(--vscode-panel-border);vertical-align:top;max-width:260px;word-break:break-word;white-space:pre-wrap}
.meta-tbl tr.changed td{background:var(--c-diff-bg)}
.meta-tbl td:first-child{color:var(--vscode-descriptionForeground)}
.va{color:var(--c-only-a)}.vb{color:var(--c-only-b)}.vs{color:var(--c-match)}
.sig-sec-lbl{padding:5px 12px;font-size:9px;font-family:var(--vscode-font-family);letter-spacing:1px;color:var(--vscode-descriptionForeground);text-transform:uppercase;border-bottom:1px solid var(--vscode-panel-border);background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03))}

/* \u2500\u2500 Only-one-side info block \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.only-info{padding:10px 14px;font-size:11px;color:var(--vscode-descriptionForeground)}
.code-preview{
  margin-top:8px;max-height:200px;overflow-y:auto;
  background:var(--vscode-textCodeBlock-background);border-radius:3px;
  padding:8px 10px;font-size:11px;white-space:pre-wrap;word-break:break-all;
  color:var(--vscode-foreground);font-family:var(--vscode-editor-font-family);
}
</style>
</head>
<body>

<!-- \u2500\u2500 TOP BAR \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
<div class="top-bar">
  <h1>Compare</h1>
  <div class="picker" id="picker">
    <div class="env-group">
      <span class="env-label a">Env A</span>
      <select id="profileA" onchange="onProfileChange('A')"><option value="">\u2014 profile \u2014</option></select>
      <select id="companyA"><option value="">\u2014 company \u2014</option></select>
    </div>
    <span class="vs-sep">vs</span>
    <div class="env-group">
      <span class="env-label b">Env B</span>
      <select id="profileB" onchange="onProfileChange('B')"><option value="">\u2014 profile \u2014</option></select>
      <select id="companyB"><option value="">\u2014 company \u2014</option></select>
    </div>
    <button class="run-btn" id="runBtn" onclick="runCompare()">\u25B6 Run Compare</button>
  </div>
</div>
<div class="status-bar" id="statusBar"></div>

<!-- \u2500\u2500 TYPE TABS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
<div class="type-tabs">
  <button class="type-tab active" id="tab-functions" onclick="switchTab('functions',this)">
    Functions <span class="tab-badge" id="fnBadge">\u2014</span>
  </button>
  <button class="type-tab" id="tab-bpm" onclick="switchTab('bpm',this)">
    BPMs <span class="tab-badge" id="bpmBadge">\u2014</span>
  </button>
  <button class="type-tab" id="tab-layers" onclick="switchTab('layers',this)">
    Layers <span class="tab-badge" id="layersBadge">\u2014</span>
  </button>
</div>

<!-- \u2500\u2500 FUNCTIONS PANE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
<div class="type-pane active" id="pane-functions">
  <div class="summary" id="fnSummary"></div>
  <div class="filter-bar"><input class="search" id="fnSearch" placeholder="Search libraries\u2026" oninput="fnApply()"></div>
  <div class="split-grid">
    <div class="list-col" id="fnList"></div>
    <div class="detail-col" id="fnDetail"><div class="empty-state"><span>Run a compare to begin</span></div></div>
  </div>
</div>

<!-- \u2500\u2500 BPM PANE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
<div class="type-pane" id="pane-bpm">
  <div class="load-prompt" id="bpmPrompt">
    <button onclick="loadBpm()">Load BPM Compare</button>
    <span>Fetches all directive code from both environments</span>
  </div>
  <div style="display:none;flex-direction:column;flex:1;overflow:hidden" id="bpmMain">
    <div class="summary" id="bpmSummary"></div>
    <div class="filter-bar"><input class="search" id="bpmSearch" placeholder="Search services\u2026" oninput="bpmApply()"></div>
    <div class="split-grid">
      <div class="list-col" id="bpmList"></div>
      <div class="detail-col" id="bpmDetail"><div class="empty-state"><span>Select a service</span></div></div>
    </div>
  </div>
</div>

<!-- \u2500\u2500 LAYERS PANE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
<div class="type-pane" id="pane-layers">
  <div class="load-prompt" id="layersPrompt">
    <button onclick="loadLayers()">Load Layers Compare</button>
    <span>Fetches app list \u2014 detail loads on click</span>
  </div>
  <div style="display:none;flex-direction:column;flex:1;overflow:hidden" id="layersMain">
    <div class="summary" id="layersSummary"></div>
    <div class="filter-bar"><input class="search" id="layersSearch" placeholder="Search apps\u2026" oninput="layersApply()"></div>
    <div class="split-grid">
      <div class="list-col" id="layersList"></div>
      <div class="detail-col" id="layersDetail"><div class="empty-state"><span>Select an app to diff</span></div></div>
    </div>
  </div>
</div>

<script>
const vscode = acquireVsCodeApi();
vscode.postMessage({ command: 'ready' });

// \u2500\u2500 STATE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
let PROFILES  = [];
let FN_DATA   = null;
let BPM_DATA  = null;
let LY_DATA   = null;
let FN_FILTER = 'all', FN_SEL = null;
let BPM_FILTER= 'all', BPM_SEL= null;
let LY_FILTER = 'all', LY_SEL = null;
let ACTIVE_TAB= 'functions';
let BPM_LOADED = false, LY_LOADED = false;
// Separate in-flight flags: the LOADED flags only flip on success, so without
// these a double-click fired two concurrent full fetches.
let BPM_LOADING = false, LY_LOADING = false;
let LAST_RUN   = null; // {profileA, companyA, profileB, companyB}
let LAYER_LIST_CACHE    = {}; // appId -> { layersA, layersB }
let LAYER_CONTENT_CACHE = {}; // appId::layerKey -> { normA, normB, same } | { loading } | { error }
let LAYER_OBJECTS       = {}; // appId::layerKey::a/b -> layer descriptor
let PENDING_DIFF        = null; // { appId, layerKey } -- open native diff once content loads

// \u2500\u2500 HELPERS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
// For values interpolated into a JS string literal inside an on* attribute.
// esc() alone is not enough there: it leaves ' untouched, so a layer or
// function named "Bob's Layer" closed the literal early and killed the handler
// (or worse, injected). Backslash-escape for the JS layer first, then HTML-escape
// for the attribute layer \u2014 the browser undoes them in the reverse order.
function jsAttr(s){
  return esc(String(s).replace(/\\\\/g,'\\\\\\\\').replace(/'/g,"\\\\'").replace(/\\r?\\n/g,'\\\\n'));
}
// Only treat genuinely blob-like strings as binary. The old 20-char threshold
// misclassified ordinary alphanumeric layer names (e.g. "CustomerPortalLayerV2"),
// collapsing every such layer onto its TypeCode key and silently dropping rows.
function looksLikeBinary(s) { return !!s && s.length > 64 && /^[A-Za-z0-9+/]+=*$/.test(s); }
// Stable cross-env identity for a layer. Prefer LayerName (stable) over
// LayerDescription (often version-stamped per save, so the same logical layer
// has different descriptions in each environment), then qualify with Company
// and DeviceType so same-named layers in different scopes never collide.
function layerBaseName(l) {
  const n = l.LayerName;        if (n && !looksLikeBinary(n)) return n;
  const d = l.LayerDescription; if (d && !looksLikeBinary(d)) return d;
  return l.TypeCode || '?';
}
// Key every layer row uniquely \u2014 residual duplicates (e.g. published + WIP
// rows of the same layer) get a #2/#3 suffix instead of overwriting each
// other during Map construction. Deterministic for a given input array, so
// the keys built in layerListReady match the ones built in renderLayerList.
// Placeholder rows with no identity and no content occasionally come back from
// GetLayers \u2014 hide them; they render as "?" and waste a content fetch per click.
// (GetLayers is a method call, not an OData entity set, so there is no
// server-side $filter \u2014 filtering here costs nothing since the rows already
// arrived in the same response.)
function isBlankLayer(l) {
  return !l.LayerName && !l.LayerDescription && !l.Content && !l.HasDraftContent;
}
function layerEntries(layers) {
  const used = new Map();
  // Suffix assignment must not depend on the order the server happened to
  // return rows in. If env A returned [published, wip] and env B returned
  // [wip, published], "#2" landed on a different logical layer per side and
  // the two environments got paired against the wrong counterparts. Sorting on
  // a stable discriminator first makes both sides number duplicates the same.
  // (filter() already copied, so this sort does not disturb the cached array.)
  const rows = (layers || []).filter(l => !isBlankLayer(l));
  rows.sort((x, y) =>
    layerBaseName(x).localeCompare(layerBaseName(y))
    || String(x.Company || '').localeCompare(String(y.Company || ''))
    || String(x.DeviceType || '').localeCompare(String(y.DeviceType || ''))
    || String(x.LayerDescription || '').localeCompare(String(y.LayerDescription || ''))
    || String(x.TypeCode || '').localeCompare(String(y.TypeCode || ''))
    || (x.IsPublished === y.IsPublished ? 0 : x.IsPublished ? -1 : 1));
  return rows.map(l => {
    let key = [layerBaseName(l), l.Company || '', l.DeviceType || ''].filter(Boolean).join(' \xB7 ');
    const n = used.get(key) || 0;
    used.set(key, n + 1);
    if (n > 0) key += ' #' + (n + 1);
    return { key: key, layer: l };
  });
}
function setStatus(text){ document.getElementById('statusBar').textContent = text || ''; }

// \u2500\u2500 PROFILES \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function populateProfiles(profiles, activeProfile, activeCompany) {
  PROFILES = profiles;
  const sels = [['profileA','companyA'], ['profileB','companyB']];
  sels.forEach(([pid, cid]) => {
    const pSel = document.getElementById(pid);
    pSel.innerHTML = '<option value="">\u2014 profile \u2014</option>';
    for (const p of profiles) {
      const opt = document.createElement('option');
      opt.value = opt.textContent = p.name;
      pSel.appendChild(opt);
    }
  });
  // Pre-select active profile on both sides
  if (activeProfile) {
    document.getElementById('profileA').value = activeProfile;
    document.getElementById('profileB').value = activeProfile;
    populateCompanies('A', activeProfile, activeCompany);
    populateCompanies('B', activeProfile, '');
  }
}

function populateCompanies(side, profileName, preferCompany) {
  const p = PROFILES.find(x => x.name === profileName);
  const sel = document.getElementById('company' + side);
  sel.innerHTML = '<option value="">\u2014 company \u2014</option>';
  if (!p) return;
  for (const c of p.companies) {
    const opt = document.createElement('option');
    opt.value = opt.textContent = c;
    sel.appendChild(opt);
  }
  if (preferCompany && p.companies.includes(preferCompany)) sel.value = preferCompany;
  else if (p.companies.length) sel.value = p.companies[0];
}

function onProfileChange(side) {
  const pName = document.getElementById('profile' + side).value;
  populateCompanies(side, pName, '');
}

// \u2500\u2500 TAB SWITCH \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function switchTab(tab, btn) {
  document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.type-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('pane-' + tab).classList.add('active');
  ACTIVE_TAB = tab;
}

// \u2500\u2500 RUN COMPARE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function runCompare() {
  const profileA = document.getElementById('profileA').value;
  const companyA = document.getElementById('companyA').value;
  const profileB = document.getElementById('profileB').value;
  const companyB = document.getElementById('companyB').value;
  if (!profileA || !companyA || !profileB || !companyB) {
    setStatus('\u26A0 Select both profiles and companies before running');
    return;
  }
  LAST_RUN = { profileA, companyA, profileB, companyB };
  BPM_LOADED = false; LY_LOADED = false;
  BPM_LOADING = false; LY_LOADING = false;
  LAYER_LIST_CACHE = {}; LAYER_CONTENT_CACHE = {}; LAYER_OBJECTS = {}; PENDING_DIFF = null;
  // Reset BPM + layers back to load-prompt
  document.getElementById('bpmPrompt').style.display = '';
  document.getElementById('bpmMain').style.display   = 'none';
  document.getElementById('layersPrompt').style.display = '';
  document.getElementById('layersMain').style.display   = 'none';
  document.getElementById('runBtn').disabled = true;
  setStatus('Connecting\u2026');
  vscode.postMessage({ command: 'runCompare', profileA, companyA, profileB, companyB });
}

function loadBpm() {
  if (!LAST_RUN) { setStatus('\u26A0 Run a compare first'); return; }
  if (BPM_LOADED || BPM_LOADING) return;
  BPM_LOADING = true;
  document.getElementById('bpmPrompt').style.display = 'none';
  document.getElementById('bpmMain').style.display   = 'flex';
  document.getElementById('bpmDetail').innerHTML     = '<div class="empty-state"><span>Loading BPM data\u2026</span></div>';
  setStatus('Fetching BPMs\u2026');
  vscode.postMessage({ command: 'runBpmCompare', ...LAST_RUN });
}

function loadLayers() {
  if (!LAST_RUN) { setStatus('\u26A0 Run a compare first'); return; }
  if (LY_LOADED || LY_LOADING) return;
  LY_LOADING = true;
  document.getElementById('layersPrompt').style.display = 'none';
  document.getElementById('layersMain').style.display   = 'flex';
  document.getElementById('layersDetail').innerHTML     = '<div class="empty-state"><span>Loading app list\u2026</span></div>';
  setStatus('Fetching app list\u2026');
  vscode.postMessage({ command: 'runLayersCompare', ...LAST_RUN });
}

// \u2500\u2500 MESSAGE HANDLER \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
window.addEventListener('message', ({ data: msg }) => {
  switch (msg.command) {
    case 'profiles':
      populateProfiles(msg.data, msg.activeProfile, msg.activeCompany);
      break;
    case 'compareStarted':
      FN_DATA = BPM_DATA = LY_DATA = null;
      FN_SEL = BPM_SEL = LY_SEL = null;
      document.getElementById('fnList').innerHTML = '';
      document.getElementById('fnDetail').innerHTML = '<div class="empty-state"><span>Loading\u2026</span></div>';
      document.getElementById('fnSummary').innerHTML = '';
      document.getElementById('fnBadge').textContent = '\u2026';
      break;
    case 'status':
      setStatus(msg.text);
      break;
    case 'functionsReady':
      document.getElementById('runBtn').disabled = false;
      setStatus('');
      FN_DATA = msg.data;
      document.getElementById('fnBadge').textContent = FN_DATA.meta.total;
      renderFnSummary(); fnApply();
      break;
    case 'bpmReady':
      BPM_LOADED = true; BPM_LOADING = false;
      setStatus('');
      BPM_DATA = msg.data;
      document.getElementById('bpmBadge').textContent = BPM_DATA.total;
      renderBpmSummary(); bpmApply();
      break;
    case 'layersReady':
      LY_LOADED = true; LY_LOADING = false;
      setStatus('');
      LY_DATA = msg.data;
      document.getElementById('layersBadge').textContent = LY_DATA.total;
      renderLayersSummary(); layersApply();
      document.getElementById('layersDetail').innerHTML = '<div class="empty-state"><span>Select an app to view its layers</span></div>';
      break;
    case 'layerListLoading':
      if (LY_SEL === msg.appId)
        document.getElementById('layersDetail').innerHTML = '<div class="empty-state"><span>Loading layers\u2026</span></div>';
      break;
    case 'layerListReady': {
      for (const e of layerEntries(msg.layersA)) LAYER_OBJECTS[msg.appId + '::' + e.key + '::a'] = e.layer;
      for (const e of layerEntries(msg.layersB)) LAYER_OBJECTS[msg.appId + '::' + e.key + '::b'] = e.layer;
      LAYER_LIST_CACHE[msg.appId] = { layersA: msg.layersA, layersB: msg.layersB, errorA: msg.errorA, errorB: msg.errorB };
      if (LY_SEL === msg.appId) renderLayerList(msg.appId);
      break;
    }
    case 'layerListError':
      if (LY_SEL === msg.appId)
        document.getElementById('layersDetail').innerHTML = \`<div class="err-banner">Error: \${esc(msg.message)}</div>\`;
      break;
    case 'layerContentLoading':
      LAYER_CONTENT_CACHE[\`\${msg.appId}::\${msg.layerKey}\`] = { loading: true };
      break;
    case 'layerContentReady': {
      LAYER_CONTENT_CACHE[\`\${msg.appId}::\${msg.layerKey}\`] = { normA: msg.normA, normB: msg.normB, same: msg.same };
      // Surgically update the body div if it's in the DOM
      const bodyEl = document.getElementById('lrb_' + safeId(msg.appId + '_' + msg.layerKey));
      if (bodyEl) {
        const inA = !!LAYER_OBJECTS[\`\${msg.appId}::\${msg.layerKey}::a\`];
        const inB = !!LAYER_OBJECTS[\`\${msg.appId}::\${msg.layerKey}::b\`];
        bodyEl.innerHTML = renderLayerRowBody(\`\${msg.appId}::\${msg.layerKey}\`, inA, inB, LAST_RUN.profileA, LAST_RUN.profileB);
      }
      // Auto-open native diff if pending
      if (PENDING_DIFF && PENDING_DIFF.appId === msg.appId && PENDING_DIFF.layerKey === msg.layerKey) {
        PENDING_DIFF = null;
        sendDiff(msg.normA||'', msg.normB||'', msg.layerKey.replace(/[^a-zA-Z0-9._-]/g,'_')+'.json', LAST_RUN?.profileA, LAST_RUN?.profileB, msg.appId);
      }
      break;
    }
    case 'layerContentError':
      LAYER_CONTENT_CACHE[\`\${msg.appId}::\${msg.layerKey}\`] = { error: msg.message };
      { const bodyEl2 = document.getElementById('lrb_' + safeId(msg.appId + '_' + msg.layerKey));
        if (bodyEl2) bodyEl2.innerHTML = \`<div class="only-info" style="color:var(--c-only-a)">Error: \${esc(msg.message)}</div>\`; }
      break;
    case 'applyFnStarted':
      setStatus(\`Applying \${msg.libraryId}.\${msg.functionId}\u2026\`);
      break;
    case 'applyFnStatus':
      setStatus(msg.text);
      break;
    case 'applyFnCancelled':
      setStatus('');
      break;
    case 'applyFnDone':
      setStatus(\`\u2713 Applied \${msg.functionId} \u2014 re-run compare to refresh this view\`);
      break;
    case 'applyFnError':
      setStatus('Apply failed: ' + msg.message);
      break;
    case 'error':
      document.getElementById('runBtn').disabled = false;
      setStatus('Error: ' + msg.message);
      // Put the failed tab back to its load prompt. Leaving it on a permanent
      // "Loading\u2026" pane with the retry button hidden meant the only way back
      // was re-running the whole comparison.
      if (msg.tab === 'bpm') {
        BPM_LOADING = false;
        document.getElementById('bpmPrompt').style.display = '';
        document.getElementById('bpmMain').style.display   = 'none';
      }
      if (msg.tab === 'layers') {
        LY_LOADING = false;
        document.getElementById('layersPrompt').style.display = '';
        document.getElementById('layersMain').style.display   = 'none';
      }
      break;
  }
});

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// FUNCTIONS TAB
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

function renderFnSummary() {
  const c = FN_DATA.meta.counts, m = FN_DATA.meta;
  const ea = m.env_a_name, eb = m.env_b_name;
  document.getElementById('fnSummary').innerHTML =
    chip('all',    'chip-all',   'All',               'fnFilter', m.total) +
    chip('match',  'chip-match', 'Match',             'fnFilter', c.match) +
    chip('diff',   'chip-diff',  'Different',         'fnFilter', c.diff) +
    chip('only-a', 'chip-only-a', \`Only in \${ea}\`,  'fnFilter', c['only-a']) +
    chip('only-b', 'chip-only-b', \`Only in \${eb}\`,  'fnFilter', c['only-b']);
}
function fnFilter(f, el) { FN_FILTER = f; document.querySelectorAll('[data-chip="fnFilter"]').forEach(c=>c.classList.remove('active')); el.classList.add('active'); fnApply(); }
function fnApply() {
  if (!FN_DATA) return;
  const q = (document.getElementById('fnSearch').value || '').toLowerCase();
  const items = FN_DATA.libraries.filter(l => (FN_FILTER === 'all' || l.status === FN_FILTER) && (!q || l.libID.toLowerCase().includes(q)));
  const lm = { match:'MATCH', diff:'DIFF', 'only-a': FN_DATA.meta.env_a_name, 'only-b': FN_DATA.meta.env_b_name };
  document.getElementById('fnList').innerHTML = items.length
    ? items.map(l => {
        const delta = l.fnDiffs.filter(f => f.status !== 'match').length;
        return \`<div class="list-item s-\${l.status} \${l.libID===FN_SEL?'active':''}" onclick="fnSelect('\${jsAttr(l.libID)}')">
          <div class="list-dot"></div>
          <span class="list-name" title="\${esc(l.libID)}">\${esc(l.libID)}</span>
          \${delta ? \`<span class="list-delta">\${delta}\u0394</span>\` : ''}
          <span class="list-badge">\${lm[l.status]||l.status}</span>
        </div>\`;
      }).join('')
    : '<div class="no-results">No libraries match</div>';
}
function fnSelect(libID) {
  FN_SEL = libID;
  document.querySelectorAll('#fnList .list-item').forEach(el => el.classList.toggle('active', el.querySelector('.list-name')?.title === libID));
  const lib = FN_DATA.libraries.find(l => l.libID === libID);
  if (lib) renderFnDetail(lib);
}

function renderFnDetail(lib) {
  const ea = FN_DATA.meta.env_a_name, eb = FN_DATA.meta.env_b_name;
  const sc = { match:'var(--c-match)', diff:'var(--c-diff)', 'only-a':'var(--c-only-a)', 'only-b':'var(--c-only-b)' };
  const sl = { match:'\u2713 Match', diff:'~ Different', 'only-a':\`\u2717 Only in \${ea}\`, 'only-b':\`+ Only in \${eb}\` };
  let html = \`<div class="detail-hdr">
    <div class="detail-title">\${esc(lib.libID)}</div>
    <div class="detail-meta">
      <span style="color:\${sc[lib.status]}">\${sl[lib.status]}</span>
      <span>\u2502 \${lib.fnDiffs.length} function\${lib.fnDiffs.length!==1?'s':''}</span>
      <span style="color:\${lib.inA?'var(--c-only-a)':'var(--vscode-descriptionForeground)'}">\u25CF \${ea}</span>
      <span style="color:\${lib.inB?'var(--c-only-b)':'var(--vscode-descriptionForeground)'}">\u25CF \${eb}</span>
    </div>
  </div>\`;
  html += renderLibInfoPanel(lib, ea, eb);
  html += '<div class="fn-section">';
  const groups = [{k:'diff',l:'Different',c:'var(--c-diff)'},{k:'only-a',l:\`Only in \${ea}\`,c:'var(--c-only-a)'},{k:'only-b',l:\`Only in \${eb}\`,c:'var(--c-only-b)'},{k:'match',l:'Matching',c:'var(--c-match)'}];
  for (const g of groups) {
    const fns = lib.fnDiffs.filter(f => f.status === g.k);
    if (!fns.length) continue;
    html += \`<div class="section-lbl" style="color:\${g.c}">\${g.l} (\${fns.length})</div>\`;
    for (const fn of fns) html += renderFnRow(fn, lib.libID, ea, eb);
  }
  html += '</div>';
  document.getElementById('fnDetail').innerHTML = html;
}

function renderLibInfoPanel(lib, ea, eb) {
  const hasDiff = lib.libDiff?.hasDiff;
  const ld = lib.libDiff || {};
  const refKeys  = ['libs','assemblies','services','tables'];
  const metaKeys = ['DirectDBAccess','AllowCustomCodeFunctions','AllowCustomCodeWidgets','Frozen','Disabled'];
  const infoKeys = ['Description','Owner','Revision','EpicorVersion','Mode','Notes','Package','PackageVersion','Publisher','LockedBy','LockedOn','DebugMode','DumpSources','AdvTracing'];
  const lid = 'li_' + CSS.escape(lib.libID);
  const refsDiff = refKeys.some(k => ld[k] && !ld[k].same);
  const metaDiff = metaKeys.some(k => ld[k] && !ld[k].same);

  let html = \`<div class="lib-info-wrap">
    <div class="lib-info-toggle" onclick="toggleEl('\${lid}','\${lid}_chev')">
      <span class="lib-info-label">
        \${hasDiff ? '\u26A1' : '\u{1F4CB}'} Library Info
        \${hasDiff ? \`<span style="color:var(--c-diff);font-size:9px">has differences</span>\` : \`<span style="color:var(--vscode-descriptionForeground);font-size:9px">click to expand</span>\`}
      </span>
      <span class="chevron \${hasDiff?'open':''}" id="\${lid}_chev">\u25B6</span>
    </div>
    <div id="\${lid}" style="display:\${hasDiff?'block':'none'};border-top:1px solid var(--vscode-panel-border)">
      <div class="tabs">
        <button class="tab active" onclick="switchLibTab(this,'\${lid}','refs')">References\${refsDiff?' \u26A1':''}</button>
        <button class="tab"        onclick="switchLibTab(this,'\${lid}','settings')">Settings\${metaDiff?' \u26A1':''}</button>
        <button class="tab"        onclick="switchLibTab(this,'\${lid}','info')">Info</button>
      </div>\`;

  // REFS
  html += \`<div class="pane active" data-libtab="\${lid}" data-tab="refs">\`;
  for (const k of refKeys) {
    const v = ld[k]; if (!v) continue;
    if (v.same) {
      const items = (v.a||'').split('\\n').filter(Boolean); if (!items.length) continue;
      const sid = \`\${lid}_\${k}\`;
      html += \`<div class="ref-group"><div class="ref-group-hdr" onclick="toggleEl('\${sid}','\${sid}_chev')">
        <span class="ref-group-lbl">\${k}</span>
        <span style="font-size:9px;color:var(--c-match)">\u2713 match (\${items.length})</span>
        <span class="chevron" id="\${sid}_chev">\u25B6</span></div>
        <div id="\${sid}" style="display:none"><table class="meta-tbl"><tbody>\${items.map(i=>\`<tr><td colspan="2" class="vs">\${esc(i)}</td></tr>\`).join('')}</tbody></table></div></div>\`;
    } else {
      html += \`<div class="ref-group"><div class="ref-group-hdr"><span class="ref-group-lbl">\${k}</span><span style="font-size:9px;color:var(--c-diff)">\u26A1 different</span></div>\${inlineListDiff(v.a,v.b,ea,eb)}</div>\`;
    }
  }
  html += '</div>';

  // SETTINGS
  html += \`<div class="pane" data-libtab="\${lid}" data-tab="settings"><table class="meta-tbl"><thead><tr><th>Field</th><th style="color:var(--c-only-a)">\${ea}</th><th style="color:var(--c-only-b)">\${eb}</th></tr></thead><tbody>\`;
  for (const k of metaKeys) { const v = ld[k]; if(!v) continue; html += \`<tr \${!v.same?'class="changed"':''}><td>\${k}</td><td class="\${v.same?'vs':'va'}">\${esc(v.a||'\u2014')}</td><td class="\${v.same?'vs':'vb'}">\${esc(v.b||'\u2014')}</td></tr>\`; }
  html += '</tbody></table></div>';

  // INFO
  html += \`<div class="pane" data-libtab="\${lid}" data-tab="info">
    <div style="padding:4px 12px;font-size:9px;color:var(--vscode-descriptionForeground);border-bottom:1px solid var(--vscode-panel-border);background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.03))">Informational only \u2014 differences here do not affect library status</div>
    <table class="meta-tbl"><thead><tr><th>Field</th><th style="color:var(--c-only-a)">\${ea}</th><th style="color:var(--c-only-b)">\${eb}</th></tr></thead><tbody>\`;
  for (const k of infoKeys) { const v = ld[k]; if(!v) continue; html += \`<tr><td>\${k}</td><td style="\${!v.same?'color:var(--c-only-a);opacity:.7':''}" class="\${v.same?'vs':''}">\${esc(v.a||'\u2014')}</td><td style="\${!v.same?'color:var(--c-only-b);opacity:.7':''}" class="\${v.same?'vs':''}">\${esc(v.b||'\u2014')}</td></tr>\`; }
  html += '</tbody></table></div>';

  html += '</div></div>';
  return html;
}

function renderFnRow(fn, libID, ea, eb) {
  const sc = { match:'var(--c-match)', diff:'var(--c-diff)', 'only-a':'var(--c-only-a)', 'only-b':'var(--c-only-b)' };
  const sb = { match:'MATCH', diff:'DIFF', 'only-a': ea, 'only-b': eb };
  const changed = fn.fields ? Object.entries(fn.fields).filter(([k,v])=>k!=='hasDiff'&&typeof v==='object'&&!v.same).map(([k])=>k) : [];
  const id = 'fn_' + CSS.escape(libID + '_' + fn.fnID);
  // Only offer Apply where it can actually work: the wrapper updates an
  // existing function row, so only-in-one-environment functions are excluded
  // (they need creating on the target first), as are already-matching ones.
  const applyBtns = fn.status === 'diff'
    ? \`<button class="open-diff-btn" title="Copy this function's code to \${esc(eb)}" onclick="event.stopPropagation();applyFn('\${jsAttr(libID)}','\${jsAttr(fn.fnID)}','aToB')">\u2192 \${esc(eb)}</button>\`
      + \`<button class="open-diff-btn" title="Copy this function's code to \${esc(ea)}" onclick="event.stopPropagation();applyFn('\${jsAttr(libID)}','\${jsAttr(fn.fnID)}','bToA')">\u2192 \${esc(ea)}</button>\`
    : '';
  return \`<div class="fn-row" id="\${id}">
    <div class="fn-row-hdr" onclick="toggleFn('\${id}')">
      <span class="fn-badge" style="background:\${sc[fn.status]}22;color:\${sc[fn.status]}">\${sb[fn.status]}</span>
      <span class="fn-name">\${esc(fn.fnID)}</span>
      \${changed.length?\`<span class="fn-changed">\${changed.join(', ')}</span>\`:''}
      <button class="open-diff-btn" title="Open in VS Code diff editor" onclick="event.stopPropagation();openFnDiff('\${jsAttr(libID)}','\${jsAttr(fn.fnID)}')">\u2197 Diff</button>
      \${applyBtns}
      <span class="chevron">\u25B6</span>
    </div>
    <div class="fn-body">\${renderFnBody(fn, ea, eb)}</div>
  </div>\`;
}

function renderFnBody(fn, ea, eb) {
  if (fn.status === 'match') {
    const fid = esc(fn.fnID);
    return \`<div class="tabs"><button class="tab active" onclick="switchFnTab(this,'\${fid}','code')">Code</button><button class="tab" onclick="switchFnTab(this,'\${fid}','sig')">Signature</button><button class="tab" onclick="switchFnTab(this,'\${fid}','meta')">Metadata</button></div>
      <div class="pane active" data-fn="\${fid}" data-tab="code">
        <div style="font-family:var(--vscode-editor-font-family);font-size:calc(var(--vscode-editor-font-size,13px) - 1px);padding:10px 14px;max-height:400px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;color:var(--vscode-descriptionForeground)">\${esc(fn.fa?._code||fn.fb?._code||'')}</div>
      </div>
      <div class="pane" data-fn="\${fid}" data-tab="sig">\${renderSigPane(fn,ea,eb)}</div>
      <div class="pane" data-fn="\${fid}" data-tab="meta">\${renderMetaPane(fn,ea,eb)}</div>\`;
  }
  if (fn.status === 'only-a' || fn.status === 'only-b') {
    const f = fn.fa || fn.fb, env = fn.status==='only-a'?ea:eb, fid = esc(fn.fnID);
    const envColor = fn.status==='only-a'?'var(--c-only-a)':'var(--c-only-b)';
    const synth = fn.status==='only-a'
      ? { fields:{ Inputs:{params_a:f?._sig?.inputs||[],params_b:[],same:false}, Outputs:{params_a:f?._sig?.outputs||[],params_b:[],same:false} }, fa:f, fb:null }
      : { fields:{ Inputs:{params_a:[],params_b:f?._sig?.inputs||[],same:false}, Outputs:{params_a:[],params_b:f?._sig?.outputs||[],same:false} }, fa:null, fb:f };
    const synthMeta = { fields:{}, fa:fn.status==='only-a'?f:null, fb:fn.status==='only-b'?f:null };
    for (const k of ['Description','Kind','RequireTransaction','SingleRowMode','Private','Disabled']) {
      const val = String(f?.[k]??'');
      synthMeta.fields[k] = fn.status==='only-a'?{a:val,b:'\u2014',same:false}:{a:'\u2014',b:val,same:false};
    }
    return \`<div class="tabs"><button class="tab active" onclick="switchFnTab(this,'\${fid}','code')">Code</button><button class="tab" onclick="switchFnTab(this,'\${fid}','sig')">Signature</button><button class="tab" onclick="switchFnTab(this,'\${fid}','meta')">Metadata</button></div>
      <div class="pane active" data-fn="\${fid}" data-tab="code">
        <div style="padding:4px 12px;font-size:9px;color:\${envColor};border-bottom:1px solid var(--vscode-panel-border)">Only exists in \${env}</div>
        <div style="font-family:var(--vscode-editor-font-family);font-size:calc(var(--vscode-editor-font-size,13px)-1px);padding:10px 14px;max-height:400px;overflow-y:auto;white-space:pre-wrap;word-break:break-all">\${esc(f?._code||'')}</div>
      </div>
      <div class="pane" data-fn="\${fid}" data-tab="sig">\${renderSigPane(synth,ea,eb)}</div>
      <div class="pane" data-fn="\${fid}" data-tab="meta">\${renderMetaPane(synthMeta,ea,eb)}</div>\`;
  }
  const fid = esc(fn.fnID);
  const codeDiff = !fn.fields?.Code?.same || !fn.fields?.Usings?.same;
  const sigDiff  = !fn.fields?.Inputs?.same || !fn.fields?.Outputs?.same;
  const metaDiff = ['Description','Kind','RequireTransaction','SingleRowMode','Private','Disabled'].some(k=>fn.fields?.[k]&&!fn.fields[k].same);
  return \`<div class="tabs">
    <button class="tab active" onclick="switchFnTab(this,'\${fid}','code')">Code\${codeDiff?' \u26A1':''}</button>
    <button class="tab"        onclick="switchFnTab(this,'\${fid}','sig')">Signature\${sigDiff?' \u26A1':''}</button>
    <button class="tab"        onclick="switchFnTab(this,'\${fid}','meta')">Metadata\${metaDiff?' \u26A1':''}</button>
  </div>
  <div class="pane active" data-fn="\${fid}" data-tab="code">
    \${sideBySide(fn.fields?.Code?.a||'',fn.fields?.Code?.b||'',ea,eb)}
    \${!fn.fields?.Usings?.same?\`<div style="padding:4px 12px;font-size:9px;color:var(--vscode-descriptionForeground);border-top:1px solid var(--vscode-panel-border)">USINGS</div>\${sideBySide(fn.fields.Usings.a||'',fn.fields.Usings.b||'',ea,eb)}\`:''}
  </div>
  <div class="pane" data-fn="\${fid}" data-tab="sig">\${renderSigPane(fn,ea,eb)}</div>
  <div class="pane" data-fn="\${fid}" data-tab="meta">\${renderMetaPane(fn,ea,eb)}</div>\`;
}

function renderSigPane(fn, ea, eb) {
  function tbl(label, pA, pB) {
    const names = [...new Set([...(pA||[]).map(p=>p.name),...(pB||[]).map(p=>p.name)])];
    const mA = Object.fromEntries((pA||[]).map(p=>[p.name,p]));
    const mB = Object.fromEntries((pB||[]).map(p=>[p.name,p]));
    return \`<div class="sig-sec-lbl">\${label}</div><table class="meta-tbl"><thead><tr><th>#</th><th>Name</th><th style="color:var(--c-only-a)">\${ea} Type</th><th style="color:var(--c-only-b)">\${eb} Type</th></tr></thead><tbody>\${
      names.map((name,i)=>{const pa=mA[name],pb=mB[name],same=pa&&pb&&pa.type===pb.type;
        return \`<tr \${!same?'class="changed"':''}><td style="color:var(--vscode-descriptionForeground)">\${i+1}</td><td>\${esc(name)}</td><td class="\${pa?(same?'vs':'va'):'va'}">\${pa?esc(pa.type):'\u2014'}</td><td class="\${pb?(same?'vs':'vb'):'vb'}">\${pb?esc(pb.type):'\u2014'}</td></tr>\`;
      }).join('')
    }</tbody></table>\`;
  }
  return tbl('Inputs', fn.fields?.Inputs?.params_a, fn.fields?.Inputs?.params_b) +
         tbl('Outputs', fn.fields?.Outputs?.params_a, fn.fields?.Outputs?.params_b);
}

function renderMetaPane(fn, ea, eb) {
  const keys = ['Description','Kind','RequireTransaction','SingleRowMode','Private','Disabled'];
  return \`<table class="meta-tbl"><thead><tr><th>Field</th><th style="color:var(--c-only-a)">\${ea}</th><th style="color:var(--c-only-b)">\${eb}</th></tr></thead><tbody>\${
    keys.map(k=>{ const f=fn.fields?.[k]; if(!f) return '';
      return \`<tr \${!f.same?'class="changed"':''}><td>\${k}</td><td class="\${f.same?'vs':'va'}">\${esc(f.a||'\u2014')}</td><td class="\${f.same?'vs':'vb'}">\${esc(f.b||'\u2014')}</td></tr>\`;
    }).join('')
  }</tbody></table>\`;
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// BPM TAB
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

function renderBpmSummary() {
  const c = BPM_DATA.counts;
  document.getElementById('bpmSummary').innerHTML =
    chip('all',   'chip-all',   'All',       'bpmFilter', BPM_DATA.total) +
    chip('match', 'chip-match', 'Match',     'bpmFilter', c.match||0) +
    chip('diff',  'chip-diff',  'Different', 'bpmFilter', c.diff||0);
}
function bpmFilter(f, el) { BPM_FILTER = f; document.querySelectorAll('[data-chip="bpmFilter"]').forEach(c=>c.classList.remove('active')); el.classList.add('active'); bpmApply(); }
function bpmApply() {
  if (!BPM_DATA) return;
  const q = (document.getElementById('bpmSearch').value||'').toLowerCase();
  const items = BPM_DATA.services.filter(s => (BPM_FILTER==='all'||s.status===BPM_FILTER)&&(!q||s.businessObject.toLowerCase().includes(q)));
  document.getElementById('bpmList').innerHTML = items.length
    ? items.map(s => \`<div class="list-item s-\${s.status} \${s.svcKey===BPM_SEL?'active':''}" onclick="bpmSelect('\${jsAttr(s.svcKey)}')">
        <div class="list-dot"></div>
        <span class="list-name" title="\${esc(s.svcKey)}">\${esc(s.businessObject)}</span>
        \${s.diffCount?\`<span class="list-delta">\${s.diffCount}\u0394</span>\`:''}
        <span class="list-badge">\${s.status.toUpperCase()}</span>
      </div>\`).join('')
    : '<div class="no-results">No services match</div>';
}
function bpmSelect(svcKey) {
  BPM_SEL = svcKey;
  document.querySelectorAll('#bpmList .list-item').forEach(el=>el.classList.toggle('active', el.querySelector('.list-name')?.title===svcKey));
  const svc = BPM_DATA.services.find(s=>s.svcKey===svcKey);
  if (svc) renderBpmDetail(svc);
}

function renderBpmDetail(svc) {
  const ea = LAST_RUN.profileA, eb = LAST_RUN.profileB;
  const sc = { match:'var(--c-match)', diff:'var(--c-diff)', 'only-a':'var(--c-only-a)', 'only-b':'var(--c-only-b)' };
  let html = \`<div class="detail-hdr">
    <div class="detail-title">\${esc(svc.businessObject)}</div>
    <div class="detail-meta">
      <span style="color:\${sc[svc.status]}">\${svc.status}</span>
      <span>\u2502 \${svc.methods.length} method\${svc.methods.length!==1?'s':''}</span>
      <span>\${svc.systemCode}</span>
    </div>
  </div><div class="fn-section">\`;

  const groups = [{k:'diff',l:'Different',c:'var(--c-diff)'},{k:'only-a',l:\`Only in \${ea}\`,c:'var(--c-only-a)'},{k:'only-b',l:\`Only in \${eb}\`,c:'var(--c-only-b)'},{k:'match',l:'Matching',c:'var(--c-match)'}];
  for (const g of groups) {
    const methods = svc.methods.filter(m => m.status === g.k);
    if (!methods.length) continue;
    html += \`<div class="section-lbl" style="color:\${g.c}">\${g.l} (\${methods.length})</div>\`;
    for (const m of methods) {
      html += \`<div style="padding:4px 0 2px;font-size:10px;font-weight:700;color:var(--vscode-descriptionForeground);font-family:var(--vscode-editor-font-family);margin-top:6px">\${esc(m.methodName)}</div>\`;
      for (const dir of m.dirDiffs) html += renderBpmDirRow(dir, m.methodCode, ea, eb);
    }
  }
  html += '</div>';
  document.getElementById('bpmDetail').innerHTML = html;
}

function renderBpmDirRow(dir, methodCode, ea, eb) {
  const sc = { match:'var(--c-match)', diff:'var(--c-diff)', 'only-a':'var(--c-only-a)', 'only-b':'var(--c-only-b)' };
  const sb = { match:'MATCH', diff:'DIFF', 'only-a': ea, 'only-b': eb };
  const id = 'bpm_' + CSS.escape(methodCode + '_' + dir.name);
  const typeLabel = { 1:'Pre', 2:'Base', 3:'Post' };
  const dirType = typeLabel[(dir.da||dir.db)?.DirectiveType] || '';
  const changed = dir.fields ? Object.entries(dir.fields).filter(([k,v])=>k!=='hasDiff'&&typeof v==='object'&&!v.same).map(([k])=>k) : [];
  return \`<div class="fn-row" id="\${id}">
    <div class="fn-row-hdr" onclick="toggleFn('\${id}')">
      <span class="fn-badge" style="background:\${sc[dir.status]}22;color:\${sc[dir.status]}">\${sb[dir.status]}</span>
      <span class="fn-name">\${esc(dir.name)}\${dirType?\` <span style="opacity:.5;font-size:10px">[\${dirType}]</span>\`:''}</span>
      \${changed.length?\`<span class="fn-changed">\${changed.join(', ')}</span>\`:''}
      <button class="open-diff-btn" title="Open in VS Code diff editor" onclick="event.stopPropagation();openBpmDirDiff('\${jsAttr(methodCode)}','\${jsAttr(dir.name)}')">\u2197 Diff</button>
      <span class="chevron">\u25B6</span>
    </div>
    <div class="fn-body">\${renderBpmDirBody(dir, ea, eb)}</div>
  </div>\`;
}

function renderBpmDirBody(dir, ea, eb) {
  if (dir.status === 'only-a' || dir.status === 'only-b') {
    const d = dir.da || dir.db, env = dir.status==='only-a'?ea:eb;
    const envColor = dir.status==='only-a'?'var(--c-only-a)':'var(--c-only-b)';
    return \`<div style="padding:4px 12px;font-size:9px;color:\${envColor};border-bottom:1px solid var(--vscode-panel-border)">Only in \${env}</div>
      \${d?.hasCode?\`<div style="font-family:var(--vscode-editor-font-family);font-size:calc(var(--vscode-editor-font-size,13px)-1px);padding:10px 14px;max-height:360px;overflow-y:auto;white-space:pre-wrap;word-break:break-all">\${esc(d._code||'')}</div>\`:'<div class="only-info">No custom C# code</div>'}\`;
  }
  if (dir.status === 'match') {
    const code = dir.da?._code || '';
    return \`<div style="font-family:var(--vscode-editor-font-family);font-size:calc(var(--vscode-editor-font-size,13px)-1px);padding:10px 14px;max-height:360px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;color:var(--vscode-descriptionForeground)">\${esc(code||'(no custom code)')}</div>\`;
  }
  const fid = esc(dir.name);
  const codeDiff = dir.fields?.Code && !dir.fields.Code.same;
  const xamlDiff = dir.fields?.Xaml && !dir.fields.Xaml.same;
  const metaDiff = ['DirectiveType','IsEnabled','Sequence'].some(k=>dir.fields?.[k]&&!dir.fields[k].same);
  return \`<div class="tabs">
    <button class="tab active" onclick="switchFnTab(this,'\${fid}','code')">Code\${codeDiff?' \u26A1':''}</button>
    \${xamlDiff?\`<button class="tab" onclick="switchFnTab(this,'\${fid}','xaml')">Widgets \u26A1</button>\`:''}
    <button class="tab"        onclick="switchFnTab(this,'\${fid}','meta')">Settings\${metaDiff?' \u26A1':''}</button>
  </div>
  <div class="pane active" data-fn="\${fid}" data-tab="code">\${sideBySide(dir.fields?.Code?.a||'',dir.fields?.Code?.b||'',ea,eb)}</div>
  \${xamlDiff?\`<div class="pane" data-fn="\${fid}" data-tab="xaml">\${sideBySide(dir.fields.Xaml.a||'',dir.fields.Xaml.b||'',ea,eb)}</div>\`:''}
  <div class="pane" data-fn="\${fid}" data-tab="meta">
    <table class="meta-tbl"><thead><tr><th>Field</th><th style="color:var(--c-only-a)">\${ea}</th><th style="color:var(--c-only-b)">\${eb}</th></tr></thead><tbody>\${
      ['DirectiveType','IsEnabled','Sequence'].map(k=>{ const f=dir.fields?.[k]; if(!f) return '';
        return \`<tr \${!f.same?'class="changed"':''}><td>\${k}</td><td class="\${f.same?'vs':'va'}">\${esc(f.a||'\u2014')}</td><td class="\${f.same?'vs':'vb'}">\${esc(f.b||'\u2014')}</td></tr>\`;
      }).join('')
    }</tbody></table>
  </div>\`;
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// LAYERS TAB
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

function renderLayersSummary() {
  const c = LY_DATA.counts;
  document.getElementById('layersSummary').innerHTML =
    chip('all',               'chip-all',   'All',              'lyFilter', LY_DATA.total) +
    chip('only-a',            'chip-only-a', \`Only in \${LAST_RUN?.profileA||'A'}\`, 'lyFilter', c['only-a']) +
    chip('only-b',            'chip-only-b', \`Only in \${LAST_RUN?.profileB||'B'}\`, 'lyFilter', c['only-b']) +
    chip('timestamps-differ', 'chip-diff',  'Timestamps Differ','lyFilter', c['timestamps-differ']) +
    chip('in-both',           'chip-match', 'Matching',         'lyFilter', c['in-both']);
}
function lyFilter(f, el) { LY_FILTER = f; document.querySelectorAll('[data-chip="lyFilter"]').forEach(c=>c.classList.remove('active')); el.classList.add('active'); layersApply(); }
function layersApply() {
  if (!LY_DATA) return;
  const q = (document.getElementById('layersSearch').value||'').toLowerCase();
  const items = LY_DATA.apps.filter(a => {
    if (LY_FILTER !== 'all') {
      if (LY_FILTER === 'timestamps-differ' && !(a.status==='in-both'&&a.timestampsDiffer)) return false;
      if (LY_FILTER === 'in-both' && !(a.status==='in-both'&&!a.timestampsDiffer)) return false;
      if (LY_FILTER !== 'timestamps-differ' && LY_FILTER !== 'in-both' && a.status !== LY_FILTER) return false;
    }
    return !q || a.id.toLowerCase().includes(q);
  });
  document.getElementById('layersList').innerHTML = items.length
    ? items.map(a => {
        const cls = a.status!=='in-both' ? \`s-\${a.status}\` : a.timestampsDiffer ? 's-ts-diff' : 's-in-both';
        const badge = a.status==='only-a'?LAST_RUN.profileA : a.status==='only-b'?LAST_RUN.profileB : a.timestampsDiffer?'\u23F1 DIFFER':'MATCH';
        return \`<div class="list-item \${cls} \${a.id===LY_SEL?'active':''}" onclick="layersSelect('\${jsAttr(a.id)}')">
          <div class="list-dot"></div>
          <span class="list-name" title="\${esc(a.id)}">\${esc(a.id)}</span>
          \${a.subType?\`<span class="list-delta">\${esc(a.subType)}</span>\`:''}
          <span class="list-badge">\${badge}</span>
        </div>\`;
      }).join('')
    : '<div class="no-results">No apps match</div>';
}

function layersSelect(appId) {
  LY_SEL = appId;
  document.querySelectorAll('#layersList .list-item').forEach(el=>el.classList.toggle('active', el.querySelector('.list-name')?.title===appId));
  if (LAYER_LIST_CACHE[appId]) {
    renderLayerList(appId);
  } else {
    document.getElementById('layersDetail').innerHTML = '<div class="empty-state"><span>Loading layers\u2026</span></div>';
    vscode.postMessage({ command: 'fetchLayerList', appId, ...LAST_RUN });
  }
}

// \u2500\u2500 safeId: turn any string into a valid HTML id fragment \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function safeId(s) { return String(s).replace(/[^a-zA-Z0-9_-]/g, '_'); }

// \u2500\u2500 Layer list render \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderLayerList(appId) {
  const cache = LAYER_LIST_CACHE[appId];
  if (!cache) return;
  const { layersA, layersB } = cache;
  const ea = LAST_RUN.profileA, eb = LAST_RUN.profileB;
  const app = LY_DATA?.apps.find(a=>a.id===appId);
  // layerEntries gives every row a unique key, so Map construction can no
  // longer drop layers that share a name (device/company/WIP variants).
  const mapA = new Map(layerEntries(layersA).map(e=>[e.key,e.layer]));
  const mapB = new Map(layerEntries(layersB).map(e=>[e.key,e.layer]));
  const allKeys = [...new Set([...mapA.keys(),...mapB.keys()])].sort();
  const rows = allKeys.map(key => ({ key, lA: mapA.get(key)||null, lB: mapB.get(key)||null }));

  const onlyA  = rows.filter(r=>r.lA&&!r.lB);
  const onlyB  = rows.filter(r=>!r.lA&&r.lB);
  const inBoth = rows.filter(r=>r.lA&&r.lB);

  let html = \`<div class="detail-hdr">
    <div style="font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--vscode-descriptionForeground);margin-bottom:4px">App\${app?.subType?' \xB7 '+esc(app.subType):''}</div>
    <div class="detail-title" title="\${esc(appId)}">\${esc(appId)}</div>
    <div class="detail-meta">
      <span style="color:var(--c-only-a)">\u25CF \${esc(ea)}: \${mapA.size} layer\${mapA.size!==1?'s':''}\${(layersA||[]).length>mapA.size?' ('+((layersA||[]).length-mapA.size)+' blank hidden)':''}</span>
      <span style="color:var(--c-only-b)">\u25CF \${esc(eb)}: \${mapB.size} layer\${mapB.size!==1?'s':''}\${(layersB||[]).length>mapB.size?' ('+((layersB||[]).length-mapB.size)+' blank hidden)':''}</span>
    </div>
  </div><div class="fn-section">\`;

  // Surface per-environment fetch failures \u2014 a failed GetLayers is not the
  // same thing as "this environment has 0 layers".
  if (cache.errorA) html += '<div class="err-banner">\u26A0 ' + esc(ea) + ' GetLayers failed: ' + esc(cache.errorA) + '</div>';
  if (cache.errorB) html += '<div class="err-banner">\u26A0 ' + esc(eb) + ' GetLayers failed: ' + esc(cache.errorB) + '</div>';

  if (!rows.length) {
    html += '<div class="no-results">No layers found on either environment</div>';
  } else {
    if (onlyA.length) {
      html += \`<div class="section-lbl" style="color:var(--c-only-a)">Only in \${esc(ea)} (\${onlyA.length})</div>\`;
      for (const r of onlyA) html += renderLayerRow(r, appId, ea, eb);
    }
    if (onlyB.length) {
      html += \`<div class="section-lbl" style="color:var(--c-only-b)">Only in \${esc(eb)} (\${onlyB.length})</div>\`;
      for (const r of onlyB) html += renderLayerRow(r, appId, ea, eb);
    }
    if (inBoth.length) {
      html += \`<div class="section-lbl">In Both (\${inBoth.length})</div>\`;
      for (const r of inBoth) html += renderLayerRow(r, appId, ea, eb);
    }
  }

  html += '</div>';
  document.getElementById('layersDetail').innerHTML = html;
}

function renderLayerRow(row, appId, ea, eb) {
  const { key, lA, lB } = row;
  const rid  = 'lr_'  + safeId(appId + '_' + key);
  const rbid = 'lrb_' + safeId(appId + '_' + key);
  const inA = !!lA, inB = !!lB;
  const status = !inA ? 'only-b' : !inB ? 'only-a' : 'in-both';
  const sc = { 'only-a':'var(--c-only-a)', 'only-b':'var(--c-only-b)', 'in-both':'var(--vscode-descriptionForeground)' };
  const sb = { 'only-a':esc(ea), 'only-b':esc(eb), 'in-both':'BOTH' };
  const meta = lA || lB;
  const typeLabel = meta?.TypeCode ? \`<span style="opacity:.5;font-size:10px"> [\${esc(meta.TypeCode)}]</span>\` : '';
  const compLabel = meta?.Company  ? \`<span class="list-delta">\${esc(meta.Company)}</span>\` : '';
  const wipLabel  = (lA?.IsPublished === false || lB?.IsPublished === false)
    ? '<span style="opacity:.8;font-size:10px;color:var(--c-diff)"> [WIP]</span>' : '';

  const diffBtn   = (inA && inB)
    ? \`<button class="open-diff-btn" title="Open in VS Code diff editor" onclick="event.stopPropagation();openLayerDiff('\${jsAttr(appId)}','\${jsAttr(key)}')">\u2197 Diff</button>\`
    : '';
  return \`<div class="fn-row" id="\${rid}">
    <div class="fn-row-hdr" onclick="toggleFn('\${rid}');loadLayerContent('\${jsAttr(appId)}','\${jsAttr(key)}')">
      <span class="fn-badge" style="background:\${sc[status]}22;color:\${sc[status]}">\${sb[status]}</span>
      <span class="fn-name">\${esc(key)}\${typeLabel}\${wipLabel}</span>
      \${compLabel}
      \${diffBtn}
      <span class="chevron">\u25B6</span>
    </div>
    <div class="fn-body" id="\${rbid}">\${renderLayerRowBody(\`\${appId}::\${key}\`, inA, inB, ea, eb)}</div>
  </div>\`;
}

function renderLayerRowBody(contentKey, inA, inB, ea, eb) {
  const c = LAYER_CONTENT_CACHE[contentKey];
  if (!c)           return \`<div class="only-info">Click row to load diff\u2026</div>\`;
  if (c.loading)    return \`<div class="only-info">Loading\u2026</div>\`;
  if (c.error)      return \`<div class="only-info" style="color:var(--c-only-a)">Error: \${esc(c.error)}</div>\`;
  if (c.same)       return \`<div class="only-info" style="color:var(--c-match)">\u2713 Identical</div>\`;
  if (!inA)         return \`<div style="font-family:var(--vscode-editor-font-family);font-size:calc(var(--vscode-editor-font-size,13px)-1px);padding:10px 14px;max-height:360px;overflow-y:auto;white-space:pre-wrap;word-break:break-all">\${esc(c.normB||'')}</div>\`;
  if (!inB)         return \`<div style="font-family:var(--vscode-editor-font-family);font-size:calc(var(--vscode-editor-font-size,13px)-1px);padding:10px 14px;max-height:360px;overflow-y:auto;white-space:pre-wrap;word-break:break-all">\${esc(c.normA||'')}</div>\`;
  return sideBySide(c.normA||'', c.normB||'', ea, eb);
}

function loadLayerContent(appId, layerKey) {
  const ck = \`\${appId}::\${layerKey}\`;
  const cached = LAYER_CONTENT_CACHE[ck];
  // Loaded or in-flight \u2192 nothing to do. A previous *error* must not latch,
  // though: it used to make the row permanently unclickable (and left
  // openLayerDiff's PENDING_DIFF waiting on a fetch that never re-fired).
  if (cached && !cached.error) return;
  LAYER_CONTENT_CACHE[ck] = { loading: true };
  const layerA = LAYER_OBJECTS[\`\${appId}::\${layerKey}::a\`] || null;
  const layerB = LAYER_OBJECTS[\`\${appId}::\${layerKey}::b\`] || null;
  vscode.postMessage({ command: 'fetchLayerContent', appId, layerKey, layerA, layerB, ...LAST_RUN });
}

function openLayerDiff(appId, layerKey) {
  const c = LAYER_CONTENT_CACHE[\`\${appId}::\${layerKey}\`];
  if (c && !c.loading && !c.error) {
    sendDiff(c.normA||'', c.normB||'', layerKey.replace(/[^a-zA-Z0-9._-]/g,'_')+'.json', LAST_RUN?.profileA, LAST_RUN?.profileB, appId);
    return;
  }
  PENDING_DIFF = { appId, layerKey };
  setStatus('Loading layer content for diff\u2026');
  loadLayerContent(appId, layerKey);
}

// \u2500\u2500 Unified native diff helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// diffId scopes the temp files (library / app / BPM method) so two items that
// share a filename under different parents don't collide on disk.
function sendDiff(cA, cB, fileName, lA, lB, diffId) {
  vscode.postMessage({ command: 'openNativeDiff',
    contentA: cA, contentB: cB, diffId: diffId || '',
    fileName: fileName, labelA: lA || 'A', labelB: lB || 'B' });
}
function applyFn(libraryId, functionId, direction) {
  vscode.postMessage({ command: 'applyFunction', libraryId, functionId, direction, ...LAST_RUN });
}
function openFnDiff(libId, fnId) {
  const lib = (FN_DATA?.libraries||[]).find(l=>l.libID===libId);
  const fn  = (lib?.fnDiffs||[]).find(f=>f.fnID===fnId);
  if (!fn) return;
  sendDiff(fn.fa?._code||'', fn.fb?._code||'', fnId+'.cs', LAST_RUN?.profileA, LAST_RUN?.profileB, libId);
}
function openBpmDirDiff(methodCode, dirName) {
  for (const svc of (BPM_DATA?.services||[])) {
    for (const m of (svc.methods||[])) {
      if (m.methodCode !== methodCode) continue;
      const d = (m.dirDiffs||[]).find(x=>x.name===dirName);
      if (!d) continue;
      const safe = dirName.replace(/[^a-zA-Z0-9._-]/g,'_');
      const hasCode = !!((d.da?._code) || (d.db?._code));
      // Widget-only directives have no C# code \u2014 diff the XAML instead of
      // opening two empty documents.
      if (!hasCode && d.fields?.Xaml && !d.fields.Xaml.same) {
        sendDiff(d.fields.Xaml.a||'', d.fields.Xaml.b||'', safe+'.widgets.txt', LAST_RUN?.profileA, LAST_RUN?.profileB, methodCode);
      } else {
        sendDiff(d.da?._code||'', d.db?._code||'', safe+'.cs', LAST_RUN?.profileA, LAST_RUN?.profileB, methodCode);
      }
      return;
    }
  }
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// SHARED DIFF RENDERING
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

function sideBySide(textA, textB, labelA, labelB) {
  const linesA = textA.split('\\n'), linesB = textB.split('\\n');
  const diff = lcs(linesA, linesB);
  let cells = '', nA = 1, nB = 1;
  for (const d of diff) {
    if (d.t === 'skip') {
      cells += \`<div class="diff-cell skip"><span class="ln">\${nA}\u2013\${nA+d.countA-1}</span>\${esc(d.v)}</div><div class="diff-cell skip"><span class="ln">\${nB}\u2013\${nB+d.countB-1}</span>\${esc(d.v)}</div>\`;
      nA += d.countA; nB += d.countB;
    } else if (d.t === '=') {
      cells += \`<div class="diff-cell ctx"><span class="ln">\${nA++}</span>\${esc(d.v)}</div><div class="diff-cell ctx"><span class="ln">\${nB++}</span>\${esc(d.v)}</div>\`;
    } else if (d.t === '-') {
      cells += \`<div class="diff-cell del"><span class="ln">\${nA++}</span>\${esc(d.v)}</div><div class="diff-cell empty"></div>\`;
    } else {
      cells += \`<div class="diff-cell empty"></div><div class="diff-cell add"><span class="ln">\${nB++}</span>\${esc(d.v)}</div>\`;
    }
  }
  return \`<div class="diff-wrap"><div class="diff-col-hdrs"><div class="diff-col-hdr a">\u25CF \${labelA}</div><div class="diff-col-hdr b">\u25CF \${labelB}</div></div><div class="diff-scroll"><div class="diff-grid">\${cells}</div></div></div>\`;
}

function lcs(A, B) {
  // Trim the common prefix/suffix first \u2014 layer JSONs and function bodies are
  // mostly identical, so the O(n\xB7m) alignment only needs to run on the changed
  // middle. The old version bailed out entirely past 800 lines and rendered
  // "all of A deleted, then all of B added" \u2014 the misaligned stacked view.
  let pre = 0;
  while (pre < A.length && pre < B.length && A[pre] === B[pre]) pre++;
  let suf = 0;
  while (suf < A.length - pre && suf < B.length - pre && A[A.length-1-suf] === B[B.length-1-suf]) suf++;
  const midA = A.slice(pre, A.length - suf), midB = B.slice(pre, B.length - suf);
  const n = midA.length, m = midB.length;
  let aligned;
  if (n === 0 && m === 0) {
    aligned = [];
  } else if (n > 2500 || m > 2500) {
    // Genuinely massive changed region \u2014 alignment too expensive; the
    // native \u2197 Diff button handles these properly.
    aligned = [...midA.map(v=>({t:'-',v})), ...midB.map(v=>({t:'+',v}))];
  } else {
    const dp = Array.from({length:n+1},()=>new Int32Array(m+1));
    for (let i=n-1;i>=0;i--) for (let j=m-1;j>=0;j--) dp[i][j]=midA[i]===midB[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
    aligned=[]; let i=0,j=0;
    while(i<n||j<m){
      if(i<n&&j<m&&midA[i]===midB[j]){aligned.push({t:'=',v:midA[i]});i++;j++;}
      else if(j<m&&(i>=n||dp[i][j+1]>=dp[i+1][j])){aligned.push({t:'+',v:midB[j]});j++;}
      else{aligned.push({t:'-',v:midA[i]});i++;}
    }
  }
  const out=[...A.slice(0,pre).map(v=>({t:'=',v})), ...aligned, ...A.slice(A.length-suf).map(v=>({t:'=',v}))];
  const CTX=3, result=[];
  let equalRun=[];
  // Collapse long equal runs into a skip row, keeping CTX context lines on the
  // sides that touch a change. Every line is accounted for exactly once \u2014 the
  // old version double-pushed short trailing runs and dropped end-of-file runs
  // without a skip marker, which corrupted the line numbers.
  function flush(last){
    if(!equalRun.length) return;
    if(result.length===0&&last){result.push(...equalRun);equalRun=[];return;}
    const head = result.length>0 ? CTX : 0; // context after a change
    const tail = last ? 0 : CTX;            // context before the next change
    if (equalRun.length <= head + tail) {
      result.push(...equalRun);
    } else {
      if (head) result.push(...equalRun.slice(0, head));
      const midCount = equalRun.length - head - tail;
      result.push({t:'skip',v:'\u2026 '+midCount+' unchanged lines \u2026',countA:midCount,countB:midCount});
      if (tail) result.push(...equalRun.slice(-tail));
    }
    equalRun=[];
  }
  for(const d of out){ if(d.t==='=') equalRun.push(d); else{flush(false);result.push(d);} }
  flush(true);
  return result;
}

function inlineListDiff(strA, strB, labelA, labelB) {
  const setA = new Set((strA||'').split('\\n').filter(Boolean));
  const setB = new Set((strB||'').split('\\n').filter(Boolean));
  const all = [...new Set([...setA,...setB])].sort();
  let cells = '';
  for (const item of all) {
    const inA=setA.has(item), inB=setB.has(item);
    if(inA&&inB){ cells+=\`<div class="diff-cell ctx">\${esc(item)}</div><div class="diff-cell ctx">\${esc(item)}</div>\`; }
    else if(inA){ cells+=\`<div class="diff-cell del">\${esc(item)}</div><div class="diff-cell empty"></div>\`; }
    else       { cells+=\`<div class="diff-cell empty"></div><div class="diff-cell add">\${esc(item)}</div>\`; }
  }
  return \`<div class="diff-wrap"><div class="diff-col-hdrs"><div class="diff-col-hdr a">\u25CF \${labelA}</div><div class="diff-col-hdr b">\u25CF \${labelB}</div></div><div class="diff-scroll"><div class="diff-grid">\${cells}</div></div></div>\`;
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// UI HELPERS
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

function chip(filter, cls, label, group, count) {
  const cur = group==='fnFilter'?FN_FILTER : group==='bpmFilter'?BPM_FILTER : LY_FILTER;
  const badge = count!==undefined ? \`<span class="chip-count">\${count}</span>\` : '';
  return \`<button class="chip \${cls} \${filter===cur?'active':''}" data-chip="\${group}" onclick="\${group}('\${filter}',this)">\${label}\${badge}</button>\`;
}
function toggleFn(id) { document.getElementById(id)?.classList.toggle('open'); }
function toggleEl(id, chevId) {
  const el = document.getElementById(id), chev = document.getElementById(chevId);
  const open = el.style.display === 'none';
  el.style.display = open ? 'block' : 'none';
  if (chev) chev.classList.toggle('open', open);
}
function switchFnTab(btn, fnID, tab) {
  const body = btn.closest('.fn-body') || btn.closest('.lib-info-body');
  if (!body) return;
  body.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  body.querySelectorAll('.pane').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  body.querySelector(\`.pane[data-fn="\${fnID}"][data-tab="\${tab}"]\`)?.classList.add('active');
}
function switchLibTab(btn, lid, tab) {
  const wrap = btn.closest('div[id="' + lid + '"]') || btn.parentElement?.nextElementSibling?.parentElement;
  if (!wrap) return;
  btn.closest('.tabs')?.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll(\`[data-libtab="\${lid}"]\`).forEach(p=>p.classList.remove('active'));
  document.querySelector(\`[data-libtab="\${lid}"][data-tab="\${tab}"]\`)?.classList.add('active');
}
</script>
</body>
</html>`}};Kt.KEY="efxCompare";Kt.panels=new Map;ni.ComparePanel=Kt});var Dc=exports&&exports.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),Cc=exports&&exports.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),gr=exports&&exports.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&Dc(n,e,r[o]);return Cc(n,e),n}})();Object.defineProperty(exports,"__esModule",{value:!0});exports.activate=Pc;exports.deactivate=Yc;var f=gr(require("vscode")),ye=gr(require("path")),me=gr(require("fs")),Re=Pn(),Ac=Cr(),xc=Ar(),ze=en(),dr=Ir(),{openWidgetPanel:Tc}=Ho(),oi=Ko(),Sc=cr(),{ComparePanel:Ic}=ri(),Tn=new Map,be=new Map,fr=new Set,L=null,Q=null,li=null,V,We,Ln=null,On=null,pr=null;function se(t){return String(t||"").toLowerCase()}function mr(t){return JSON.stringify(String(t))}function Ct(t,e,n,r){let o=0,i=!1,a=!1;for(let c=e;c<t.length;c++){let u=t[c];if(i){a?a=!1:u==="\\"?a=!0:u==='"'&&(i=!1);continue}if(u==='"'){i=!0;continue}if(u===n)o++;else if(u===r&&(o--,o===0))return c}return-1}function Nc(t,e,n){let o=t.indexOf('"EfxFunction"');if(o<0)throw new Error("EfxFunction array not found in raw tableset");let i=t.indexOf("[",o);if(i<0)throw new Error("EfxFunction array start not found in raw tableset");let a=Ct(t,i,"[","]");if(a<0)throw new Error("EfxFunction array end not found in raw tableset");let c='"LibraryID":'+mr(e),u='"FunctionID":'+mr(n),s=i+1;for(;s<a;){let m=t.indexOf("{",s);if(m<0||m>a)break;let h=Ct(t,m,"{","}");if(h<0||h>a)throw new Error("Malformed EfxFunction row object in raw tableset");let g=t.slice(m,h+1);if(g.includes(c)&&g.includes(u))return{start:m,end:h+1,row:g};s=h+1}throw new Error(`EfxFunction row not found in raw tableset for ${e}.${n}`)}function br(t,e,n){let r='"'+e+'":',o=t.indexOf(r);if(o<0)throw new Error(`${e} property not found in target EfxFunction row`);let i=o+r.length;for(;/\s/.test(t[i]||"");)i++;if(t[i]!=='"')throw new Error(`${e} is not a JSON string in target EfxFunction row`);let a=i+1,c=!1;for(;a<t.length;a++){let u=t[a];if(c){c=!1;continue}if(u==="\\"){c=!0;continue}if(u==='"')break}if(a>=t.length)throw new Error(`${e} string did not terminate in target EfxFunction row`);return t.slice(0,i)+n+t.slice(a+1)}function Bc(t,e,n){let r=Nc(t,e,n),o=br(r.row,"RowMod",JSON.stringify("D"));if(o===r.row)throw new Error(`Target EfxFunction row did not change for ${e}.${n}`);let i=t.slice(0,r.start)+o+t.slice(r.end);return JSON.parse(i),i}function Sn(t,e,n){let r=`"${e}":[`,o=t.indexOf(r);if(o===-1)throw new Error(`Array "${e}" not found in raw tableset`);let i=t.indexOf("[",o),a=Ct(t,i,"[","]");if(a<0)throw new Error(`Could not find end of "${e}" array`);let u=t.substring(i+1,a).trim().length>0?",":"";return t.substring(0,a)+u+n+t.substring(a)}function Lc(t,e){let r=t.indexOf('"EfxRefTable"');if(r<0)throw new Error("EfxRefTable array not found in raw tableset");let o=t.indexOf("[",r);if(o<0)throw new Error("EfxRefTable array start not found in raw tableset");let i=Ct(t,o,"[","]");if(i<0)throw new Error("EfxRefTable array end not found in raw tableset");let a='"TableID":'+mr(e),c=o+1;for(;c<i;){let u=t.indexOf("{",c);if(u<0||u>i)break;let s=Ct(t,u,"{","}");if(s<0||s>i)throw new Error("Malformed EfxRefTable row object in raw tableset");let m=t.slice(u,s+1);if(m.includes(a))return{start:u,end:s+1,row:m};c=s+1}throw new Error(`EfxRefTable row not found in raw tableset for ${e}`)}function Oc(t,e){let n=t.indexOf('"EfxLibrary":[');if(n<0)throw new Error("EfxLibrary array not found in raw tableset");let r=t.indexOf("[",n),o=t.indexOf("{",r);if(o<0)throw new Error("No EfxLibrary row found in raw tableset");let i=Ct(t,o,"{","}"),a=t.slice(o,i+1),c=br(a,"RowMod",JSON.stringify(e));return t.slice(0,o)+c+t.slice(i+1)}function _c(t,e,n){let r='"'+e+'":',o=t.indexOf(r);if(o<0)throw new Error(`${e} not found in object`);let i=o+r.length;for(;/\s/.test(t[i]||"");)i++;let a=t.startsWith("true",i),c=t.startsWith("false",i);if(!a&&!c)throw new Error(`${e} is not a boolean in object`);let u=i+(a?4:5);return t.slice(0,i)+String(n)+t.slice(u)}function kc(t,e,n){let r=Lc(t,e),o=_c(r.row,"Updatable",n);o=br(o,"RowMod",JSON.stringify("U"));let i=t.slice(0,r.start)+o+t.slice(r.end);return i=Oc(i,"U"),JSON.parse(i),i}async function ii(t){let e=se(t),n=f.workspace.textDocuments.find(r=>r.uri&&se(r.uri.fsPath)===e);if(n&&n.isDirty){fr.add(e);try{if(!await n.save())throw new Error(`Could not save ${t}`)}finally{fr.delete(e)}}}function ai(t){return t===1?f.DiagnosticSeverity.Warning:t===0?f.DiagnosticSeverity.Hint:f.DiagnosticSeverity.Error}function Fc(t){return Nn(t).content}function Nn(t){let e=t.split(/\r?\n/);if(!/^\/\/ (EFx Function|BPM Directive):/.test(e[0]||""))return{content:t,lineOffset:0};let n=s=>s.startsWith("// \u2500\u2500\u2500\u2500\u2500")||s.startsWith("// -----"),r=-1;for(let s=0;s<e.length;s++){if(n(e[s])){r=s;break}if(!e[s].startsWith("//")&&e[s].trim()!=="")break}if(r<0)return{content:t,lineOffset:0};let o=e[r],i=o.indexOf("// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),a=o.indexOf("// --------------------------------------------------"),c="";i>=0?c=o.slice(i+40).trimStart():a>=0&&(c=o.slice(a+53).trimStart());let u=e.slice(r+1);return c?{content:[c,...u].join(`
`),lineOffset:r}:{content:u.join(`
`),lineOffset:r+1}}function In(t){return String(t||"").replace(/\r\n/g,`
`).replace(/\r/g,`
`)}function Mc(t){return!t||t.length===0?"":t.map((e,n)=>{let r=e.ErrorLevel!==void 0?`Level ${e.ErrorLevel}`:"Error",o=e.ErrorType?` (${e.ErrorType})`:"",i=e.TableName?`
Table: ${e.TableName}`:"",a=e.ErrorText||e.Message||JSON.stringify(e);return`${n+1}. ${r}${o}${i}
${a}`}).join(`

`)}function Pc(t){li=t,V=new Ac.EfxTreeProvider(null),Ln=f.window.createTreeView("efxLibraries",{treeDataProvider:V}),t.subscriptions.push(Ln),We=new dr.BpmTreeProvider(null),On=f.window.createTreeView("bpmMethods",{treeDataProvider:We}),t.subscriptions.push(On),pr=new xc.ExecuteViewProvider,t.subscriptions.push(f.window.registerWebviewViewProvider("efxExecuteView",pr,{webviewOptions:{retainContextWhenHidden:!0}})),Gc(t).then(()=>kn()),oi.registerUpdateCommand(t),oi.checkForUpdatesOnStartup(t);let e=async()=>{await ui(t)};t.subscriptions.push(f.commands.registerCommand("efx.manageProfiles",e)),t.subscriptions.push(f.commands.registerCommand("efx.configureConnection",e)),t.subscriptions.push(f.commands.registerCommand("efx.switchProfile",async()=>{await Vc(t)})),t.subscriptions.push(f.commands.registerCommand("efx.switchCompany",async()=>{await zc(t)})),t.subscriptions.push(f.commands.registerCommand("efx.changeStorageLocation",async()=>{await f.workspace.getConfiguration("efx").update("storageLocation","",f.ConfigurationTarget.Global);let l=await mi();l&&f.window.showInformationMessage(`EFx: Storage location changed to ${l}`)})),t.subscriptions.push(f.commands.registerCommand("efx.refreshLibraries",async()=>{if(!L){f.window.showWarningMessage("EFx: Configure connection first");return}await V.refresh()})),t.subscriptions.push(f.commands.registerCommand("efx.pullFunction",async l=>{if(!L||!l)return;let p=l.libraryId,d=l.func.FunctionID;await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Pulling ${d}...`},async()=>{try{V.invalidateCache(p);let y=await V.getLibraryTableset(p);if(!y)return;Tn.set(p,y);let v=y.EfxFunction.find(I=>I.FunctionID===d);if(!v){f.window.showErrorMessage(`Function ${d} not found`);return}let{code:w,usings:b}=Re.EpicorClient.extractCode(v.Body),D=await ci();if(!D){f.window.showWarningMessage("EFx: Storage location not set \u2014 pull cancelled.");return}let E=ye.join(D,p);me.mkdirSync(E,{recursive:!0});let C=ye.join(E,`${d}.cs`),A=[`// EFx Function: ${p}.${d}`,`// Pulled: ${new Date().toISOString()}`,b?`// Usings: ${b}`:"","// --------------------------------------------------",""].filter(I=>I!=="").join(`
`);me.writeFileSync(C,A.replace(/\s*$/,"")+`

`+w,"utf-8"),be.set(se(C),{libraryId:p,functionId:d});let T=await f.workspace.openTextDocument(C);await f.window.showTextDocument(T,f.ViewColumn.One),f.window.showInformationMessage(`EFx: Pulled ${p}.${d}`)}catch(y){f.window.showErrorMessage(`EFx Pull failed: ${y.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.pushFunction",async(l,p=!1)=>{if(!L)return;let d,y,v;if(l){d=l.libraryId,y=l.func.FunctionID;let w=await ci();if(!w){f.window.showWarningMessage("EFx: Storage location not set \u2014 push cancelled.");return}v=ye.join(w,d,`${y}.cs`)}else{let w=f.window.activeTextEditor;if(!w){f.window.showWarningMessage("EFx: No active file to push");return}v=w.document.uri.fsPath;let b=await Jt(v);if(!b){f.window.showWarningMessage("EFx: This file is not a pulled EFx function");return}d=b.libraryId,y=b.functionId}if(!v||!me.existsSync(v)){f.window.showErrorMessage("EFx: File not found. Pull the function first.");return}!p&&await f.window.showWarningMessage(`Push ${y} to ${d}?`,{modal:!0},"Push")!=="Push"||await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Pushing ${y}...`},async()=>{try{await ii(v);let w=V.libraryCache.get(d)||await L.getLibrary(d),b=w.EfxLibrary&&w.EfxLibrary[0];if(!b)throw new Error(`Library ${d} not found on server`);if(b.Frozen===!0){let U=b.Published?`${d} is promoted to production \u2014 demote it first (right-click the library \u2192 Demote from Production).`:`${d} is locked/frozen in Epicor. Unfreeze it before editing.`;throw new Error(U)}let D=Nn(me.readFileSync(v,"utf-8")),E=D.content,C=D.lineOffset,A=w.EfxFunction.find(U=>U.FunctionID===y);if(!A)throw new Error(`Function ${y} not found on server`);let T=Re.EpicorClient.extractCode(A.Body),I=await L.validateFunctionViaWrapper(d,y,E,T.usings,"Utilities","ApplyChangesWithDiagnostics"),k=f.Uri.file(v);if(!I.saved){let U=I.diagnostics||I.errors||[];if(U.length>0){let ke=U.map(re=>{if(typeof re=="object"&&re!==null){let O=Math.max(0,(re.Line??1)-1)+C,Y=Math.max(0,(re.Column??1)-1),he=[re.Code,re.Message].filter(Boolean).join(": ")||String(re);return new f.Diagnostic(new f.Range(O,Y,O,Y+1),he,f.DiagnosticSeverity.Error)}return new f.Diagnostic(new f.Range(0,0,0,1),String(re),f.DiagnosticSeverity.Error)});r.set(k,ke)}throw new Error(I.errors?.[0]||I.outMsg||I.outResult||"Wrapper save failed")}let x=(await L.getLibrary(d)).EfxFunction.find(U=>U.FunctionID===y);if(!x)throw new Error(`Verification failed: ${d}.${y} not found after save`);let S=Re.EpicorClient.extractCode(x.Body).code;if(In(S)!==In(E))throw new Error("EFx Push verification failed: wrapper returned success, but server Body does not match editor text.");r.set(k,[]),f.window.showInformationMessage(`EFx: Verified save of ${d}.${y}`);let P=Tn.get(d)?.EfxFunction?.find(U=>U.FunctionID===y);P&&I.newBody&&(P.Body=I.newBody),V.invalidateCache(d)}catch(w){console.error("EFx Push failed:",w),f.window.showErrorMessage(`EFx Push failed: ${w.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.regenerateLibrary",async l=>{if(!L){f.window.showWarningMessage("EFx: Configure connection first");return}let p;if(l?.library?.LibraryID)p=l.library.LibraryID;else if(l?.libraryId)p=l.libraryId;else{let d=f.window.activeTextEditor;if(d){let y=be.get(se(d.document.uri.fsPath));y&&!y.isBpm&&(p=y.libraryId)}}p||(p=await f.window.showInputBox({prompt:"Library ID to regenerate / validate",placeHolder:"e.g. PimberlyFuncts"})),p&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Validating ${p}...`},async()=>{try{let y=(await L.regenerateLibrary(p)).errors||[];if(y.length===0){f.window.showInformationMessage(`EFx: ${p} validated with no reported errors`);return}let v=Mc(y),w=await f.workspace.openTextDocument({language:"markdown",content:`# EFx Validation Errors: ${p}

\`\`\`text
${v}
\`\`\`
`});await f.window.showTextDocument(w,f.ViewColumn.Two),f.window.showWarningMessage(`EFx: ${p} has ${y.length} validation error(s)`)}catch(d){f.window.showErrorMessage(`EFx Validate failed: ${d.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.executeFunction",async l=>{if(!L||!l)return;let p=Xt(),d=p?p.companies||[]:[],y=et()||d[0]||"",v=(V.libraries||[]).find(b=>b.LibraryID===l.libraryId),w=v?!v.Published:!1;await pr.load(L,l.libraryId,l.func.FunctionID,l.signatures,d,y,V,w)})),t.subscriptions.push(f.commands.registerCommand("efx.demoteLibrary",async l=>{if(!(!L||!l||await f.window.showWarningMessage(`Demote ${l.library.LibraryID} from production?`,{modal:!0},"Demote")!=="Demote"))try{await L.demoteFromProduction(l.library.LibraryID),f.window.showInformationMessage(`EFx: Demoted ${l.library.LibraryID}`),await V.refresh()}catch(d){f.window.showErrorMessage(`EFx Demote failed: ${d.message}`)}})),t.subscriptions.push(f.commands.registerCommand("efx.promoteLibrary",async l=>{if(!(!L||!l||await f.window.showWarningMessage(`Promote ${l.library.LibraryID} to production?`,{modal:!0},"Promote")!=="Promote"))try{await L.promoteToProduction(l.library.LibraryID),f.window.showInformationMessage(`EFx: Promoted ${l.library.LibraryID}`),await V.refresh()}catch(d){f.window.showErrorMessage(`EFx Promote failed: ${d.message}`)}})),t.subscriptions.push(f.commands.registerCommand("efx.newFunction",async l=>{if(!L){f.window.showWarningMessage("EFx: Configure connection first");return}let p;if(l&&l.library?p=l.library.LibraryID:l&&l.libraryId?p=l.libraryId:p=await f.window.showInputBox({prompt:"Library ID to add the function to",placeHolder:"e.g. PaintLineFuncts"}),!p)return;let d=await f.window.showInputBox({prompt:"New Function ID",placeHolder:"e.g. MyNewFunction",validateInput:T=>!T||T.trim().length===0?"Function ID is required":/\s/.test(T)?"Function ID cannot contain spaces":null});if(!d)return;let y=await f.window.showInputBox({prompt:"Description (optional)",placeHolder:"Short description of the function"}),v=["string","int","decimal","bool","DateTime","System.Data.DataSet","System.Data.DataTable","Custom\u2026"];async function w(T){let I=[];for(;;){let k=await f.window.showInputBox({prompt:`${T} param name (leave blank to finish)`,placeHolder:"e.g. partNum",ignoreFocusOut:!0});if(!k)break;let q=await f.window.showQuickPick(v.map(S=>({label:S})),{placeHolder:`Data type for "${k}"`,ignoreFocusOut:!0});if(!q)break;let x=q.label;if(x==="Custom\u2026"){let S=await f.window.showInputBox({prompt:"Enter full .NET type name",placeHolder:"e.g. Erp.Tablesets.SalesOrderTableset",ignoreFocusOut:!0});if(!S)break;x=S}I.push({ArgumentName:k,DataType:x})}return I}let D=(await f.window.showQuickPick([{label:"Skip \u2014 add later",value:!1},{label:"Add request params now",value:!0}],{placeHolder:"Add request parameters?",ignoreFocusOut:!0}))?.value?await w("Request"):[],C=(await f.window.showQuickPick([{label:"Skip \u2014 add later",value:!1},{label:"Add response params now",value:!0}],{placeHolder:"Add response parameters?",ignoreFocusOut:!0}))?.value?await w("Response"):[],A=[...D.map((T,I)=>({...T,Response:!1,Order:I})),...C.map((T,I)=>({...T,Response:!0,Order:I}))];await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Creating ${d}...`},async()=>{try{let T=await L.getLibraryRaw(p),I=JSON.stringify({Code:`// New function\r
`,Usings:""}),q=JSON.stringify({LibraryID:p,FunctionID:d,Description:y||null,Kind:2,RequireTransaction:!1,SingleRowMode:!1,Private:!1,Disabled:!1,Invalid:!1,Thumbnail:null,Body:I,Notes:null,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",BitFlag:0,RowMod:"A"}),x=T.indexOf('"EfxFunction":[');if(x===-1){f.window.showErrorMessage("EFx: Could not find EfxFunction array in tableset");return}let S=T.indexOf("[",x),B=0,P=-1;for(let O=S;O<T.length;O++){let Y=T[O];if(Y==='"'){for(O++;O<T.length;){if(T[O]==="\\")O++;else if(T[O]==='"')break;O++}continue}if(Y==="["&&B++,Y==="]"&&(B--,B===0)){P=O;break}}if(P===-1){f.window.showErrorMessage("EFx: Could not parse EfxFunction array");return}let ke=T.substring(S+1,P).trim().length>0?",":"";T=T.substring(0,P)+ke+q+T.substring(P);let re=await L.applyChangesRaw(T);if(re.diagnostics&&re.diagnostics.length>0){let O=re.diagnostics.join(`
`);f.window.showWarningMessage(`EFx: ${d} created with diagnostics:
${O}`)}else f.window.showInformationMessage(`EFx: Created ${p}.${d} \u2713`);if(A.length>0){let O=!1,Y=null;for(let he=0;he<4;he++){he>0&&await new Promise(xe=>setTimeout(xe,800*he));try{await L.saveSignatures(p,d,A),O=!0;break}catch(xe){Y=xe}}O?f.window.showInformationMessage(`EFx: Saved ${A.length} parameter(s) for ${d} \u2713`):f.window.showWarningMessage(`EFx: Function created but signatures failed: ${Y?.message}. Add them via \u2699 Edit Signatures in the Execute panel.`)}V.invalidateCache(p),await V.refresh()}catch(T){f.window.showErrorMessage(`EFx: Create function failed: ${T.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.deleteFunction",async l=>{if(!L){f.window.showWarningMessage("EFx: Configure connection first");return}if(!l){f.window.showWarningMessage("EFx: Delete must be invoked from a function in the tree.");return}let p=l.libraryId,d=l.func&&l.func.FunctionID;if(!p||!d){f.window.showErrorMessage("EFx: Could not determine library/function from selection.");return}await f.window.showWarningMessage(`Delete function "${d}" from library "${p}"? This cannot be undone.`,{modal:!0},"Delete")==="Delete"&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Deleting ${d}...`},async()=>{try{let v=await L.getLibrary(p),w=v&&v.EfxLibrary&&v.EfxLibrary[0];if(!w)throw new Error(`Library ${p} not found on server`);if(w.Frozen===!0){let T=w.Published?`${p} is promoted to production \u2014 demote it first (right-click the library \u2192 Demote from Production).`:`${p} is locked/frozen in Epicor. Unfreeze it before deleting functions.`;throw new Error(T)}let b=await L.getLibraryRaw(p),D=Bc(b,p,d),C=(await L.applyChangesRaw(D)).diagnostics||[];if(C.some(T=>typeof T=="object"?(T.Severity??2)>=2:/\berror\b/i.test(String(T)))){let T=C.map(I=>typeof I=="object"?I.ErrorText||JSON.stringify(I):String(I)).join(`
`);throw new Error(`Server rejected delete:
${T}`)}Tn.delete(p);for(let[T,I]of be.entries())I&&I.libraryId===p&&I.functionId===d&&be.delete(T);V.invalidateCache(p),await V.refresh(),f.window.showInformationMessage(`EFx: Deleted ${p}.${d} \u2713 (local .cs file, if any, was left in place)`)}catch(v){f.window.showErrorMessage(`EFx: Delete function failed: ${v.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.newLibrary",async()=>{if(!L){f.window.showWarningMessage("EFx: Configure connection first");return}let l=await f.window.showInputBox({prompt:"New Library ID",placeHolder:"e.g. MyNewLibrary",validateInput:d=>!d||d.trim().length===0?"Library ID is required":/\s/.test(d)?"Library ID cannot contain spaces":null});if(!l)return;let p=await f.window.showInputBox({prompt:"Description (optional)",placeHolder:"Short description of the library"});await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Creating library ${l}...`},async()=>{try{let d=await L.getDefaultsRaw();d=d.replace(/"LibraryID":"@library"/g,`"LibraryID":"${l}"`),d=d.replace(/"OriginalID":"@library"/,`"OriginalID":"${l}"`),d=d.replace(/"FunctionID":"@function"/,'"FunctionID":"__placeholder__"'),p&&(d=d.replace(/"Description":null/,`"Description":"${p}"`)),d=d.replace(/("OriginalID":"[^"]*"[^}]*"RowMod":")(")/,"$1A$2"),d=d.replace('"AllowCustomCodeFunctions":false','"AllowCustomCodeFunctions":true'),d=d.replace('"DirectDBAccess":0','"DirectDBAccess":2');let y=d.indexOf('"EfxFunction":[');if(y!==-1){let w=d.indexOf("[",y),b=0,D=-1;for(let E=w;E<d.length;E++){let C=d[E];if(C==='"'){for(E++;E<d.length;){if(d[E]==="\\")E++;else if(d[E]==='"')break;E++}continue}if(C==="["&&b++,C==="]"&&(b--,b===0)){D=E;break}}D!==-1&&(d=d.substring(0,w)+"[]"+d.substring(D+1))}let v=await L.applyChangesRaw(d);if(v.diagnostics&&v.diagnostics.length>0){let w=v.diagnostics.join(`
`);f.window.showWarningMessage(`EFx: Library ${l} created with diagnostics:
${w}`)}else f.window.showInformationMessage(`EFx: Created library ${l} \u2713`);await V.refresh()}catch(d){f.window.showErrorMessage(`EFx: Create library failed: ${d.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.addTable",async l=>{if(!L||!l)return;let p=l.libraryId,d=["ERP.Part","ERP.PartBin","ERP.PartCost","ERP.PartPlant","ERP.PartUOM","ERP.PartWhse","ERP.PartCOO","ERP.PartPC","ERP.PartRev","ERP.Customer","ERP.CustCnt","ERP.ShipTo","ERP.OrderHed","ERP.OrderDtl","ERP.OrderRel","ERP.QuoteHed","ERP.QuoteDtl","ERP.JobHead","ERP.JobAsmbl","ERP.JobMtl","ERP.JobOper","ERP.ShipHead","ERP.ShipDtl","ERP.PurchaseOrder","ERP.PODetail","ERP.PORel","ERP.Vendor","ERP.VendPart","ERP.PriceLst","ERP.PriceLstParts","ERP.LaborDtl","ERP.LaborHed","ERP.PlantWhse","ERP.PartTran","ERP.Country","ERP.Currency","ERP.UD01","ERP.UD02","ERP.UD03","ERP.UD04","ERP.UD05","ERP.UD06","ERP.UD07","ERP.UD08","ERP.UD09","ERP.UD10","ICE.UD11","ICE.UD12","ICE.UD13","ICE.UD14","ICE.UD15","ICE.UD16","ICE.UD17","ICE.UD18","ICE.UD19","ICE.UD20"].sort(),y=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...d.map(D=>({label:D,manual:!1}))],v=await f.window.showQuickPick(y,{placeHolder:"Select a table or enter manually (format: ERP.Part)",matchOnDescription:!0});if(!v)return;let w;if(v.manual?w=await f.window.showInputBox({prompt:"Table ID",placeHolder:"e.g. ERP.PartBin or ICE.UD11",validateInput:D=>!D||!D.includes(".")?"Format must be NAMESPACE.TableName":null}):w=v.label,!w)return;let b=await f.window.showQuickPick([{label:"Read-only",value:!1},{label:"Updatable",value:!0}],{placeHolder:"Read-only or Updatable?"});b&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Adding table ${w}...`},async()=>{try{let D=await L.getLibraryRaw(p),E=JSON.stringify({LibraryID:p,TableID:w,Updatable:b.value,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",RowMod:"A"});D=Sn(D,"EfxRefTable",E);let C=await L.applyChangesRaw(D);C.diagnostics&&C.diagnostics.length>0?f.window.showWarningMessage(`EFx: Table added with diagnostics: ${C.diagnostics.join(", ")}`):f.window.showInformationMessage(`EFx: Added table ${w} to ${p} \u2713`),V.invalidateCache(p),V._onDidChangeTreeData.fire(void 0)}catch(D){f.window.showErrorMessage(`EFx: Add table failed: ${D.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.setTableUpdatable",async l=>{if(!L){f.window.showWarningMessage("EFx: Configure connection first");return}if(!l||!l.row){f.window.showWarningMessage("EFx: Must be invoked from a table in the tree.");return}let p=l.row.LibraryID,d=l.row.TableID,y=l.row.Updatable;if(!p||!d){f.window.showErrorMessage("EFx: Could not determine library/table from selection.");return}let v=await f.window.showQuickPick([{label:"$(lock) Read-only",value:!1,description:y===!1?"current":""},{label:"$(edit) Updatable",value:!0,description:y===!0?"current":""}],{placeHolder:`${d} \u2014 choose access mode`});!v||v.value===y||await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Updating ${d}...`},async()=>{try{let w=await L.getLibraryRaw(p),b=kc(w,d,v.value),E=(await L.applyChangesRaw(b)).diagnostics||[];if(E.some(A=>typeof A=="object"?(A.Severity??2)>=2:/\berror\b/i.test(String(A)))){let A=E.map(T=>typeof T=="object"?T.ErrorText||JSON.stringify(T):String(T)).join(`
`);throw new Error(`Server rejected update:
${A}`)}V.invalidateCache(p),V._onDidChangeTreeData.fire(void 0),f.window.showInformationMessage(`EFx: ${d} set to ${v.value?"Updatable":"Read-only"} \u2713`)}catch(w){f.window.showErrorMessage(`EFx: Set updatable failed: ${w.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.addService",async l=>{if(!L||!l)return;let p=l.libraryId,d=["ERP:BO:Part","ERP:BO:PartBin","ERP:BO:PartWhse","ERP:BO:PartCost","ERP:BO:PartTran","ERP:BO:Customer","ERP:BO:ShipTo","ERP:BO:SalesOrder","ERP:BO:QuoteMgr","ERP:BO:JobEntry","ERP:BO:JobStatus","ERP:BO:CustShip","ERP:BO:SubShipD","ERP:BO:PurchaseOrder","ERP:BO:Receipt","ERP:BO:Vendor","ERP:BO:LaborDtl","ERP:BO:PriceLst","ERP:BO:Currency","ERP:BO:Country","ERP:BO:Inventory","ICE:BO:UD11","ICE:BO:UD12","ICE:BO:UD13","ICE:BO:UD14","ICE:BO:UD15","ICE:BO:UD16","ICE:BO:UD17","ICE:BO:UD18","ICE:BO:UD19","ICE:BO:UD20","ICE:LIB:EfxLibraryDesigner"].sort(),y=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...d.map(b=>({label:b,manual:!1}))],v=await f.window.showQuickPick(y,{placeHolder:"Select a service or enter manually (format: ERP:BO:Part)"});if(!v)return;let w;v.manual?w=await f.window.showInputBox({prompt:"Service ID",placeHolder:"e.g. ERP:BO:Part or ICE:BO:UD11",validateInput:b=>!b||b.split(":").length<3?"Format must be NAMESPACE:TYPE:Name":null}):w=v.label,w&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Adding service ${w}...`},async()=>{try{let b=await L.getLibraryRaw(p),D=JSON.stringify({LibraryID:p,ServiceID:w,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",RowMod:"A"});b=Sn(b,"EfxRefService",D);let E=await L.applyChangesRaw(b);E.diagnostics&&E.diagnostics.length>0?f.window.showWarningMessage(`EFx: Service added with diagnostics: ${E.diagnostics.join(", ")}`):f.window.showInformationMessage(`EFx: Added service ${w} to ${p} \u2713`),V.invalidateCache(p),V._onDidChangeTreeData.fire(void 0)}catch(b){f.window.showErrorMessage(`EFx: Add service failed: ${b.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.addAssembly",async l=>{if(!L||!l)return;let p=l.libraryId,d=["Newtonsoft.Json.dll","Ice.Contracts.BO.DynamicQuery.dll","Ice.Contracts.BO.BAQDesigner.dll","Erp.Contracts.BO.Part.dll","Erp.Contracts.BO.JobEntry.dll","Erp.Contracts.BO.SalesOrder.dll","Erp.Contracts.BO.QuoteMgr.dll","Erp.Contracts.BO.CustShip.dll","Erp.Contracts.BO.PurchaseOrder.dll","Erp.Contracts.BO.LaborDtl.dll","Erp.Contracts.BO.Inventory.dll","Erp.Contracts.BO.Customer.dll","Erp.Contracts.BO.Vendor.dll","Ice.Contracts.BO.UD11.dll","Ice.Contracts.BO.UD15.dll","System.Net.Http.dll","System.Xml.dll","System.Linq.dll"].sort(),y=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...d.map(b=>({label:b,manual:!1}))],v=await f.window.showQuickPick(y,{placeHolder:"Select an assembly or enter manually (include .dll)"});if(!v)return;let w;v.manual?w=await f.window.showInputBox({prompt:"Assembly filename",placeHolder:"e.g. Newtonsoft.Json.dll",validateInput:b=>!b||!b.toLowerCase().endsWith(".dll")?"Must end in .dll":null}):w=v.label,w&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Adding assembly ${w}...`},async()=>{try{let b=await L.getLibraryRaw(p),D=JSON.stringify({LibraryID:p,Assembly:w,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",RowMod:"A"});b=Sn(b,"EfxRefAssembly",D);let E=await L.applyChangesRaw(b);E.diagnostics&&E.diagnostics.length>0?f.window.showWarningMessage(`EFx: Assembly added with diagnostics: ${E.diagnostics.join(", ")}`):f.window.showInformationMessage(`EFx: Added assembly ${w} to ${p} \u2713`),V.invalidateCache(p),V._onDidChangeTreeData.fire(void 0)}catch(b){f.window.showErrorMessage(`EFx: Add assembly failed: ${b.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.addLibraryRef",async l=>{if(!L||!l)return;let p=l.libraryId,y=(V.libraries||[]).map(E=>E.LibraryID).filter(E=>E!==p).sort(),v=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...y.map(E=>({label:E,manual:!1}))],w=await f.window.showQuickPick(v,{placeHolder:y.length>0?"Select a library to reference":"Enter library ID (refresh tree first to get suggestions)"});if(!w)return;let b;if(w.manual?b=await f.window.showInputBox({prompt:"Library ID to reference",placeHolder:"e.g. LogFuncts",validateInput:E=>!E||E.trim().length===0?"Library ID is required":null}):b=w.label,!b)return;let D=await f.window.showQuickPick([{label:"Normal (0)",value:0,description:"Standard reference"},{label:"Read-only (1)",value:1,description:"Cannot call mutating functions"},{label:"Hidden (2)",value:2,description:"Not visible in designer"}],{placeHolder:"Reference mode"});D&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Adding library ref ${b}...`},async()=>{try{let E=await L.getLibraryRaw(p),C=JSON.stringify({LibraryID:p,LibraryRef:b,Mode:D.value,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",RowMod:"A"});E=Sn(E,"EfxRefLibrary",C);let A=await L.applyChangesRaw(E);A.diagnostics&&A.diagnostics.length>0?f.window.showWarningMessage(`EFx: Library ref added with diagnostics: ${A.diagnostics.join(", ")}`):f.window.showInformationMessage(`EFx: Added library ref ${b} to ${p} \u2713`),V.invalidateCache(p),V._onDidChangeTreeData.fire(void 0)}catch(E){f.window.showErrorMessage(`EFx: Add library ref failed: ${E.message}`)}})}));let n=f.languages.createDiagnosticCollection("epicor-bpm");t.subscriptions.push(n);let r=f.languages.createDiagnosticCollection("epicor-efx");t.subscriptions.push(r);let o=new Map;function i(l){return o.has(l)||o.set(l,{status:"idle",timer:null}),o.get(l)}function a(l,p){let d=i(l);if(d.status==="running"||d.status==="dirty"){d.timer&&(clearTimeout(d.timer),d.timer=null),d.status="dirty";return}d.timer&&clearTimeout(d.timer),d.timer=setTimeout(()=>{d.timer=null,d.status="running",c(l,p)},500)}async function c(l,p){if(o.get(l))try{if(!Q||!p.isBpm||!p.functionDefinition)return;let y=f.workspace.textDocuments.find(C=>se(C.uri.fsPath)===se(l)),v=Nn(y?y.getText():me.readFileSync(l,"utf-8")),w=v.content,b=v.lineOffset,D=await Q.validateCustomCode(w,p.functionDefinition),E=f.Uri.file(l);if(!D||D.length===0)n.set(E,[]);else{let C=D.map(A=>{let T=Math.max(0,(A.Span?.start?.line??1)-1),I=Math.max(T,(A.Span?.end?.line??T+1)-1),k=T+b,q=I+b,x=Math.max(0,A.Span?.start?.column??0),S=Math.max(0,A.Span?.end?.column??x+1),B=new f.Range(k,x,q,S),P=ai(A.Severity),U=`${A.Code}: ${A.Message}`;return new f.Diagnostic(B,U,P)});n.set(E,C)}}catch{}finally{let y=o.get(l);if(!y)return;let v=y.status==="dirty";y.status="idle",v&&(y.status="running",c(l,p))}}t.subscriptions.push(f.workspace.onDidOpenTextDocument(async l=>{let p=l.uri.fsPath;if(!p.endsWith(".cs")||be.has(se(p)))return;let d=f.workspace.getConfiguration("efx").get("storageLocation");!d||!p.startsWith(String(d))||await Jt(p)})),t.subscriptions.push(f.workspace.onDidChangeTextDocument(l=>{let p=l.document.uri.fsPath,d=be.get(se(p));d&&d.isBpm&&d.functionDefinition&&a(p,d),d&&!d.isBpm&&L&&m(p,d)})),t.subscriptions.push(f.workspace.onDidSaveTextDocument(async l=>{let p=se(l.uri.fsPath);if(fr.has(p))return;let d=await Jt(l.uri.fsPath);!d||d.isBpm||!L||!Xt()?.autoPush||await f.commands.executeCommand("efx.pushFunction",null,!0)})),t.subscriptions.push(f.workspace.onDidCloseTextDocument(l=>{let p=l.uri.fsPath,d=be.get(se(p));if(d&&d.isBpm){n.delete(l.uri);let y=o.get(p);y?.timer&&clearTimeout(y.timer),o.delete(p)}if(d&&!d.isBpm){r.delete(l.uri);let y=u.get(p);y?.timer&&clearTimeout(y.timer),u.delete(p)}if(d&&!l.isDirty&&Xt()?.autoClean)try{me.unlinkSync(p),be.delete(se(p))}catch{}}));let u=new Map;function s(l){return u.has(l)||u.set(l,{status:"idle",timer:null}),u.get(l)}function m(l,p){let d=s(l);if(d.status==="running"||d.status==="dirty"){d.timer&&(clearTimeout(d.timer),d.timer=null),d.status="dirty";return}d.timer&&clearTimeout(d.timer),d.timer=setTimeout(()=>{d.timer=null,d.status="running",h(l,p)},1500)}async function h(l,p){if(u.get(l))try{if(!L||!p.libraryId||!p.functionId)return;let y=f.workspace.textDocuments.find(q=>se(q.uri.fsPath)===se(l)),v=Nn(y?y.getText():me.readFileSync(l,"utf-8")),w=v.content,b=v.lineOffset,D=Tn.get(p.libraryId),E=D?.EfxFunction?.find(q=>q.FunctionID===p.functionId);if(E){let q=Re.EpicorClient.extractCode(E.Body).code;if(In(q)===In(w)){r.set(f.Uri.file(l),[]);return}}let C=E?Re.EpicorClient.extractCode(E.Body).usings:"",{diagnostics:A,saved:T,newBody:I}=await L.validateFunctionViaWrapper(p.libraryId,p.functionId,w,C,"Utilities","ApplyChangesWithDiagnostics",D);T&&D&&E&&(E.Body=I);let k=f.Uri.file(l);if(!A||A.length===0)r.set(k,[]);else{let q=A.map(x=>{if(typeof x=="object"&&x!==null){let B=Number.isInteger(x.Line)?x.Line:void 0,P=Number.isInteger(x.Column)?x.Column-1:void 0,U=Math.max(0,(x.Span?.start?.line??B??1)-1),ke=Math.max(U,(x.Span?.end?.line??B??U+1)-1),re=U+b,O=ke+b,Y=Math.max(0,x.Span?.start?.column??P??0),he=Math.max(0,x.Span?.end?.column??Y+1),xe=ai(x.Severity),hi=[x.Code,x.Message].filter(Boolean).join(": ");return new f.Diagnostic(new f.Range(re,Y,O,he),hi||String(x),xe)}let S=String(x).match(/\((\d+),(\d+)\).*?(error|warning|info)\s+(CS\w+)?:?\s*(.*)/i);if(S){let B=Math.max(0,parseInt(S[1])-1)+b,P=Math.max(0,parseInt(S[2])-1),U=S[3].toLowerCase();return new f.Diagnostic(new f.Range(B,P,B,P+1),`${S[4]?S[4]+": ":""}${S[5]}`,U==="warning"?f.DiagnosticSeverity.Warning:U==="info"?f.DiagnosticSeverity.Information:f.DiagnosticSeverity.Error)}return new f.Diagnostic(new f.Range(0,0,0,1),String(x),f.DiagnosticSeverity.Error)});r.set(k,q)}}catch{}finally{let y=u.get(l);if(!y)return;let v=y.status==="dirty";y.status="idle",v&&(y.status="running",h(l,p))}}t.subscriptions.push(f.commands.registerCommand("efx.bpm.refresh",async()=>{if(!Q){f.window.showWarningMessage("BPM: Configure connection first");return}await We.refresh()})),t.subscriptions.push(f.commands.registerCommand("efx.bpm.openWidgetPanel",async l=>{if(!Q){f.window.showWarningMessage("BPM: Configure connection first");return}let p;if((l?.directive||l instanceof dr.BpmDirectiveNode)&&(p=l.directive),!p){f.window.showWarningMessage("BPM: Select a directive");return}Tc(t,Q,p)})),t.subscriptions.push(f.commands.registerCommand("efx.bpm.pullDirective",async l=>{if(!Q){f.window.showWarningMessage("BPM: Configure connection first");return}let p;if(l&&l.directive)p=l.directive;else if(l instanceof dr.BpmDirectiveNode)p=l.directive;else{f.window.showWarningMessage("BPM: Select a directive to pull");return}let{code:d,hasCustomCode:y}=ze.extractBpmCode(p.Body);if(!y){f.window.showWarningMessage(`BPM: "${p.Name}" has no custom C# code \u2014 it uses widget actions only`);return}await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Pulling BPM: ${p.Name}...`},async()=>{try{let v=p.DirectiveType===1?"Pre":p.DirectiveType===3?"Post":p.DirectiveType===2?"Base":`Type${p.DirectiveType}`,w=await hr();if(!w){f.window.showWarningMessage("BPM: Storage location not set \u2014 pull cancelled.");return}let b=ye.join(w,"BPM",p.BpMethodCode);me.mkdirSync(b,{recursive:!0});let D=p.Name.replace(/[^a-zA-Z0-9_\-. ]/g,"_"),E=ye.join(b,`${v}_${D}.cs`),C=[`// BPM Directive: ${p.Name}`,`// Method: ${p.BpMethodCode}`,`// Type: ${v}`,`// Enabled: ${p.IsEnabled}`,`// Group: ${p.DirectiveGroup||"(none)"}`,`// DirectiveID: ${p.DirectiveID}`,`// Pulled: ${new Date().toISOString()}`,"// --------------------------------------------------",""].join(`
`);me.writeFileSync(E,C+d,"utf-8");let A=await Q.getBpmMethod("BO",p.BpMethodCode),T=A?.BpMethod?.[0],I=A?.BpArgument||[],k=T?ze.buildFunctionDefinition(T,I):null;be.set(se(E),{libraryId:"__BPM__",functionId:p.DirectiveID,bpmMethodCode:p.BpMethodCode,directiveId:p.DirectiveID,directiveType:p.DirectiveType,isBpm:!0,functionDefinition:k});let q=await f.workspace.openTextDocument(E);if(await f.window.showTextDocument(q,f.ViewColumn.One),f.window.showInformationMessage(`BPM: Pulled ${v} directive "${p.Name}"`),k){let x=be.get(se(E));a(E,x)}}catch(v){f.window.showErrorMessage(`BPM Pull failed: ${v.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.bpm.pushDirective",async l=>{if(!Q){f.window.showWarningMessage("BPM: Configure connection first");return}let p,d;if(l&&l.directive){let v=l.directive,w=v.DirectiveType===1?"Pre":v.DirectiveType===3?"Post":v.DirectiveType===2?"Base":`Type${v.DirectiveType}`,b=v.Name.replace(/[^a-zA-Z0-9_\-. ]/g,"_"),D=await hr();if(!D){f.window.showWarningMessage("BPM: Storage location not set \u2014 push cancelled.");return}p=ye.join(D,"BPM",v.BpMethodCode,`${w}_${b}.cs`),d=await Jt(p)}else{let v=f.window.activeTextEditor;if(!v){f.window.showWarningMessage("BPM: No active file to push");return}p=v.document.uri.fsPath,d=await Jt(p)}if(!d||!d.isBpm){f.window.showWarningMessage("BPM: This file is not a pulled BPM directive. Pull it first.");return}if(!p||!me.existsSync(p)){f.window.showErrorMessage("BPM: File not found. Pull the directive first.");return}await f.window.showWarningMessage(`Push BPM directive to ${d.bpmMethodCode}?`,{modal:!0},"Push")==="Push"&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:"Pushing BPM directive..."},async()=>{try{await ii(p);let v=me.readFileSync(p,"utf-8");v=Fc(v);let w=await Q.getBpmMethodRaw("BO",d.bpmMethodCode),b=ze.updateRawBpmDirective(w,d.directiveId,v);JSON.parse(`{"ds":${b}}`),await Q.updateBpmRaw(b),f.window.showInformationMessage(`BPM: Pushed directive to ${d.bpmMethodCode} \u2713`),d.functionDefinition&&a(p,d);let D=d.bpmMethodCode.split(".");D.length>=3&&We.invalidateService(D[0].toUpperCase(),D[1],D[2])}catch(v){f.window.showErrorMessage(`BPM Push failed: ${v.message}`)}})}));async function g(l){let p=_e();if(p.length<1)return f.window.showWarningMessage("EFx: No profiles configured. Add profiles via Manage Profiles first."),null;let d=await f.window.showQuickPick(p.map(b=>({label:b.name,description:b.serverUrl,profile:b})),{placeHolder:l,ignoreFocusOut:!0});if(!d)return null;let y;if(d.profile.companies.length===1?y=d.profile.companies[0]:y=await f.window.showQuickPick(d.profile.companies,{placeHolder:`Company on ${d.profile.name}`,ignoreFocusOut:!0}),!y)return null;let v=await t.secrets.get(Z(d.profile.name,"password"));if(!v)return f.window.showErrorMessage(`EFx: No password stored for "${d.profile.name}".`),null;let w=await t.secrets.get(Z(d.profile.name,"apiKey"))||"";return new Sc.KineticMetaFXClient({serverUrl:d.profile.serverUrl,company:y,username:d.profile.username,password:v,apiKey:w})}t.subscriptions.push(f.commands.registerCommand("efx.dev.dumpBpmXaml",async()=>{if(!Q){f.window.showErrorMessage("EFx: Not connected \u2014 configure a profile first.");return}let l=await f.window.showInputBox({prompt:"BPM method code",value:"Erp.BO.Labor.Update",ignoreFocusOut:!0});if(!l)return;let p=f.window.createOutputChannel("EFx Widget XAML Dump");p.show(!0),p.appendLine(`Fetching ${l}...`);try{let y=(await Q.getBpmMethod("BO",l.trim()))?.BpDirective||[];p.appendLine(`Got ${y.length} directive(s)
`);for(let v of y){let w=v.DirectiveType===1?"Pre":v.DirectiveType===3?"Post":"Base";if(p.appendLine("=".repeat(70)),p.appendLine(`[${w}] "${v.Name}"  enabled=${v.IsEnabled}  group=${v.DirectiveGroup||"(none)"}`),!v.Body){p.appendLine("  (no body)");continue}let b=[...new Set([...v.Body.matchAll(/<(\w+Action)\b/g)].map(C=>C[1]))];p.appendLine(`  Action elements: ${b.join(", ")||"(none found)"}`);let D=0,E=0;for(;;){let C=v.Body.indexOf("CustomCodeAction",D);if(C<0)break;let A='Code="',T=v.Body.indexOf(A,C);if(T<0){D=C+1;continue}let I=T+A.length,k=I;for(;k<v.Body.length&&v.Body[k]!=='"';){if(v.Body[k]==="&"){let S=v.Body.indexOf(";",k);if(S<0)break;k=S+1;continue}k++}let q=v.Body.slice(I,k),x=ze.xmlDecode(q);p.appendLine(`
  --- CustomCodeAction[${E++}] ---`),p.appendLine(x),D=k+1}E===0&&(p.appendLine(`
  No CustomCodeAction found \u2014 full XAML body:`),p.appendLine(v.Body))}}catch(d){p.appendLine(`ERROR: ${d.message}`)}})),t.subscriptions.push(f.commands.registerCommand("efx.compareLibraries",()=>{Ic.show(t)}))}var Ze={ignoreFocusOut:!0};function _e(){let e=f.workspace.getConfiguration("efx").get("profiles");return Array.isArray(e)?e:[]}async function yr(t){await f.workspace.getConfiguration("efx").update("profiles",t,f.ConfigurationTarget.Global)}function Oe(){return f.workspace.getConfiguration("efx").get("activeProfile")||""}async function vr(t){await f.workspace.getConfiguration("efx").update("activeProfile",t,f.ConfigurationTarget.Global)}function et(){return f.workspace.getConfiguration("efx").get("activeCompany")||""}async function _n(t){await f.workspace.getConfiguration("efx").update("activeCompany",t,f.ConfigurationTarget.Global)}function Xt(){let t=Oe();return t&&_e().find(e=>e.name===t)||null}function Z(t,e){return`efx.profile.${t}.${e}`}function kn(){let t=Oe(),e=et(),n=t&&e?`${t} / ${e}`:t||"";Ln&&(Ln.description=n),On&&(On.description=n)}async function ui(t){let e=_e(),n=Oe(),r=[];r.push({label:"$(add) New Profile\u2026",description:"Create a new Epicor environment profile",action:"new"});for(let i of e){let a=i.name===n;r.push({label:`${a?"$(check) ":"$(blank) "}${i.name}`,description:i.serverUrl||"",detail:`${i.username||"(no user)"} \u2022 ${(i.companies||[]).join(", ")||"no companies"}`,action:"use",profileName:i.name})}e.length>0&&(r.push({label:"$(edit) Edit Profile\u2026",action:"edit"}),r.push({label:"$(trash) Delete Profile\u2026",action:"delete"}));let o=await f.window.showQuickPick(r,{placeHolder:e.length===0?"No profiles yet \u2014 create your first one":`Select a profile to activate, or manage profiles (${e.length} configured)`,ignoreFocusOut:!0});if(o){if(o.action==="new")await Rc(t);else if(o.action==="use")await Fn(t,o.profileName);else if(o.action==="edit"){let i=await si("Select profile to edit");i&&await Uc(t,i)}else if(o.action==="delete"){let i=await si("Select profile to delete");i&&await qc(t,i)}}}async function si(t){let e=_e();if(e.length===0)return f.window.showInformationMessage("EFx: No profiles configured."),null;let n=await f.window.showQuickPick(e.map(r=>({label:r.name,description:r.serverUrl||"",detail:r.username||"",profileName:r.name})),{placeHolder:t,ignoreFocusOut:!0});return n?n.profileName:null}async function Rc(t){let e={name:"",serverUrl:"",username:"",companies:[]};if(!await di(t,e,!0))return;let r=_e();if(r.some(o=>o.name===e.name)){f.window.showErrorMessage(`EFx: Profile "${e.name}" already exists.`);return}r.push(e),await yr(r),r.length===1||await $c(e.name)?await Fn(t,e.name):f.window.showInformationMessage(`EFx: Profile "${e.name}" saved.`)}async function $c(t){let e=await f.window.showQuickPick([{label:"Activate now",value:!0},{label:"Save only",value:!1}],{placeHolder:`Activate profile "${t}"?`,ignoreFocusOut:!0});return e?e.value:!1}async function Uc(t,e){let n=_e(),r=n.findIndex(c=>c.name===e);if(r<0)return;let o=JSON.parse(JSON.stringify(n[r])),i=o.name;if(await di(t,o,!1)){if(o.name!==i){let c=await t.secrets.get(Z(i,"password")),u=await t.secrets.get(Z(i,"apiKey"));c&&await t.secrets.store(Z(o.name,"password"),c),u&&await t.secrets.store(Z(o.name,"apiKey"),u),await t.secrets.delete(Z(i,"password")),await t.secrets.delete(Z(i,"apiKey")),Oe()===i&&await vr(o.name)}n[r]=o,await yr(n),Oe()===o.name?await Fn(t,o.name):f.window.showInformationMessage(`EFx: Profile "${o.name}" updated.`)}}async function qc(t,e){if(await f.window.showWarningMessage(`Delete profile "${e}"? This will remove its stored credentials.`,{modal:!0},"Delete")!=="Delete")return;let r=_e().filter(o=>o.name!==e);await yr(r),await t.secrets.delete(Z(e,"password")),await t.secrets.delete(Z(e,"apiKey")),Oe()===e&&(await vr(""),await _n(""),L=null,Q=null,V.setClient(null),We.setClient(null),kn()),f.window.showInformationMessage(`EFx: Profile "${e}" deleted.`)}async function di(t,e,n){let r=await f.window.showInputBox({...Ze,prompt:n?"Profile name (e.g. Dev, Prod, Pilot)":"Profile name",value:e.name,validateInput:l=>!l||!l.trim()?"Name is required":/^[A-Za-z0-9_\-. ]+$/.test(l)?null:"Use letters, numbers, space, dash, dot, underscore"});if(r===void 0)return!1;e.name=r.trim();let o=await f.window.showInputBox({...Ze,prompt:"Epicor Server URL",value:e.serverUrl,placeHolder:"https://your-epicor-server/your-app",validateInput:l=>!l||!l.trim()?"Server URL is required":null});if(o===void 0)return!1;e.serverUrl=o.trim();let i=await f.window.showInputBox({...Ze,prompt:"Username",value:e.username,validateInput:l=>!l||!l.trim()?"Username is required":null});if(i===void 0)return!1;e.username=i.trim();let a=n?null:await t.secrets.get(Z(e.name,"password")),c=n;if(!n){let l=await f.window.showQuickPick([{label:"Keep existing password",value:!1},{label:"Change password",value:!0}],{placeHolder:"Password",ignoreFocusOut:!0});if(!l)return!1;c=l.value}if(c){let l=await f.window.showInputBox({...Ze,prompt:`Password for ${e.username}`,password:!0,validateInput:p=>p?null:"Password is required"});if(l===void 0)return!1;await t.secrets.store(Z(e.name,"password"),l),a=l}let u=n?"":await t.secrets.get(Z(e.name,"apiKey"))||"",s=n;if(!n){let l=await f.window.showQuickPick([{label:"Keep existing API key",value:!1},{label:"Change API key",value:!0},{label:"Clear API key",value:"clear"}],{placeHolder:"API Key",ignoreFocusOut:!0});if(!l)return!1;l.value==="clear"?(await t.secrets.delete(Z(e.name,"apiKey")),u="",s=!1):s=l.value===!0}if(s){let l=await f.window.showInputBox({...Ze,prompt:"API Key (leave blank if not required)",password:!0,value:""});if(l===void 0)return!1;await t.secrets.store(Z(e.name,"apiKey"),l||""),u=l||""}let m=await jc(t,e,a,u);if(m===void 0)return!1;e.companies=m;let h=await f.window.showQuickPick([{label:"No \u2014 push manually",value:!1},{label:"Yes \u2014 auto-push on file save",value:!0}],{placeHolder:"Auto-push changes to Epicor when you save a .cs file?",ignoreFocusOut:!0});if(h===void 0)return!1;e.autoPush=h.value;let g=await f.window.showQuickPick([{label:"No \u2014 keep the local file after closing",value:!1},{label:"Yes \u2014 delete the local file when its tab is closed (only if fully saved)",value:!0}],{placeHolder:"Delete the local .cs file automatically when you close it?",ignoreFocusOut:!0});return g===void 0?!1:(e.autoClean=g.value,!0)}async function jc(t,e,n,r){let o=!e.companies||e.companies.length===0,i;if(o)i="fetch";else{let a=[],c=Oe()===e.name,u=et();c&&e.companies.length>1&&a.push({label:"$(arrow-right) Switch active company",description:`currently ${u||"(none)"}`,value:"switch"}),a.push({label:"$(check) Keep current selection",description:(e.companies||[]).join(", "),value:"keep"}),a.push({label:"$(refresh) Re-fetch from server",description:"Discover companies again via UserFile",value:"fetch"}),a.push({label:"$(list-selection) Pick from current list",description:"Multi-select among already saved companies",value:"pick"}),a.push({label:"$(edit) Enter manually",description:"Comma-separated list",value:"manual"});let s=await f.window.showQuickPick(a,{placeHolder:"Companies",ignoreFocusOut:!0});if(!s)return;if(i=s.value,i==="keep")return e.companies;if(i==="switch"){let m=await f.window.showQuickPick(e.companies.map(h=>({label:`${h===u?"$(check) ":"$(blank) "}${h}`,company:h})),{placeHolder:`Active company (profile: ${e.name})`,ignoreFocusOut:!0});return m?(m.company!==u&&await fi(t,m.company),e.companies):void 0}}if(i==="fetch"){let a=await Hc(e,n,r);return a===void 0?void 0:a}return i==="pick"?await pi(e.companies,e.companies):await Bn(e.companies)}async function Hc(t,e,n){if(!e)return f.window.showWarningMessage("EFx: Cannot fetch companies \u2014 no password available. Falling back to manual entry."),await Bn(t.companies);let r=t.companies&&t.companies[0]||"",o=await f.window.showInputBox({...Ze,prompt:"Default company (used to authenticate the discovery call)",placeHolder:"your default company code",value:r,validateInput:s=>!s||!s.trim()?"Default company is required":null});if(o===void 0)return;let i=o.trim(),a;try{a=await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Fetching companies for ${t.username}...`},async()=>await new Re.EpicorClient({serverUrl:t.serverUrl,company:i,username:t.username,password:e,apiKey:n||""}).getUserCompanies())}catch(s){return await f.window.showErrorMessage(`EFx: Could not fetch companies \u2014 ${s.message}`,{modal:!1},"Enter Manually","Cancel")!=="Enter Manually"?void 0:await Bn([i])}if(!a||a.length===0)return await f.window.showWarningMessage(`EFx: Server returned no companies for user "${t.username}". Enter manually?`,"Enter Manually","Cancel")!=="Enter Manually"?void 0:await Bn([i]);let c=Array.from(new Set([i,...a]));return await pi(c,c)}async function pi(t,e){let n=new Set(e||[]),r=t.map(i=>({label:i,picked:n.has(i)})),o=await f.window.showQuickPick(r,{canPickMany:!0,placeHolder:"Select companies to include in this profile",ignoreFocusOut:!0});if(o){if(o.length===0){f.window.showWarningMessage("EFx: At least one company is required.");return}return o.map(i=>i.label)}}async function Bn(t){let e=await f.window.showInputBox({...Ze,prompt:"Companies (comma-separated)",value:(t||[]).join(", "),validateInput:n=>!n||!n.trim()||n.split(",").map(o=>o.trim()).filter(Boolean).length===0?"At least one company is required":null});if(e!==void 0)return e.split(",").map(n=>n.trim()).filter(Boolean)}async function Fn(t,e){let n=_e().find(a=>a.name===e);if(!n){f.window.showErrorMessage(`EFx: Profile "${e}" not found.`);return}let r=await t.secrets.get(Z(e,"password"));if(!r){f.window.showErrorMessage(`EFx: No password stored for "${e}". Edit the profile to set one.`);return}let o=await t.secrets.get(Z(e,"apiKey"))||"",i=et();n.companies.includes(i)||(i=n.companies[0]),await vr(e),await _n(i),L=new Re.EpicorClient({serverUrl:n.serverUrl,company:i,username:n.username,password:r,apiKey:o}),V.setClient(L),Q=new ze.BpmClient(L),We.setClient(Q),await V.refresh(),kn(),f.window.showInformationMessage(`EFx: Active profile "${e}" (company ${i})`)}async function Vc(t){let e=_e();if(e.length===0){await f.window.showInformationMessage("EFx: No profiles configured. Create one?","Create Profile")==="Create Profile"&&await ui(t);return}let n=Oe(),r=await f.window.showQuickPick(e.map(o=>({label:`${o.name===n?"$(check) ":"$(blank) "}${o.name}`,description:o.serverUrl||"",profileName:o.name})),{placeHolder:"Switch to profile",ignoreFocusOut:!0});r&&await Fn(t,r.profileName)}async function zc(t){let e=Xt();if(!e){f.window.showWarningMessage("EFx: No active profile. Manage Profiles first.");return}if(!e.companies||e.companies.length===0){f.window.showWarningMessage(`EFx: Profile "${e.name}" has no companies configured. Edit the profile to add some.`);return}if(e.companies.length===1){f.window.showInformationMessage(`EFx: Only one company in profile "${e.name}" (${e.companies[0]}).`);return}let n=et(),r=await f.window.showQuickPick(e.companies.map(o=>({label:`${o===n?"$(check) ":"$(blank) "}${o}`,company:o})),{placeHolder:`Active company (profile: ${e.name})`,ignoreFocusOut:!0});r&&r.company!==n&&await fi(t,r.company)}async function fi(t,e){let n=Xt();if(!n)return;if(!n.companies.includes(e)){f.window.showErrorMessage(`EFx: "${e}" is not in profile "${n.name}".`);return}let r=await t.secrets.get(Z(n.name,"password"));if(!r){f.window.showErrorMessage(`EFx: No password stored for "${n.name}".`);return}let o=await t.secrets.get(Z(n.name,"apiKey"))||"";await _n(e),L=new Re.EpicorClient({serverUrl:n.serverUrl,company:e,username:n.username,password:r,apiKey:o}),V.setClient(L),Q=new ze.BpmClient(L),We.setClient(Q),await V.refresh(),kn(),f.window.showInformationMessage(`EFx: Active company \u2192 ${e}`)}async function mi(){let t=f.workspace.getConfiguration("efx"),e=t.get("storageLocation");if(e&&String(e).trim())return String(e).trim();let n=await f.window.showQuickPick([{label:"Use default location (VS Code internal storage)",value:"default"},{label:"Choose a folder...",value:"custom"}],{placeHolder:"EFx: Where should pulled functions and BPM directives be stored?",ignoreFocusOut:!0});if(!n)return null;let r;if(n.value==="default")r=ye.join(li.globalStorageUri.fsPath,"EpicorExtension");else{let o=await f.window.showOpenDialog({canSelectFolders:!0,canSelectFiles:!1,canSelectMany:!1,openLabel:"Select EFx Storage Folder"});if(!o||o.length===0)return null;r=ye.join(o[0].fsPath,"EpicorExtension")}return me.mkdirSync(r,{recursive:!0}),await t.update("storageLocation",r,f.ConfigurationTarget.Global),f.window.showInformationMessage(`EFx: Storage location set to ${r}`),r}async function hr(){let t=await mi();if(!t)return null;let n=(Oe()||"Default").replace(/[^a-zA-Z0-9_\-. ]/g,"_");return ye.join(t,n)}async function ci(){let t=await hr();return t?ye.join(t,"Libraries"):null}function Wc(t){let e;try{e=me.readFileSync(t,"utf-8")}catch{return{}}let n={};for(let r of e.split(/\r?\n/).slice(0,12)){let o=r.match(/^\/\/\s*([A-Za-z ]+):\s*(.*)$/);o&&(n[o[1].trim()]=o[2].trim())}return n}async function Jt(t){let e=se(t),n=be.get(e);if(n)return n;if(!t.endsWith(".cs")||!me.existsSync(t))return null;let r=Wc(t);if(r["BPM Directive"]&&r.Method&&r.DirectiveID){if(!Q)return null;let o=r.Method,i=r.DirectiveID,c={Pre:1,Post:3,Base:2}[r.Type]??parseInt(String(r.Type).replace("Type",""),10);try{let u=await Q.getBpmMethod("BO",o),s=u?.BpMethod?.[0],m=u?.BpArgument||[],h=s?ze.buildFunctionDefinition(s,m):null,g={libraryId:"__BPM__",functionId:i,bpmMethodCode:o,directiveId:i,directiveType:c,isBpm:!0,functionDefinition:h};return be.set(e,g),g}catch{return null}}if(r["EFx Function"]){let o=ye.basename(t,".cs"),a={libraryId:ye.basename(ye.dirname(t)),functionId:o};return be.set(e,a),a}return null}async function Gc(t){let e=Oe();if(!e)return;let n=_e().find(a=>a.name===e);if(!n)return;let r=await t.secrets.get(Z(e,"password"));if(!r)return;let o=await t.secrets.get(Z(e,"apiKey"))||"",i=et();n.companies.includes(i)||(i=n.companies[0]||""),i&&(i!==et()&&await _n(i),L=new Re.EpicorClient({serverUrl:n.serverUrl,company:i,username:n.username,password:r,apiKey:o}),V.setClient(L),Q=new ze.BpmClient(L),We.setClient(Q))}function Yc(){}
