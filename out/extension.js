"use strict";var re=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports);var Pr=re(Ae=>{"use strict";var da=Ae&&Ae.__createBinding||(Object.create?(function(t,e,r,n){n===void 0&&(n=r);var o=Object.getOwnPropertyDescriptor(e,r);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[r]}}),Object.defineProperty(t,n,o)}):(function(t,e,r,n){n===void 0&&(n=r),t[n]=e[r]})),pa=Ae&&Ae.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),vn=Ae&&Ae.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(r){var n=[];for(var o in r)Object.prototype.hasOwnProperty.call(r,o)&&(n[n.length]=o);return n},t(e)};return function(e){if(e&&e.__esModule)return e;var r={};if(e!=null)for(var n=t(e),o=0;o<n.length;o++)n[o]!=="default"&&da(r,e,n[o]);return pa(r,e),r}})();Object.defineProperty(Ae,"__esModule",{value:!0});Ae.EpicorClient=void 0;var bn=vn(require("https")),yn=vn(require("http")),Fr=class t{constructor(e){this.config=e}getHeaders(){let r={"Content-Type":"application/json",Authorization:`Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64")}`};return this.config.apiKey&&(r["x-api-key"]=this.config.apiKey),r}getDesignerUrl(e){return`${this.config.serverUrl.replace(/\/$/,"")}/api/v2/odata/${this.config.company}/Ice.LIB.EfxLibraryDesignerSvc/${e}`}getEfxUrl(e,r,n,o=!1){let a=this.config.serverUrl.replace(/\/$/,""),i=n||this.config.company;return o?`${a}/api/v2/efx/staging/${i}/${e}/${r}`:`${a}/api/v2/efx/${i}/${e}/${r}`}async request(e,r){let n=await this.requestRaw(e,typeof r=="string"?r:JSON.stringify(r));try{return n?JSON.parse(n):{}}catch{return n}}async requestGet(e){return new Promise((r,n)=>{let o=new URL(e),a=o.protocol==="https:",i=a?bn:yn,c={hostname:o.hostname,port:o.port||(a?443:80),path:o.pathname+o.search,method:"GET",headers:this.getHeaders(),rejectUnauthorized:!1},l=i.request(c,s=>{let f="";s.on("data",g=>{f+=g}),s.on("end",()=>{if(s.statusCode&&s.statusCode>=200&&s.statusCode<300)try{r(f?JSON.parse(f):{})}catch{r(f)}else{let g=`HTTP ${s.statusCode}`;try{let h=JSON.parse(f);g=h.ErrorMessage||h.error?.message||JSON.stringify(h,null,2)}catch{g=f||g}n(new Error(g))}})});l.on("error",n),l.end()})}async getUserCompanies(){let e=this.config.serverUrl.replace(/\/$/,""),r=encodeURIComponent(this.config.username),n=`${e}/api/v2/odata/${this.config.company}/Ice.BO.UserFileSvc/UserFiles('${r}')/UserComps?$select=Company,Name`,o=await this.requestGet(n);return(Array.isArray(o?.value)?o.value:[]).map(i=>i.Company).filter(Boolean)}async requestRaw(e,r){return new Promise((n,o)=>{let a=new URL(e),i=a.protocol==="https:",c=i?bn:yn,l={hostname:a.hostname,port:a.port||(i?443:80),path:a.pathname+a.search,method:"POST",headers:{...this.getHeaders(),"Content-Length":Buffer.byteLength(r)},rejectUnauthorized:!1},s=c.request(l,f=>{let g="";f.on("data",h=>{g+=h}),f.on("end",()=>{if(f.statusCode&&f.statusCode>=200&&f.statusCode<300)n(g);else{let h=`HTTP ${f.statusCode}`;try{let p=JSON.parse(g);h=p.ErrorMessage||p.error?.message||JSON.stringify(p,null,2)}catch{h=g||h}console.error("EFx HTTP failure status:",f.statusCode),console.error("EFx HTTP failure body:",g),o(new Error(h))}})});s.on("error",o),s.write(r),s.end()})}async getLibraryList(){return(await this.request(this.getDesignerUrl("GetLibraryList"),{options:{kind:0,startsWith:"",rollOutMode:2,status:0}})).returnObj?.EfxLibraryList||[]}async getLibrary(e){return(await this.request(this.getDesignerUrl("GetLibrary"),{libraryId:e})).returnObj}async getDefaults(){return(await this.request(this.getDesignerUrl("GetDefaults"),{})).returnObj}async getDefaultsRaw(){let e=await this.requestRaw(this.getDesignerUrl("GetDefaults"),"{}"),r=e.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);return r?r[1]:e}async getLibraryRaw(e){let r=await this.requestRaw(this.getDesignerUrl("GetLibrary"),JSON.stringify({libraryId:e})),n=r.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);return n?n[1]:r}async applyChangesRaw(e){let r=`{"libraryTableset":${e}}`,n=await this.requestRaw(this.getDesignerUrl("ApplyChangesWithDiagnostics"),r);try{let o=JSON.parse(n);return{diagnostics:o.returnObj?.diagnostics||o.parameters?.diagnostics||[]}}catch{return{diagnostics:[]}}}async applyChanges(e){let r=await this.request(this.getDesignerUrl("ApplyChangesWithDiagnostics"),{libraryTableset:e});return{tableset:r.returnObj?.libraryTableset||r.parameters?.libraryTableset||e,diagnostics:r.returnObj?.diagnostics||r.parameters?.diagnostics||[]}}async promoteToProduction(e){await this.request(this.getDesignerUrl("PromoteToProduction"),{libraryID:e})}async regenerateLibrary(e){let r=await this.request(this.getDesignerUrl("RegenerateLibrary"),{libraryID:e});return console.log("EFx Regenerate raw result:",JSON.stringify(r,null,2)),{errors:r.returnObj?.BOUpdError||r.returnObj?.BOUpdErrorList||r.returnObj?.BOUpdErrorTableset?.BOUpdError||r.parameters?.result?.BOUpdError||r.parameters?.result?.BOUpdErrorList||r.parameters?.result?.BOUpdErrorTableset?.BOUpdError||r.parameters?.errors||r.errors||[],raw:r}}async demoteFromProduction(e){await this.request(this.getDesignerUrl("DemoteFromProduction"),{libraryID:e})}async lockLibrary(e){await this.request(this.getDesignerUrl("LockLibrary"),{libraryID:e})}async releaseLibrary(e){await this.request(this.getDesignerUrl("ReleaseLibrary"),{libraryID:e})}async validateFunctionRaw(e,r,n,o){let a=await this.getLibraryRaw(e),i=t.packCode(n,o||""),l=`{"libraryTableset":${this._patchFunctionBody(a,r,i,"U")}}`,s=await this.requestRaw(this.getDesignerUrl("ApplyChangesWithDiagnostics"),l);try{let f=JSON.parse(s),g=f.returnObj?.diagnostics||f.parameters?.diagnostics||[],h=g.some(p=>typeof p=="object"?(p.Severity??2)>=2:/\berror\b/i.test(String(p)));return{diagnostics:g,saved:!h,newBody:i}}catch{return{diagnostics:[],saved:!1,newBody:i}}}async validateFunctionViaWrapper(e,r,n,o,a="Utilities",i="ApplyChangesWithDiagnostics",c=null){let l=c;if((!l?.EfxLibrary?.[0]||!l.EfxFunction?.some(x=>x.FunctionID===r))&&(l=await this.getLibrary(e)),!l?.EfxLibrary?.[0]){let x=`Library '${e}' not found`;return{saved:!1,diagnostics:[{Severity:2,Message:x}],errors:[x],outResult:"",outMsg:"",raw:null,newBody:null}}let s=l.EfxFunction?.find(x=>x.FunctionID===r);if(!s){let x=`Function '${r}' not found in library '${e}'`;return{saved:!1,diagnostics:[{Severity:2,Message:x}],errors:[x],outResult:"",outMsg:"",raw:null,newBody:null}}let f={...l.EfxLibrary[0],RowMod:"U"},g={...s,Code:n,Usings:o||"",Body:"",RowMod:"U"},h={EfxLibrary:[f],EfxFunction:[g]},p;try{p=await this.request(this.getEfxUrl(a,i),{inFunctionID:r,inDS:h})}catch(x){if(/HTTP 404/.test(x.message))try{let S=await this.validateFunctionRaw(e,r,n,o);return{saved:S.saved,diagnostics:S.diagnostics||[],errors:S.saved?[]:S.diagnostics?.map(L=>L.Message||String(L))||["Save failed"],outResult:S.saved?"Success":"",outMsg:S.saved?"Saved Successfully":"Save failed",raw:null,newBody:S.saved?S.newBody:null}}catch(S){let L=S.message||String(S);return{saved:!1,diagnostics:[{Severity:2,Message:L}],errors:[L],outResult:"",outMsg:L,raw:null,newBody:null}}throw x}let u=p?.outMsg??p?.parameters?.outMsg??"",d=p?.outResult??p?.parameters?.outResult??"",v=p?.outSuccess??p?.parameters?.outSuccess??!1,b=[],w=new Set,y=x=>{let S=x.trim();S&&!w.has(S)&&(w.add(S),b.push(S))};for(let x of String(u).split(/\r?\n/)){let S=x.match(/^Error:\s*(.+)$/i);if(S){y(S[1]);continue}/\(\d+,\d+\):\s*(?:error|warning)\s+CS/i.test(x)&&y(x)}let D=b.filter(x=>!/\(\d+,\d+\):\s*warning\s+CS/i.test(x)),E=v===!0||D.length===0&&/Saved Successfully/i.test(u),C=b.map(x=>{let S=x.match(/\((\d+),(\d+)\):\s*(?:error|warning)/i)||x.match(/\((\d+),(\d+)\)/)||x.match(/\bline\s+(\d+)/i);return{Severity:/\(\d+,\d+\):\s*warning\s+CS/i.test(x)?1:2,Message:x,Line:S?parseInt(S[1],10):void 0,Column:S&&S[2]!==void 0?parseInt(S[2],10):void 0}}),A=String(n).split(/\r?\n/),T=new Map;for(let x of C){if(!x.Line||!x.Column)continue;let S=x.Message.match(/'([^']+)'/);if(!(!S||!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(S[1]))){for(let L=0;L<A.length;L++)if(A[L].slice(x.Column-1).startsWith(S[1])){let z=x.Line-(L+1);z>=0&&T.set(z,(T.get(z)||0)+1)}}}let N=0,F=0,j=!1;for(let[x,S]of T)S>F?(F=S,N=x,j=!1):S===F&&x!==N&&(j=!0);if(F>0&&!j&&N>0)for(let x of C)x.Line&&(x.Line=Math.max(1,x.Line-N));return{saved:E,diagnostics:C,errors:b,outResult:d,outMsg:u,raw:p,newBody:t.packCode(n,o||"")}}_patchFunctionBody(e,r,n,o){let a=`"FunctionID":${JSON.stringify(r)}`,i=JSON.stringify(n),c=this._setParentLibraryRowMod(e,o),l=c.indexOf('"EfxFunction":[');if(l<0)throw new Error("EfxFunction array not found");let f=c.indexOf("[",l)+1;for(;f<c.length;){let g=c.indexOf("{",f);if(g<0)break;let h=this._findJsonObjectEnd(c,g,"EfxFunction row"),p=c.slice(g,h+1);if(!p.includes(a)){f=h+1;continue}let u=this._replaceJsonStringValue(p,"Body",i);return u=this._replaceJsonStringValue(u,"RowMod",JSON.stringify(o)),c.slice(0,g)+u+c.slice(h+1)}throw new Error(`Function ${r} not found in raw tableset`)}_setParentLibraryRowMod(e,r){let n=e.indexOf('"EfxLibrary":[');if(n<0)throw new Error("EfxLibrary array not found");let o=e.indexOf("[",n),a=e.indexOf("{",o);if(a<0)throw new Error("No EfxLibrary row found");let i=this._findJsonObjectEnd(e,a,"EfxLibrary row"),c=e.slice(a,i+1),l=this._replaceJsonStringValue(c,"RowMod",JSON.stringify(r));return e.slice(0,a)+l+e.slice(i+1)}_findJsonObjectEnd(e,r,n){let o=0,a=!1,i=!1;for(let c=r;c<e.length;c++){let l=e[c];if(a){if(i){i=!1;continue}if(l==="\\"){i=!0;continue}l==='"'&&(a=!1);continue}if(l==='"'){a=!0;continue}if(l==="{")o++;else if(l==="}"&&(o--,o===0))return c}throw new Error(`Malformed ${n}`)}_replaceJsonStringValue(e,r,n){let o=`"${r}":`,a=e.lastIndexOf(o);if(a<0)throw new Error(`${r} not found in object`);let i=a+o.length;for(;/\s/.test(e[i]||"");)i++;if(e[i]!=='"')throw new Error(`${r} value is not a JSON string`);let c=i+1,l=!1;for(;c<e.length;c++){let s=e[c];if(l){l=!1;continue}if(s==="\\"){l=!0;continue}if(s==='"')break}return e.slice(0,i)+n+e.slice(c+1)}async executeFunction(e,r,n,o,a=!1){let i=this.getEfxUrl(e,r,o,a);return this.request(i,n)}async saveSignatures(e,r,n){let o=await this.getLibraryRaw(e),a=JSON.parse(o);if(!a?.EfxLibrary?.[0])throw new Error(`Library '${e}' not found`);if(!a.EfxFunction?.find(y=>y.FunctionID===r))throw new Error(`Function '${r}' not found in library '${e}'`);let i=(a.EfxFunctionSignature||[]).filter(y=>y.FunctionID===r),c=(a.EfxFunctionSignature||[]).reduce((y,D)=>Math.max(y,D.ParameterID||0),0)+1,s=o.indexOf('"EfxFunctionSignature":[');if(s<0)throw new Error("EfxFunctionSignature array not found");let f=o.indexOf("[",s),g=this._rawFindClose(o,f,"[","]"),h=[],p=f+1;for(;p<g;){let y=o.indexOf("{",p);if(y<0||y>=g)break;let D=this._rawFindClose(o,y,"{","}");if(D<0||D>=g)break;let E=o.slice(y,D+1),C=null;try{C=JSON.parse(E)}catch{}h.push({objStr:E,sigData:C}),p=D+1}let u=[];for(let{objStr:y,sigData:D}of h)(!D||D.FunctionID!==r)&&u.push(y);for(let y of n){let D=i.find(E=>E.ArgumentName===y.ArgumentName&&!!E.Response==!!y.Response);if(D){let{objStr:E}=h.find(A=>A.sigData?.ArgumentName===D.ArgumentName&&!!A.sigData?.Response==!!D.Response)||{};if(!E)continue;if(!(D.DataType!==(y.DataType??D.DataType)||D.DataTypeInfo!==(y.DataTypeInfo??D.DataTypeInfo)||!!D.Optional!=!!(y.Optional??D.Optional)||D.DefaultValue!==(y.DefaultValue??D.DefaultValue)||D.Order!==(y.Order??D.Order)))u.push(E);else{let A=E;A=this._rawSetStringProp(A,"DataType",y.DataType??D.DataType),A=this._rawSetStringProp(A,"DataTypeInfo",y.DataTypeInfo??D.DataTypeInfo??""),A=this._rawSetBoolProp(A,"Optional",y.Optional??D.Optional??!1),A=this._rawSetStringProp(A,"DefaultValue",y.DefaultValue??D.DefaultValue??""),A=this._rawSetIntProp(A,"Order",y.Order??D.Order),A=this._rawSetStringProp(A,"RowMod","U"),u.push(E),u.push(A)}}else{let E={LibraryID:e,FunctionID:r,Response:!!y.Response,ParameterID:c++,ArgumentName:y.ArgumentName,Order:y.Order??u.length,DataType:y.DataType||"System.String",DataTypeInfo:y.DataTypeInfo||"",Optional:y.Optional??!1,DefaultValue:y.DefaultValue??"",SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",BitFlag:0,RowMod:"A"};u.push(JSON.stringify(E))}}for(let y of i)if(!n.some(E=>E.ArgumentName===y.ArgumentName&&!!E.Response==!!y.Response)){let{objStr:E}=h.find(A=>A.sigData?.ArgumentName===y.ArgumentName&&!!A.sigData?.Response==!!y.Response)||{};if(!E)continue;let C=this._rawSetStringProp(E,"RowMod","D");u.push(E),u.push(C)}let d=o.slice(0,f+1)+u.join(",")+o.slice(g);d=this._setParentLibraryRowMod(d,"U"),d=this._setEfxFunctionRowMod(d,r,"U"),JSON.parse(d);let v=await this.applyChangesRaw(d),b=(v.diagnostics||[]).some(y=>typeof y=="object"?(y.Severity??2)>=2:/\berror\b/i.test(String(y))),w=n.map((y,D)=>{let E=i.find(C=>C.ArgumentName===y.ArgumentName&&!!C.Response==!!y.Response);return E?{...E,DataType:y.DataType??E.DataType,DataTypeInfo:y.DataTypeInfo??E.DataTypeInfo??"",Optional:y.Optional??E.Optional??!1,DefaultValue:y.DefaultValue??E.DefaultValue??"",Order:y.Order??D}:{LibraryID:e,FunctionID:r,Response:!!y.Response,ArgumentName:y.ArgumentName,DataType:y.DataType||"System.String",DataTypeInfo:y.DataTypeInfo||"",Optional:y.Optional??!1,DefaultValue:y.DefaultValue??"",Order:y.Order??D}});return{saved:!b,diagnostics:v.diagnostics||[],updatedSigs:w}}_rawFindClose(e,r,n,o){let a=0,i=!1,c=!1;for(let l=r;l<e.length;l++){let s=e[l];if(i){if(c){c=!1;continue}if(s==="\\"){c=!0;continue}s==='"'&&(i=!1);continue}if(s==='"'){i=!0;continue}if(s===n)a++;else if(s===o&&(a--,a===0))return l}return-1}_rawSetStringProp(e,r,n){let o=`"${r}":`,a=e.indexOf(o);if(a<0)throw new Error(`Property "${r}" not found`);let i=a+o.length;for(;e[i]===" ";)i++;let c;if(e[i]==='"'){c=i+1;let l=!1;for(;c<e.length;c++){let s=e[c];if(l){l=!1;continue}if(s==="\\"){l=!0;continue}if(s==='"'){c++;break}}}else for(c=i;c<e.length&&e[c]!==","&&e[c]!=="}"&&e[c]!==" "&&e[c]!==`
`&&e[c]!=="\r";)c++;return e.slice(0,i)+JSON.stringify(n)+e.slice(c)}_rawSetBoolProp(e,r,n){let o=`"${r}":`,a=e.indexOf(o);if(a<0)throw new Error(`Property "${r}" not found`);let i=a+o.length;for(;e[i]===" ";)i++;let c=i;for(;c<e.length&&e[c]!==","&&e[c]!=="}"&&e[c]!==" ";)c++;return e.slice(0,i)+(n?"true":"false")+e.slice(c)}_rawSetIntProp(e,r,n){let o=`"${r}":`,a=e.indexOf(o);if(a<0)throw new Error(`Property "${r}" not found`);let i=a+o.length;for(;e[i]===" ";)i++;let c=i;for(;c<e.length&&e[c]!==","&&e[c]!=="}"&&e[c]!==" ";)c++;return e.slice(0,i)+String(Math.floor(n))+e.slice(c)}_setEfxFunctionRowMod(e,r,n){let o=`"FunctionID":${JSON.stringify(r)}`,a=e.indexOf('"EfxFunction":[');if(a<0)throw new Error("EfxFunction array not found");let c=e.indexOf("[",a)+1;for(;c<e.length;){let l=e.indexOf("{",c);if(l<0)break;let s=this._findJsonObjectEnd(e,l,"EfxFunction row"),f=e.slice(l,s+1);if(f.includes(o)){let g=this._replaceJsonStringValue(f,"RowMod",JSON.stringify(n));return e.slice(0,l)+g+e.slice(s+1)}c=s+1}throw new Error(`EfxFunction row for '${r}' not found`)}static extractCode(e){try{let r=JSON.parse(e);return{code:r.Code||"",usings:r.Usings||""}}catch{return{code:e,usings:""}}}static packCode(e,r=""){return JSON.stringify({Code:e,Usings:r})}};Ae.EpicorClient=Fr});var wn=re(le=>{"use strict";var fa=le&&le.__createBinding||(Object.create?(function(t,e,r,n){n===void 0&&(n=r);var o=Object.getOwnPropertyDescriptor(e,r);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[r]}}),Object.defineProperty(t,n,o)}):(function(t,e,r,n){n===void 0&&(n=r),t[n]=e[r]})),ma=le&&le.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),ha=le&&le.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(r){var n=[];for(var o in r)Object.prototype.hasOwnProperty.call(r,o)&&(n[n.length]=o);return n},t(e)};return function(e){if(e&&e.__esModule)return e;var r={};if(e!=null)for(var n=t(e),o=0;o<n.length;o++)n[o]!=="default"&&fa(r,e,n[o]);return ma(r,e),r}})();Object.defineProperty(le,"__esModule",{value:!0});le.EfxTreeProvider=le.FunctionNode=le.LibraryNode=void 0;var W=ha(require("vscode")),At=class extends W.TreeItem{constructor(e){super(e.LibraryID,W.TreeItemCollapsibleState.Collapsed),this.library=e;let r=[];e.Published?r.push("$(cloud) Promoted"):r.push("Unpromoted / Editable"),e.Disabled&&r.push("$(circle-slash) Disabled"),e.LockedBy&&r.push(`$(lock) ${e.LockedBy}`),e.OwnedByCompany&&r.push(e.OwnedByCompany),this.description=e.Description||"",this.tooltip=[e.LibraryID,e.Description||"",`Status: ${e.Published?"Promoted":"Unpromoted / Editable"}`,e.LockedBy?`Locked by: ${e.LockedBy}`:"Unlocked",e.Disabled?"DISABLED":"",`Company: ${e.OwnedByCompany||"System"}`].filter(Boolean).join(`
`),this.contextValue=e.Published?"library-promoted":"library-unpromoted",e.Published?this.iconPath=new W.ThemeIcon("cloud",new W.ThemeColor("charts.green")):e.Disabled?this.iconPath=new W.ThemeIcon("circle-slash",new W.ThemeColor("charts.red")):e.LockedBy?this.iconPath=new W.ThemeIcon("lock",new W.ThemeColor("charts.yellow")):this.iconPath=new W.ThemeIcon("package")}};le.LibraryNode=At;var Jt=class extends W.TreeItem{constructor(e,r,n){super(r.FunctionID,W.TreeItemCollapsibleState.None),this.libraryId=e,this.func=r,this.signatures=n;let o=n.filter(i=>!i.Response).map(i=>i.ArgumentName),a=n.filter(i=>i.Response).map(i=>i.ArgumentName);this.description=r.Description||"",this.tooltip=[`${r.LibraryID}.${r.FunctionID}`,r.Description||"",`Kind: ${r.Kind===2?"Code-based":r.Kind===1?"Widget + Code":"Widget"}`,o.length?`Request: ${o.join(", ")}`:"Request: (none)",`Response: ${a.join(", ")}`,r.Disabled?"DISABLED":"",r.Invalid?"INVALID":""].filter(Boolean).join(`
`),this.contextValue="function",this.iconPath=new W.ThemeIcon(r.Invalid?"warning":r.Disabled?"circle-slash":"symbol-function"),this.command={command:"efx.pullFunction",title:"Pull Function",arguments:[{libraryId:this.libraryId,func:this.func,signatures:this.signatures}]}}},Xt=class extends W.TreeItem{constructor(e,r){super(`Functions (${r})`,W.TreeItemCollapsibleState.Collapsed),this.libraryId=e,this.contextValue="function-group",this.iconPath=new W.ThemeIcon("symbol-function")}},We=class extends W.TreeItem{constructor(e,r,n,o){super(`${n} (${o})`,W.TreeItemCollapsibleState.Collapsed),this.libraryId=e,this.kind=r,this.contextValue=`reference-group-${r}`;let a={tables:"database",services:"server",libraries:"library",assemblies:"package"};this.iconPath=new W.ThemeIcon(a[r]||"references")}},tt=class extends W.TreeItem{constructor(e,r){let n="",o="",a="",i="references";e==="tables"?(n=r.TableID,o=r.Updatable?"Updatable":"Read-only",a=[r.TableID,`Updatable: ${r.Updatable?"Yes":"No"}`,`SysRowID: ${r.SysRowID||""}`].join(`
`),i=r.Updatable?"edit":"lock"):e==="services"?(n=r.ServiceID,o="Service",a=[r.ServiceID,`SysRowID: ${r.SysRowID||""}`].join(`
`),i="server"):e==="libraries"?(n=r.LibraryRef,o=r.Mode===1?"Read-only":r.Mode===2?"Hidden":"Normal",a=[r.LibraryRef,`Mode: ${r.Mode}`,`SysRowID: ${r.SysRowID||""}`].join(`
`),i="library"):e==="assemblies"&&(n=r.Assembly,o="Assembly",a=[r.Assembly,`SysRowID: ${r.SysRowID||""}`].join(`
`),i="package"),super(n||"(unknown)",W.TreeItemCollapsibleState.None),this.kind=e,this.row=r,this.description=o,this.tooltip=a,this.contextValue=`reference-item-${e}`,this.iconPath=new W.ThemeIcon(i)}};le.FunctionNode=Jt;var Rr=class{constructor(e){this.client=e,this._onDidChangeTreeData=new W.EventEmitter,this.onDidChangeTreeData=this._onDidChangeTreeData.event,this.libraries=[],this.libraryCache=new Map}setClient(e){this.client=e}async refresh(){if(!this.client){W.window.showWarningMessage("EFx: Configure connection first (gear icon)");return}try{this.libraries=await this.client.getLibraryList(),this.libraryCache.clear(),this._onDidChangeTreeData.fire(void 0),W.window.showInformationMessage(`EFx: Loaded ${this.libraries.length} libraries`)}catch(e){W.window.showErrorMessage(`EFx: Failed to load libraries: ${e.message}`)}}async getLibraryTableset(e){if(this.client){if(this.libraryCache.has(e))return this.libraryCache.get(e);try{let r=await this.client.getLibrary(e);return this.libraryCache.set(e,r),r}catch(r){W.window.showErrorMessage(`EFx: Failed to load ${e}: ${r.message}`);return}}}invalidateCache(e){this.libraryCache.delete(e)}getTreeItem(e){return e}async getChildren(e){if(!this.client)return[];if(!e)return this.libraries.sort((r,n)=>r.LibraryID.localeCompare(n.LibraryID)).map(r=>new At(r));if(e instanceof At){let r=await this.getLibraryTableset(e.library.LibraryID);if(!r)return[];let n=[],o=(r.EfxFunction||[]).filter(s=>s.Kind===2||s.Kind===1),a=r.EfxRefTable||[],i=r.EfxRefService||[],c=r.EfxRefLibrary||[],l=r.EfxRefAssembly||[];return o.length>0,o.length>0&&n.push(new Xt(e.library.LibraryID,o.length)),n.push(new We(e.library.LibraryID,"tables","Tables",a.length)),n.push(new We(e.library.LibraryID,"services","Services",i.length)),n.push(new We(e.library.LibraryID,"libraries","Libraries",c.length)),n.push(new We(e.library.LibraryID,"assemblies","Assemblies",l.length)),n}if(e instanceof Xt){let r=await this.getLibraryTableset(e.libraryId);return r?(r.EfxFunction||[]).filter(n=>n.Kind===2||n.Kind===1).sort((n,o)=>n.FunctionID.localeCompare(o.FunctionID)).map(n=>{let o=(r.EfxFunctionSignature||[]).filter(a=>a.FunctionID===n.FunctionID);return new Jt(e.libraryId,n,o)}):[]}if(e instanceof We){let r=await this.getLibraryTableset(e.libraryId);return r?e.kind==="tables"?(r.EfxRefTable||[]).sort((n,o)=>n.TableID.localeCompare(o.TableID)).map(n=>new tt("tables",n)):e.kind==="services"?(r.EfxRefService||[]).sort((n,o)=>n.ServiceID.localeCompare(o.ServiceID)).map(n=>new tt("services",n)):e.kind==="libraries"?(r.EfxRefLibrary||[]).sort((n,o)=>n.LibraryRef.localeCompare(o.LibraryRef)).map(n=>new tt("libraries",n)):e.kind==="assemblies"?(r.EfxRefAssembly||[]).sort((n,o)=>n.Assembly.localeCompare(o.Assembly)).map(n=>new tt("assemblies",n)):[]:[]}return[]}};le.EfxTreeProvider=Rr});var Dn=re(xe=>{"use strict";var ga=xe&&xe.__createBinding||(Object.create?(function(t,e,r,n){n===void 0&&(n=r);var o=Object.getOwnPropertyDescriptor(e,r);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[r]}}),Object.defineProperty(t,n,o)}):(function(t,e,r,n){n===void 0&&(n=r),t[n]=e[r]})),ba=xe&&xe.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),ya=xe&&xe.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(r){var n=[];for(var o in r)Object.prototype.hasOwnProperty.call(r,o)&&(n[n.length]=o);return n},t(e)};return function(e){if(e&&e.__esModule)return e;var r={};if(e!=null)for(var n=t(e),o=0;o<n.length;o++)n[o]!=="default"&&ga(r,e,n[o]);return ba(r,e),r}})();Object.defineProperty(xe,"__esModule",{value:!0});xe.ExecutePanel=void 0;var En=ya(require("vscode")),Qt=class t{constructor(e,r,n,o,a,i,c,l,s=!1){this.client=r,this.libraryId=n,this.functionId=o,this.signatures=a,this.companies=Array.isArray(i)&&i.length>0?i:c?[c]:[],this.defaultCompany=c||this.companies[0]||"",this.treeProvider=l||null,this.staging=s,this.disposed=!1,this.panel=e,this.panel.webview.onDidReceiveMessage(async f=>{f.command==="execute"&&await this.execute(f.payload,f.company),f.command==="saveSignatures"&&await this.saveSignatures(f.signatures)}),this.panel.onDidDispose(()=>{this.disposed=!0,t.panels.delete(`${n}.${o}`)}),this.panel.webview.html=this.getHtml()}static show(e,r,n,o,a,i,c,l=!1){let s=`${r}.${n}`,f=t.panels.get(s);if(f&&!f.disposed){f.panel.reveal();return}let g=En.window.createWebviewPanel("efxExecute",`\u25B6 ${n}`,En.ViewColumn.Two,{enableScripts:!0,retainContextWhenHidden:!0}),h=new t(g,e,r,n,o,a,i,c,l);t.panels.set(s,h)}async execute(e,r){this.panel.webview.postMessage({command:"executing"});try{let n=await this.client.executeFunction(this.libraryId,this.functionId,e,r||void 0,this.staging);this.panel.webview.postMessage({command:"result",data:JSON.stringify(n,null,2),success:!0})}catch(n){this.panel.webview.postMessage({command:"result",data:n.message,success:!1})}}async saveSignatures(e){this.panel.webview.postMessage({command:"sigSaving"});try{let{saved:r,diagnostics:n,updatedSigs:o}=await this.client.saveSignatures(this.libraryId,this.functionId,e);if(!r){let i=(n||[]).map(c=>typeof c=="object"?c.Message||JSON.stringify(c):String(c));this.panel.webview.postMessage({command:"sigError",error:i.join(`
`)||"Epicor rejected the signature change"});return}let a=this.signatures.filter(i=>i.FunctionID!==this.functionId);this.signatures=[...a,...o],this.treeProvider&&this.treeProvider.invalidateCache(this.libraryId),this.panel.webview.postMessage({command:"sigSaved",signatures:o})}catch(r){this.panel.webview.postMessage({command:"sigError",error:r.message})}}getHtml(){let e=this.signatures.filter(h=>!h.Response),r=this.signatures.filter(h=>h.Response),n={};for(let h of e)h.DataType.includes("Int")||h.DataType.includes("Decimal")||h.DataType.includes("Double")?n[h.ArgumentName]=0:h.DataType.includes("Boolean")?n[h.ArgumentName]=!1:h.DataType.includes("DataSet")||h.DataType.includes("DataTable")?n[h.ArgumentName]={}:n[h.ArgumentName]="";let o=e.map(h=>`<span class="param">${h.ArgumentName} <span class="type">${h.DataType.split(".").pop()}${h.Optional?"?":""}</span></span>`).join("")||'<span class="param none">No request parameters</span>',a=r.map(h=>`<span class="param">${h.ArgumentName} <span class="type">${h.DataType.split(".").pop()}</span></span>`).join(""),i=(this.companies||[]).map(h=>`<option value="${h}"${h===this.defaultCompany?" selected":""}>${h}</option>`).join(""),c=this.companies&&this.companies.length>0?`<div class="company-row">
        <label for="companySelect">Company</label>
        <select id="companySelect">${i}</select>
        <button class="btn-secondary" id="toggleSigBtn" onclick="toggleSigEditor()">\u2699 Edit Signatures</button>
    </div>`:`<div class="company-row">
        <button class="btn-secondary" id="toggleSigBtn" onclick="toggleSigEditor()">\u2699 Edit Signatures</button>
    </div>`,l=h=>({ArgumentName:h.ArgumentName,DataType:h.DataType||"System.String",Optional:!!h.Optional,Response:!!h.Response,Order:h.Order??0}),s=JSON.stringify(e.map(l)),f=JSON.stringify(r.map(l)),g=[["System.String","String"],["System.Int32","Int32"],["System.Int64","Int64"],["System.Decimal","Decimal"],["System.Double","Double"],["System.Boolean","Boolean"],["System.DateTime","DateTime"],["System.Data.DataSet","DataSet"],["System.Data.DataTable","DataTable"]].map(([h,p])=>`<option value="${h}">${p}</option>`).join("")+'<option value="__custom__">Custom\u2026</option>';return`<!DOCTYPE html>
<html>
<head>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        color: var(--vscode-foreground);
        background: var(--vscode-editor-background);
        padding: 16px;
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
        min-height: 200px;
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
        max-height: 400px;
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
        margin-top: 10px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; overflow: hidden;
    }
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
            <select id="newDataType">${g}</select>
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
        <textarea id="payload" spellcheck="false">${JSON.stringify(n,null,2)}</textarea>
    </div>

    <button id="executeBtn" onclick="doExecute()">
        Execute
    </button>
    <span class="spinner" id="spinner">\u23F3 Running...</span>

    <div class="response-area">
        <div class="response-header">
            <h2>Response</h2>
            <button class="btn-copy" id="copyBtn" onclick="copyResponse()" title="Copy response to clipboard">\u2398 Copy</button>
        </div>
        <div class="params">${a}</div>
        <pre id="response">\u2014 No response yet \u2014</pre>
        <div id="datasetWrap" class="dataset-table-wrap" style="display:none"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const staging = ${this.staging?"true":"false"};

        let reqSigs  = ${s};
        let respSigs = ${f};
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

        let activeDatasetTab = null;
        function renderDatasetTables(obj) {
            const wrap = document.getElementById('datasetWrap');
            const tables = extractTables(obj);
            const keys = Object.keys(tables);
            if (keys.length === 0) { wrap.style.display = 'none'; return; }
            wrap.style.display = '';
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
                datasetWrap.style.display = 'none';
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
                            datasetWrap.style.display = 'none';
                        }
                    } catch(e) {
                        datasetWrap.style.display = 'none';
                    }
                } else {
                    datasetWrap.style.display = 'none';
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
</html>`}};xe.ExecutePanel=Qt;Qt.panels=new Map});var Zt=re(he=>{"use strict";Object.defineProperty(he,"__esModule",{value:!0});he.BpmClient=void 0;var va={PRE:1,BASE:2,POST:3};he.DIRECTIVE_TYPE=va;function Cn(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\t/g,"&#x9;").replace(/\r\n/g,"&#xA;").replace(/\n/g,"&#xA;").replace(/\r/g,"&#xA;")}function An(t){return t.replace(/&#xA;/gi,`
`).replace(/&#xD;/gi,"\r").replace(/&#x9;/gi,"	").replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")}he.xmlDecode=An;he.xmlEncode=Cn;function wa(t){if(!t)return{code:"",hasCustomCode:!1};let e=t.indexOf("CustomCodeAction");if(e<0)return{code:"",hasCustomCode:!1};let r='Code="',n=t.indexOf(r,e);if(n<0)return{code:"",hasCustomCode:!1};let o=n+r.length,a=o;for(;a<t.length&&t[a]!=='"';){if(t[a]==="&"){let c=t.indexOf(";",a);if(c<0)break;a=c+1;continue}a++}let i=t.slice(o,a);return{code:An(i),hasCustomCode:!0}}he.extractBpmCode=wa;function xn(t,e){let r=t.indexOf("CustomCodeAction");if(r<0)throw new Error("No CustomCodeAction found in directive body");let n='Code="',o=t.indexOf(n,r);if(o<0)throw new Error("No Code= attribute found in CustomCodeAction");let a=o+n.length,i=a;for(;i<t.length&&t[i]!=='"';){if(t[i]==="&"){let c=t.indexOf(";",i);if(c<0)break;i=c+1;continue}i++}return t.slice(0,a)+Cn(e)+t.slice(i)}he.replaceBpmCode=xn;function Ea(t){return t?String(t).replace(/></g,`>
<`):""}he.formatBpmBodyXaml=Ea;function Da(t,e,r){let o=t.indexOf('"BpDirective":[');if(o<0)throw new Error("BpDirective array not found in raw tableset");let a=t.indexOf("[",o),i=`"DirectiveID":"${e}"`,c=a+1;for(;c<t.length;){let l=t.indexOf("{",c);if(l<0)break;let s=0,f=!1,g=!1,h=-1;for(let u=l;u<t.length;u++){let d=t[u];if(f){if(g){g=!1;continue}if(d==="\\"){g=!0;continue}d==='"'&&(f=!1);continue}if(d==='"'){f=!0;continue}if(d==="{")s++;else if(d==="}"&&(s--,s===0)){h=u;break}}if(h<0)throw new Error("Malformed BpDirective object in raw tableset");let p=t.slice(l,h+1);if(p.includes(i)){let u='"Body":"',d=p.indexOf(u);if(d<0)throw new Error("Body field not found in BpDirective row");let v=d+u.length,b=v,w=!1;for(;b<p.length;){let z=p[b];if(w){w=!1,b++;continue}if(z==="\\"){w=!0,b++;continue}if(z==='"')break;b++}if(b>=p.length)throw new Error("Body string value did not terminate");let y=b,D='"'+p.slice(v,y)+'"',E;try{E=JSON.parse(D)}catch(z){throw new Error("Failed to JSON-parse Body value: "+z.message)}let C=xn(E,r),A=JSON.stringify(C).slice(1,-1),T=p.slice(0,v)+A+p.slice(y),N=t.slice(0,l)+p+","+T+t.slice(h+1),F='"BitFlag":0,"RowMod":""',j='"BitFlag":0,"RowMod":"U"',x=l+p.length+1,S=x+T.length,L=N.indexOf(F,x);if(L<0||L>S)throw new Error(`BitFlag/RowMod anchor not found for directive ${e}`);return N.slice(0,L)+j+N.slice(L+F.length)}c=h+1}throw new Error(`Directive ${e} not found in raw tableset`)}he.updateRawBpmDirective=Da;var $r=class{constructor(e){this._client=e}getBpmUrl(e){return`${this._client.config.serverUrl.replace(/\/$/,"")}/api/v2/odata/${this._client.config.company}/Ice.BO.BpMethodSvc/${e}`}async request(e,r){return this._client.request(e,r)}async requestRaw(e,r){return this._client.requestRaw(e,r)}async getBpmServices(){return(await this.request(this.getBpmUrl("GetBpmDirectiveServicesTS"),{})).returnObj?.BpDirectiveService||[]}async getBpmMethodsByService(e,r,n){let a=(await this.request(this.getBpmUrl("GetRowsEx"),{source:"BO",whereClauseBpMethod:`SystemCode = '${e}' and ObjectNS = '${r}' and BusinessObject = '${n}'`,whereClauseBpDirective:"",pageSize:500,absolutePage:1})).returnObj;return{methods:a?.BpMethod||[],directives:a?.BpDirective||[]}}async getBpmMethod(e,r){return(await this.request(this.getBpmUrl("GetByIDBpMethod"),{source:e,bpMethodCode:r})).returnObj}async getBpmMethodRaw(e,r){let n=await this.requestRaw(this.getBpmUrl("GetByIDBpMethod"),JSON.stringify({source:e,bpMethodCode:r})),o=n.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);return o?o[1]:n}async updateBpmRaw(e){let r=`{"ds":${e}}`,n=await this.requestRaw(this.getBpmUrl("Update"),r);try{return JSON.parse(n)}catch{return{}}}async validateCustomCode(e,r){let n=JSON.stringify({Code:e,IsCondition:!1});return(await this.request(this.getBpmUrl("ValidateCustomCode"),{codeSnippetWithScope:n,functionDefinition:JSON.stringify(r),isAsync:!1})).returnObj?.diagnostics||null}};he.BpmClient=$r;function Ca(t,e){let r=t.SystemCode||"Erp",n=r.charAt(0).toUpperCase()+r.slice(1).toLowerCase(),o={INPUT:0,OUTPUT:1,"INPUT-OUTPUT":2};return{FunctionKind:0,Target:{kind:0,id:t.BpMethodCode,alias:t.BpMethodCode,productCode:{value:n},name:t.BusinessObject,method:t.Name,hasRootTransaction:t.HasRootTransaction},SupportsAdvancedFeatures:!0,SupportsDbAccessInCode:0,DebugMode:t.DebugMode||!1,Arguments:(e||[]).map(a=>({Name:a.BpArgumentName,Type:a.TypeInfo,TypeName:a.Type,Direction:o[a.Direction]??2,Kind:o[a.Direction]??2})),LocalVariables:[],CustomReferences:[{Name:"Assemblies",IsStandard:!1,IsEditable:!0,References:{}},{Name:"Externals",IsStandard:!1,IsEditable:!0,References:{}},{Name:"Standard",IsStandard:!0,IsEditable:!0,References:{}}],CustomUsings:""}}he.buildFunctionDefinition=Ca});var Tn=re(me=>{"use strict";var Aa=me&&me.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(r){var n=[];for(var o in r)Object.prototype.hasOwnProperty.call(r,o)&&(n[n.length]=o);return n},t(e)};return function(e){if(e&&e.__esModule)return e;var r={};if(e!=null)for(var n=t(e),o=0;o<n.length;o++)n[o]!=="default"&&xa(r,e,n[o]);return Ta(r,e),r}})(),xa=me&&me.__createBinding||(Object.create?(function(t,e,r,n){n===void 0&&(n=r);var o=Object.getOwnPropertyDescriptor(e,r);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[r]}}),Object.defineProperty(t,n,o)}):(function(t,e,r,n){n===void 0&&(n=r),t[n]=e[r]})),Ta=me&&me.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e});Object.defineProperty(me,"__esModule",{value:!0});me.BpmTreeProvider=void 0;var V=Aa(require("vscode")),Sa=Zt(),xt=class extends V.TreeItem{constructor(e){let r=`${e.SystemCode}.${e.ServiceKind}.${e.ServiceName}`;super(r,V.TreeItemCollapsibleState.Collapsed),this.svc=e,this.contextValue="bpm-service",this.iconPath=new V.ThemeIcon("server"),this.tooltip=`${e.SystemCode} / ${e.ServiceKind} / ${e.ServiceName}`}},Tt=class extends V.TreeItem{constructor(e,r){super(e.Name,V.TreeItemCollapsibleState.Collapsed),this.method=e,this.directives=r,this.contextValue="bpm-method";let n=[];e.HasPreProcessing&&n.push("Pre"),e.HasBaseProcessing&&n.push("Base"),e.HasPostProcessing&&n.push("Post"),e.Disabled&&n.push("Disabled"),e.HasOutdatedDirectives&&n.push("\u26A0 Outdated"),this.description=n.join(" \xB7 ")||"No directives",this.tooltip=[`${e.BpMethodCode}`,`Source: ${e.Source}`,n.length?`Flags: ${n.join(", ")}`:""].filter(Boolean).join(`
`),e.Disabled?this.iconPath=new V.ThemeIcon("circle-slash",new V.ThemeColor("charts.red")):e.HasOutdatedDirectives?this.iconPath=new V.ThemeIcon("warning",new V.ThemeColor("charts.yellow")):n.length>0?this.iconPath=new V.ThemeIcon("symbol-event",new V.ThemeColor("charts.blue")):this.iconPath=new V.ThemeIcon("symbol-event")}},er=class extends V.TreeItem{constructor(e){super(e.Name,V.TreeItemCollapsibleState.None),this.directive=e;let r=e.DirectiveType===1?"Pre":e.DirectiveType===3?"Post":e.DirectiveType===2?"Base":`Type${e.DirectiveType}`,{hasCustomCode:n}=Sa.extractBpmCode(e.Body);this.description=[r,e.IsEnabled?"":"Disabled",n?"":"No code",e.DirectiveGroup?`[${e.DirectiveGroup}]`:""].filter(Boolean).join(" \xB7 "),this.contextValue=n?"bpm-directive-code":"bpm-directive-nocode",n||(this.command={command:"efx.bpm.openWidgetPanel",title:"Open Widget Panel",arguments:[{directive:e}]}),this.tooltip=[e.Name,`Type: ${r}`,`Enabled: ${e.IsEnabled}`,`Group: ${e.DirectiveGroup||"(none)"}`,n?"Has custom C# code":"No custom code (widget/condition only)",e.CompilerDiagnostics?`Diagnostics: ${e.CompilerDiagnostics}`:""].filter(Boolean).join(`
`),e.IsEnabled?n?e.DirectiveType===1?this.iconPath=new V.ThemeIcon("arrow-up",new V.ThemeColor("charts.blue")):e.DirectiveType===3?this.iconPath=new V.ThemeIcon("arrow-down",new V.ThemeColor("charts.green")):this.iconPath=new V.ThemeIcon("symbol-event"):this.iconPath=new V.ThemeIcon("gear"):this.iconPath=new V.ThemeIcon("circle-slash",new V.ThemeColor("charts.red")),n&&(this.command={command:"efx.bpm.pullDirective",title:"Pull Directive Code",arguments:[{directive:e}]})}};me.BpmServiceNode=xt;me.BpmMethodNode=Tt;me.BpmDirectiveNode=er;var Ur=class{constructor(e){this.bpmClient=e,this._onDidChangeTreeData=new V.EventEmitter,this.onDidChangeTreeData=this._onDidChangeTreeData.event,this.services=[],this.methodCache=new Map}setClient(e){this.bpmClient=e}async refresh(){if(!this.bpmClient){V.window.showWarningMessage("BPM: Configure EFx connection first");return}try{this.services=await this.bpmClient.getBpmServices(),this.methodCache.clear(),this._onDidChangeTreeData.fire(void 0),V.window.showInformationMessage(`BPM: Loaded ${this.services.length} services`)}catch(e){V.window.showErrorMessage(`BPM: Failed to load services: ${e.message}`)}}invalidateService(e,r,n){let o=`${e}.${r}.${n}`;this.methodCache.delete(o)}getTreeItem(e){return e}async getChildren(e){if(!this.bpmClient)return[];if(!e)return this.services.sort((r,n)=>{let o=`${r.SystemCode}.${r.ServiceKind}.${r.ServiceName}`,a=`${n.SystemCode}.${n.ServiceKind}.${n.ServiceName}`;return o.localeCompare(a)}).map(r=>new xt(r));if(e instanceof xt){let{SystemCode:r,ServiceKind:n,ServiceName:o}=e.svc,a=`${r}.${n}.${o}`,i=this.methodCache.get(a);if(!i)try{i=await this.bpmClient.getBpmMethodsByService(r,n,o),this.methodCache.set(a,i)}catch(s){return V.window.showErrorMessage(`BPM: Failed to load methods: ${s.message}`),[]}let{methods:c,directives:l}=i;return c.sort((s,f)=>s.Name.localeCompare(f.Name)).map(s=>{let f=l.filter(g=>g.BpMethodCode===s.BpMethodCode);return new Tt(s,f)})}if(e instanceof Tt){let r=e.directives;return!r||r.length===0?[]:r.sort((n,o)=>n.DirectiveType!==o.DirectiveType?n.DirectiveType-o.DirectiveType:(n.Order||0)-(o.Order||0)).map(n=>new er(n))}return[]}};me.BpmTreeProvider=Ur});var Ye=re(oe=>{"use strict";function Ia(t,e,r){if(r===void 0&&(r=Array.prototype),t&&typeof r.find=="function")return r.find.call(t,e);for(var n=0;n<t.length;n++)if(Ge(t,n)){var o=t[n];if(e.call(void 0,o,n,t))return o}}function rt(t,e){return e===void 0&&(e=Object),e&&typeof e.getOwnPropertyDescriptors=="function"&&(t=e.create(null,e.getOwnPropertyDescriptors(t))),e&&typeof e.freeze=="function"?e.freeze(t):t}function Ge(t,e){return Object.prototype.hasOwnProperty.call(t,e)}function Na(t,e){if(t===null||typeof t!="object")throw new TypeError("target is not an object");for(var r in e)Ge(e,r)&&(t[r]=e[r]);return t}var Sn=rt({allowfullscreen:!0,async:!0,autofocus:!0,autoplay:!0,checked:!0,controls:!0,default:!0,defer:!0,disabled:!0,formnovalidate:!0,hidden:!0,ismap:!0,itemscope:!0,loop:!0,multiple:!0,muted:!0,nomodule:!0,novalidate:!0,open:!0,playsinline:!0,readonly:!0,required:!0,reversed:!0,selected:!0});function Ba(t){return Ge(Sn,t.toLowerCase())}var In=rt({area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function La(t){return Ge(In,t.toLowerCase())}var St=rt({script:!1,style:!1,textarea:!0,title:!0});function Oa(t){var e=t.toLowerCase();return Ge(St,e)&&!St[e]}function _a(t){var e=t.toLowerCase();return Ge(St,e)&&St[e]}function Nn(t){return t===It.HTML}function ka(t){return Nn(t)||t===It.XML_XHTML_APPLICATION}var It=rt({HTML:"text/html",XML_APPLICATION:"application/xml",XML_TEXT:"text/xml",XML_XHTML_APPLICATION:"application/xhtml+xml",XML_SVG_IMAGE:"image/svg+xml"}),Ma=Object.keys(It).map(function(t){return It[t]});function Fa(t){return Ma.indexOf(t)>-1}var Pa=rt({HTML:"http://www.w3.org/1999/xhtml",SVG:"http://www.w3.org/2000/svg",XML:"http://www.w3.org/XML/1998/namespace",XMLNS:"http://www.w3.org/2000/xmlns/"});oe.assign=Na;oe.find=Ia;oe.freeze=rt;oe.HTML_BOOLEAN_ATTRIBUTES=Sn;oe.HTML_RAW_TEXT_ELEMENTS=St;oe.HTML_VOID_ELEMENTS=In;oe.hasDefaultHTMLNamespace=ka;oe.hasOwn=Ge;oe.isHTMLBooleanAttribute=Ba;oe.isHTMLRawTextElement=Oa;oe.isHTMLEscapableRawTextElement=_a;oe.isHTMLMimeType=Nn;oe.isHTMLVoidElement=La;oe.isValidMimeType=Fa;oe.MIME_TYPE=It;oe.NAMESPACE=Pa});var _t=re(Ot=>{"use strict";var Ra=Ye();function Ln(t,e){t.prototype=Object.create(Error.prototype,{constructor:{value:t},name:{value:t.name,enumerable:!0,writable:e}})}var Bt=Ra.freeze({Error:"Error",IndexSizeError:"IndexSizeError",DomstringSizeError:"DomstringSizeError",HierarchyRequestError:"HierarchyRequestError",WrongDocumentError:"WrongDocumentError",InvalidCharacterError:"InvalidCharacterError",NoDataAllowedError:"NoDataAllowedError",NoModificationAllowedError:"NoModificationAllowedError",NotFoundError:"NotFoundError",NotSupportedError:"NotSupportedError",InUseAttributeError:"InUseAttributeError",InvalidStateError:"InvalidStateError",SyntaxError:"SyntaxError",InvalidModificationError:"InvalidModificationError",NamespaceError:"NamespaceError",InvalidAccessError:"InvalidAccessError",ValidationError:"ValidationError",TypeMismatchError:"TypeMismatchError",SecurityError:"SecurityError",NetworkError:"NetworkError",AbortError:"AbortError",URLMismatchError:"URLMismatchError",QuotaExceededError:"QuotaExceededError",TimeoutError:"TimeoutError",InvalidNodeTypeError:"InvalidNodeTypeError",DataCloneError:"DataCloneError",EncodingError:"EncodingError",NotReadableError:"NotReadableError",UnknownError:"UnknownError",ConstraintError:"ConstraintError",DataError:"DataError",TransactionInactiveError:"TransactionInactiveError",ReadOnlyError:"ReadOnlyError",VersionError:"VersionError",OperationError:"OperationError",NotAllowedError:"NotAllowedError",OptOutError:"OptOutError"}),On=Object.keys(Bt);function _n(t){return typeof t=="number"&&t>=1&&t<=25}function $a(t){return typeof t=="string"&&t.substring(t.length-Bt.Error.length)===Bt.Error}function Lt(t,e){_n(t)?(this.name=On[t],this.message=e||""):(this.message=t,this.name=$a(e)?e:Bt.Error),Error.captureStackTrace&&Error.captureStackTrace(this,Lt)}Ln(Lt,!0);Object.defineProperties(Lt.prototype,{code:{enumerable:!0,get:function(){var t=On.indexOf(this.name);return _n(t)?t:0}}});var kn={INDEX_SIZE_ERR:1,DOMSTRING_SIZE_ERR:2,HIERARCHY_REQUEST_ERR:3,WRONG_DOCUMENT_ERR:4,INVALID_CHARACTER_ERR:5,NO_DATA_ALLOWED_ERR:6,NO_MODIFICATION_ALLOWED_ERR:7,NOT_FOUND_ERR:8,NOT_SUPPORTED_ERR:9,INUSE_ATTRIBUTE_ERR:10,INVALID_STATE_ERR:11,SYNTAX_ERR:12,INVALID_MODIFICATION_ERR:13,NAMESPACE_ERR:14,INVALID_ACCESS_ERR:15,VALIDATION_ERR:16,TYPE_MISMATCH_ERR:17,SECURITY_ERR:18,NETWORK_ERR:19,ABORT_ERR:20,URL_MISMATCH_ERR:21,QUOTA_EXCEEDED_ERR:22,TIMEOUT_ERR:23,INVALID_NODE_TYPE_ERR:24,DATA_CLONE_ERR:25},qr=Object.entries(kn);for(Nt=0;Nt<qr.length;Nt++)Bn=qr[Nt][0],Lt[Bn]=qr[Nt][1];var Bn,Nt;function jr(t,e){this.message=t,this.locator=e,Error.captureStackTrace&&Error.captureStackTrace(this,jr)}Ln(jr);Ot.DOMException=Lt;Ot.DOMExceptionName=Bt;Ot.ExceptionCode=kn;Ot.ParseError=jr});var Kr=re(k=>{"use strict";function qn(t){try{typeof t!="function"&&(t=RegExp);var e=new t("\u{1D306}","u").exec("\u{1D306}");return!!e&&e[0].length===2}catch{}return!1}var at=qn();function Re(t){if(t.source[0]!=="[")throw new Error(t+" can not be used with chars");return t.source.slice(1,t.source.lastIndexOf("]"))}function nt(t,e){if(t.source[0]!=="[")throw new Error("/"+t.source+"/ can not be used with chars_without");if(!e||typeof e!="string")throw new Error(JSON.stringify(e)+" is not a valid search");if(t.source.indexOf(e)===-1)throw new Error('"'+e+'" is not is /'+t.source+"/");if(e==="-"&&t.source.indexOf(e)!==1)throw new Error('"'+e+'" is not at the first postion of /'+t.source+"/");return new RegExp(t.source.replace(e,""),at?"u":"")}function P(t){var e=this;return new RegExp(Array.prototype.slice.call(arguments).map(function(r){var n=typeof r=="string";if(n&&e===void 0&&r==="|")throw new Error("use regg instead of reg to wrap expressions with `|`!");return n?r:r.source}).join(""),at?"mu":"m")}function _(t){if(arguments.length===0)throw new Error("no parameters provided");return P.apply(_,["(?:"].concat(Array.prototype.slice.call(arguments),[")"]))}var Ua="\uFFFD",$e=/[-\x09\x0A\x0D\x20-\x2C\x2E-\uD7FF\uE000-\uFFFD]/;at&&($e=P("[",Re($e),"\\u{10000}-\\u{10FFFF}","]"));var qa=new RegExp("[^"+Re($e)+"]",at?"u":""),zr=/[\x20\x09\x0D\x0A]/,ja=Re(zr),H=P(zr,"+"),Y=P(zr,"*"),kt=/[:_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;at&&(kt=P("[",Re(kt),"\\u{10000}-\\u{10FFFF}","]"));var Ha=Re(kt),Vr=P("[",Ha,Re(/[-.0-9\xB7]/),Re(/[\u0300-\u036F\u203F-\u2040]/),"]"),ge=P(kt,Vr,"*"),Mn=P(Vr,"+"),za=P("&",ge,";"),Va=_(/&#[0-9]+;|&#x[0-9a-fA-F]+;/),Mt=_(za,"|",Va),Ft=P("%",ge,";"),Wr=_(P('"',_(/[^%&"]/,"|",Ft,"|",Mt),"*",'"'),"|",P("'",_(/[^%&']/,"|",Ft,"|",Mt),"*","'")),Wa=_('"',_(/[^<&"]/,"|",Mt),"*",'"',"|","'",_(/[^<&']/,"|",Mt),"*","'"),Ga=nt(kt,":"),Ya=nt(Vr,":"),Fn=P(Ga,Ya,"*"),Pt=P(Fn,_(":",Fn),"?"),Ka=P("^",Pt,"$"),Ja=P("(",Pt,")"),ot=_(/"[^"]*"|'[^']*'/),Xa=P(/^<\?/,"(",ge,")",_(H,"(",$e,"*?)"),"?",/\?>/),Pn=/[\x20\x0D\x0Aa-zA-Z0-9-'()+,./:=?;!*#@$_%]/,Rt=_('"',Pn,'*"',"|","'",nt(Pn,"'"),"*'"),jn="<!--",Hn="-->",Qa=P(jn,_(nt($e,"-"),"|",P("-",nt($e,"-"))),"*",Hn),Rn="#PCDATA",Za=_(P(/\(/,Y,Rn,_(Y,/\|/,Y,Pt),"*",Y,/\)\*/),"|",P(/\(/,Y,Rn,Y,/\)/)),ei=/[?*+]?/,ti=P(/\([^>]+\)/,ei),ri=_("EMPTY","|","ANY","|",Za,"|",ti),ni="<!ELEMENT",oi=P(ni,H,_(Pt,"|",Ft),H,_(ri,"|",Ft),Y,">"),ai=P("NOTATION",H,/\(/,Y,ge,_(Y,/\|/,Y,ge),"*",Y,/\)/),ii=P(/\(/,Y,Mn,_(Y,/\|/,Y,Mn),"*",Y,/\)/),si=_(ai,"|",ii),ci=_(/CDATA|ID|IDREF|IDREFS|ENTITY|ENTITIES|NMTOKEN|NMTOKENS/,"|",si),li=_(/#REQUIRED|#IMPLIED/,"|",_(_("#FIXED",H),"?",Wa)),ui=_(H,ge,H,ci,H,li),di="<!ATTLIST",pi=P(di,H,ge,ui,"*",Y,">"),Hr="about:legacy-compat",fi=_('"'+Hr+'"',"|","'"+Hr+"'"),Gr="SYSTEM",tr="PUBLIC",rr=_(_(Gr,H,ot),"|",_(tr,H,Rt,H,ot)),mi=P("^",_(_(Gr,H,"(?<SystemLiteralOnly>",ot,")"),"|",_(tr,H,"(?<PubidLiteral>",Rt,")",H,"(?<SystemLiteral>",ot,")"))),hi=P("^",Rt,"$"),gi=P("^",ot,"$"),bi=_(H,"NDATA",H,ge),yi=_(Wr,"|",_(rr,bi,"?")),zn="<!ENTITY",vi=P(zn,H,ge,H,yi,Y,">"),wi=_(Wr,"|",rr),Ei=P(zn,H,"%",H,ge,H,wi,Y,">"),Di=_(vi,"|",Ei),Ci=P(tr,H,Rt),Ai=P("<!NOTATION",H,ge,H,_(rr,"|",Ci),Y,">"),Yr=P(Y,"=",Y),$n=/1[.]\d+/,xi=P(H,"version",Yr,_("'",$n,"'","|",'"',$n,'"')),Un=/[A-Za-z][-A-Za-z0-9._]*/,Ti=_(H,"encoding",Yr,_('"',Un,'"',"|","'",Un,"'")),Si=_(H,"standalone",Yr,_("'",_("yes","|","no"),"'","|",'"',_("yes","|","no"),'"')),Ii=P(/^<\?xml/,xi,Ti,"?",Si,"?",Y,/\?>/),Ni="<!DOCTYPE",Bi="<![CDATA[",Li="]]>",Oi=/<!\[CDATA\[/,_i=/\]\]>/,ki=P($e,"*?",_i),Mi=P(Oi,ki);k.chars=Re;k.chars_without=nt;k.detectUnicodeSupport=qn;k.reg=P;k.regg=_;k.ABOUT_LEGACY_COMPAT=Hr;k.ABOUT_LEGACY_COMPAT_SystemLiteral=fi;k.AttlistDecl=pi;k.CDATA_START=Bi;k.CDATA_END=Li;k.CDSect=Mi;k.Char=$e;k.Comment=Qa;k.COMMENT_START=jn;k.COMMENT_END=Hn;k.DOCTYPE_DECL_START=Ni;k.elementdecl=oi;k.EntityDecl=Di;k.EntityValue=Wr;k.ExternalID=rr;k.ExternalID_match=mi;k.Name=ge;k.NotationDecl=Ai;k.Reference=Mt;k.PEReference=Ft;k.PI=Xa;k.PUBLIC=tr;k.PubidLiteral=Rt;k.PubidLiteral_match=hi;k.QName=Pt;k.QName_exact=Ka;k.QName_group=Ja;k.S=H;k.SChar_s=ja;k.S_OPT=Y;k.SYSTEM=Gr;k.SystemLiteral=ot;k.SystemLiteral_match=gi;k.InvalidChar=qa;k.UNICODE_REPLACEMENT_CHARACTER=Ua;k.UNICODE_SUPPORT=at;k.XMLDecl=Ii});var nn=re(X=>{"use strict";var ve=Ye(),Se=ve.find,Fi=ve.hasDefaultHTMLNamespace,st=ve.hasOwn,Pi=ve.isHTMLMimeType,Ri=ve.isHTMLRawTextElement,$i=ve.isHTMLVoidElement,$t=ve.MIME_TYPE,Ie=ve.NAMESPACE,ce=Symbol(),Xn=_t(),I=Xn.DOMException,be=Xn.DOMExceptionName,ae=Kr();function ue(t){if(t!==ce)throw new TypeError("Illegal constructor")}function Ui(t){return t!==""}function qi(t){return t?t.split(/[\t\n\f\r ]+/).filter(Ui):[]}function ji(t,e){return st(t,e)||(t[e]=!0),t}function Vn(t){if(!t)return[];var e=qi(t);return Object.keys(e.reduce(ji,{}))}function Hi(t){return function(e){return t&&t.indexOf(e)!==-1}}function Qn(t){if(!ae.QName_exact.test(t))throw new I(I.INVALID_CHARACTER_ERR,'invalid character in qualified name "'+t+'"')}function Xr(t,e){Qn(e),t=t||null;var r=null,n=e;if(e.indexOf(":")>=0){var o=e.split(":");r=o[0],n=o[1]}if(r!==null&&t===null)throw new I(I.NAMESPACE_ERR,"prefix is non-null and namespace is null");if(r==="xml"&&t!==ve.NAMESPACE.XML)throw new I(I.NAMESPACE_ERR,'prefix is "xml" and namespace is not the XML namespace');if((r==="xmlns"||e==="xmlns")&&t!==ve.NAMESPACE.XMLNS)throw new I(I.NAMESPACE_ERR,'either qualifiedName or prefix is "xmlns" and namespace is not the XMLNS namespace');if(t===ve.NAMESPACE.XMLNS&&r!=="xmlns"&&e!=="xmlns")throw new I(I.NAMESPACE_ERR,'namespace is the XMLNS namespace and neither qualifiedName nor prefix is "xmlns"');return[t,r,n]}function ut(t,e){for(var r in t)st(t,r)&&(e[r]=t[r])}function de(t,e){var r=t.prototype;if(!(r instanceof e)){let n=function(){};n.prototype=e.prototype,n=new n,ut(r,n),t.prototype=r=n}r.constructor!=t&&(typeof t!="function"&&console.error("unknown Class:"+t),r.constructor=t)}var pe={},ye=pe.ELEMENT_NODE=1,ct=pe.ATTRIBUTE_NODE=2,ar=pe.TEXT_NODE=3,Zn=pe.CDATA_SECTION_NODE=4,eo=pe.ENTITY_REFERENCE_NODE=5,zi=pe.ENTITY_NODE=6,Qr=pe.PROCESSING_INSTRUCTION_NODE=7,Zr=pe.COMMENT_NODE=8,it=pe.DOCUMENT_NODE=9,to=pe.DOCUMENT_TYPE_NODE=10,Ue=pe.DOCUMENT_FRAGMENT_NODE=11,Vi=pe.NOTATION_NODE=12,J=ve.freeze({DOCUMENT_POSITION_DISCONNECTED:1,DOCUMENT_POSITION_PRECEDING:2,DOCUMENT_POSITION_FOLLOWING:4,DOCUMENT_POSITION_CONTAINS:8,DOCUMENT_POSITION_CONTAINED_BY:16,DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:32});function ro(t,e){if(e.length<t.length)return ro(e,t);var r=null;for(var n in t){if(t[n]!==e[n])return r;r=t[n]}return r}function Wn(t){return t.guid||(t.guid=Math.random()),t.guid}function Z(){}Z.prototype={length:0,item:function(t){return t>=0&&t<this.length?this[t]:null},toString:function(t){var e;typeof t=="function"?e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:t}:t?e={requireWellFormed:!!t.requireWellFormed,splitCDATASections:t.splitCDATASections!==!1,nodeFilter:t.nodeFilter||null}:e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:null};for(var r=[],n=0;n<this.length;n++)rn(this[n],r,null,e);return r.join("")},filter:function(t){return Array.prototype.filter.call(this,t)},indexOf:function(t){return Array.prototype.indexOf.call(this,t)}};Z.prototype[Symbol.iterator]=function(){var t=this,e=0;return{next:function(){return e<t.length?{value:t[e++],done:!1}:{done:!0}},return:function(){return{done:!0}}}};function Te(t,e){this._node=t,this._refresh=e,sr(this)}function sr(t){var e=t._node._inc||t._node.ownerDocument._inc;if(t._inc!==e){var r=t._refresh(t._node);if(ho(t,"length",r.length),!t.$$length||r.length<t.$$length)for(var n=r.length;n in t;n++)st(t,n)&&delete t[n];ut(r,t),t._inc=e}}Te.prototype.item=function(t){return sr(this),this[t]||null};de(Te,Z);function lt(){}function no(t,e){for(var r=0;r<t.length;){if(t[r]===e)return r;r++}}function Wi(t,e,r,n){if(n?e[no(e,n)]=r:(e[e.length]=r,e.length++),t){r.ownerElement=t;var o=t.ownerDocument;o&&(n&&io(o,t,n),Gi(o,t,r))}}function Gn(t,e,r){var n=no(e,r);if(n>=0){for(var o=e.length-1;n<=o;)e[n]=e[++n];if(e.length=o,t){var a=t.ownerDocument;a&&io(a,t,r),r.ownerElement=null}}}lt.prototype={length:0,item:Z.prototype.item,getNamedItem:function(t){this._ownerElement&&this._ownerElement._isInHTMLDocumentAndNamespace()&&(t=t.toLowerCase());for(var e=0;e<this.length;){var r=this[e];if(r.nodeName===t)return r;e++}return null},setNamedItem:function(t){var e=t.ownerElement;if(e&&e!==this._ownerElement)throw new I(I.INUSE_ATTRIBUTE_ERR);var r=this.getNamedItemNS(t.namespaceURI,t.localName);return r===t?t:(Wi(this._ownerElement,this,t,r),r)},setNamedItemNS:function(t){return this.setNamedItem(t)},removeNamedItem:function(t){var e=this.getNamedItem(t);if(!e)throw new I(I.NOT_FOUND_ERR,t);return Gn(this._ownerElement,this,e),e},removeNamedItemNS:function(t,e){var r=this.getNamedItemNS(t,e);if(!r)throw new I(I.NOT_FOUND_ERR,t?t+" : "+e:e);return Gn(this._ownerElement,this,r),r},getNamedItemNS:function(t,e){t||(t=null);for(var r=0;r<this.length;){var n=this[r];if(n.localName===e&&n.namespaceURI===t)return n;r++}return null}};lt.prototype[Symbol.iterator]=function(){var t=this,e=0;return{next:function(){return e<t.length?{value:t[e++],done:!1}:{done:!0}},return:function(){return{done:!0}}}};function oo(){}oo.prototype={hasFeature:function(t,e){return!0},createDocument:function(t,e,r){var n=$t.XML_APPLICATION;t===Ie.HTML?n=$t.XML_XHTML_APPLICATION:t===Ie.SVG&&(n=$t.XML_SVG_IMAGE);var o=new ke(ce,{contentType:n});if(o.implementation=this,o.childNodes=new Z,o.doctype=r||null,r&&o.appendChild(r),e){var a=o.createElementNS(t,e);o.appendChild(a)}return o},createDocumentType:function(t,e,r,n){Qn(t);var o=new ur(ce);return o.name=t,o.nodeName=t,o.publicId=e||"",o.systemId=r||"",o.internalSubset=n||"",o.childNodes=new Z,o},createHTMLDocument:function(t){var e=new ke(ce,{contentType:$t.HTML});if(e.implementation=this,e.childNodes=new Z,t!==!1){e.doctype=this.createDocumentType("html"),e.doctype.ownerDocument=e,e.appendChild(e.doctype);var r=e.createElement("html");e.appendChild(r);var n=e.createElement("head");if(r.appendChild(n),typeof t=="string"){var o=e.createElement("title");o.appendChild(e.createTextNode(t)),n.appendChild(o)}r.appendChild(e.createElement("body"))}return e}};function $(t){ue(t)}$.prototype={firstChild:null,lastChild:null,previousSibling:null,nextSibling:null,parentNode:null,get parentElement(){return this.parentNode&&this.parentNode.nodeType===this.ELEMENT_NODE?this.parentNode:null},childNodes:null,ownerDocument:null,nodeValue:null,namespaceURI:null,prefix:null,localName:null,baseURI:"about:blank",get isConnected(){var t=this.getRootNode();return t&&t.nodeType===t.DOCUMENT_NODE},contains:function(t){if(!t)return!1;var e=t;do{if(this===e)return!0;e=e.parentNode}while(e);return!1},getRootNode:function(t){var e=this;do{if(!e.parentNode)return e;e=e.parentNode}while(e)},isEqualNode:function(t){if(!t)return!1;for(var e=[{node:this,other:t}];e.length>0;){var r=e.pop(),n=r.node,o=r.other;if(n.nodeType!==o.nodeType)return!1;switch(n.nodeType){case n.DOCUMENT_TYPE_NODE:if(n.name!==o.name||n.publicId!==o.publicId||n.systemId!==o.systemId)return!1;break;case n.ELEMENT_NODE:if(n.namespaceURI!==o.namespaceURI||n.prefix!==o.prefix||n.localName!==o.localName||n.attributes.length!==o.attributes.length)return!1;for(var a=0;a<n.attributes.length;a++){var i=n.attributes.item(a),c=o.getAttributeNodeNS(i.namespaceURI,i.localName);if(!c)return!1;e.push({node:i,other:c})}break;case n.ATTRIBUTE_NODE:if(n.namespaceURI!==o.namespaceURI||n.localName!==o.localName||n.value!==o.value)return!1;break;case n.PROCESSING_INSTRUCTION_NODE:if(n.target!==o.target||n.data!==o.data)return!1;break;case n.TEXT_NODE:case n.CDATA_SECTION_NODE:case n.COMMENT_NODE:if(n.data!==o.data)return!1;break}if(n.childNodes.length!==o.childNodes.length)return!1;for(var a=n.childNodes.length-1;a>=0;a--)e.push({node:n.childNodes[a],other:o.childNodes[a]})}return!0},isSameNode:function(t){return this===t},insertBefore:function(t,e){return ir(this,t,e)},replaceChild:function(t,e){ir(this,t,e,uo),e&&this.removeChild(e)},removeChild:function(t){return co(this,t)},appendChild:function(t){return this.insertBefore(t,null)},hasChildNodes:function(){return this.firstChild!=null},cloneNode:function(t){return mo(this.ownerDocument||this,this,t)},normalize:function(){ie(this,null,{enter:function(t){for(var e=t.firstChild;e;){var r=e.nextSibling;r!==null&&r.nodeType===ar&&e.nodeType===ar?(t.removeChild(r),e.appendData(r.data)):e=r}return!0}})},isSupported:function(t,e){return this.ownerDocument.implementation.hasFeature(t,e)},lookupPrefix:function(t){for(var e=this;e;){var r=e._nsMap;if(r){for(var n in r)if(st(r,n)&&r[n]===t)return n}e=e.nodeType==ct?e.ownerDocument:e.parentNode}return null},lookupNamespaceURI:function(t){for(var e=this;e;){var r=e._nsMap;if(r&&st(r,t))return r[t];e=e.nodeType==ct?e.ownerDocument:e.parentNode}return null},isDefaultNamespace:function(t){var e=this.lookupPrefix(t);return e==null},compareDocumentPosition:function(t){if(this===t)return 0;var e=t,r=this,n=null,o=null;if(e instanceof Ke&&(n=e,e=n.ownerElement),r instanceof Ke&&(o=r,r=o.ownerElement,n&&e&&r===e))for(var a=0,i;i=r.attributes[a];a++){if(i===n)return J.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC+J.DOCUMENT_POSITION_PRECEDING;if(i===o)return J.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC+J.DOCUMENT_POSITION_FOLLOWING}if(!e||!r||r.ownerDocument!==e.ownerDocument)return J.DOCUMENT_POSITION_DISCONNECTED+J.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC+(Wn(r.ownerDocument)>Wn(e.ownerDocument)?J.DOCUMENT_POSITION_FOLLOWING:J.DOCUMENT_POSITION_PRECEDING);if(o&&e===r)return J.DOCUMENT_POSITION_CONTAINS+J.DOCUMENT_POSITION_PRECEDING;if(n&&e===r)return J.DOCUMENT_POSITION_CONTAINED_BY+J.DOCUMENT_POSITION_FOLLOWING;for(var c=[],l=e.parentNode;l;){if(!o&&l===r)return J.DOCUMENT_POSITION_CONTAINED_BY+J.DOCUMENT_POSITION_FOLLOWING;c.push(l),l=l.parentNode}c.reverse();for(var s=[],f=r.parentNode;f;){if(!n&&f===e)return J.DOCUMENT_POSITION_CONTAINS+J.DOCUMENT_POSITION_PRECEDING;s.push(f),f=f.parentNode}s.reverse();var g=ro(c,s);for(var h in g.childNodes){var p=g.childNodes[h];if(p===r)return J.DOCUMENT_POSITION_FOLLOWING;if(p===e)return J.DOCUMENT_POSITION_PRECEDING;if(s.indexOf(p)>=0)return J.DOCUMENT_POSITION_FOLLOWING;if(c.indexOf(p)>=0)return J.DOCUMENT_POSITION_PRECEDING}return 0}};function ao(t){return t=="<"&&"&lt;"||t==">"&&"&gt;"||t=="&"&&"&amp;"||t=='"'&&"&quot;"||"&#"+t.charCodeAt()+";"}ut(pe,$);ut(pe,$.prototype);ut(J,$);ut(J,$.prototype);function or(t,e){ie(t,null,{enter:function(r){return e(r)?ie.STOP:!0}})}function ie(t,e,r){for(var n=[{node:t,context:e,phase:ie.ENTER}];n.length>0;){var o=n.pop();if(o.phase===ie.ENTER){var a=r.enter(o.node,o.context);if(a===ie.STOP)return ie.STOP;if(n.push({node:o.node,context:a,phase:ie.EXIT}),a==null)continue;for(var i=o.node.lastChild;i;)n.push({node:i,context:a,phase:ie.ENTER}),i=i.previousSibling}else r.exit&&r.exit(o.node,o.context)}}ie.STOP=Symbol("walkDOM.STOP");ie.ENTER=0;ie.EXIT=1;function ke(t,e){ue(t);var r=e||{};this.ownerDocument=this,this.contentType=r.contentType||$t.XML_APPLICATION,this.type=Pi(this.contentType)?"html":"xml"}function Gi(t,e,r){t&&t._inc++;var n=r.namespaceURI;n===Ie.XMLNS&&(e._nsMap[r.prefix?r.localName:""]=r.value)}function io(t,e,r,n){t&&t._inc++;var o=r.namespaceURI;o===Ie.XMLNS&&delete e._nsMap[r.prefix?r.localName:""]}function so(t,e,r){if(t&&t._inc){t._inc++;var n=e.childNodes;if(r&&!r.nextSibling)n[n.length++]=r;else{for(var o=e.firstChild,a=0;o;)n[a++]=o,o=o.nextSibling;n.length=a,delete n[n.length]}}}function co(t,e){if(t!==e.parentNode)throw new I(I.NOT_FOUND_ERR,"child's parent is not parent");var r=e.previousSibling,n=e.nextSibling;return r?r.nextSibling=n:t.firstChild=n,n?n.previousSibling=r:t.lastChild=r,so(t.ownerDocument,t),e.parentNode=null,e.previousSibling=null,e.nextSibling=null,e}function Yi(t){return t&&(t.nodeType===$.DOCUMENT_NODE||t.nodeType===$.DOCUMENT_FRAGMENT_NODE||t.nodeType===$.ELEMENT_NODE)}function Ki(t){return t&&(t.nodeType===$.CDATA_SECTION_NODE||t.nodeType===$.COMMENT_NODE||t.nodeType===$.DOCUMENT_FRAGMENT_NODE||t.nodeType===$.DOCUMENT_TYPE_NODE||t.nodeType===$.ELEMENT_NODE||t.nodeType===$.PROCESSING_INSTRUCTION_NODE||t.nodeType===$.TEXT_NODE)}function qe(t){return t&&t.nodeType===$.DOCUMENT_TYPE_NODE}function _e(t){return t&&t.nodeType===$.ELEMENT_NODE}function lo(t){return t&&t.nodeType===$.TEXT_NODE}function Yn(t,e){var r=t.childNodes||[];if(Se(r,_e)||qe(e))return!1;var n=Se(r,qe);return!(e&&n&&r.indexOf(n)>r.indexOf(e))}function Kn(t,e){var r=t.childNodes||[];function n(a){return _e(a)&&a!==e}if(Se(r,n))return!1;var o=Se(r,qe);return!(e&&o&&r.indexOf(o)>r.indexOf(e))}function Ji(t,e,r){if(!Yi(t))throw new I(I.HIERARCHY_REQUEST_ERR,"Unexpected parent node type "+t.nodeType);if(r&&r.parentNode!==t)throw new I(I.NOT_FOUND_ERR,"child not in parent");if(!Ki(e)||qe(e)&&t.nodeType!==$.DOCUMENT_NODE)throw new I(I.HIERARCHY_REQUEST_ERR,"Unexpected node type "+e.nodeType+" for parent node type "+t.nodeType)}function Xi(t,e,r){var n=t.childNodes||[],o=e.childNodes||[];if(e.nodeType===$.DOCUMENT_FRAGMENT_NODE){var a=o.filter(_e);if(a.length>1||Se(o,lo))throw new I(I.HIERARCHY_REQUEST_ERR,"More than one element or text in fragment");if(a.length===1&&!Yn(t,r))throw new I(I.HIERARCHY_REQUEST_ERR,"Element in fragment can not be inserted before doctype")}if(_e(e)&&!Yn(t,r))throw new I(I.HIERARCHY_REQUEST_ERR,"Only one element can be added and only after doctype");if(qe(e)){if(Se(n,qe))throw new I(I.HIERARCHY_REQUEST_ERR,"Only one doctype is allowed");var i=Se(n,_e);if(r&&n.indexOf(i)<n.indexOf(r))throw new I(I.HIERARCHY_REQUEST_ERR,"Doctype can only be inserted before an element");if(!r&&i)throw new I(I.HIERARCHY_REQUEST_ERR,"Doctype can not be appended since element is present")}}function uo(t,e,r){var n=t.childNodes||[],o=e.childNodes||[];if(e.nodeType===$.DOCUMENT_FRAGMENT_NODE){var a=o.filter(_e);if(a.length>1||Se(o,lo))throw new I(I.HIERARCHY_REQUEST_ERR,"More than one element or text in fragment");if(a.length===1&&!Kn(t,r))throw new I(I.HIERARCHY_REQUEST_ERR,"Element in fragment can not be inserted before doctype")}if(_e(e)&&!Kn(t,r))throw new I(I.HIERARCHY_REQUEST_ERR,"Only one element can be added and only after doctype");if(qe(e)){if(Se(n,function(l){return qe(l)&&l!==r}))throw new I(I.HIERARCHY_REQUEST_ERR,"Only one doctype is allowed");var i=Se(n,_e);if(r&&n.indexOf(i)<n.indexOf(r))throw new I(I.HIERARCHY_REQUEST_ERR,"Doctype can only be inserted before an element")}}function ir(t,e,r,n){Ji(t,e,r),t.nodeType===$.DOCUMENT_NODE&&(n||Xi)(t,e,r);var o=e.parentNode;if(o&&o.removeChild(e),e.nodeType===Ue){var a=e.firstChild;if(a==null)return e;var i=e.lastChild}else a=i=e;var c=r?r.previousSibling:t.lastChild;a.previousSibling=c,i.nextSibling=r,c?c.nextSibling=a:t.firstChild=a,r==null?t.lastChild=i:r.previousSibling=i;do a.parentNode=t;while(a!==i&&(a=a.nextSibling));return so(t.ownerDocument||t,t,e),e.nodeType==Ue&&(e.firstChild=e.lastChild=null),e}ke.prototype={implementation:null,nodeName:"#document",nodeType:it,doctype:null,documentElement:null,_inc:1,insertBefore:function(t,e){if(t.nodeType===Ue){for(var r=t.firstChild;r;){var n=r.nextSibling;this.insertBefore(r,e),r=n}return t}return ir(this,t,e),t.ownerDocument=this,this.documentElement===null&&t.nodeType===ye&&(this.documentElement=t),t},removeChild:function(t){var e=co(this,t);return e===this.documentElement&&(this.documentElement=null),e},replaceChild:function(t,e){ir(this,t,e,uo),t.ownerDocument=this,e&&this.removeChild(e),_e(t)&&(this.documentElement=t)},importNode:function(t,e){return Qi(this,t,e)},getElementById:function(t){var e=null;return or(this.documentElement,function(r){if(r.nodeType==ye&&r.getAttribute("id")==t)return e=r,!0}),e},createElement:function(t){var e=new Me(ce);e.ownerDocument=this,this.type==="html"&&(t=t.toLowerCase()),Fi(this.contentType)&&(e.namespaceURI=Ie.HTML),e.nodeName=t,e.tagName=t,e.localName=t,e.childNodes=new Z;var r=e.attributes=new lt;return r._ownerElement=e,e},createDocumentFragment:function(){var t=new pt(ce);return t.ownerDocument=this,t.childNodes=new Z,t},createTextNode:function(t){var e=new Ut(ce);return e.ownerDocument=this,e.childNodes=new Z,e.appendData(t),e},createComment:function(t){var e=new cr(ce);return e.ownerDocument=this,e.childNodes=new Z,e.appendData(t),e},createCDATASection:function(t){if(t.indexOf("]]>")!==-1)throw new I(I.INVALID_CHARACTER_ERR,'data contains "]]>"');var e=new lr(ce);return e.ownerDocument=this,e.childNodes=new Z,e.appendData(t),e},createProcessingInstruction:function(t,e){var r=new pr(ce);return r.ownerDocument=this,r.childNodes=new Z,r.nodeName=r.target=t,r.nodeValue=r.data=e,r},createAttribute:function(t){if(!ae.QName_exact.test(t))throw new I(I.INVALID_CHARACTER_ERR,'invalid character in name "'+t+'"');return this.type==="html"&&(t=t.toLowerCase()),this._createAttribute(t)},_createAttribute:function(t){var e=new Ke(ce);return e.ownerDocument=this,e.childNodes=new Z,e.name=t,e.nodeName=t,e.localName=t,e.specified=!0,e},createEntityReference:function(t){if(!ae.Name.test(t))throw new I(I.INVALID_CHARACTER_ERR,'not a valid xml name "'+t+'"');if(this.type==="html")throw new I("document is an html document",be.NotSupportedError);var e=new dr(ce);return e.ownerDocument=this,e.childNodes=new Z,e.nodeName=t,e},createElementNS:function(t,e){var r=Xr(t,e),n=new Me(ce),o=n.attributes=new lt;return n.childNodes=new Z,n.ownerDocument=this,n.nodeName=e,n.tagName=e,n.namespaceURI=r[0],n.prefix=r[1],n.localName=r[2],o._ownerElement=n,n},createAttributeNS:function(t,e){var r=Xr(t,e),n=new Ke(ce);return n.ownerDocument=this,n.childNodes=new Z,n.nodeName=e,n.name=e,n.specified=!0,n.namespaceURI=r[0],n.prefix=r[1],n.localName=r[2],n}};de(ke,$);function Me(t){ue(t),this._nsMap=Object.create(null)}Me.prototype={nodeType:ye,attributes:null,getQualifiedName:function(){return this.prefix?this.prefix+":"+this.localName:this.localName},_isInHTMLDocumentAndNamespace:function(){return this.ownerDocument.type==="html"&&this.namespaceURI===Ie.HTML},hasAttributes:function(){return!!(this.attributes&&this.attributes.length)},hasAttribute:function(t){return!!this.getAttributeNode(t)},getAttribute:function(t){var e=this.getAttributeNode(t);return e?e.value:null},getAttributeNode:function(t){return this._isInHTMLDocumentAndNamespace()&&(t=t.toLowerCase()),this.attributes.getNamedItem(t)},setAttribute:function(t,e){this._isInHTMLDocumentAndNamespace()&&(t=t.toLowerCase());var r=this.getAttributeNode(t);r?r.value=r.nodeValue=""+e:(r=this.ownerDocument._createAttribute(t),r.value=r.nodeValue=""+e,this.setAttributeNode(r))},removeAttribute:function(t){var e=this.getAttributeNode(t);e&&this.removeAttributeNode(e)},setAttributeNode:function(t){return this.attributes.setNamedItem(t)},setAttributeNodeNS:function(t){return this.attributes.setNamedItemNS(t)},removeAttributeNode:function(t){return this.attributes.removeNamedItem(t.nodeName)},removeAttributeNS:function(t,e){var r=this.getAttributeNodeNS(t,e);r&&this.removeAttributeNode(r)},hasAttributeNS:function(t,e){return this.getAttributeNodeNS(t,e)!=null},getAttributeNS:function(t,e){var r=this.getAttributeNodeNS(t,e);return r?r.value:null},setAttributeNS:function(t,e,r){var n=Xr(t,e),o=n[2],a=this.getAttributeNodeNS(t,o);a?a.value=a.nodeValue=""+r:(a=this.ownerDocument.createAttributeNS(t,e),a.value=a.nodeValue=""+r,this.setAttributeNode(a))},getAttributeNodeNS:function(t,e){return this.attributes.getNamedItemNS(t,e)},getElementsByClassName:function(t){var e=Vn(t);return new Te(this,function(r){var n=[];return e.length>0&&or(r,function(o){if(o!==r&&o.nodeType===ye){var a=o.getAttribute("class");if(a){var i=t===a;if(!i){var c=Vn(a);i=e.every(Hi(c))}i&&n.push(o)}}}),n})},getElementsByTagName:function(t){var e=(this.nodeType===it?this:this.ownerDocument).type==="html",r=t.toLowerCase();return new Te(this,function(n){var o=[];return or(n,function(a){if(!(a===n||a.nodeType!==ye))if(t==="*")o.push(a);else{var i=a.getQualifiedName(),c=e&&a.namespaceURI===Ie.HTML?r:t;i===c&&o.push(a)}}),o})},getElementsByTagNameNS:function(t,e){return new Te(this,function(r){var n=[];return or(r,function(o){o!==r&&o.nodeType===ye&&(t==="*"||o.namespaceURI===t)&&(e==="*"||o.localName==e)&&n.push(o)}),n})}};ke.prototype.getElementsByClassName=Me.prototype.getElementsByClassName;ke.prototype.getElementsByTagName=Me.prototype.getElementsByTagName;ke.prototype.getElementsByTagNameNS=Me.prototype.getElementsByTagNameNS;de(Me,$);function Ke(t){ue(t),this.namespaceURI=null,this.prefix=null,this.ownerElement=null}Ke.prototype.nodeType=ct;de(Ke,$);function dt(t){ue(t)}dt.prototype={data:"",substringData:function(t,e){return this.data.substring(t,t+e)},appendData:function(t){t=this.data+t,this.nodeValue=this.data=t,this.length=t.length},insertData:function(t,e){this.replaceData(t,0,e)},deleteData:function(t,e){this.replaceData(t,e,"")},replaceData:function(t,e,r){var n=this.data.substring(0,t),o=this.data.substring(t+e);r=n+r+o,this.nodeValue=this.data=r,this.length=r.length}};de(dt,$);function Ut(t){ue(t)}Ut.prototype={nodeName:"#text",nodeType:ar,splitText:function(t){var e=this.data,r=e.substring(t);e=e.substring(0,t),this.data=this.nodeValue=e,this.length=e.length;var n=this.ownerDocument.createTextNode(r);return this.parentNode&&this.parentNode.insertBefore(n,this.nextSibling),n}};de(Ut,dt);function cr(t){ue(t)}cr.prototype={nodeName:"#comment",nodeType:Zr};de(cr,dt);function lr(t){ue(t)}lr.prototype={nodeName:"#cdata-section",nodeType:Zn};de(lr,Ut);function ur(t){ue(t)}ur.prototype.nodeType=to;de(ur,$);function en(t){ue(t)}en.prototype.nodeType=Vi;de(en,$);function tn(t){ue(t)}tn.prototype.nodeType=zi;de(tn,$);function dr(t){ue(t)}dr.prototype.nodeType=eo;de(dr,$);function pt(t){ue(t)}pt.prototype.nodeName="#document-fragment";pt.prototype.nodeType=Ue;de(pt,$);function pr(t){ue(t)}pr.prototype.nodeType=Qr;de(pr,dt);function po(){}po.prototype.serializeToString=function(t,e){return fo.call(t,e)};$.prototype.toString=fo;function fo(t){var e;typeof t=="function"?e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:t}:t!=null?e={requireWellFormed:!!t.requireWellFormed,splitCDATASections:t.splitCDATASections!==!1,nodeFilter:t.nodeFilter||null}:e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:null};var r=[],n=this.nodeType===it&&this.documentElement||this,o=n.prefix,a=n.namespaceURI;if(a&&o==null){var o=n.lookupPrefix(a);if(o==null)var i=[{namespace:a,prefix:null}]}return rn(this,r,i,e),r.join("")}function Jn(t,e,r){var n=t.prefix||"",o=t.namespaceURI;if(!o||n==="xml"&&o===Ie.XML||o===Ie.XMLNS)return!1;for(var a=r.length;a--;){var i=r[a];if(i.prefix===n)return i.namespace!==o}return!0}function nr(t,e,r){t.push(" ",e,'="',r.replace(/[<>&"\t\n\r]/g,ao),'"')}function rn(t,e,r,n){r||(r=[]);var o=n.nodeFilter,a=n.requireWellFormed,i=n.splitCDATASections,c=t.nodeType===it?t:t.ownerDocument,l=c.type==="html";ie(t,{ns:r},{enter:function(s,f){var g=f.ns;if(o)if(s=o(s),s){if(typeof s=="string")return e.push(s),null}else return null;switch(s.nodeType){case ye:var h=s.attributes,p=h.length,u=s.tagName,d=u;if(!l&&!s.prefix&&s.namespaceURI){for(var v,b=0;b<h.length;b++)if(h.item(b).name==="xmlns"){v=h.item(b).value;break}if(!v)for(var w=g.length-1;w>=0;w--){var y=g[w];if(y.prefix===""&&y.namespace===s.namespaceURI){v=y.namespace;break}}if(v!==s.namespaceURI)for(var w=g.length-1;w>=0;w--){var y=g[w];if(y.namespace===s.namespaceURI){y.prefix&&(d=y.prefix+":"+u);break}}}e.push("<",d);for(var D=g.slice(),E=0;E<p;E++){var C=h.item(E);C.prefix=="xmlns"?D.push({prefix:C.localName,namespace:C.value}):C.nodeName=="xmlns"&&D.push({prefix:"",namespace:C.value})}for(var E=0;E<p;E++){var C=h.item(E);if(Jn(C,l,D)){var A=C.prefix||"",T=C.namespaceURI;nr(e,A?"xmlns:"+A:"xmlns",T),D.push({prefix:A,namespace:T})}var N=o?o(C):C;N&&(typeof N=="string"?e.push(N):nr(e,N.name,N.value))}if(u===d&&Jn(s,l,D)){var F=s.prefix||"",T=s.namespaceURI;nr(e,F?"xmlns:"+F:"xmlns",T),D.push({prefix:F,namespace:T})}var j=!s.firstChild;if(j&&(l||s.namespaceURI===Ie.HTML)&&(j=$i(u)),j)return e.push("/>"),null;if(e.push(">"),l&&Ri(u)){for(var x=s.firstChild;x;)x.data?e.push(x.data):rn(x,e,D.slice(),n),x=x.nextSibling;return e.push("</",d,">"),null}return{ns:D,tag:d};case it:case Ue:if(a&&s.nodeType===it&&s.documentElement==null)throw new I("The Document has no documentElement",be.InvalidStateError);return{ns:g};case ct:return nr(e,s.name,s.value),null;case ar:if(a&&ae.InvalidChar.test(s.data))throw new I("The Text node data contains characters outside the XML Char production",be.InvalidStateError);return e.push(s.data.replace(/[<&>]/g,ao)),null;case Zn:if(a&&s.data.indexOf("]]>")!==-1)throw new I('The CDATASection data contains "]]>"',be.InvalidStateError);return i?e.push(ae.CDATA_START,s.data.replace(/]]>/g,"]]]]><![CDATA[>"),ae.CDATA_END):e.push(ae.CDATA_START,s.data,ae.CDATA_END),null;case Zr:if(a){if(ae.InvalidChar.test(s.data))throw new I("The comment node data contains characters outside the XML Char production",be.InvalidStateError);if(s.data.indexOf("--")!==-1||s.data[s.data.length-1]==="-")throw new I('The comment node data contains "--" or ends with "-"',be.InvalidStateError)}return e.push(ae.COMMENT_START,s.data,ae.COMMENT_END),null;case to:var S=s.publicId,L=s.systemId;if(a){if(S&&!ae.PubidLiteral_match.test(S))throw new I("DocumentType publicId is not a valid PubidLiteral",be.InvalidStateError);if(L&&L!=="."&&!ae.SystemLiteral_match.test(L))throw new I("DocumentType systemId is not a valid SystemLiteral",be.InvalidStateError);if(s.internalSubset&&s.internalSubset.indexOf("]>")!==-1)throw new I('DocumentType internalSubset contains "]>"',be.InvalidStateError)}return e.push(ae.DOCTYPE_DECL_START," ",s.name),S?(e.push(" ",ae.PUBLIC," ",S),L&&L!=="."&&e.push(" ",L)):L&&L!=="."&&e.push(" ",ae.SYSTEM," ",L),s.internalSubset&&e.push(" [",s.internalSubset,"]"),e.push(">"),null;case Qr:if(a){if(s.target.indexOf(":")!==-1||s.target.toLowerCase()==="xml")throw new I("The ProcessingInstruction target is not well-formed",be.InvalidStateError);if(ae.InvalidChar.test(s.data))throw new I("The ProcessingInstruction data contains characters outside the XML Char production",be.InvalidStateError);if(s.data.indexOf("?>")!==-1)throw new I('The ProcessingInstruction data contains "?>"',be.InvalidStateError)}return e.push("<?",s.target," ",s.data,"?>"),null;case eo:return e.push("&",s.nodeName,";"),null;default:return e.push("??",s.nodeName),null}},exit:function(s,f){f&&f.tag&&e.push("</",f.tag,">")}})}function Qi(t,e,r){var n;return ie(e,null,{enter:function(o,a){var i=o.cloneNode(!1);i.ownerDocument=t,i.parentNode=null,a===null?n=i:a.appendChild(i);var c=o.nodeType===ct||r;return c?i:null}}),n}function mo(t,e,r){var n;return ie(e,null,{enter:function(o,a){var i=new o.constructor(ce);for(var c in o)if(st(o,c)){var l=o[c];typeof l!="object"&&l!=i[c]&&(i[c]=l)}o.childNodes&&(i.childNodes=new Z),i.ownerDocument=t;var s=r;switch(i.nodeType){case ye:var f=o.attributes,g=i.attributes=new lt,h=f.length;g._ownerElement=i;for(var p=0;p<h;p++)i.setAttributeNode(mo(t,f.item(p),!0));break;case ct:s=!0}return a!==null?a.appendChild(i):n=i,s?i:null}}),n}function ho(t,e,r){t[e]=r}function Jr(t){for(var e=[],r=t.firstChild;r;)r.nodeType===ye&&e.push(r),r=r.nextSibling;return e}try{Object.defineProperty&&(Object.defineProperty(Te.prototype,"length",{get:function(){return sr(this),this.$$length}}),Object.defineProperty($.prototype,"textContent",{get:function(){if(this.nodeType===ye||this.nodeType===Ue){var t=[];return ie(this,null,{enter:function(e){if(e.nodeType===ye||e.nodeType===Ue)return!0;if(e.nodeType===Qr||e.nodeType===Zr)return null;t.push(e.nodeValue)}}),t.join("")}return this.nodeValue},set:function(t){switch(this.nodeType){case ye:case Ue:for(;this.firstChild;)this.removeChild(this.firstChild);(t||String(t))&&this.appendChild(this.ownerDocument.createTextNode(t));break;default:this.data=t,this.value=t,this.nodeValue=t}}}),Object.defineProperty(Me.prototype,"children",{get:function(){return new Te(this,Jr)}}),Object.defineProperty(ke.prototype,"children",{get:function(){return new Te(this,Jr)}}),Object.defineProperty(pt.prototype,"children",{get:function(){return new Te(this,Jr)}}),ho=function(t,e,r){t["$$"+e]=r})}catch{}X._updateLiveList=sr;X.Attr=Ke;X.CDATASection=lr;X.CharacterData=dt;X.Comment=cr;X.Document=ke;X.DocumentFragment=pt;X.DocumentType=ur;X.DOMImplementation=oo;X.Element=Me;X.Entity=tn;X.EntityReference=dr;X.LiveNodeList=Te;X.NamedNodeMap=lt;X.Node=$;X.NodeList=Z;X.Notation=en;X.Text=Ut;X.ProcessingInstruction=pr;X.walkDOM=ie;X.XMLSerializer=po});var bo=re(qt=>{"use strict";var go=Ye().freeze;qt.XML_ENTITIES=go({amp:"&",apos:"'",gt:">",lt:"<",quot:'"'});qt.HTML_ENTITIES=go({Aacute:"\xC1",aacute:"\xE1",Abreve:"\u0102",abreve:"\u0103",ac:"\u223E",acd:"\u223F",acE:"\u223E\u0333",Acirc:"\xC2",acirc:"\xE2",acute:"\xB4",Acy:"\u0410",acy:"\u0430",AElig:"\xC6",aelig:"\xE6",af:"\u2061",Afr:"\u{1D504}",afr:"\u{1D51E}",Agrave:"\xC0",agrave:"\xE0",alefsym:"\u2135",aleph:"\u2135",Alpha:"\u0391",alpha:"\u03B1",Amacr:"\u0100",amacr:"\u0101",amalg:"\u2A3F",AMP:"&",amp:"&",And:"\u2A53",and:"\u2227",andand:"\u2A55",andd:"\u2A5C",andslope:"\u2A58",andv:"\u2A5A",ang:"\u2220",ange:"\u29A4",angle:"\u2220",angmsd:"\u2221",angmsdaa:"\u29A8",angmsdab:"\u29A9",angmsdac:"\u29AA",angmsdad:"\u29AB",angmsdae:"\u29AC",angmsdaf:"\u29AD",angmsdag:"\u29AE",angmsdah:"\u29AF",angrt:"\u221F",angrtvb:"\u22BE",angrtvbd:"\u299D",angsph:"\u2222",angst:"\xC5",angzarr:"\u237C",Aogon:"\u0104",aogon:"\u0105",Aopf:"\u{1D538}",aopf:"\u{1D552}",ap:"\u2248",apacir:"\u2A6F",apE:"\u2A70",ape:"\u224A",apid:"\u224B",apos:"'",ApplyFunction:"\u2061",approx:"\u2248",approxeq:"\u224A",Aring:"\xC5",aring:"\xE5",Ascr:"\u{1D49C}",ascr:"\u{1D4B6}",Assign:"\u2254",ast:"*",asymp:"\u2248",asympeq:"\u224D",Atilde:"\xC3",atilde:"\xE3",Auml:"\xC4",auml:"\xE4",awconint:"\u2233",awint:"\u2A11",backcong:"\u224C",backepsilon:"\u03F6",backprime:"\u2035",backsim:"\u223D",backsimeq:"\u22CD",Backslash:"\u2216",Barv:"\u2AE7",barvee:"\u22BD",Barwed:"\u2306",barwed:"\u2305",barwedge:"\u2305",bbrk:"\u23B5",bbrktbrk:"\u23B6",bcong:"\u224C",Bcy:"\u0411",bcy:"\u0431",bdquo:"\u201E",becaus:"\u2235",Because:"\u2235",because:"\u2235",bemptyv:"\u29B0",bepsi:"\u03F6",bernou:"\u212C",Bernoullis:"\u212C",Beta:"\u0392",beta:"\u03B2",beth:"\u2136",between:"\u226C",Bfr:"\u{1D505}",bfr:"\u{1D51F}",bigcap:"\u22C2",bigcirc:"\u25EF",bigcup:"\u22C3",bigodot:"\u2A00",bigoplus:"\u2A01",bigotimes:"\u2A02",bigsqcup:"\u2A06",bigstar:"\u2605",bigtriangledown:"\u25BD",bigtriangleup:"\u25B3",biguplus:"\u2A04",bigvee:"\u22C1",bigwedge:"\u22C0",bkarow:"\u290D",blacklozenge:"\u29EB",blacksquare:"\u25AA",blacktriangle:"\u25B4",blacktriangledown:"\u25BE",blacktriangleleft:"\u25C2",blacktriangleright:"\u25B8",blank:"\u2423",blk12:"\u2592",blk14:"\u2591",blk34:"\u2593",block:"\u2588",bne:"=\u20E5",bnequiv:"\u2261\u20E5",bNot:"\u2AED",bnot:"\u2310",Bopf:"\u{1D539}",bopf:"\u{1D553}",bot:"\u22A5",bottom:"\u22A5",bowtie:"\u22C8",boxbox:"\u29C9",boxDL:"\u2557",boxDl:"\u2556",boxdL:"\u2555",boxdl:"\u2510",boxDR:"\u2554",boxDr:"\u2553",boxdR:"\u2552",boxdr:"\u250C",boxH:"\u2550",boxh:"\u2500",boxHD:"\u2566",boxHd:"\u2564",boxhD:"\u2565",boxhd:"\u252C",boxHU:"\u2569",boxHu:"\u2567",boxhU:"\u2568",boxhu:"\u2534",boxminus:"\u229F",boxplus:"\u229E",boxtimes:"\u22A0",boxUL:"\u255D",boxUl:"\u255C",boxuL:"\u255B",boxul:"\u2518",boxUR:"\u255A",boxUr:"\u2559",boxuR:"\u2558",boxur:"\u2514",boxV:"\u2551",boxv:"\u2502",boxVH:"\u256C",boxVh:"\u256B",boxvH:"\u256A",boxvh:"\u253C",boxVL:"\u2563",boxVl:"\u2562",boxvL:"\u2561",boxvl:"\u2524",boxVR:"\u2560",boxVr:"\u255F",boxvR:"\u255E",boxvr:"\u251C",bprime:"\u2035",Breve:"\u02D8",breve:"\u02D8",brvbar:"\xA6",Bscr:"\u212C",bscr:"\u{1D4B7}",bsemi:"\u204F",bsim:"\u223D",bsime:"\u22CD",bsol:"\\",bsolb:"\u29C5",bsolhsub:"\u27C8",bull:"\u2022",bullet:"\u2022",bump:"\u224E",bumpE:"\u2AAE",bumpe:"\u224F",Bumpeq:"\u224E",bumpeq:"\u224F",Cacute:"\u0106",cacute:"\u0107",Cap:"\u22D2",cap:"\u2229",capand:"\u2A44",capbrcup:"\u2A49",capcap:"\u2A4B",capcup:"\u2A47",capdot:"\u2A40",CapitalDifferentialD:"\u2145",caps:"\u2229\uFE00",caret:"\u2041",caron:"\u02C7",Cayleys:"\u212D",ccaps:"\u2A4D",Ccaron:"\u010C",ccaron:"\u010D",Ccedil:"\xC7",ccedil:"\xE7",Ccirc:"\u0108",ccirc:"\u0109",Cconint:"\u2230",ccups:"\u2A4C",ccupssm:"\u2A50",Cdot:"\u010A",cdot:"\u010B",cedil:"\xB8",Cedilla:"\xB8",cemptyv:"\u29B2",cent:"\xA2",CenterDot:"\xB7",centerdot:"\xB7",Cfr:"\u212D",cfr:"\u{1D520}",CHcy:"\u0427",chcy:"\u0447",check:"\u2713",checkmark:"\u2713",Chi:"\u03A7",chi:"\u03C7",cir:"\u25CB",circ:"\u02C6",circeq:"\u2257",circlearrowleft:"\u21BA",circlearrowright:"\u21BB",circledast:"\u229B",circledcirc:"\u229A",circleddash:"\u229D",CircleDot:"\u2299",circledR:"\xAE",circledS:"\u24C8",CircleMinus:"\u2296",CirclePlus:"\u2295",CircleTimes:"\u2297",cirE:"\u29C3",cire:"\u2257",cirfnint:"\u2A10",cirmid:"\u2AEF",cirscir:"\u29C2",ClockwiseContourIntegral:"\u2232",CloseCurlyDoubleQuote:"\u201D",CloseCurlyQuote:"\u2019",clubs:"\u2663",clubsuit:"\u2663",Colon:"\u2237",colon:":",Colone:"\u2A74",colone:"\u2254",coloneq:"\u2254",comma:",",commat:"@",comp:"\u2201",compfn:"\u2218",complement:"\u2201",complexes:"\u2102",cong:"\u2245",congdot:"\u2A6D",Congruent:"\u2261",Conint:"\u222F",conint:"\u222E",ContourIntegral:"\u222E",Copf:"\u2102",copf:"\u{1D554}",coprod:"\u2210",Coproduct:"\u2210",COPY:"\xA9",copy:"\xA9",copysr:"\u2117",CounterClockwiseContourIntegral:"\u2233",crarr:"\u21B5",Cross:"\u2A2F",cross:"\u2717",Cscr:"\u{1D49E}",cscr:"\u{1D4B8}",csub:"\u2ACF",csube:"\u2AD1",csup:"\u2AD0",csupe:"\u2AD2",ctdot:"\u22EF",cudarrl:"\u2938",cudarrr:"\u2935",cuepr:"\u22DE",cuesc:"\u22DF",cularr:"\u21B6",cularrp:"\u293D",Cup:"\u22D3",cup:"\u222A",cupbrcap:"\u2A48",CupCap:"\u224D",cupcap:"\u2A46",cupcup:"\u2A4A",cupdot:"\u228D",cupor:"\u2A45",cups:"\u222A\uFE00",curarr:"\u21B7",curarrm:"\u293C",curlyeqprec:"\u22DE",curlyeqsucc:"\u22DF",curlyvee:"\u22CE",curlywedge:"\u22CF",curren:"\xA4",curvearrowleft:"\u21B6",curvearrowright:"\u21B7",cuvee:"\u22CE",cuwed:"\u22CF",cwconint:"\u2232",cwint:"\u2231",cylcty:"\u232D",Dagger:"\u2021",dagger:"\u2020",daleth:"\u2138",Darr:"\u21A1",dArr:"\u21D3",darr:"\u2193",dash:"\u2010",Dashv:"\u2AE4",dashv:"\u22A3",dbkarow:"\u290F",dblac:"\u02DD",Dcaron:"\u010E",dcaron:"\u010F",Dcy:"\u0414",dcy:"\u0434",DD:"\u2145",dd:"\u2146",ddagger:"\u2021",ddarr:"\u21CA",DDotrahd:"\u2911",ddotseq:"\u2A77",deg:"\xB0",Del:"\u2207",Delta:"\u0394",delta:"\u03B4",demptyv:"\u29B1",dfisht:"\u297F",Dfr:"\u{1D507}",dfr:"\u{1D521}",dHar:"\u2965",dharl:"\u21C3",dharr:"\u21C2",DiacriticalAcute:"\xB4",DiacriticalDot:"\u02D9",DiacriticalDoubleAcute:"\u02DD",DiacriticalGrave:"`",DiacriticalTilde:"\u02DC",diam:"\u22C4",Diamond:"\u22C4",diamond:"\u22C4",diamondsuit:"\u2666",diams:"\u2666",die:"\xA8",DifferentialD:"\u2146",digamma:"\u03DD",disin:"\u22F2",div:"\xF7",divide:"\xF7",divideontimes:"\u22C7",divonx:"\u22C7",DJcy:"\u0402",djcy:"\u0452",dlcorn:"\u231E",dlcrop:"\u230D",dollar:"$",Dopf:"\u{1D53B}",dopf:"\u{1D555}",Dot:"\xA8",dot:"\u02D9",DotDot:"\u20DC",doteq:"\u2250",doteqdot:"\u2251",DotEqual:"\u2250",dotminus:"\u2238",dotplus:"\u2214",dotsquare:"\u22A1",doublebarwedge:"\u2306",DoubleContourIntegral:"\u222F",DoubleDot:"\xA8",DoubleDownArrow:"\u21D3",DoubleLeftArrow:"\u21D0",DoubleLeftRightArrow:"\u21D4",DoubleLeftTee:"\u2AE4",DoubleLongLeftArrow:"\u27F8",DoubleLongLeftRightArrow:"\u27FA",DoubleLongRightArrow:"\u27F9",DoubleRightArrow:"\u21D2",DoubleRightTee:"\u22A8",DoubleUpArrow:"\u21D1",DoubleUpDownArrow:"\u21D5",DoubleVerticalBar:"\u2225",DownArrow:"\u2193",Downarrow:"\u21D3",downarrow:"\u2193",DownArrowBar:"\u2913",DownArrowUpArrow:"\u21F5",DownBreve:"\u0311",downdownarrows:"\u21CA",downharpoonleft:"\u21C3",downharpoonright:"\u21C2",DownLeftRightVector:"\u2950",DownLeftTeeVector:"\u295E",DownLeftVector:"\u21BD",DownLeftVectorBar:"\u2956",DownRightTeeVector:"\u295F",DownRightVector:"\u21C1",DownRightVectorBar:"\u2957",DownTee:"\u22A4",DownTeeArrow:"\u21A7",drbkarow:"\u2910",drcorn:"\u231F",drcrop:"\u230C",Dscr:"\u{1D49F}",dscr:"\u{1D4B9}",DScy:"\u0405",dscy:"\u0455",dsol:"\u29F6",Dstrok:"\u0110",dstrok:"\u0111",dtdot:"\u22F1",dtri:"\u25BF",dtrif:"\u25BE",duarr:"\u21F5",duhar:"\u296F",dwangle:"\u29A6",DZcy:"\u040F",dzcy:"\u045F",dzigrarr:"\u27FF",Eacute:"\xC9",eacute:"\xE9",easter:"\u2A6E",Ecaron:"\u011A",ecaron:"\u011B",ecir:"\u2256",Ecirc:"\xCA",ecirc:"\xEA",ecolon:"\u2255",Ecy:"\u042D",ecy:"\u044D",eDDot:"\u2A77",Edot:"\u0116",eDot:"\u2251",edot:"\u0117",ee:"\u2147",efDot:"\u2252",Efr:"\u{1D508}",efr:"\u{1D522}",eg:"\u2A9A",Egrave:"\xC8",egrave:"\xE8",egs:"\u2A96",egsdot:"\u2A98",el:"\u2A99",Element:"\u2208",elinters:"\u23E7",ell:"\u2113",els:"\u2A95",elsdot:"\u2A97",Emacr:"\u0112",emacr:"\u0113",empty:"\u2205",emptyset:"\u2205",EmptySmallSquare:"\u25FB",emptyv:"\u2205",EmptyVerySmallSquare:"\u25AB",emsp:"\u2003",emsp13:"\u2004",emsp14:"\u2005",ENG:"\u014A",eng:"\u014B",ensp:"\u2002",Eogon:"\u0118",eogon:"\u0119",Eopf:"\u{1D53C}",eopf:"\u{1D556}",epar:"\u22D5",eparsl:"\u29E3",eplus:"\u2A71",epsi:"\u03B5",Epsilon:"\u0395",epsilon:"\u03B5",epsiv:"\u03F5",eqcirc:"\u2256",eqcolon:"\u2255",eqsim:"\u2242",eqslantgtr:"\u2A96",eqslantless:"\u2A95",Equal:"\u2A75",equals:"=",EqualTilde:"\u2242",equest:"\u225F",Equilibrium:"\u21CC",equiv:"\u2261",equivDD:"\u2A78",eqvparsl:"\u29E5",erarr:"\u2971",erDot:"\u2253",Escr:"\u2130",escr:"\u212F",esdot:"\u2250",Esim:"\u2A73",esim:"\u2242",Eta:"\u0397",eta:"\u03B7",ETH:"\xD0",eth:"\xF0",Euml:"\xCB",euml:"\xEB",euro:"\u20AC",excl:"!",exist:"\u2203",Exists:"\u2203",expectation:"\u2130",ExponentialE:"\u2147",exponentiale:"\u2147",fallingdotseq:"\u2252",Fcy:"\u0424",fcy:"\u0444",female:"\u2640",ffilig:"\uFB03",fflig:"\uFB00",ffllig:"\uFB04",Ffr:"\u{1D509}",ffr:"\u{1D523}",filig:"\uFB01",FilledSmallSquare:"\u25FC",FilledVerySmallSquare:"\u25AA",fjlig:"fj",flat:"\u266D",fllig:"\uFB02",fltns:"\u25B1",fnof:"\u0192",Fopf:"\u{1D53D}",fopf:"\u{1D557}",ForAll:"\u2200",forall:"\u2200",fork:"\u22D4",forkv:"\u2AD9",Fouriertrf:"\u2131",fpartint:"\u2A0D",frac12:"\xBD",frac13:"\u2153",frac14:"\xBC",frac15:"\u2155",frac16:"\u2159",frac18:"\u215B",frac23:"\u2154",frac25:"\u2156",frac34:"\xBE",frac35:"\u2157",frac38:"\u215C",frac45:"\u2158",frac56:"\u215A",frac58:"\u215D",frac78:"\u215E",frasl:"\u2044",frown:"\u2322",Fscr:"\u2131",fscr:"\u{1D4BB}",gacute:"\u01F5",Gamma:"\u0393",gamma:"\u03B3",Gammad:"\u03DC",gammad:"\u03DD",gap:"\u2A86",Gbreve:"\u011E",gbreve:"\u011F",Gcedil:"\u0122",Gcirc:"\u011C",gcirc:"\u011D",Gcy:"\u0413",gcy:"\u0433",Gdot:"\u0120",gdot:"\u0121",gE:"\u2267",ge:"\u2265",gEl:"\u2A8C",gel:"\u22DB",geq:"\u2265",geqq:"\u2267",geqslant:"\u2A7E",ges:"\u2A7E",gescc:"\u2AA9",gesdot:"\u2A80",gesdoto:"\u2A82",gesdotol:"\u2A84",gesl:"\u22DB\uFE00",gesles:"\u2A94",Gfr:"\u{1D50A}",gfr:"\u{1D524}",Gg:"\u22D9",gg:"\u226B",ggg:"\u22D9",gimel:"\u2137",GJcy:"\u0403",gjcy:"\u0453",gl:"\u2277",gla:"\u2AA5",glE:"\u2A92",glj:"\u2AA4",gnap:"\u2A8A",gnapprox:"\u2A8A",gnE:"\u2269",gne:"\u2A88",gneq:"\u2A88",gneqq:"\u2269",gnsim:"\u22E7",Gopf:"\u{1D53E}",gopf:"\u{1D558}",grave:"`",GreaterEqual:"\u2265",GreaterEqualLess:"\u22DB",GreaterFullEqual:"\u2267",GreaterGreater:"\u2AA2",GreaterLess:"\u2277",GreaterSlantEqual:"\u2A7E",GreaterTilde:"\u2273",Gscr:"\u{1D4A2}",gscr:"\u210A",gsim:"\u2273",gsime:"\u2A8E",gsiml:"\u2A90",Gt:"\u226B",GT:">",gt:">",gtcc:"\u2AA7",gtcir:"\u2A7A",gtdot:"\u22D7",gtlPar:"\u2995",gtquest:"\u2A7C",gtrapprox:"\u2A86",gtrarr:"\u2978",gtrdot:"\u22D7",gtreqless:"\u22DB",gtreqqless:"\u2A8C",gtrless:"\u2277",gtrsim:"\u2273",gvertneqq:"\u2269\uFE00",gvnE:"\u2269\uFE00",Hacek:"\u02C7",hairsp:"\u200A",half:"\xBD",hamilt:"\u210B",HARDcy:"\u042A",hardcy:"\u044A",hArr:"\u21D4",harr:"\u2194",harrcir:"\u2948",harrw:"\u21AD",Hat:"^",hbar:"\u210F",Hcirc:"\u0124",hcirc:"\u0125",hearts:"\u2665",heartsuit:"\u2665",hellip:"\u2026",hercon:"\u22B9",Hfr:"\u210C",hfr:"\u{1D525}",HilbertSpace:"\u210B",hksearow:"\u2925",hkswarow:"\u2926",hoarr:"\u21FF",homtht:"\u223B",hookleftarrow:"\u21A9",hookrightarrow:"\u21AA",Hopf:"\u210D",hopf:"\u{1D559}",horbar:"\u2015",HorizontalLine:"\u2500",Hscr:"\u210B",hscr:"\u{1D4BD}",hslash:"\u210F",Hstrok:"\u0126",hstrok:"\u0127",HumpDownHump:"\u224E",HumpEqual:"\u224F",hybull:"\u2043",hyphen:"\u2010",Iacute:"\xCD",iacute:"\xED",ic:"\u2063",Icirc:"\xCE",icirc:"\xEE",Icy:"\u0418",icy:"\u0438",Idot:"\u0130",IEcy:"\u0415",iecy:"\u0435",iexcl:"\xA1",iff:"\u21D4",Ifr:"\u2111",ifr:"\u{1D526}",Igrave:"\xCC",igrave:"\xEC",ii:"\u2148",iiiint:"\u2A0C",iiint:"\u222D",iinfin:"\u29DC",iiota:"\u2129",IJlig:"\u0132",ijlig:"\u0133",Im:"\u2111",Imacr:"\u012A",imacr:"\u012B",image:"\u2111",ImaginaryI:"\u2148",imagline:"\u2110",imagpart:"\u2111",imath:"\u0131",imof:"\u22B7",imped:"\u01B5",Implies:"\u21D2",in:"\u2208",incare:"\u2105",infin:"\u221E",infintie:"\u29DD",inodot:"\u0131",Int:"\u222C",int:"\u222B",intcal:"\u22BA",integers:"\u2124",Integral:"\u222B",intercal:"\u22BA",Intersection:"\u22C2",intlarhk:"\u2A17",intprod:"\u2A3C",InvisibleComma:"\u2063",InvisibleTimes:"\u2062",IOcy:"\u0401",iocy:"\u0451",Iogon:"\u012E",iogon:"\u012F",Iopf:"\u{1D540}",iopf:"\u{1D55A}",Iota:"\u0399",iota:"\u03B9",iprod:"\u2A3C",iquest:"\xBF",Iscr:"\u2110",iscr:"\u{1D4BE}",isin:"\u2208",isindot:"\u22F5",isinE:"\u22F9",isins:"\u22F4",isinsv:"\u22F3",isinv:"\u2208",it:"\u2062",Itilde:"\u0128",itilde:"\u0129",Iukcy:"\u0406",iukcy:"\u0456",Iuml:"\xCF",iuml:"\xEF",Jcirc:"\u0134",jcirc:"\u0135",Jcy:"\u0419",jcy:"\u0439",Jfr:"\u{1D50D}",jfr:"\u{1D527}",jmath:"\u0237",Jopf:"\u{1D541}",jopf:"\u{1D55B}",Jscr:"\u{1D4A5}",jscr:"\u{1D4BF}",Jsercy:"\u0408",jsercy:"\u0458",Jukcy:"\u0404",jukcy:"\u0454",Kappa:"\u039A",kappa:"\u03BA",kappav:"\u03F0",Kcedil:"\u0136",kcedil:"\u0137",Kcy:"\u041A",kcy:"\u043A",Kfr:"\u{1D50E}",kfr:"\u{1D528}",kgreen:"\u0138",KHcy:"\u0425",khcy:"\u0445",KJcy:"\u040C",kjcy:"\u045C",Kopf:"\u{1D542}",kopf:"\u{1D55C}",Kscr:"\u{1D4A6}",kscr:"\u{1D4C0}",lAarr:"\u21DA",Lacute:"\u0139",lacute:"\u013A",laemptyv:"\u29B4",lagran:"\u2112",Lambda:"\u039B",lambda:"\u03BB",Lang:"\u27EA",lang:"\u27E8",langd:"\u2991",langle:"\u27E8",lap:"\u2A85",Laplacetrf:"\u2112",laquo:"\xAB",Larr:"\u219E",lArr:"\u21D0",larr:"\u2190",larrb:"\u21E4",larrbfs:"\u291F",larrfs:"\u291D",larrhk:"\u21A9",larrlp:"\u21AB",larrpl:"\u2939",larrsim:"\u2973",larrtl:"\u21A2",lat:"\u2AAB",lAtail:"\u291B",latail:"\u2919",late:"\u2AAD",lates:"\u2AAD\uFE00",lBarr:"\u290E",lbarr:"\u290C",lbbrk:"\u2772",lbrace:"{",lbrack:"[",lbrke:"\u298B",lbrksld:"\u298F",lbrkslu:"\u298D",Lcaron:"\u013D",lcaron:"\u013E",Lcedil:"\u013B",lcedil:"\u013C",lceil:"\u2308",lcub:"{",Lcy:"\u041B",lcy:"\u043B",ldca:"\u2936",ldquo:"\u201C",ldquor:"\u201E",ldrdhar:"\u2967",ldrushar:"\u294B",ldsh:"\u21B2",lE:"\u2266",le:"\u2264",LeftAngleBracket:"\u27E8",LeftArrow:"\u2190",Leftarrow:"\u21D0",leftarrow:"\u2190",LeftArrowBar:"\u21E4",LeftArrowRightArrow:"\u21C6",leftarrowtail:"\u21A2",LeftCeiling:"\u2308",LeftDoubleBracket:"\u27E6",LeftDownTeeVector:"\u2961",LeftDownVector:"\u21C3",LeftDownVectorBar:"\u2959",LeftFloor:"\u230A",leftharpoondown:"\u21BD",leftharpoonup:"\u21BC",leftleftarrows:"\u21C7",LeftRightArrow:"\u2194",Leftrightarrow:"\u21D4",leftrightarrow:"\u2194",leftrightarrows:"\u21C6",leftrightharpoons:"\u21CB",leftrightsquigarrow:"\u21AD",LeftRightVector:"\u294E",LeftTee:"\u22A3",LeftTeeArrow:"\u21A4",LeftTeeVector:"\u295A",leftthreetimes:"\u22CB",LeftTriangle:"\u22B2",LeftTriangleBar:"\u29CF",LeftTriangleEqual:"\u22B4",LeftUpDownVector:"\u2951",LeftUpTeeVector:"\u2960",LeftUpVector:"\u21BF",LeftUpVectorBar:"\u2958",LeftVector:"\u21BC",LeftVectorBar:"\u2952",lEg:"\u2A8B",leg:"\u22DA",leq:"\u2264",leqq:"\u2266",leqslant:"\u2A7D",les:"\u2A7D",lescc:"\u2AA8",lesdot:"\u2A7F",lesdoto:"\u2A81",lesdotor:"\u2A83",lesg:"\u22DA\uFE00",lesges:"\u2A93",lessapprox:"\u2A85",lessdot:"\u22D6",lesseqgtr:"\u22DA",lesseqqgtr:"\u2A8B",LessEqualGreater:"\u22DA",LessFullEqual:"\u2266",LessGreater:"\u2276",lessgtr:"\u2276",LessLess:"\u2AA1",lesssim:"\u2272",LessSlantEqual:"\u2A7D",LessTilde:"\u2272",lfisht:"\u297C",lfloor:"\u230A",Lfr:"\u{1D50F}",lfr:"\u{1D529}",lg:"\u2276",lgE:"\u2A91",lHar:"\u2962",lhard:"\u21BD",lharu:"\u21BC",lharul:"\u296A",lhblk:"\u2584",LJcy:"\u0409",ljcy:"\u0459",Ll:"\u22D8",ll:"\u226A",llarr:"\u21C7",llcorner:"\u231E",Lleftarrow:"\u21DA",llhard:"\u296B",lltri:"\u25FA",Lmidot:"\u013F",lmidot:"\u0140",lmoust:"\u23B0",lmoustache:"\u23B0",lnap:"\u2A89",lnapprox:"\u2A89",lnE:"\u2268",lne:"\u2A87",lneq:"\u2A87",lneqq:"\u2268",lnsim:"\u22E6",loang:"\u27EC",loarr:"\u21FD",lobrk:"\u27E6",LongLeftArrow:"\u27F5",Longleftarrow:"\u27F8",longleftarrow:"\u27F5",LongLeftRightArrow:"\u27F7",Longleftrightarrow:"\u27FA",longleftrightarrow:"\u27F7",longmapsto:"\u27FC",LongRightArrow:"\u27F6",Longrightarrow:"\u27F9",longrightarrow:"\u27F6",looparrowleft:"\u21AB",looparrowright:"\u21AC",lopar:"\u2985",Lopf:"\u{1D543}",lopf:"\u{1D55D}",loplus:"\u2A2D",lotimes:"\u2A34",lowast:"\u2217",lowbar:"_",LowerLeftArrow:"\u2199",LowerRightArrow:"\u2198",loz:"\u25CA",lozenge:"\u25CA",lozf:"\u29EB",lpar:"(",lparlt:"\u2993",lrarr:"\u21C6",lrcorner:"\u231F",lrhar:"\u21CB",lrhard:"\u296D",lrm:"\u200E",lrtri:"\u22BF",lsaquo:"\u2039",Lscr:"\u2112",lscr:"\u{1D4C1}",Lsh:"\u21B0",lsh:"\u21B0",lsim:"\u2272",lsime:"\u2A8D",lsimg:"\u2A8F",lsqb:"[",lsquo:"\u2018",lsquor:"\u201A",Lstrok:"\u0141",lstrok:"\u0142",Lt:"\u226A",LT:"<",lt:"<",ltcc:"\u2AA6",ltcir:"\u2A79",ltdot:"\u22D6",lthree:"\u22CB",ltimes:"\u22C9",ltlarr:"\u2976",ltquest:"\u2A7B",ltri:"\u25C3",ltrie:"\u22B4",ltrif:"\u25C2",ltrPar:"\u2996",lurdshar:"\u294A",luruhar:"\u2966",lvertneqq:"\u2268\uFE00",lvnE:"\u2268\uFE00",macr:"\xAF",male:"\u2642",malt:"\u2720",maltese:"\u2720",Map:"\u2905",map:"\u21A6",mapsto:"\u21A6",mapstodown:"\u21A7",mapstoleft:"\u21A4",mapstoup:"\u21A5",marker:"\u25AE",mcomma:"\u2A29",Mcy:"\u041C",mcy:"\u043C",mdash:"\u2014",mDDot:"\u223A",measuredangle:"\u2221",MediumSpace:"\u205F",Mellintrf:"\u2133",Mfr:"\u{1D510}",mfr:"\u{1D52A}",mho:"\u2127",micro:"\xB5",mid:"\u2223",midast:"*",midcir:"\u2AF0",middot:"\xB7",minus:"\u2212",minusb:"\u229F",minusd:"\u2238",minusdu:"\u2A2A",MinusPlus:"\u2213",mlcp:"\u2ADB",mldr:"\u2026",mnplus:"\u2213",models:"\u22A7",Mopf:"\u{1D544}",mopf:"\u{1D55E}",mp:"\u2213",Mscr:"\u2133",mscr:"\u{1D4C2}",mstpos:"\u223E",Mu:"\u039C",mu:"\u03BC",multimap:"\u22B8",mumap:"\u22B8",nabla:"\u2207",Nacute:"\u0143",nacute:"\u0144",nang:"\u2220\u20D2",nap:"\u2249",napE:"\u2A70\u0338",napid:"\u224B\u0338",napos:"\u0149",napprox:"\u2249",natur:"\u266E",natural:"\u266E",naturals:"\u2115",nbsp:"\xA0",nbump:"\u224E\u0338",nbumpe:"\u224F\u0338",ncap:"\u2A43",Ncaron:"\u0147",ncaron:"\u0148",Ncedil:"\u0145",ncedil:"\u0146",ncong:"\u2247",ncongdot:"\u2A6D\u0338",ncup:"\u2A42",Ncy:"\u041D",ncy:"\u043D",ndash:"\u2013",ne:"\u2260",nearhk:"\u2924",neArr:"\u21D7",nearr:"\u2197",nearrow:"\u2197",nedot:"\u2250\u0338",NegativeMediumSpace:"\u200B",NegativeThickSpace:"\u200B",NegativeThinSpace:"\u200B",NegativeVeryThinSpace:"\u200B",nequiv:"\u2262",nesear:"\u2928",nesim:"\u2242\u0338",NestedGreaterGreater:"\u226B",NestedLessLess:"\u226A",NewLine:`
`,nexist:"\u2204",nexists:"\u2204",Nfr:"\u{1D511}",nfr:"\u{1D52B}",ngE:"\u2267\u0338",nge:"\u2271",ngeq:"\u2271",ngeqq:"\u2267\u0338",ngeqslant:"\u2A7E\u0338",nges:"\u2A7E\u0338",nGg:"\u22D9\u0338",ngsim:"\u2275",nGt:"\u226B\u20D2",ngt:"\u226F",ngtr:"\u226F",nGtv:"\u226B\u0338",nhArr:"\u21CE",nharr:"\u21AE",nhpar:"\u2AF2",ni:"\u220B",nis:"\u22FC",nisd:"\u22FA",niv:"\u220B",NJcy:"\u040A",njcy:"\u045A",nlArr:"\u21CD",nlarr:"\u219A",nldr:"\u2025",nlE:"\u2266\u0338",nle:"\u2270",nLeftarrow:"\u21CD",nleftarrow:"\u219A",nLeftrightarrow:"\u21CE",nleftrightarrow:"\u21AE",nleq:"\u2270",nleqq:"\u2266\u0338",nleqslant:"\u2A7D\u0338",nles:"\u2A7D\u0338",nless:"\u226E",nLl:"\u22D8\u0338",nlsim:"\u2274",nLt:"\u226A\u20D2",nlt:"\u226E",nltri:"\u22EA",nltrie:"\u22EC",nLtv:"\u226A\u0338",nmid:"\u2224",NoBreak:"\u2060",NonBreakingSpace:"\xA0",Nopf:"\u2115",nopf:"\u{1D55F}",Not:"\u2AEC",not:"\xAC",NotCongruent:"\u2262",NotCupCap:"\u226D",NotDoubleVerticalBar:"\u2226",NotElement:"\u2209",NotEqual:"\u2260",NotEqualTilde:"\u2242\u0338",NotExists:"\u2204",NotGreater:"\u226F",NotGreaterEqual:"\u2271",NotGreaterFullEqual:"\u2267\u0338",NotGreaterGreater:"\u226B\u0338",NotGreaterLess:"\u2279",NotGreaterSlantEqual:"\u2A7E\u0338",NotGreaterTilde:"\u2275",NotHumpDownHump:"\u224E\u0338",NotHumpEqual:"\u224F\u0338",notin:"\u2209",notindot:"\u22F5\u0338",notinE:"\u22F9\u0338",notinva:"\u2209",notinvb:"\u22F7",notinvc:"\u22F6",NotLeftTriangle:"\u22EA",NotLeftTriangleBar:"\u29CF\u0338",NotLeftTriangleEqual:"\u22EC",NotLess:"\u226E",NotLessEqual:"\u2270",NotLessGreater:"\u2278",NotLessLess:"\u226A\u0338",NotLessSlantEqual:"\u2A7D\u0338",NotLessTilde:"\u2274",NotNestedGreaterGreater:"\u2AA2\u0338",NotNestedLessLess:"\u2AA1\u0338",notni:"\u220C",notniva:"\u220C",notnivb:"\u22FE",notnivc:"\u22FD",NotPrecedes:"\u2280",NotPrecedesEqual:"\u2AAF\u0338",NotPrecedesSlantEqual:"\u22E0",NotReverseElement:"\u220C",NotRightTriangle:"\u22EB",NotRightTriangleBar:"\u29D0\u0338",NotRightTriangleEqual:"\u22ED",NotSquareSubset:"\u228F\u0338",NotSquareSubsetEqual:"\u22E2",NotSquareSuperset:"\u2290\u0338",NotSquareSupersetEqual:"\u22E3",NotSubset:"\u2282\u20D2",NotSubsetEqual:"\u2288",NotSucceeds:"\u2281",NotSucceedsEqual:"\u2AB0\u0338",NotSucceedsSlantEqual:"\u22E1",NotSucceedsTilde:"\u227F\u0338",NotSuperset:"\u2283\u20D2",NotSupersetEqual:"\u2289",NotTilde:"\u2241",NotTildeEqual:"\u2244",NotTildeFullEqual:"\u2247",NotTildeTilde:"\u2249",NotVerticalBar:"\u2224",npar:"\u2226",nparallel:"\u2226",nparsl:"\u2AFD\u20E5",npart:"\u2202\u0338",npolint:"\u2A14",npr:"\u2280",nprcue:"\u22E0",npre:"\u2AAF\u0338",nprec:"\u2280",npreceq:"\u2AAF\u0338",nrArr:"\u21CF",nrarr:"\u219B",nrarrc:"\u2933\u0338",nrarrw:"\u219D\u0338",nRightarrow:"\u21CF",nrightarrow:"\u219B",nrtri:"\u22EB",nrtrie:"\u22ED",nsc:"\u2281",nsccue:"\u22E1",nsce:"\u2AB0\u0338",Nscr:"\u{1D4A9}",nscr:"\u{1D4C3}",nshortmid:"\u2224",nshortparallel:"\u2226",nsim:"\u2241",nsime:"\u2244",nsimeq:"\u2244",nsmid:"\u2224",nspar:"\u2226",nsqsube:"\u22E2",nsqsupe:"\u22E3",nsub:"\u2284",nsubE:"\u2AC5\u0338",nsube:"\u2288",nsubset:"\u2282\u20D2",nsubseteq:"\u2288",nsubseteqq:"\u2AC5\u0338",nsucc:"\u2281",nsucceq:"\u2AB0\u0338",nsup:"\u2285",nsupE:"\u2AC6\u0338",nsupe:"\u2289",nsupset:"\u2283\u20D2",nsupseteq:"\u2289",nsupseteqq:"\u2AC6\u0338",ntgl:"\u2279",Ntilde:"\xD1",ntilde:"\xF1",ntlg:"\u2278",ntriangleleft:"\u22EA",ntrianglelefteq:"\u22EC",ntriangleright:"\u22EB",ntrianglerighteq:"\u22ED",Nu:"\u039D",nu:"\u03BD",num:"#",numero:"\u2116",numsp:"\u2007",nvap:"\u224D\u20D2",nVDash:"\u22AF",nVdash:"\u22AE",nvDash:"\u22AD",nvdash:"\u22AC",nvge:"\u2265\u20D2",nvgt:">\u20D2",nvHarr:"\u2904",nvinfin:"\u29DE",nvlArr:"\u2902",nvle:"\u2264\u20D2",nvlt:"<\u20D2",nvltrie:"\u22B4\u20D2",nvrArr:"\u2903",nvrtrie:"\u22B5\u20D2",nvsim:"\u223C\u20D2",nwarhk:"\u2923",nwArr:"\u21D6",nwarr:"\u2196",nwarrow:"\u2196",nwnear:"\u2927",Oacute:"\xD3",oacute:"\xF3",oast:"\u229B",ocir:"\u229A",Ocirc:"\xD4",ocirc:"\xF4",Ocy:"\u041E",ocy:"\u043E",odash:"\u229D",Odblac:"\u0150",odblac:"\u0151",odiv:"\u2A38",odot:"\u2299",odsold:"\u29BC",OElig:"\u0152",oelig:"\u0153",ofcir:"\u29BF",Ofr:"\u{1D512}",ofr:"\u{1D52C}",ogon:"\u02DB",Ograve:"\xD2",ograve:"\xF2",ogt:"\u29C1",ohbar:"\u29B5",ohm:"\u03A9",oint:"\u222E",olarr:"\u21BA",olcir:"\u29BE",olcross:"\u29BB",oline:"\u203E",olt:"\u29C0",Omacr:"\u014C",omacr:"\u014D",Omega:"\u03A9",omega:"\u03C9",Omicron:"\u039F",omicron:"\u03BF",omid:"\u29B6",ominus:"\u2296",Oopf:"\u{1D546}",oopf:"\u{1D560}",opar:"\u29B7",OpenCurlyDoubleQuote:"\u201C",OpenCurlyQuote:"\u2018",operp:"\u29B9",oplus:"\u2295",Or:"\u2A54",or:"\u2228",orarr:"\u21BB",ord:"\u2A5D",order:"\u2134",orderof:"\u2134",ordf:"\xAA",ordm:"\xBA",origof:"\u22B6",oror:"\u2A56",orslope:"\u2A57",orv:"\u2A5B",oS:"\u24C8",Oscr:"\u{1D4AA}",oscr:"\u2134",Oslash:"\xD8",oslash:"\xF8",osol:"\u2298",Otilde:"\xD5",otilde:"\xF5",Otimes:"\u2A37",otimes:"\u2297",otimesas:"\u2A36",Ouml:"\xD6",ouml:"\xF6",ovbar:"\u233D",OverBar:"\u203E",OverBrace:"\u23DE",OverBracket:"\u23B4",OverParenthesis:"\u23DC",par:"\u2225",para:"\xB6",parallel:"\u2225",parsim:"\u2AF3",parsl:"\u2AFD",part:"\u2202",PartialD:"\u2202",Pcy:"\u041F",pcy:"\u043F",percnt:"%",period:".",permil:"\u2030",perp:"\u22A5",pertenk:"\u2031",Pfr:"\u{1D513}",pfr:"\u{1D52D}",Phi:"\u03A6",phi:"\u03C6",phiv:"\u03D5",phmmat:"\u2133",phone:"\u260E",Pi:"\u03A0",pi:"\u03C0",pitchfork:"\u22D4",piv:"\u03D6",planck:"\u210F",planckh:"\u210E",plankv:"\u210F",plus:"+",plusacir:"\u2A23",plusb:"\u229E",pluscir:"\u2A22",plusdo:"\u2214",plusdu:"\u2A25",pluse:"\u2A72",PlusMinus:"\xB1",plusmn:"\xB1",plussim:"\u2A26",plustwo:"\u2A27",pm:"\xB1",Poincareplane:"\u210C",pointint:"\u2A15",Popf:"\u2119",popf:"\u{1D561}",pound:"\xA3",Pr:"\u2ABB",pr:"\u227A",prap:"\u2AB7",prcue:"\u227C",prE:"\u2AB3",pre:"\u2AAF",prec:"\u227A",precapprox:"\u2AB7",preccurlyeq:"\u227C",Precedes:"\u227A",PrecedesEqual:"\u2AAF",PrecedesSlantEqual:"\u227C",PrecedesTilde:"\u227E",preceq:"\u2AAF",precnapprox:"\u2AB9",precneqq:"\u2AB5",precnsim:"\u22E8",precsim:"\u227E",Prime:"\u2033",prime:"\u2032",primes:"\u2119",prnap:"\u2AB9",prnE:"\u2AB5",prnsim:"\u22E8",prod:"\u220F",Product:"\u220F",profalar:"\u232E",profline:"\u2312",profsurf:"\u2313",prop:"\u221D",Proportion:"\u2237",Proportional:"\u221D",propto:"\u221D",prsim:"\u227E",prurel:"\u22B0",Pscr:"\u{1D4AB}",pscr:"\u{1D4C5}",Psi:"\u03A8",psi:"\u03C8",puncsp:"\u2008",Qfr:"\u{1D514}",qfr:"\u{1D52E}",qint:"\u2A0C",Qopf:"\u211A",qopf:"\u{1D562}",qprime:"\u2057",Qscr:"\u{1D4AC}",qscr:"\u{1D4C6}",quaternions:"\u210D",quatint:"\u2A16",quest:"?",questeq:"\u225F",QUOT:'"',quot:'"',rAarr:"\u21DB",race:"\u223D\u0331",Racute:"\u0154",racute:"\u0155",radic:"\u221A",raemptyv:"\u29B3",Rang:"\u27EB",rang:"\u27E9",rangd:"\u2992",range:"\u29A5",rangle:"\u27E9",raquo:"\xBB",Rarr:"\u21A0",rArr:"\u21D2",rarr:"\u2192",rarrap:"\u2975",rarrb:"\u21E5",rarrbfs:"\u2920",rarrc:"\u2933",rarrfs:"\u291E",rarrhk:"\u21AA",rarrlp:"\u21AC",rarrpl:"\u2945",rarrsim:"\u2974",Rarrtl:"\u2916",rarrtl:"\u21A3",rarrw:"\u219D",rAtail:"\u291C",ratail:"\u291A",ratio:"\u2236",rationals:"\u211A",RBarr:"\u2910",rBarr:"\u290F",rbarr:"\u290D",rbbrk:"\u2773",rbrace:"}",rbrack:"]",rbrke:"\u298C",rbrksld:"\u298E",rbrkslu:"\u2990",Rcaron:"\u0158",rcaron:"\u0159",Rcedil:"\u0156",rcedil:"\u0157",rceil:"\u2309",rcub:"}",Rcy:"\u0420",rcy:"\u0440",rdca:"\u2937",rdldhar:"\u2969",rdquo:"\u201D",rdquor:"\u201D",rdsh:"\u21B3",Re:"\u211C",real:"\u211C",realine:"\u211B",realpart:"\u211C",reals:"\u211D",rect:"\u25AD",REG:"\xAE",reg:"\xAE",ReverseElement:"\u220B",ReverseEquilibrium:"\u21CB",ReverseUpEquilibrium:"\u296F",rfisht:"\u297D",rfloor:"\u230B",Rfr:"\u211C",rfr:"\u{1D52F}",rHar:"\u2964",rhard:"\u21C1",rharu:"\u21C0",rharul:"\u296C",Rho:"\u03A1",rho:"\u03C1",rhov:"\u03F1",RightAngleBracket:"\u27E9",RightArrow:"\u2192",Rightarrow:"\u21D2",rightarrow:"\u2192",RightArrowBar:"\u21E5",RightArrowLeftArrow:"\u21C4",rightarrowtail:"\u21A3",RightCeiling:"\u2309",RightDoubleBracket:"\u27E7",RightDownTeeVector:"\u295D",RightDownVector:"\u21C2",RightDownVectorBar:"\u2955",RightFloor:"\u230B",rightharpoondown:"\u21C1",rightharpoonup:"\u21C0",rightleftarrows:"\u21C4",rightleftharpoons:"\u21CC",rightrightarrows:"\u21C9",rightsquigarrow:"\u219D",RightTee:"\u22A2",RightTeeArrow:"\u21A6",RightTeeVector:"\u295B",rightthreetimes:"\u22CC",RightTriangle:"\u22B3",RightTriangleBar:"\u29D0",RightTriangleEqual:"\u22B5",RightUpDownVector:"\u294F",RightUpTeeVector:"\u295C",RightUpVector:"\u21BE",RightUpVectorBar:"\u2954",RightVector:"\u21C0",RightVectorBar:"\u2953",ring:"\u02DA",risingdotseq:"\u2253",rlarr:"\u21C4",rlhar:"\u21CC",rlm:"\u200F",rmoust:"\u23B1",rmoustache:"\u23B1",rnmid:"\u2AEE",roang:"\u27ED",roarr:"\u21FE",robrk:"\u27E7",ropar:"\u2986",Ropf:"\u211D",ropf:"\u{1D563}",roplus:"\u2A2E",rotimes:"\u2A35",RoundImplies:"\u2970",rpar:")",rpargt:"\u2994",rppolint:"\u2A12",rrarr:"\u21C9",Rrightarrow:"\u21DB",rsaquo:"\u203A",Rscr:"\u211B",rscr:"\u{1D4C7}",Rsh:"\u21B1",rsh:"\u21B1",rsqb:"]",rsquo:"\u2019",rsquor:"\u2019",rthree:"\u22CC",rtimes:"\u22CA",rtri:"\u25B9",rtrie:"\u22B5",rtrif:"\u25B8",rtriltri:"\u29CE",RuleDelayed:"\u29F4",ruluhar:"\u2968",rx:"\u211E",Sacute:"\u015A",sacute:"\u015B",sbquo:"\u201A",Sc:"\u2ABC",sc:"\u227B",scap:"\u2AB8",Scaron:"\u0160",scaron:"\u0161",sccue:"\u227D",scE:"\u2AB4",sce:"\u2AB0",Scedil:"\u015E",scedil:"\u015F",Scirc:"\u015C",scirc:"\u015D",scnap:"\u2ABA",scnE:"\u2AB6",scnsim:"\u22E9",scpolint:"\u2A13",scsim:"\u227F",Scy:"\u0421",scy:"\u0441",sdot:"\u22C5",sdotb:"\u22A1",sdote:"\u2A66",searhk:"\u2925",seArr:"\u21D8",searr:"\u2198",searrow:"\u2198",sect:"\xA7",semi:";",seswar:"\u2929",setminus:"\u2216",setmn:"\u2216",sext:"\u2736",Sfr:"\u{1D516}",sfr:"\u{1D530}",sfrown:"\u2322",sharp:"\u266F",SHCHcy:"\u0429",shchcy:"\u0449",SHcy:"\u0428",shcy:"\u0448",ShortDownArrow:"\u2193",ShortLeftArrow:"\u2190",shortmid:"\u2223",shortparallel:"\u2225",ShortRightArrow:"\u2192",ShortUpArrow:"\u2191",shy:"\xAD",Sigma:"\u03A3",sigma:"\u03C3",sigmaf:"\u03C2",sigmav:"\u03C2",sim:"\u223C",simdot:"\u2A6A",sime:"\u2243",simeq:"\u2243",simg:"\u2A9E",simgE:"\u2AA0",siml:"\u2A9D",simlE:"\u2A9F",simne:"\u2246",simplus:"\u2A24",simrarr:"\u2972",slarr:"\u2190",SmallCircle:"\u2218",smallsetminus:"\u2216",smashp:"\u2A33",smeparsl:"\u29E4",smid:"\u2223",smile:"\u2323",smt:"\u2AAA",smte:"\u2AAC",smtes:"\u2AAC\uFE00",SOFTcy:"\u042C",softcy:"\u044C",sol:"/",solb:"\u29C4",solbar:"\u233F",Sopf:"\u{1D54A}",sopf:"\u{1D564}",spades:"\u2660",spadesuit:"\u2660",spar:"\u2225",sqcap:"\u2293",sqcaps:"\u2293\uFE00",sqcup:"\u2294",sqcups:"\u2294\uFE00",Sqrt:"\u221A",sqsub:"\u228F",sqsube:"\u2291",sqsubset:"\u228F",sqsubseteq:"\u2291",sqsup:"\u2290",sqsupe:"\u2292",sqsupset:"\u2290",sqsupseteq:"\u2292",squ:"\u25A1",Square:"\u25A1",square:"\u25A1",SquareIntersection:"\u2293",SquareSubset:"\u228F",SquareSubsetEqual:"\u2291",SquareSuperset:"\u2290",SquareSupersetEqual:"\u2292",SquareUnion:"\u2294",squarf:"\u25AA",squf:"\u25AA",srarr:"\u2192",Sscr:"\u{1D4AE}",sscr:"\u{1D4C8}",ssetmn:"\u2216",ssmile:"\u2323",sstarf:"\u22C6",Star:"\u22C6",star:"\u2606",starf:"\u2605",straightepsilon:"\u03F5",straightphi:"\u03D5",strns:"\xAF",Sub:"\u22D0",sub:"\u2282",subdot:"\u2ABD",subE:"\u2AC5",sube:"\u2286",subedot:"\u2AC3",submult:"\u2AC1",subnE:"\u2ACB",subne:"\u228A",subplus:"\u2ABF",subrarr:"\u2979",Subset:"\u22D0",subset:"\u2282",subseteq:"\u2286",subseteqq:"\u2AC5",SubsetEqual:"\u2286",subsetneq:"\u228A",subsetneqq:"\u2ACB",subsim:"\u2AC7",subsub:"\u2AD5",subsup:"\u2AD3",succ:"\u227B",succapprox:"\u2AB8",succcurlyeq:"\u227D",Succeeds:"\u227B",SucceedsEqual:"\u2AB0",SucceedsSlantEqual:"\u227D",SucceedsTilde:"\u227F",succeq:"\u2AB0",succnapprox:"\u2ABA",succneqq:"\u2AB6",succnsim:"\u22E9",succsim:"\u227F",SuchThat:"\u220B",Sum:"\u2211",sum:"\u2211",sung:"\u266A",Sup:"\u22D1",sup:"\u2283",sup1:"\xB9",sup2:"\xB2",sup3:"\xB3",supdot:"\u2ABE",supdsub:"\u2AD8",supE:"\u2AC6",supe:"\u2287",supedot:"\u2AC4",Superset:"\u2283",SupersetEqual:"\u2287",suphsol:"\u27C9",suphsub:"\u2AD7",suplarr:"\u297B",supmult:"\u2AC2",supnE:"\u2ACC",supne:"\u228B",supplus:"\u2AC0",Supset:"\u22D1",supset:"\u2283",supseteq:"\u2287",supseteqq:"\u2AC6",supsetneq:"\u228B",supsetneqq:"\u2ACC",supsim:"\u2AC8",supsub:"\u2AD4",supsup:"\u2AD6",swarhk:"\u2926",swArr:"\u21D9",swarr:"\u2199",swarrow:"\u2199",swnwar:"\u292A",szlig:"\xDF",Tab:"	",target:"\u2316",Tau:"\u03A4",tau:"\u03C4",tbrk:"\u23B4",Tcaron:"\u0164",tcaron:"\u0165",Tcedil:"\u0162",tcedil:"\u0163",Tcy:"\u0422",tcy:"\u0442",tdot:"\u20DB",telrec:"\u2315",Tfr:"\u{1D517}",tfr:"\u{1D531}",there4:"\u2234",Therefore:"\u2234",therefore:"\u2234",Theta:"\u0398",theta:"\u03B8",thetasym:"\u03D1",thetav:"\u03D1",thickapprox:"\u2248",thicksim:"\u223C",ThickSpace:"\u205F\u200A",thinsp:"\u2009",ThinSpace:"\u2009",thkap:"\u2248",thksim:"\u223C",THORN:"\xDE",thorn:"\xFE",Tilde:"\u223C",tilde:"\u02DC",TildeEqual:"\u2243",TildeFullEqual:"\u2245",TildeTilde:"\u2248",times:"\xD7",timesb:"\u22A0",timesbar:"\u2A31",timesd:"\u2A30",tint:"\u222D",toea:"\u2928",top:"\u22A4",topbot:"\u2336",topcir:"\u2AF1",Topf:"\u{1D54B}",topf:"\u{1D565}",topfork:"\u2ADA",tosa:"\u2929",tprime:"\u2034",TRADE:"\u2122",trade:"\u2122",triangle:"\u25B5",triangledown:"\u25BF",triangleleft:"\u25C3",trianglelefteq:"\u22B4",triangleq:"\u225C",triangleright:"\u25B9",trianglerighteq:"\u22B5",tridot:"\u25EC",trie:"\u225C",triminus:"\u2A3A",TripleDot:"\u20DB",triplus:"\u2A39",trisb:"\u29CD",tritime:"\u2A3B",trpezium:"\u23E2",Tscr:"\u{1D4AF}",tscr:"\u{1D4C9}",TScy:"\u0426",tscy:"\u0446",TSHcy:"\u040B",tshcy:"\u045B",Tstrok:"\u0166",tstrok:"\u0167",twixt:"\u226C",twoheadleftarrow:"\u219E",twoheadrightarrow:"\u21A0",Uacute:"\xDA",uacute:"\xFA",Uarr:"\u219F",uArr:"\u21D1",uarr:"\u2191",Uarrocir:"\u2949",Ubrcy:"\u040E",ubrcy:"\u045E",Ubreve:"\u016C",ubreve:"\u016D",Ucirc:"\xDB",ucirc:"\xFB",Ucy:"\u0423",ucy:"\u0443",udarr:"\u21C5",Udblac:"\u0170",udblac:"\u0171",udhar:"\u296E",ufisht:"\u297E",Ufr:"\u{1D518}",ufr:"\u{1D532}",Ugrave:"\xD9",ugrave:"\xF9",uHar:"\u2963",uharl:"\u21BF",uharr:"\u21BE",uhblk:"\u2580",ulcorn:"\u231C",ulcorner:"\u231C",ulcrop:"\u230F",ultri:"\u25F8",Umacr:"\u016A",umacr:"\u016B",uml:"\xA8",UnderBar:"_",UnderBrace:"\u23DF",UnderBracket:"\u23B5",UnderParenthesis:"\u23DD",Union:"\u22C3",UnionPlus:"\u228E",Uogon:"\u0172",uogon:"\u0173",Uopf:"\u{1D54C}",uopf:"\u{1D566}",UpArrow:"\u2191",Uparrow:"\u21D1",uparrow:"\u2191",UpArrowBar:"\u2912",UpArrowDownArrow:"\u21C5",UpDownArrow:"\u2195",Updownarrow:"\u21D5",updownarrow:"\u2195",UpEquilibrium:"\u296E",upharpoonleft:"\u21BF",upharpoonright:"\u21BE",uplus:"\u228E",UpperLeftArrow:"\u2196",UpperRightArrow:"\u2197",Upsi:"\u03D2",upsi:"\u03C5",upsih:"\u03D2",Upsilon:"\u03A5",upsilon:"\u03C5",UpTee:"\u22A5",UpTeeArrow:"\u21A5",upuparrows:"\u21C8",urcorn:"\u231D",urcorner:"\u231D",urcrop:"\u230E",Uring:"\u016E",uring:"\u016F",urtri:"\u25F9",Uscr:"\u{1D4B0}",uscr:"\u{1D4CA}",utdot:"\u22F0",Utilde:"\u0168",utilde:"\u0169",utri:"\u25B5",utrif:"\u25B4",uuarr:"\u21C8",Uuml:"\xDC",uuml:"\xFC",uwangle:"\u29A7",vangrt:"\u299C",varepsilon:"\u03F5",varkappa:"\u03F0",varnothing:"\u2205",varphi:"\u03D5",varpi:"\u03D6",varpropto:"\u221D",vArr:"\u21D5",varr:"\u2195",varrho:"\u03F1",varsigma:"\u03C2",varsubsetneq:"\u228A\uFE00",varsubsetneqq:"\u2ACB\uFE00",varsupsetneq:"\u228B\uFE00",varsupsetneqq:"\u2ACC\uFE00",vartheta:"\u03D1",vartriangleleft:"\u22B2",vartriangleright:"\u22B3",Vbar:"\u2AEB",vBar:"\u2AE8",vBarv:"\u2AE9",Vcy:"\u0412",vcy:"\u0432",VDash:"\u22AB",Vdash:"\u22A9",vDash:"\u22A8",vdash:"\u22A2",Vdashl:"\u2AE6",Vee:"\u22C1",vee:"\u2228",veebar:"\u22BB",veeeq:"\u225A",vellip:"\u22EE",Verbar:"\u2016",verbar:"|",Vert:"\u2016",vert:"|",VerticalBar:"\u2223",VerticalLine:"|",VerticalSeparator:"\u2758",VerticalTilde:"\u2240",VeryThinSpace:"\u200A",Vfr:"\u{1D519}",vfr:"\u{1D533}",vltri:"\u22B2",vnsub:"\u2282\u20D2",vnsup:"\u2283\u20D2",Vopf:"\u{1D54D}",vopf:"\u{1D567}",vprop:"\u221D",vrtri:"\u22B3",Vscr:"\u{1D4B1}",vscr:"\u{1D4CB}",vsubnE:"\u2ACB\uFE00",vsubne:"\u228A\uFE00",vsupnE:"\u2ACC\uFE00",vsupne:"\u228B\uFE00",Vvdash:"\u22AA",vzigzag:"\u299A",Wcirc:"\u0174",wcirc:"\u0175",wedbar:"\u2A5F",Wedge:"\u22C0",wedge:"\u2227",wedgeq:"\u2259",weierp:"\u2118",Wfr:"\u{1D51A}",wfr:"\u{1D534}",Wopf:"\u{1D54E}",wopf:"\u{1D568}",wp:"\u2118",wr:"\u2240",wreath:"\u2240",Wscr:"\u{1D4B2}",wscr:"\u{1D4CC}",xcap:"\u22C2",xcirc:"\u25EF",xcup:"\u22C3",xdtri:"\u25BD",Xfr:"\u{1D51B}",xfr:"\u{1D535}",xhArr:"\u27FA",xharr:"\u27F7",Xi:"\u039E",xi:"\u03BE",xlArr:"\u27F8",xlarr:"\u27F5",xmap:"\u27FC",xnis:"\u22FB",xodot:"\u2A00",Xopf:"\u{1D54F}",xopf:"\u{1D569}",xoplus:"\u2A01",xotime:"\u2A02",xrArr:"\u27F9",xrarr:"\u27F6",Xscr:"\u{1D4B3}",xscr:"\u{1D4CD}",xsqcup:"\u2A06",xuplus:"\u2A04",xutri:"\u25B3",xvee:"\u22C1",xwedge:"\u22C0",Yacute:"\xDD",yacute:"\xFD",YAcy:"\u042F",yacy:"\u044F",Ycirc:"\u0176",ycirc:"\u0177",Ycy:"\u042B",ycy:"\u044B",yen:"\xA5",Yfr:"\u{1D51C}",yfr:"\u{1D536}",YIcy:"\u0407",yicy:"\u0457",Yopf:"\u{1D550}",yopf:"\u{1D56A}",Yscr:"\u{1D4B4}",yscr:"\u{1D4CE}",YUcy:"\u042E",yucy:"\u044E",Yuml:"\u0178",yuml:"\xFF",Zacute:"\u0179",zacute:"\u017A",Zcaron:"\u017D",zcaron:"\u017E",Zcy:"\u0417",zcy:"\u0437",Zdot:"\u017B",zdot:"\u017C",zeetrf:"\u2128",ZeroWidthSpace:"\u200B",Zeta:"\u0396",zeta:"\u03B6",Zfr:"\u2128",zfr:"\u{1D537}",ZHcy:"\u0416",zhcy:"\u0436",zigrarr:"\u21DD",Zopf:"\u2124",zopf:"\u{1D56B}",Zscr:"\u{1D4B5}",zscr:"\u{1D4CF}",zwj:"\u200D",zwnj:"\u200C"});qt.entityMap=qt.HTML_ENTITIES});var Io=re(mr=>{"use strict";var gt=Ye(),M=Kr(),Do=_t(),Zi=gt.isHTMLEscapableRawTextElement,es=gt.isHTMLMimeType,ts=gt.isHTMLRawTextElement,Vt=gt.hasOwn,yo=gt.NAMESPACE,vo=Do.ParseError,rs=Do.DOMException,jt=0,je=1,ft=2,Ht=3,mt=4,ht=5,zt=6,fr=7;function Co(){}Co.prototype={parse:function(t,e,r){var n=this.domBuilder;n.startDocument(),Ao(e,e=Object.create(null)),ns(t,e,r,n,this.errorHandler),n.endDocument()}};var on=/&#?\w+;?/g;function ns(t,e,r,n,o){var a=es(n.mimeType);t.indexOf(M.UNICODE_REPLACEMENT_CHARACTER)>=0&&o.warning("Unicode replacement character detected, source encoding issues?");function i(O){if(O>65535){O-=65536;var G=55296+(O>>10),fe=56320+(O&1023);return String.fromCharCode(G,fe)}else return String.fromCharCode(O)}function c(O){var G=O[O.length-1]===";"?O:O+";";if(!a&&G!==O)return o.error("EntityRef: expecting ;"),O;var fe=M.Reference.exec(G);if(!fe||fe[0].length!==G.length)return o.error("entity not matching Reference production: "+O),O;var Ce=G.slice(1,-1);return Vt(r,Ce)?r[Ce]:Ce.charAt(0)==="#"?i(parseInt(Ce.substring(1).replace("x","0x"))):(o.error("entity not found:"+O),O)}function l(O){if(O>v){var G=t.substring(v,O).replace(on,c);h&&p(v),n.characters(G,0,O-v),v=O}}var s=0,f=0,g=/\r\n?|\n|$/g,h=n.locator;function p(O,G){for(;O>=f&&(G=g.exec(t));)s=f,f=G.index+G[0].length,h.lineNumber++;h.columnNumber=O-s+1}for(var u=[{currentNSMap:e}],d=[],v=0;;){try{var b=t.indexOf("<",v);if(b<0){if(!a&&d.length>0)return o.fatalError("unclosed xml tag(s): "+d.join(", "));if(!t.substring(v).match(/^\s*$/)){var w=n.doc,y=w.createTextNode(t.substring(v));if(w.documentElement)return o.error("Extra content at the end of the document");w.appendChild(y),n.currentElement=y}return}if(b>v){var D=t.substring(v,b);!a&&d.length===0&&(D=D.replace(new RegExp(M.S_OPT.source,"g"),""),D&&o.error("Unexpected content outside root element: '"+D+"'")),l(b)}switch(t.charAt(b+1)){case"/":var L=t.indexOf(">",b+2),E=t.substring(b+2,L>0?L:void 0);if(!E)return o.fatalError("end tag name missing");var C=L>0&&M.reg("^",M.QName_group,M.S_OPT,"$").exec(E);if(!C)return o.fatalError('end tag name contains invalid characters: "'+E+'"');if(!n.currentElement&&!n.doc.documentElement)return;var A=d[d.length-1]||n.currentElement.tagName||n.doc.documentElement.tagName||"";if(A!==C[1]){var T=C[1].toLowerCase();if(!a||A.toLowerCase()!==T)return o.fatalError('Opening and ending tag mismatch: "'+A+'" != "'+E+'"')}var N=u.pop();d.pop();var F=N.localNSMap;if(n.endElement(N.uri,N.localName,A),F)for(var j in F)Vt(F,j)&&n.endPrefixMapping(j);L++;break;case"?":h&&p(b),L=ss(t,b,n,o);break;case"!":h&&p(b),L=To(t,b,n,o,a);break;default:h&&p(b);var x=new So,S=u[u.length-1].currentNSMap,L=os(t,b,x,S,c,o,a),z=x.length;if(x.closed||(a&&gt.isHTMLVoidElement(x.tagName)?x.closed=!0:d.push(x.tagName)),h&&z){for(var K=wo(h,{}),Oe=0;Oe<z;Oe++){var ne=x[Oe];p(ne.offset),ne.locator=wo(h,{})}n.locator=K,Eo(x,n,S)&&u.push(x),n.locator=h}else Eo(x,n,S)&&u.push(x);a&&!x.closed?L=as(t,L,x.tagName,c,n):L++}}catch(O){if(O instanceof vo)throw O;if(O instanceof rs)throw new vo(O.name+": "+O.message,n.locator,O);o.error("element parse error: "+O),L=-1}L>v?v=L:l(Math.max(b,v)+1)}}function wo(t,e){return e.lineNumber=t.lineNumber,e.columnNumber=t.columnNumber,e}function os(t,e,r,n,o,a,i){function c(p,u,d){if(Vt(r.attributeNames,p))return a.fatalError("Attribute "+p+" redefined");if(!i&&u.indexOf("<")>=0)return a.fatalError("Unescaped '<' not allowed in attributes values");r.addValue(p,u.replace(/[\t\n\r]/g," ").replace(on,o),d)}for(var l,s,f=++e,g=jt;;){var h=t.charAt(f);switch(h){case"=":if(g===je)l=t.slice(e,f),g=Ht;else if(g===ft)g=Ht;else throw new Error("attribute equal must after attrName");break;case"'":case'"':if(g===Ht||g===je)if(g===je&&(a.warning('attribute value must after "="'),l=t.slice(e,f)),e=f+1,f=t.indexOf(h,e),f>0)s=t.slice(e,f),c(l,s,e-1),g=ht;else throw new Error("attribute value no end '"+h+"' match");else if(g==mt)s=t.slice(e,f),c(l,s,e),a.warning('attribute "'+l+'" missed start quot('+h+")!!"),e=f+1,g=ht;else throw new Error('attribute value must after "="');break;case"/":switch(g){case jt:r.setTagName(t.slice(e,f));case ht:case zt:case fr:g=fr,r.closed=!0;case mt:case je:break;case ft:r.closed=!0;break;default:throw new Error("attribute invalid close char('/')")}break;case"":return a.error("unexpected end of input"),g==jt&&r.setTagName(t.slice(e,f)),f;case">":switch(g){case jt:r.setTagName(t.slice(e,f));case ht:case zt:case fr:break;case mt:case je:s=t.slice(e,f),s.slice(-1)==="/"&&(r.closed=!0,s=s.slice(0,-1));case ft:g===ft&&(s=l),g==mt?(a.warning('attribute "'+s+'" missed quot(")!'),c(l,s,e)):(i||a.warning('attribute "'+s+'" missed value!! "'+s+'" instead!!'),c(s,s,e));break;case Ht:if(!i)return a.fatalError(`AttValue: ' or " expected`)}return f;case"\x80":h=" ";default:if(h<=" ")switch(g){case jt:r.setTagName(t.slice(e,f)),g=zt;break;case je:l=t.slice(e,f),g=ft;break;case mt:var s=t.slice(e,f);a.warning('attribute "'+s+'" missed quot(")!!'),c(l,s,e);case ht:g=zt;break}else switch(g){case ft:i||a.warning('attribute "'+l+'" missed value!! "'+l+'" instead2!!'),c(l,l,e),e=f,g=je;break;case ht:a.warning('attribute space is required"'+l+'"!!');case zt:g=je,e=f;break;case Ht:g=mt,e=f;break;case fr:throw new Error("elements closed character '/' and '>' must be connected to")}}f++}}function Eo(t,e,r){for(var n=t.tagName,o=null,g=t.length;g--;){var a=t[g],i=a.qName,c=a.value,h=i.indexOf(":");if(h>0)var l=a.prefix=i.slice(0,h),s=i.slice(h+1),f=l==="xmlns"&&s;else s=i,l=null,f=i==="xmlns"&&"";a.localName=s,f!==!1&&(o==null&&(o=Object.create(null),Ao(r,r=Object.create(null))),r[f]=o[f]=c,a.uri=yo.XMLNS,e.startPrefixMapping(f,c))}for(var g=t.length;g--;)a=t[g],a.prefix&&(a.prefix==="xml"&&(a.uri=yo.XML),a.prefix!=="xmlns"&&(a.uri=r[a.prefix]));var h=n.indexOf(":");h>0?(l=t.prefix=n.slice(0,h),s=t.localName=n.slice(h+1)):(l=null,s=t.localName=n);var p=t.uri=r[l||""];if(e.startElement(p,s,n,t),t.closed){if(e.endElement(p,s,n),o)for(l in o)Vt(o,l)&&e.endPrefixMapping(l)}else return t.currentNSMap=r,t.localNSMap=o,!0}function as(t,e,r,n,o){var a=Zi(r);if(a||ts(r)){var i=t.indexOf("</"+r+">",e),c=t.substring(e+1,i);return a&&(c=c.replace(on,n)),o.characters(c,0,c.length),i}return e+1}function Ao(t,e){for(var r in t)Vt(t,r)&&(e[r]=t[r])}function xo(t,e){var r=e;function n(f){return f=f||0,t.charAt(r+f)}function o(f){f=f||1,r+=f}function a(){for(var f=0;r<t.length;){var g=n();if(g!==" "&&g!==`
`&&g!=="	"&&g!=="\r")return f;f++,o()}return-1}function i(){return t.substring(r)}function c(f){return t.substring(r,r+f.length)===f}function l(f){return t.substring(r,r+f.length).toUpperCase()===f.toUpperCase()}function s(f){var g=M.reg("^",f),h=g.exec(i());return h?(o(h[0].length),h[0]):null}return{char:n,getIndex:function(){return r},getMatch:s,getSource:function(){return t},skip:o,skipBlanks:a,substringFromIndex:i,substringStartsWith:c,substringStartsWithCaseInsensitive:l}}function is(t,e){function r(c,l){var s=M.PI.exec(c.substringFromIndex());return s?s[1].toLowerCase()==="xml"?l.fatalError("xml declaration is only allowed at the start of the document, but found at position "+c.getIndex()):(c.skip(s[0].length),s[0]):l.fatalError("processing instruction is not well-formed at position "+c.getIndex())}var n=t.getSource();if(t.char()==="["){t.skip(1);for(var o=t.getIndex();t.getIndex()<n.length;){if(t.skipBlanks(),t.char()==="]"){var a=n.substring(o,t.getIndex());return t.skip(1),a}var i=null;if(t.char()==="<"&&t.char(1)==="!")switch(t.char(2)){case"E":t.char(3)==="L"?i=t.getMatch(M.elementdecl):t.char(3)==="N"&&(i=t.getMatch(M.EntityDecl));break;case"A":i=t.getMatch(M.AttlistDecl);break;case"N":i=t.getMatch(M.NotationDecl);break;case"-":i=t.getMatch(M.Comment);break}else if(t.char()==="<"&&t.char(1)==="?")i=r(t,e);else if(t.char()==="%")i=t.getMatch(M.PEReference);else return e.fatalError("Error detected in Markup declaration");if(!i)return e.fatalError("Error in internal subset at position "+t.getIndex())}return e.fatalError("doctype internal subset is not well-formed, missing ]")}}function To(t,e,r,n,o){var a=xo(t,e);switch(o?a.char(2).toUpperCase():a.char(2)){case"-":var i=a.getMatch(M.Comment);return i?(r.comment(i,M.COMMENT_START.length,i.length-M.COMMENT_START.length-M.COMMENT_END.length),a.getIndex()):n.fatalError("comment is not well-formed at position "+a.getIndex());case"[":var c=a.getMatch(M.CDSect);return c?!o&&!r.currentElement?n.fatalError("CDATA outside of element"):(r.startCDATA(),r.characters(c,M.CDATA_START.length,c.length-M.CDATA_START.length-M.CDATA_END.length),r.endCDATA(),a.getIndex()):n.fatalError("Invalid CDATA starting at position "+e);case"D":{if(r.doc&&r.doc.documentElement)return n.fatalError("Doctype not allowed inside or after documentElement at position "+a.getIndex());if(o?!a.substringStartsWithCaseInsensitive(M.DOCTYPE_DECL_START):!a.substringStartsWith(M.DOCTYPE_DECL_START))return n.fatalError("Expected "+M.DOCTYPE_DECL_START+" at position "+a.getIndex());if(a.skip(M.DOCTYPE_DECL_START.length),a.skipBlanks()<1)return n.fatalError("Expected whitespace after "+M.DOCTYPE_DECL_START+" at position "+a.getIndex());var l={name:void 0,publicId:void 0,systemId:void 0,internalSubset:void 0};if(l.name=a.getMatch(M.Name),!l.name)return n.fatalError("doctype name missing or contains unexpected characters at position "+a.getIndex());if(o&&l.name.toLowerCase()!=="html"&&n.warning("Unexpected DOCTYPE in HTML document at position "+a.getIndex()),a.skipBlanks(),a.substringStartsWith(M.PUBLIC)||a.substringStartsWith(M.SYSTEM)){var s=M.ExternalID_match.exec(a.substringFromIndex());if(!s)return n.fatalError("doctype external id is not well-formed at position "+a.getIndex());s.groups.SystemLiteralOnly!==void 0?l.systemId=s.groups.SystemLiteralOnly:(l.systemId=s.groups.SystemLiteral,l.publicId=s.groups.PubidLiteral),a.skip(s[0].length)}else if(o&&a.substringStartsWithCaseInsensitive(M.SYSTEM)){if(a.skip(M.SYSTEM.length),a.skipBlanks()<1)return n.fatalError("Expected whitespace after "+M.SYSTEM+" at position "+a.getIndex());if(l.systemId=a.getMatch(M.ABOUT_LEGACY_COMPAT_SystemLiteral),!l.systemId)return n.fatalError("Expected "+M.ABOUT_LEGACY_COMPAT+" in single or double quotes after "+M.SYSTEM+" at position "+a.getIndex())}return o&&l.systemId&&!M.ABOUT_LEGACY_COMPAT_SystemLiteral.test(l.systemId)&&n.warning("Unexpected doctype.systemId in HTML document at position "+a.getIndex()),o||(a.skipBlanks(),l.internalSubset=is(a,n)),a.skipBlanks(),a.char()!==">"?n.fatalError("doctype not terminated with > at position "+a.getIndex()):(a.skip(1),r.startDTD(l.name,l.publicId,l.systemId,l.internalSubset),r.endDTD(),a.getIndex())}default:return n.fatalError('Not well-formed XML starting with "<!" at position '+e)}}function ss(t,e,r,n){var o=t.substring(e).match(M.PI);if(!o)return n.fatalError("Invalid processing instruction starting at position "+e);if(o[1].toLowerCase()==="xml"){if(e>0)return n.fatalError("processing instruction at position "+e+" is an xml declaration which is only at the start of the document");if(!M.XMLDecl.test(t.substring(e)))return n.fatalError("xml declaration is not well-formed")}return r.processingInstruction(o[1],o[2]),e+o[0].length}function So(){this.attributeNames=Object.create(null)}So.prototype={setTagName:function(t){if(!M.QName_exact.test(t))throw new Error("invalid tagName:"+t);this.tagName=t},addValue:function(t,e,r){if(!M.QName_exact.test(t))throw new Error("invalid attribute:"+t);this.attributeNames[t]=this.length,this[this.length++]={qName:t,value:e,offset:r}},length:0,getLocalName:function(t){return this[t].localName},getLocator:function(t){return this[t].locator},getQName:function(t){return this[t].qName},getURI:function(t){return this[t].uri},getValue:function(t){return this[t].value}};mr.XMLReader=Co;mr.parseUtils=xo;mr.parseDoctypeCommentOrCData=To});var Mo=re(yt=>{"use strict";var Je=Ye(),cs=nn(),ls=_t(),No=bo(),us=Io(),ds=cs.DOMImplementation,ps=Je.hasDefaultHTMLNamespace,fs=Je.isHTMLMimeType,ms=Je.isValidMimeType,Oo=Je.MIME_TYPE,an=Je.NAMESPACE,Bo=ls.ParseError,hs=us.XMLReader;function _o(t){return t.replace(/\r[\n\u0085]/g,`
`).replace(/[\r\u0085\u2028\u2029]/g,`
`)}function ko(t){if(t=t||{},t.locator===void 0&&(t.locator=!0),this.assign=t.assign||Je.assign,this.domHandler=t.domHandler||gr,this.onError=t.onError||t.errorHandler,t.errorHandler&&typeof t.errorHandler!="function")throw new TypeError("errorHandler object is no longer supported, switch to onError!");t.errorHandler&&t.errorHandler("warning","The `errorHandler` option has been deprecated, use `onError` instead!",this),this.normalizeLineEndings=t.normalizeLineEndings||_o,this.locator=!!t.locator,this.xmlns=this.assign(Object.create(null),t.xmlns)}ko.prototype.parseFromString=function(t,e){if(!ms(e))throw new TypeError('DOMParser.parseFromString: the provided mimeType "'+e+'" is not valid.');var r=this.assign(Object.create(null),this.xmlns),n=No.XML_ENTITIES,o=r[""]||null;ps(e)?(n=No.HTML_ENTITIES,o=an.HTML):e===Oo.XML_SVG_IMAGE&&(o=an.SVG),r[""]=o,r.xml=r.xml||an.XML;var a=new this.domHandler({mimeType:e,defaultNamespace:o,onError:this.onError}),i=this.locator?{}:void 0;this.locator&&a.setDocumentLocator(i);var c=new hs;c.errorHandler=a,c.domBuilder=a;var l=!Je.isHTMLMimeType(e);return l&&typeof t!="string"&&c.errorHandler.fatalError("source is not a string"),c.parse(this.normalizeLineEndings(String(t)),r,n),a.doc.documentElement||c.errorHandler.fatalError("missing root element"),a.doc};function gr(t){var e=t||{};this.mimeType=e.mimeType||Oo.XML_APPLICATION,this.defaultNamespace=e.defaultNamespace||null,this.cdata=!1,this.currentElement=void 0,this.doc=void 0,this.locator=void 0,this.onError=e.onError}function bt(t,e){e.lineNumber=t.lineNumber,e.columnNumber=t.columnNumber}gr.prototype={startDocument:function(){var t=new ds;this.doc=fs(this.mimeType)?t.createHTMLDocument(!1):t.createDocument(this.defaultNamespace,"")},startElement:function(t,e,r,n){var o=this.doc,a=o.createElementNS(t,r||e),i=n.length;hr(this,a),this.currentElement=a,this.locator&&bt(this.locator,a);for(var c=0;c<i;c++){var t=n.getURI(c),l=n.getValue(c),r=n.getQName(c),s=o.createAttributeNS(t,r);this.locator&&bt(n.getLocator(c),s),s.value=s.nodeValue=l,a.setAttributeNode(s)}},endElement:function(t,e,r){this.currentElement=this.currentElement.parentNode},startPrefixMapping:function(t,e){},endPrefixMapping:function(t){},processingInstruction:function(t,e){var r=this.doc.createProcessingInstruction(t,e);this.locator&&bt(this.locator,r),hr(this,r)},ignorableWhitespace:function(t,e,r){},characters:function(t,e,r){if(t=Lo.apply(this,arguments),t){if(this.cdata)var n=this.doc.createCDATASection(t);else var n=this.doc.createTextNode(t);this.currentElement?this.currentElement.appendChild(n):/^\s*$/.test(t)&&this.doc.appendChild(n),this.locator&&bt(this.locator,n)}},skippedEntity:function(t){},endDocument:function(){this.doc.normalize()},setDocumentLocator:function(t){t&&(t.lineNumber=0),this.locator=t},comment:function(t,e,r){t=Lo.apply(this,arguments);var n=this.doc.createComment(t);this.locator&&bt(this.locator,n),hr(this,n)},startCDATA:function(){this.cdata=!0},endCDATA:function(){this.cdata=!1},startDTD:function(t,e,r,n){var o=this.doc.implementation;if(o&&o.createDocumentType){var a=o.createDocumentType(t,e,r,n);this.locator&&bt(this.locator,a),hr(this,a),this.doc.doctype=a}},reportError:function(t,e){if(typeof this.onError=="function")try{this.onError(t,e,this)}catch(r){throw new Bo("Reporting "+t+' "'+e+'" caused '+r,this.locator)}else console.error("[xmldom "+t+"]	"+e,gs(this.locator))},warning:function(t){this.reportError("warning",t)},error:function(t){this.reportError("error",t)},fatalError:function(t){throw this.reportError("fatalError",t),new Bo(t,this.locator)}};function gs(t){if(t)return`
@#[line:`+t.lineNumber+",col:"+t.columnNumber+"]"}function Lo(t,e,r){return typeof t=="string"?t.substr(e,r):t.length>=e+r||e?new java.lang.String(t,e,r)+"":t}"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g,function(t){gr.prototype[t]=function(){return null}});function hr(t,e){t.currentElement?t.currentElement.appendChild(e):t.doc.appendChild(e)}function bs(t){if(t==="error")throw"onErrorStopParsing"}function ys(){throw"onWarningStopParsing"}yt.__DOMHandler=gr;yt.DOMParser=ko;yt.normalizeLineEndings=_o;yt.onErrorStopParsing=bs;yt.onWarningStopParsing=ys});var Fo=re(U=>{"use strict";var vt=Ye();U.assign=vt.assign;U.hasDefaultHTMLNamespace=vt.hasDefaultHTMLNamespace;U.isHTMLMimeType=vt.isHTMLMimeType;U.isValidMimeType=vt.isValidMimeType;U.MIME_TYPE=vt.MIME_TYPE;U.NAMESPACE=vt.NAMESPACE;var br=_t();U.DOMException=br.DOMException;U.DOMExceptionName=br.DOMExceptionName;U.ExceptionCode=br.ExceptionCode;U.ParseError=br.ParseError;var ee=nn();U.Attr=ee.Attr;U.CDATASection=ee.CDATASection;U.CharacterData=ee.CharacterData;U.Comment=ee.Comment;U.Document=ee.Document;U.DocumentFragment=ee.DocumentFragment;U.DocumentType=ee.DocumentType;U.DOMImplementation=ee.DOMImplementation;U.Element=ee.Element;U.Entity=ee.Entity;U.EntityReference=ee.EntityReference;U.LiveNodeList=ee.LiveNodeList;U.NamedNodeMap=ee.NamedNodeMap;U.Node=ee.Node;U.NodeList=ee.NodeList;U.Notation=ee.Notation;U.ProcessingInstruction=ee.ProcessingInstruction;U.Text=ee.Text;U.XMLSerializer=ee.XMLSerializer;var yr=Mo();U.DOMParser=yr.DOMParser;U.normalizeLineEndings=yr.normalizeLineEndings;U.onErrorStopParsing=yr.onErrorStopParsing;U.onWarningStopParsing=yr.onWarningStopParsing});var sn=re((nl,$o)=>{"use strict";var{DOMParser:vs,XMLSerializer:wt}=Fo(),Ro="http://schemas.microsoft.com/winfx/2006/xaml";function R(t,e){for(let r=0;r<t.childNodes.length;r++){let n=t.childNodes[r];if(n.nodeType===1&&n.localName===e)return n}return null}function Ne(t){if(!t)return null;for(let e=0;e<t.childNodes.length;e++)if(t.childNodes[e].nodeType===1)return t.childNodes[e];return null}function ws(t){return t.getAttributeNS(Ro,"Name")||t.getAttribute("x:Name")||null}function Es(t){return t.getAttributeNS(Ro,"Key")||t.getAttribute("x:Key")||null}function Ds(t){let e=R(t,"VisualPropertiesStorage");if(e)return e;for(let r=0;r<t.childNodes.length;r++){let n=t.childNodes[r];if(!(n.nodeType!==1||!n.localName.includes("."))&&(e=R(n,"VisualPropertiesStorage"),e))return e}return null}function Cs(t){let e=Ds(t);if(!e)return{x:0,y:0};let r=0,n=0;for(let o=0;o<e.childNodes.length;o++){let a=e.childNodes[o];if(a.nodeType!==1)continue;let i=Es(a);i==="ElementX"&&(r=parseFloat(a.textContent)||0),i==="ElementY"&&(n=parseFloat(a.textContent)||0)}return{x:r,y:n}}function Xe(t){let e=R(t,"DirectiveStep.Action");if(e)return Ne(e);for(let r=0;r<t.childNodes.length;r++){let n=t.childNodes[r];if(n.nodeType===1&&!(n.localName.includes(".")||n.localName==="VisualPropertiesStorage"))return n}return null}function vr(t){let e=R(t,"DirectiveCondition.Condition");if(e)return Ne(e);for(let r=0;r<t.childNodes.length;r++){let n=t.childNodes[r];if(n.nodeType===1&&!(n.localName.includes(".")||n.localName==="VisualPropertiesStorage"))return n}return null}var As={CustomCodeAction:"Execute Custom Code",EnableDirectivesAction:"Enable Post Directive",RaiseExceptionAction:"Raise Exception",SetDataFieldAction:"Set Data Field",CallMethodAction:"Invoke BO Method",CompleteMethodCallAction:"Complete Method Call",SendEmailAction:"Send E-mail",ActivityTrackingAction:"Activity Tracking",LogMessageAction:"Log Message",ShowMessageAction:"Show Message",AttachDataTagAction:"Attach Data Tag",RemoveDataTagAction:"Remove Data Tag",AttachHoldAction:"Attach Hold",RemoveHoldsAction:"Remove Holds",EnablePostDirectiveAction:"Enable Post Directive",InvokeFunctionAction:"Invoke Function",InvokeExternalMethodAction:"Invoke External Method"},xs={CustomCodeCondition:"C# Condition",FieldCondition:"Field Condition"};function Po(t){if(!t)return null;let e=t.localName,r={};for(let f=0;f<t.attributes.length;f++){let g=t.attributes[f];g.name.startsWith("xmlns")||(r[g.name]=g.value)}let n=t.hasAttribute("Code")?t.getAttribute("Code"):null,o=null,a=Ne(t);a&&a.localName==="String"&&(o=a.textContent);let i=null,c=null;if(e==="SetBpmDataFieldAction"){let f=R(t,e+".Expression");if(f){let h=R(f,"ExpressionDefinition");h&&(i=h.getAttribute("Text"))}let g=R(t,e+".Field");if(g){let h=R(g,"ColumnInfo");h&&(c={tableName:h.getAttribute("TableName"),columnName:h.getAttribute("ColumnName")})}}let l=null;if(e==="InvokeEpicorFunctionAction2"||e==="InvokeEpicorFunctionAction"){l=[];for(let f of["InputParameters","OutputParameters"]){let g=R(t,e+"."+f);if(!g)continue;let h=R(g,"Array")||g;for(let p=0;p<h.childNodes.length;p++){let u=h.childNodes[p];if(u.nodeType!==1||u.localName!=="ParameterBinding2")continue;let d=R(u,"ParameterBinding2.BindingTarget"),v=d?R(d,"VariableBindingTarget"):null;l.push({paramName:u.getAttribute("ParameterName")||"",paramDirection:u.getAttribute("ParameterDirection")||"Input",variableName:v&&v.getAttribute("VariableName")||""})}}}let s=null;if(e==="ConditionBlock"){s=[];let g=R(t,"ConditionBlock.Items")||t;for(let h=0;h<g.childNodes.length;h++){let p=g.childNodes[h];if(p.nodeType!==1||p.localName!=="ConditionBlockItem")continue;let u=p.getAttribute("Operator")||"None",d=R(p,"ConditionBlockItem.Condition"),v=d?Ne(d):null;if(!v)continue;let b=v.localName,w={};for(let A=0;A<v.attributes.length;A++){let T=v.attributes[A];T.name.startsWith("xmlns")||(w[T.name]=T.value)}let y=null,D=R(v,b+".Expression");if(D){let A=R(D,"ExpressionDefinition");A&&(y=A.getAttribute("Text"))}let E=null,C=R(v,b+".Field");if(C){let A=R(C,"ColumnInfo");A&&(E={tableName:A.getAttribute("TableName"),columnName:A.getAttribute("ColumnName")})}s.push({localName:b,attrs:w,itemOperator:u,expressionText:y,fieldInfo:E})}}return{localName:e,attrs:r,code:n,message:o,conditions:s,actionExpressionText:i,actionFieldInfo:c,paramBindings:l,label:As[e]||xs[e]||e}}function He(t){if(!t)return null;let e=new vs({onError:(l,s)=>{if(l==="fatalError")throw new Error(s)}}).parseFromString(t,"text/xml"),r=e.documentElement;if(!r||r.localName!=="DirectiveDefinition2")return null;let n=[],o=[],a=new Set;function i(l,s,f){if(!l||l.localName==="Null"||l.getAttribute("x:Null")!==null)return;let g=ws(l)||`_node${n.length}`;if(a.has(g)){s!==null&&o.push({from:s,to:g,label:f});return}a.add(g),s!==null&&o.push({from:s,to:g,label:f});let{x:h,y:p}=Cs(l);if(l.localName==="DirectiveCondition"){n.push({id:g,type:"condition",widget:Po(vr(l)),x:h,y:p,_el:l});let u=R(l,"DirectiveCondition.True"),d=R(l,"DirectiveCondition.False"),v=u?Ne(u):null;v?i(v,g,"True"):o.push({from:g,to:null,label:"True"});let b=l.getAttribute("False"),w=d?Ne(d):null;w?i(w,g,"False"):(!b||b==="{x:Null}")&&o.push({from:g,to:null,label:"False"})}else if(l.localName==="DirectiveStep"){n.push({id:g,type:"step",widget:Po(Xe(l)),x:h,y:p,_el:l});let u=R(l,"DirectiveStep.Next");u&&i(Ne(u),g,null)}}let c=R(r,"DirectiveDefinition2.StartNode");return c&&i(Ne(c),null,null),{nodes:n,edges:o,startNodeId:n[0]?.id??null,doc:e,root:r}}function Ts(t,e,r){let n=He(t);if(!n)throw new Error("Failed to parse directive XAML");let o=n.nodes.find(i=>i.id===e);if(!o)throw new Error(`Node "${e}" not found`);let a=o.type==="condition"?vr(o._el):Xe(o._el);if(!a)throw new Error(`No widget element found in node "${e}"`);if(!a.hasAttribute("Code"))throw new Error(`Widget ${a.localName} has no Code attribute`);return a.setAttribute("Code",r),new wt().serializeToString(n.doc)}function Ss(t,e,r){let n=He(t);if(!n)throw new Error("Failed to parse directive XAML");let o=n.nodes.find(c=>c.id===e);if(!o||o.type!=="step")throw new Error(`Step node "${e}" not found`);let a=Xe(o._el);if(!a||a.localName!=="RaiseExceptionAction")throw new Error(`Node "${e}" is not a RaiseExceptionAction`);let i=Ne(a);return i&&i.localName==="String"&&(i.textContent=r),new wt().serializeToString(n.doc)}function Is(t,e,r){let n=He(t);if(!n)throw new Error("Failed to parse directive XAML");let o=n.nodes.find(s=>s.id===e);if(!o)throw new Error(`Node "${e}" not found`);let a=o.type==="condition"?vr(o._el):Xe(o._el);if(!a||a.localName!=="ConditionBlock")throw new Error("Not a ConditionBlock node");let c=R(a,"ConditionBlock.Items")||a,l=[];for(let s=0;s<c.childNodes.length;s++){let f=c.childNodes[s];f.nodeType===1&&f.localName==="ConditionBlockItem"&&l.push(f)}for(let{index:s,conditionAttrs:f,expressionText:g,itemOperator:h,fieldInfo:p}of r){let u=l[s];if(!u)continue;h!==void 0&&u.setAttribute("Operator",h);let d=R(u,"ConditionBlockItem.Condition"),v=d?Ne(d):null;if(v){if(f)for(let[b,w]of Object.entries(f))v.setAttribute(b,w);if(g!==void 0){let b=R(v,v.localName+".Expression");if(b){let w=R(b,"ExpressionDefinition");w&&w.setAttribute("Text",g)}}if(p){let b=R(v,v.localName+".Field");if(b){let w=R(b,"ColumnInfo");w&&(p.tableName!==void 0&&w.setAttribute("TableName",p.tableName),p.columnName!==void 0&&w.setAttribute("ColumnName",p.columnName))}}}}return new wt().serializeToString(n.doc)}function Ns(t,e,r){let n=He(t);if(!n)throw new Error("Failed to parse directive XAML");let o=n.nodes.find(i=>i.id===e);if(!o)throw new Error(`Node "${e}" not found`);let a=o.type==="condition"?vr(o._el):Xe(o._el);if(!a)throw new Error(`No widget element found in node "${e}"`);for(let[i,c]of Object.entries(r))a.setAttribute(i,c);return new wt().serializeToString(n.doc)}function Bs(t,e,r,n){let o=He(t);if(!o)throw new Error("Failed to parse directive XAML");let a=o.nodes.find(c=>c.id===e);if(!a)throw new Error(`Node "${e}" not found`);let i=Xe(a._el);if(!i)throw new Error(`No action element found in node "${e}"`);for(let[c,l]of Object.entries(r))i.setAttribute(c,l);for(let{paramName:c,variableName:l}of n)for(let s of["InputParameters","OutputParameters"]){let f=R(i,i.localName+"."+s);if(!f)continue;let g=R(f,"Array")||f;for(let h=0;h<g.childNodes.length;h++){let p=g.childNodes[h];if(p.nodeType!==1||p.localName!=="ParameterBinding2"||p.getAttribute("ParameterName")!==c)continue;let u=R(p,"ParameterBinding2.BindingTarget"),d=u?R(u,"VariableBindingTarget"):null;d&&d.setAttribute("VariableName",l)}}return new wt().serializeToString(o.doc)}function Ls(t,e,r,n){let o=He(t);if(!o)throw new Error("Failed to parse directive XAML");let a=o.nodes.find(c=>c.id===e);if(!a)throw new Error(`Node "${e}" not found`);let i=Xe(a._el);if(!i)throw new Error(`No action element found in node "${e}"`);if(r!==void 0){let c=R(i,i.localName+".Expression");if(c){let l=R(c,"ExpressionDefinition");l&&l.setAttribute("Text",r)}}if(n){let c=R(i,i.localName+".Field");if(c){let l=R(c,"ColumnInfo");l&&(n.tableName!==void 0&&l.setAttribute("TableName",n.tableName),n.columnName!==void 0&&l.setAttribute("ColumnName",n.columnName))}}return new wt().serializeToString(o.doc)}var Os=new Set(["Id","ValidationState","IsNewRow","RowMod","BitFlag","SysRevID","SysRowID","Code"]);function _s(t,e){let r=[];if(!t)return r.push(e+"(no widget)"),r;let n=Object.entries(t.attrs||{}).filter(([o])=>!o.startsWith("xmlns")&&!o.startsWith("x:")&&!Os.has(o)).sort(([o],[a])=>o.localeCompare(a));for(let[o,a]of n)r.push(e+o+" = "+a);t.message!=null&&r.push(e+"Message = "+t.message),t.actionFieldInfo&&r.push(e+"Field = "+(t.actionFieldInfo.tableName||"")+"."+(t.actionFieldInfo.columnName||"")),t.actionExpressionText!=null&&r.push(e+"Expression = "+t.actionExpressionText);for(let o of t.paramBindings||[])r.push(e+"Param "+o.paramDirection+" "+o.paramName+" <-> "+o.variableName);if((t.conditions||[]).forEach((o,a)=>{let i=[];if(a>0&&i.push(o.itemOperator),i.push(o.localName),o.fieldInfo&&i.push((o.fieldInfo.tableName||"")+"."+(o.fieldInfo.columnName||"")),o.attrs&&o.attrs.Operator&&i.push(o.attrs.Operator),o.expressionText!=null&&i.push(o.expressionText),o.attrs&&o.attrs.Filter!==void 0&&i.push("["+o.attrs.Filter+"]"),r.push(e+"Condition "+(a+1)+": "+i.join(" ")),o.attrs&&o.attrs.Code)for(let c of String(o.attrs.Code).split(`
`))r.push(e+"  | "+c)}),t.code!=null){r.push(e+"Code:");for(let o of String(t.code).split(`
`))r.push(e+"  | "+o)}return r}function ks(t){let e;try{e=He(t)}catch{return null}if(!e||e.nodes.length===0)return null;let r=new Map(e.nodes.map((a,i)=>[a.id,i+1])),n=a=>a==null?"(end)":"["+(r.get(a)??"?")+"]",o=[];return e.nodes.forEach((a,i)=>{o.push("["+(i+1)+"] "+(a.type==="condition"?"Condition":"Step")+": "+(a.widget?.label||a.widget?.localName||"(unknown)")),o.push(..._s(a.widget,"    "));for(let c of e.edges.filter(l=>l.from===a.id))o.push("    "+(c.label?c.label+" -> ":"-> ")+n(c.to));o.push("")}),o.join(`
`)}$o.exports={parseDirective:He,setNodeCode:Ts,setRaiseExceptionMessage:Ss,setNodeAttrs:Ns,setConditionChildren:Is,setInvokeFunctionAction:Bs,setActionField:Ls,directiveToCanonicalText:ks}});var qo=re((ol,Uo)=>{"use strict";var Wt=require("vscode"),{parseDirective:Ms,setNodeCode:Fs,setRaiseExceptionMessage:Ps,setNodeAttrs:Rs,setConditionChildren:$s,setInvokeFunctionAction:Us,setActionField:qs}=sn(),wr=new Map;function js(t,e,r){let n=r.DirectiveID;if(wr.has(n)){wr.get(n).reveal(Wt.ViewColumn.One);return}let o=r.DirectiveType===1?"Pre":r.DirectiveType===3?"Post":r.DirectiveType===2?"Base":"",a=Wt.window.createWebviewPanel("bpmWidgets",`BPM: ${o} ${r.Name}`,Wt.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0});wr.set(n,a),a.onDidDispose(()=>wr.delete(n),null,t.subscriptions);let i=r.Body;function c(){let s=Ms(i);if(!s||s.nodes.length===0){a.webview.html=zs("Could not parse directive XAML, or no widget nodes found.<br>This directive may be a pure C# code directive with no visual widgets.");return}let f={nodes:s.nodes.map(g=>({id:g.id,type:g.type,widget:g.widget?{localName:g.widget.localName,label:g.widget.label,code:g.widget.code,message:g.widget.message,attrs:g.widget.attrs,conditions:g.widget.conditions,paramBindings:g.widget.paramBindings,actionExpressionText:g.widget.actionExpressionText,actionFieldInfo:g.widget.actionFieldInfo}:null,x:g.x,y:g.y})),edges:s.edges};a.webview.html=Vs(r.Name,o,f)}c(),a.webview.onDidReceiveMessage(async s=>{s.type==="saveCode"?await l(s.nodeId,()=>Fs(i,s.nodeId,s.code)):s.type==="saveMessage"?await l(s.nodeId,()=>Ps(i,s.nodeId,s.message)):s.type==="saveAttrs"?await l(s.nodeId,()=>Rs(i,s.nodeId,s.attrs)):s.type==="saveConditions"?await l(s.nodeId,()=>$s(i,s.nodeId,s.conditions)):s.type==="saveInvokeFunction"?await l(s.nodeId,()=>Us(i,s.nodeId,s.attrs,s.paramBindings)):s.type==="saveActionField"&&await l(s.nodeId,()=>qs(i,s.nodeId,s.expressionText,s.fieldInfo))},null,t.subscriptions);async function l(s,f){try{a.webview.postMessage({type:"saving"});let g=f(),h=await e.getBpmMethodRaw("BO",r.BpMethodCode),p=Hs(h,r.DirectiveID,g),d=((await e.updateBpmRaw(p))?.returnObj?.BpMessageSvc||[]).filter(v=>v.Severity>1);if(d.length)throw new Error(d.map(v=>v.Message).join("; "));i=g,r.Body=g,a.webview.postMessage({type:"saved"}),Wt.window.showInformationMessage(`BPM: "${r.Name}" saved.`)}catch(g){a.webview.postMessage({type:"saveError",message:g.message}),Wt.window.showErrorMessage(`BPM Widget push failed: ${g.message}`)}}}function Hs(t,e,r){let n=t.indexOf('"BpDirective":[');if(n<0)throw new Error("BpDirective array not found in tableset");let o=`"DirectiveID":"${e}"`,a=t.indexOf("[",n)+1;for(;a<t.length;){let i=t.indexOf("{",a);if(i<0)break;let c=0,l=!1,s=!1,f=-1;for(let C=i;C<t.length;C++){let A=t[C];if(l){if(s){s=!1;continue}if(A==="\\"){s=!0;continue}A==='"'&&(l=!1);continue}if(A==='"'){l=!0;continue}if(A==="{")c++;else if(A==="}"&&(c--,!c)){f=C;break}}if(f<0)throw new Error("Malformed BpDirective object in tableset");let g=t.slice(i,f+1);if(!g.includes(o)){a=f+1;continue}let h='"Body":"',p=g.indexOf(h);if(p<0)throw new Error("Body field not found in directive row");let u=p+h.length,d=u,v=!1;for(;d<g.length;){let C=g[d];if(v){v=!1,d++;continue}if(C==="\\"){v=!0,d++;continue}if(C==='"')break;d++}let b=JSON.stringify(r).slice(1,-1),w=g.slice(0,u)+b+g.slice(d),y=t.slice(0,i)+g+","+w+t.slice(f+1),D='"BitFlag":0,"RowMod":""',E=y.indexOf(D,i+g.length+1);if(E<0)throw new Error(`RowMod anchor not found for directive ${e}`);return y.slice(0,E)+'"BitFlag":0,"RowMod":"U"'+y.slice(E+D.length)}throw new Error(`Directive ${e} not found in tableset`)}function zs(t){return`<!DOCTYPE html><html><body style="color:#f87171;font-family:sans-serif;padding:24px;background:#1e1e1e;font-size:13px">${t}</body></html>`}function Vs(t,e,r){let n=Ws(),o=JSON.stringify(r),a=JSON.stringify(t),i=JSON.stringify(e);return`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${n}';">
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
<script nonce="${n}">
const vscode=acquireVsCodeApi();
const G=${o},DN=${a},TL=${i};
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
</body></html>`}function Ws(){let t="",e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let r=0;r<32;r++)t+=e[Math.floor(Math.random()*e.length)];return t}Uo.exports={openWidgetPanel:js}});var Go=re(Dt=>{"use strict";var Gt=Dt&&Dt.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(r){var n=[];for(var o in r)Object.prototype.hasOwnProperty.call(r,o)&&(n[n.length]=o);return n},t(e)};return function(e){if(e&&e.__esModule)return e;var r={};if(e!=null)for(var n=t(e),o=0;o<n.length;o++)n[o]!=="default"&&(r[n[o]]=e[n[o]]);return r.default=e,r}})();Object.defineProperty(Dt,"__esModule",{value:!0});Dt.registerUpdateCommand=rc;Dt.checkForUpdatesOnStartup=nc;var we=Gt(require("vscode")),Ho=Gt(require("https")),Et=Gt(require("fs")),Gs=Gt(require("path")),Ys=Gt(require("os")),Ks="mbcpi",Js="epicor-customcode-manager",Xs="micah-bragg",Qs=`https://api.github.com/repos/${Ks}/${Js}/releases/latest`,jo="efx.updateSnoozedVersion";function Zs(t,e){let r=s=>String(s||"0").replace(/^v/,"").split(".").map(f=>parseInt(f)||0),[n,o,a]=r(t),[i,c,l]=r(e);return i!==n?i>n:c!==o?c>o:l>a}function zo(t,e=3){return new Promise((r,n)=>{let o=Ho.get(t,{headers:{"User-Agent":"epicor-efx-manager-vscode"}},a=>{if((a.statusCode===301||a.statusCode===302)&&a.headers.location&&e>0)return r(zo(a.headers.location,e-1));if(a.statusCode!==200)return a.resume(),n(new Error(`GitHub API returned ${a.statusCode}`));let i="";a.on("data",c=>{i+=c}),a.on("end",()=>{try{r(JSON.parse(i))}catch{n(new Error("Failed to parse GitHub API response"))}})});o.on("error",n),o.setTimeout(1e4,()=>{o.destroy(),n(new Error("Update check timed out"))})})}function Vo(t,e,r=5){return new Promise((n,o)=>{let a=Et.createWriteStream(e),i=Ho.get(t,{headers:{"User-Agent":"epicor-efx-manager-vscode"}},c=>{if((c.statusCode===301||c.statusCode===302)&&c.headers.location&&r>0)return a.close(),Et.unlink(e,()=>{}),n(Vo(c.headers.location,e,r-1));if(c.statusCode!==200)return a.close(),Et.unlink(e,()=>{}),o(new Error(`Download failed: HTTP ${c.statusCode}`));c.pipe(a),a.on("finish",()=>a.close(n)),a.on("error",l=>{Et.unlink(e,()=>{}),o(l)})});i.on("error",c=>{Et.unlink(e,()=>{}),o(c)}),i.setTimeout(6e4,()=>{i.destroy(),o(new Error("Download timed out"))})})}async function ec(){let t=await zo(Qs),e=(t.assets||[]).find(r=>r.name&&r.name.endsWith(".vsix"));if(!e)throw new Error("No .vsix asset found in latest GitHub release");return{version:(t.tag_name||"").replace(/^v/,""),tagName:t.tag_name||"",releaseNotes:t.body||"",downloadUrl:e.browser_download_url,assetName:e.name}}async function tc(t){let e=Gs.join(Ys.tmpdir(),t.assetName);await we.window.withProgress({location:we.ProgressLocation.Notification,title:`EFx: Downloading v${t.version}...`,cancellable:!1},async()=>{await Vo(t.downloadUrl,e)});let r=we.Uri.file(e);await we.commands.executeCommand("workbench.extensions.installExtension",r),setTimeout(()=>{try{Et.unlinkSync(e)}catch{}},5e3),await we.window.showInformationMessage(`EFx Manager updated to v${t.version}. Reload window to activate?`,"Reload Now","Later")==="Reload Now"&&await we.commands.executeCommand("workbench.action.reloadWindow")}async function Wo(t,e=!1){let n=we.extensions.getExtension(`${Xs}.epicor-efx-manager`)?.packageJSON?.version||"0.0.0",o;try{o=await ec()}catch(c){e||we.window.showWarningMessage(`EFx: Update check failed \u2014 ${c.message}`);return}if(!Zs(n,o.version)){e||we.window.showInformationMessage(`EFx Manager is up to date (v${n})`);return}let a=t.globalState.get(jo,"");if(e&&a===o.version)return;let i=await we.window.showInformationMessage(`EFx Manager v${o.version} is available (you have v${n})`,"Update Now","Later");if(i==="Update Now")try{await tc(o)}catch(c){we.window.showErrorMessage(`EFx: Update failed \u2014 ${c.message}`)}else i==="Later"&&await t.globalState.update(jo,o.version)}function rc(t){t.subscriptions.push(we.commands.registerCommand("efx.checkForUpdates",async()=>{await Wo(t,!1)}))}function nc(t){setTimeout(()=>{Wo(t,!0).catch(()=>{})},5e3)}});var cn=re(Er=>{"use strict";var Yo=require("https"),Ko=require("http");function Jo(t){let e={layout:"layout",events:"events",dataviews:"dataviews",pages:"pages",rules:"rules",tools:"tools",classicLayout:"classicLayout",orphans:"orphans",properties:"properties"},r={};for(let[n,o]of Object.entries(t||{})){if(!o)continue;let a=n.replace(/\.jsonc?$/,"");if(e[a])try{r[e[a]]=JSON.parse(o)}catch{}}return r}var Yt=class{constructor(e){this.config=e}_getHeaders(){let r={"Content-Type":"application/json",Authorization:`Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64")}`};return this.config.apiKey&&(r["x-api-key"]=this.config.apiKey),r}_methodUrl(e){return`${this.config.serverUrl.replace(/\/$/,"")}/api/v2/odata/${this.config.company}/Ice.LIB.MetaFXSvc/${e}`}_call(e,r){return new Promise((n,o)=>{let a=this._methodUrl(e),i=new URL(a),c=i.protocol==="https:",l=c?Yo:Ko,s=JSON.stringify(r),f={hostname:i.hostname,port:i.port||(c?443:80),path:i.pathname+i.search,method:"POST",headers:{...this._getHeaders(),"Content-Length":Buffer.byteLength(s)},rejectUnauthorized:!1},g=l.request(f,h=>{let p="";h.on("data",u=>{p+=u}),h.on("end",()=>{if(h.statusCode>=200&&h.statusCode<300)try{n(p?JSON.parse(p):null)}catch{n(p)}else{let u=`HTTP ${h.statusCode}`;try{let d=JSON.parse(p);u=d.error?.message||d.ErrorMessage||JSON.stringify(d,null,2)}catch{u=p||u}console.error(`[MetaFX] ${e} failed ${h.statusCode}: body=`,p.slice(0,2e3)),console.error(`[MetaFX] ${e} request body was:`,s.slice(0,1e3)),o(new Error(u))}})});g.on("error",o),g.write(s),g.end()})}_get(e,r){return new Promise((n,o)=>{let a=this._methodUrl(e),i=new URL(a);i.searchParams.set("request",JSON.stringify(r));let c=i.protocol==="https:",l=c?Yo:Ko,s=this._getHeaders();delete s["Content-Type"];let f={hostname:i.hostname,port:i.port||(c?443:80),path:i.pathname+"?"+i.searchParams.toString(),method:"GET",headers:s,rejectUnauthorized:!1},g=l.request(f,h=>{let p="";h.on("data",u=>{p+=u}),h.on("end",()=>{if(h.statusCode>=200&&h.statusCode<300)try{n(p?JSON.parse(p):null)}catch{n(p)}else{let u=`HTTP ${h.statusCode}`;try{let d=JSON.parse(p);u=d.error?.message||d.ErrorMessage||p}catch{u=p||u}console.error(`[MetaFX] GET ${e} failed ${h.statusCode}:`,p.slice(0,1e3)),o(new Error(u))}})});g.on("error",o),g.end()})}async listApps(){let e=await this._call("GetApplications",{request:{Type:"view",SubType:"",SearchText:"",IncludeAllLayers:!0}});return Array.isArray(e?.returnObj)?e.returnObj:[]}async getLayers(e){let r=await this._call("GetLayers",{request:{ViewId:e,IncludeUnpublishedLayers:!0}}),n=r?.returnObj,o=a=>Array.isArray(a)&&a.length>0&&typeof a[0]=="object"&&a[0]!==null&&("LayerName"in a[0]||"LayerDescription"in a[0]||"TypeCode"in a[0]);if(Array.isArray(n))return n;if(n&&typeof n=="object"){let a=["Layers","layers","EpMetaFXLayerForApplicationList","LayerList","value","Value","data","Data","items","Items","Result","result","EpMetaFXLayerList","AppLayerList","LayerDescriptors"];for(let i of a)if(o(n[i]))return n[i];for(let[i,c]of Object.entries(n))if(o(c))return console.error("[MetaFX] GetLayers used layer-shaped fallback key:",i,"shape keys:",Object.keys(n)),c;for(let i of a)if(Array.isArray(n[i])&&n[i].length>0)return n[i];for(let[i,c]of Object.entries(n))if(Array.isArray(c)&&c.length>0)return console.error("[MetaFX] GetLayers used fallback key:",i,"shape keys:",Object.keys(n)),c;for(let i of a)if(Array.isArray(n[i]))return n[i]}return n!=null?console.error("[MetaFX] GetLayers returnObj (no array found):",JSON.stringify(n).slice(0,600)):console.error("[MetaFX] GetLayers result:",JSON.stringify(r).slice(0,600)),[]}async applicationExists(e){return(await this._call("ApplicationExists",{viewId:e}))?.returnObj===!0}async deleteApp(e){await this._call("DeleteApp",{viewId:e})}async exportApp(e){return(await this._call("ExportApp",{viewId:e}))?.returnObj||null}async getAppForLayer(e,r){console.log(`[MetaFX] getAppForLayer \u2192 viewId="${e}" layer="${r}"`);let n={id:e,properties:{deviceType:"Desktop",layers:[r],baseAppVersion:0,layerVersion:0,mode:"AppStudio",applicationType:"view",ignorePersonalization:!1,additionalContext:{doValidation:!0,menuId:"preview",inPreviewMode:!0},checkDuplicateIds:!1,debug:!1}};console.log("[MetaFX] getAppForLayer request:",JSON.stringify(n));try{let o=await this._get("GetApp",n),a=o?.returnObj;return a?(console.log("[MetaFX] getAppForLayer OK \u2014 top-level keys:",Object.keys(a)),a):(console.error("[MetaFX] getAppForLayer: empty returnObj. Full response:",JSON.stringify(o).slice(0,500)),null)}catch(o){throw console.error(`[MetaFX] getAppForLayer failed for layer="${r}":`,o.message),o}}async getApplicationInfo(e){return(await this.listApps()).find(n=>n.Id===e)||null}async getNewApplication(e,r,n){await this._call("GetNewApplication",{request:{Id:e,Type:r,SubType:n}})}_buildLayerInfo(e,r={},n=!0){let o=r.layerDescription||"";return{ViewId:e,LayerDescription:o,LayerName:o,TypeCode:r.typeCode||"KNTCCustLayer",WIP:n,IsNew:r.isNew||!1,Company:r.company||this.config.company||"",DeviceType:"Desktop",CGCCode:"",SystemFlag:!1,HasDraftContent:n,PublishParentLayers:!1,CommentText:r.comment||"",ParentLayers:null,UserName:null,Content:null,ChangedOn:new Date().toISOString().slice(0,10)+"T00:00:00",LayerUpdatedToPropDiffFormat:null,ProcessedInfo:null,LastUpdatedBy:""}}async saveApp(e,r,n={}){let o=Jo(r),a=n.subType||o.layout?.viewType||"Dashboard";return(await this._call("SaveApp",{request:{id:e,viewType:a,...o,applicationType:"view",subApplicationType:a,uxAppVersion:0,commentText:n.comment||"",deviceType:"Desktop",layerInfo:this._buildLayerInfo(e,n,!0)}}))?.returnObj}async publishApp(e,r,n={}){let o=Jo(r),a=n.subType||o.layout?.viewType||"Dashboard";return(await this._call("PublishApp",{request:{id:e,viewType:a,...o,applicationType:"view",subApplicationType:a,uxAppVersion:0,commentText:n.comment||"",deviceType:"Desktop",layerInfo:this._buildLayerInfo(e,n,!1)}}))?.returnObj}async exportLayers(e){return(await this._call("ExportLayers",{apps:e}))?.returnObj??null}async importLayers(e,r=!0){await this._call("ImportLayers",{fileContent:{content:e,overwrite:r}})}};Er.KineticMetaFXClient=Yt;Er.KineticLayerClient=Yt;Er.KineticAppClient=Yt});var ta=re(ea=>{"use strict";var Ee=require("vscode"),{EpicorClient:oc}=Pr(),{BpmClient:Xo,extractBpmCode:ac,formatBpmBodyXaml:ic}=Zt(),{directiveToCanonicalText:sc}=sn(),{KineticMetaFXClient:cc}=cn();function lc(t){if(!t)return{code:"",usings:""};try{let e=JSON.parse(t);return{code:e.Code||"",usings:e.Usings||""}}catch{return{code:t,usings:""}}}function Qo(t){let e=t.EfxFunction||[],r=t.EfxFunctionSignature||[],n=t.EfxLibrary||[],o={};for(let s of r){let f=`${s.LibraryID}|${s.FunctionID}`;o[f]||(o[f]={inputs:[],outputs:[]});let g={name:s.ArgumentName,type:s.DataType,order:s.Order};(s.Response?o[f].outputs:o[f].inputs).push(g)}for(let s of Object.keys(o))o[s].inputs.sort((f,g)=>f.order-g.order),o[s].outputs.sort((f,g)=>f.order-g.order);let a={},i=(s,f,g)=>{(a[s]=a[s]||{})[f]=(a[s]||{})[f]||[],a[s][f].push(g)};for(let s of t.EfxRefLibrary||[])i(s.LibraryID,"libs",s.LibraryRef);for(let s of t.EfxRefAssembly||[])i(s.LibraryID,"assemblies",s.Assembly);for(let s of t.EfxRefService||[])i(s.LibraryID,"services",s.ServiceID);for(let s of t.EfxRefTable||[])i(s.LibraryID,"tables",`${s.TableID} (${s.Updatable?"rw":"ro"})`);let c={};for(let s of n)c[s.LibraryID]=s;let l={};for(let s of e){let{code:f,usings:g}=lc(s.Body);l[s.LibraryID]||(l[s.LibraryID]={}),l[s.LibraryID][s.FunctionID]={...s,_code:f,_usings:g,_sig:o[`${s.LibraryID}|${s.FunctionID}`]||{inputs:[],outputs:[]}}}return{fnMap:l,refMap:a,libDetail:c}}function uc(t,e){let r={},n=!1;for(let[c,l]of[["_code","Code"],["_usings","Usings"]]){let s=t[c]||"",f=e[c]||"",g=s===f;g||(n=!0),r[l]={a:s,b:f,same:g}}for(let c of["Description","Kind","RequireTransaction","SingleRowMode","Private","Disabled"]){let l=String(t[c]??""),s=String(e[c]??""),f=l===s;f||(n=!0),r[c]={a:l,b:s,same:f}}let o=c=>(c||[]).map(l=>`${l.name}: ${l.type}`).join(", "),a=t._sig||{},i=e._sig||{};for(let[c,l]of[["Inputs","inputs"],["Outputs","outputs"]]){let s=o(a[l]),f=o(i[l]),g=s===f;g||(n=!0),r[c]={a:s,b:f,same:g,params_a:a[l]||[],params_b:i[l]||[]}}return r.hasDiff=n,r}var dc=["DirectDBAccess","AllowCustomCodeFunctions","AllowCustomCodeWidgets","Frozen","Disabled"],pc=["Description","Owner","Revision","EpicorVersion","Mode","Notes","Package","PackageVersion","Publisher","LockedBy","LockedOn","DebugMode","DumpSources","AdvTracing"];function fc(t,e,r,n){let o={},a=!1;for(let i of["libs","assemblies","services","tables"]){let c=[...t[i]||[]].sort().join(`
`),l=[...e[i]||[]].sort().join(`
`),s=c===l;s||(a=!0),o[i]={a:c,b:l,same:s}}for(let i of dc){let c=String((r||{})[i]??""),l=String((n||{})[i]??""),s=c===l;s||(a=!0),o[i]={a:c,b:l,same:s}}for(let i of pc){let c=String((r||{})[i]??""),l=String((n||{})[i]??"");o[i]={a:c,b:l,same:c===l,infoOnly:!0}}return o.hasDiff=a,o}function Dr(t){return t?{FunctionID:t.FunctionID||"",Description:t.Description||"",Kind:t.Kind,RequireTransaction:t.RequireTransaction,SingleRowMode:t.SingleRowMode,Private:t.Private,Disabled:t.Disabled,_code:t._code||"",_usings:t._usings||"",_sig:t._sig||{inputs:[],outputs:[]}}:null}function mc(t,e,r,n,o,a,i,c){let l=[...new Set([...t.map(f=>f.LibraryID),...e.map(f=>f.LibraryID),...Object.keys(r),...Object.keys(n)])].sort(),s=[];for(let f of l){let g=f in r||f in i,h=f in n||f in c,p=r[f]||{},u=n[f]||{},d=[...new Set([...Object.keys(p),...Object.keys(u)])].sort(),v=[];for(let y of d){let D=p[y],E=u[y];if(!D)v.push({fnID:y,status:"only-b",fa:null,fb:Dr(E)});else if(!E)v.push({fnID:y,status:"only-a",fa:Dr(D),fb:null});else{let C=uc(D,E);v.push({fnID:y,status:C.hasDiff?"diff":"match",fa:Dr(D),fb:Dr(E),fields:C})}}let b=fc(o[f]||{},a[f]||{},i[f],c[f]),w;g?h?v.some(y=>y.status!=="match")||b.hasDiff?w="diff":w="match":w="only-a":w="only-b",s.push({libID:f,status:w,inA:g,inB:h,libDiff:b,fnDiffs:v})}return s}function hc(t,e){let r={},n=!1,o=t._code||"",a=e._code||"",i=o===a;i||(n=!0),r.Code={a:o,b:a,same:i};let c=t._bodyNorm||"",l=e._bodyNorm||"",s=c===l;s||(n=!0),r.Xaml=s?{a:"",b:"",same:!0}:{a:c,b:l,same:!1};for(let f of["DirectiveType","IsEnabled","Sequence"]){let g=String(t[f]??""),h=String(e[f]??""),p=g===h;p||(n=!0),r[f]={a:g,b:h,same:p}}return r.hasDiff=n,r}function Cr(t){return t?{name:t.Name||"",DirectiveType:t.DirectiveType,IsEnabled:t.IsEnabled,Sequence:t.Sequence,hasCode:t.hasCode||!1,_code:t._code||""}:null}function gc(t,e,r,n){let o={},a={};for(let h of t)o[h.BpMethodCode]=h;for(let h of r)a[h.BpMethodCode]=h;let i={},c={};for(let h of e)i[h.BpMethodCode]||(i[h.BpMethodCode]={}),i[h.BpMethodCode][h.Name]=h;for(let h of n)c[h.BpMethodCode]||(c[h.BpMethodCode]={}),c[h.BpMethodCode][h.Name]=h;let l=[...new Set([...Object.keys(o),...Object.keys(a)])].sort(),s={};for(let h of l){let p=o[h]||a[h],u=`${p.SystemCode||"Erp"}:${p.BusinessObject||h}`;s[u]||(s[u]={systemCode:p.SystemCode||"Erp",businessObject:p.BusinessObject||h,methods:[]});let d=i[h]||{},v=c[h]||{},b=[...new Set([...Object.keys(d),...Object.keys(v)])].sort(),w=[];for(let C of b){let A=d[C],T=v[C];if(!A)w.push({name:C,status:"only-b",da:null,db:Cr(T)});else if(!T)w.push({name:C,status:"only-a",da:Cr(A),db:null});else{let N=hc(A,T);w.push({name:C,status:N.hasDiff?"diff":"match",da:Cr(A),db:Cr(T),fields:N})}}let y=h in o,D=h in a,E=y?D?w.some(C=>C.status!=="match")?"diff":"match":"only-a":"only-b";s[u].methods.push({methodCode:h,methodName:p.Name||h,status:E,inA:y,inB:D,dirDiffs:w})}let f=Object.entries(s).map(([h,p])=>{let u=p.methods.reduce((v,b)=>v+b.dirDiffs.filter(w=>w.status!=="match").length,0),d=p.methods.some(v=>v.status!=="match")?"diff":"match";return{svcKey:h,systemCode:p.systemCode,businessObject:p.businessObject,status:d,diffCount:u,methods:p.methods}});f.sort((h,p)=>{let u={diff:0,"only-a":1,"only-b":2,match:3};return(u[h.status]??4)-(u[p.status]??4)||h.businessObject.localeCompare(p.businessObject)});let g={match:0,diff:0};for(let h of f)g[h.status]=(g[h.status]||0)+1;return{services:f,counts:g,total:f.length}}function ln(t){return Array.isArray(t)?t.map(ln):t&&typeof t=="object"?Object.keys(t).sort().reduce((e,r)=>(e[r]=ln(t[r]),e),{}):t}function Zo(t){if(!t||!t.trim())return t||"";try{return JSON.stringify(ln(JSON.parse(t)),null,2)}catch{return t}}var Kt=class t{constructor(e,r){this.panel=e,this.context=r,this.disposed=!1,this._layerCache=new Map,e.webview.onDidReceiveMessage(async n=>{try{switch(n.command){case"ready":this._postProfiles();break;case"runCompare":await this._runFunctionsCompare(n);break;case"runBpmCompare":await this._runBpmCompare(n);break;case"runLayersCompare":await this._runLayersCompare(n);break;case"fetchLayerList":await this._fetchLayerList(n);break;case"fetchLayerContent":await this._fetchLayerContent(n);break;case"openNativeDiff":await this._openNativeDiff(n);break;case"applyLayer":await this._applyLayer(n);break}}catch(o){this._post({command:"error",message:o.message})}}),e.onDidDispose(()=>{this.disposed=!0,t.panels.delete(t.KEY)}),e.webview.html=this.getHtml()}static show(e){let r=t.panels.get(t.KEY);if(r&&!r.disposed){r.panel.reveal();return}let n=Ee.window.createWebviewPanel("efxCompare","Compare",Ee.ViewColumn.Two,{enableScripts:!0,retainContextWhenHidden:!0});t.panels.set(t.KEY,new t(n,e))}_post(e){this.disposed||this.panel.webview.postMessage(e)}_postProfiles(){let e=Ee.workspace.getConfiguration().get("efx.profiles")||[],r=Ee.workspace.getConfiguration().get("efx.activeProfile")||"",n=Ee.workspace.getConfiguration().get("efx.activeCompany")||"";this._post({command:"profiles",data:e.map(o=>({name:o.name,companies:o.companies||[]})),activeProfile:r,activeCompany:n})}async _secrets(e){let r=await this.context.secrets.get(`efx.profile.${e}.password`)||"",n=await this.context.secrets.get(`efx.profile.${e}.apiKey`)||"";return{password:r,apiKey:n}}async _efxClient(e,r){let o=(Ee.workspace.getConfiguration().get("efx.profiles")||[]).find(c=>c.name===e);if(!o)throw new Error(`Profile "${e}" not found`);let{password:a,apiKey:i}=await this._secrets(e);return new oc({serverUrl:o.serverUrl,company:r,username:o.username,password:a,apiKey:i})}async _metafxClient(e,r){let o=(Ee.workspace.getConfiguration().get("efx.profiles")||[]).find(c=>c.name===e);if(!o)throw new Error(`Profile "${e}" not found`);let{password:a,apiKey:i}=await this._secrets(e);return new cc({serverUrl:o.serverUrl,company:r,username:o.username,password:a,apiKey:i})}async _runFunctionsCompare({profileA:e,companyA:r,profileB:n,companyB:o}){this._post({command:"status",text:"Building clients\u2026"}),this._layerCache.clear();try{let[a,i]=await Promise.all([this._efxClient(e,r),this._efxClient(n,o)]);this._post({command:"status",text:"Fetching library lists\u2026"});let[c,l]=await Promise.all([a.getLibraryList(),i.getLibraryList()]),s=[...new Set([...c.map(C=>C.LibraryID),...l.map(C=>C.LibraryID)])];this._post({command:"status",text:`Fetching ${s.length} libraries from both environments\u2026`});let[f,g]=await Promise.all([a.request(a.getDesignerUrl("GetLibraries"),{libraryIds:s}),i.request(i.getDesignerUrl("GetLibraries"),{libraryIds:s})]);this._post({command:"status",text:"Computing diff\u2026"});let h=f.returnObj||f,p=g.returnObj||g,{fnMap:u,refMap:d,libDetail:v}=Qo(h),{fnMap:b,refMap:w,libDetail:y}=Qo(p),D=mc(c,l,u,b,d,w,v,y),E={match:0,diff:0,"only-a":0,"only-b":0};for(let C of D)E[C.status]=(E[C.status]||0)+1;this._post({command:"functionsReady",data:{meta:{env_a_name:e,env_b_name:n,counts:E,total:D.length},libraries:D}})}catch(a){this._post({command:"error",tab:"functions",message:a.message})}}async _runBpmCompare({profileA:e,companyA:r,profileB:n,companyB:o}){this._post({command:"status",text:"Fetching BPM services\u2026"});try{let[a,i]=await Promise.all([this._efxClient(e,r),this._efxClient(n,o)]),c=new Xo(a),l=new Xo(i),s=async p=>{let u=await p.getBpmServices(),d=6,v=new Array(u.length),b=0,w=async()=>{for(;b<u.length;){let E=b++,{SystemCode:C,ServiceKind:A,ServiceName:T}=u[E];v[E]=await p.getBpmMethodsByService(C,A,T)}};await Promise.all(Array.from({length:Math.min(d,u.length)},w));let y=[],D=[];for(let E of v){y.push(...E.methods);for(let C of E.directives){let{code:A,hasCustomCode:T}=ac(C.Body||""),N=sc(C.Body||"");D.push({BpMethodCode:C.BpMethodCode,Name:C.Name,DirectiveType:C.DirectiveType,IsEnabled:C.IsEnabled,Sequence:C.Sequence,_code:A,hasCode:T,_bodyNorm:N??ic(C.Body||"")})}}return{methods:y,directives:D}};this._post({command:"status",text:"Fetching BPM directives from both environments\u2026"});let[f,g]=await Promise.all([s(c),s(l)]);this._post({command:"status",text:"Computing BPM diff\u2026"});let h=gc(f.methods,f.directives,g.methods,g.directives);this._post({command:"bpmReady",data:h})}catch(a){this._post({command:"error",tab:"bpm",message:a.message})}}async _runLayersCompare({profileA:e,companyA:r,profileB:n,companyB:o}){this._post({command:"status",text:"Fetching app list\u2026"});try{let[a,i]=await Promise.all([this._metafxClient(e,r),this._metafxClient(n,o)]),[c,l]=await Promise.all([a.listApps(),i.listApps()]),s=c[0]&&Object.entries(c[0]).find(([,d])=>Array.isArray(d)&&d.length>0&&typeof d[0]=="object"&&d[0]!==null&&("LayerName"in d[0]||"LayerDescription"in d[0]));s&&console.log('[comparePanel] GetApplications embeds layers under key "'+s[0]+'" \u2014 GetLayers per app may be skippable');let f=new Map(c.map(d=>[d.Id,d])),g=new Map(l.map(d=>[d.Id,d])),p=[...new Set([...f.keys(),...g.keys()])].sort().map(d=>{let v=f.get(d),b=g.get(d),w=!!v,y=!!b,D=w&&y&&v.LastUpdated!==b.LastUpdated;return{id:d,inA:w,inB:y,status:w?y?"in-both":"only-a":"only-b",timestampsDiffer:D,lastUpdatedA:v?.LastUpdated,lastUpdatedB:b?.LastUpdated,type:(v||b).Type,subType:(v||b).SubType}});p.sort((d,v)=>{let b=w=>w.status==="only-a"?0:w.status==="only-b"?1:w.timestampsDiffer?2:3;return b(d)-b(v)||d.id.localeCompare(v.id)});let u={"only-a":0,"only-b":0,"timestamps-differ":0,"in-both":0};for(let d of p)d.status==="only-a"?u["only-a"]++:d.status==="only-b"?u["only-b"]++:d.timestampsDiffer?u["timestamps-differ"]++:u["in-both"]++;this._post({command:"layersReady",data:{apps:p,counts:u,total:p.length}})}catch(a){this._post({command:"error",tab:"layers",message:a.message})}}async _fetchLayerList({appId:e,profileA:r,companyA:n,profileB:o,companyB:a}){this._post({command:"layerListLoading",appId:e});try{let[i,c]=await Promise.all([this._metafxClient(r,n),this._metafxClient(o,a)]),[l,s]=await Promise.all([i.getLayers(e).then(f=>({layers:f})).catch(f=>(console.error("[layers A]",f.message),{layers:[],error:f.message})),c.getLayers(e).then(f=>({layers:f})).catch(f=>(console.error("[layers B]",f.message),{layers:[],error:f.message}))]);this._post({command:"status",text:`Layers for ${e}: ${r}=${l.error?"ERROR":l.layers.length}, ${o}=${s.error?"ERROR":s.layers.length}`}),this._post({command:"layerListReady",appId:e,layersA:l.layers,layersB:s.layers,errorA:l.error||null,errorB:s.error||null})}catch(i){this._post({command:"layerListError",appId:e,message:i.message})}}async _fetchLayerContent({appId:e,layerKey:r,layerA:n,layerB:o,profileA:a,companyA:i,profileB:c,companyB:l}){this._post({command:"layerContentLoading",appId:e,layerKey:r});try{let[s,f]=await Promise.all([this._metafxClient(a,i),this._metafxClient(c,l)]),g=n?.LayerDescription||n?.LayerName,h=o?.LayerDescription||o?.LayerName;console.log(`[comparePanel] _fetchLayerContent appId="${e}" layerKey="${r}" descA="${g}" descB="${h}"`);let[p,u]=await Promise.all([g?s.getAppForLayer(e,g).catch(w=>(console.error("[comparePanel] getAppForLayer A failed:",w.message),null)):Promise.resolve(null),h?f.getAppForLayer(e,h).catch(w=>(console.error("[comparePanel] getAppForLayer B failed:",w.message),null)):Promise.resolve(null)]);console.log("[comparePanel] rawA keys:",p?Object.keys(p):"null"),console.log("[comparePanel] rawB keys:",u?Object.keys(u):"null");let d=w=>w?JSON.stringify(w,null,2):"",v=Zo(d(p)),b=Zo(d(u));this._layerCache.set(`${e}::${r}::a`,v),this._layerCache.set(`${e}::${r}::b`,b),this._post({command:"layerContentReady",appId:e,layerKey:r,normA:v,normB:b,same:v===b})}catch(s){console.error("[comparePanel] _fetchLayerContent error:",s.message),this._post({command:"layerContentError",appId:e,layerKey:r,message:s.message})}}async _applyLayer({appId:e,direction:r,profileA:n,companyA:o,profileB:a,companyB:i,layer:c,layerKey:l}){let s=r==="aToB"?n:a,f=r==="aToB"?o:i,g=r==="aToB"?a:n,h=r==="aToB"?i:o,p=r==="aToB"?n:a,u=r==="aToB"?a:n,d=l||c?.LayerDescription||c?.LayerName||e;if(await Ee.window.showWarningMessage(`Apply "${d}" from ${p} \u2192 ${u}?`,{modal:!0},"Apply")!=="Apply"){this._post({command:"applyLayerCancelled",appId:e,layerKey:l});return}this._post({command:"applyLayerStarted",appId:e,layerKey:l});try{let[b,w]=await Promise.all([this._metafxClient(s,f),this._metafxClient(g,h)]),y;if(c)y=[c];else if(this._post({command:"applyLayerStatus",appId:e,layerKey:l,text:`Getting layers from ${p}\u2026`}),y=await b.getLayers(e),!y.length)throw new Error(`No layers found for "${e}" on ${p}`);this._post({command:"applyLayerStatus",appId:e,layerKey:l,text:`Exporting from ${p}\u2026`});let D=await b.exportLayers(y);if(!D)throw new Error(`Export returned empty for "${d}"`);this._post({command:"applyLayerStatus",appId:e,layerKey:l,text:`Importing to ${u}\u2026`}),await w.importLayers(D,!0),this._post({command:"applyLayerDone",appId:e,layerKey:l}),Ee.window.showInformationMessage(`\u2713 Applied "${d}" to ${u}`)}catch(b){this._post({command:"applyLayerError",appId:e,layerKey:l,message:b.message})}}async _openNativeDiff({appId:e,fileName:r,labelA:n,labelB:o,contentA:a,contentB:i}){let c=require("os"),l=require("path"),s=require("fs"),f=a!==void 0?a:this._layerCache.get(`${e}::${r}::a`)||"",g=i!==void 0?i:this._layerCache.get(`${e}::${r}::b`)||"",h=(r||"diff").replace(/[^a-zA-Z0-9._-]/g,"_"),p=l.join(c.tmpdir(),`efx_cmp_a_${h}`),u=l.join(c.tmpdir(),`efx_cmp_b_${h}`);s.writeFileSync(p,f,"utf8"),s.writeFileSync(u,g,"utf8");let d=`${r}: ${n||"A"} \u2194 ${o||"B"}`;await Ee.commands.executeCommand("vscode.diff",Ee.Uri.file(p),Ee.Uri.file(u),d)}getHtml(){return`<!DOCTYPE html>
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
let LAST_RUN   = null; // {profileA, companyA, profileB, companyB}
let LAYER_LIST_CACHE    = {}; // appId -> { layersA, layersB }
let LAYER_CONTENT_CACHE = {}; // appId::layerKey -> { normA, normB, same } | { loading } | { error }
let LAYER_OBJECTS       = {}; // appId::layerKey::a/b -> layer descriptor
let PENDING_DIFF        = null; // { appId, layerKey } -- open native diff once content loads

// \u2500\u2500 HELPERS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
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
  return (layers || []).filter(l => !isBlankLayer(l)).map(l => {
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
  if (BPM_LOADED) return;
  document.getElementById('bpmPrompt').style.display = 'none';
  document.getElementById('bpmMain').style.display   = 'flex';
  document.getElementById('bpmDetail').innerHTML     = '<div class="empty-state"><span>Loading BPM data\u2026</span></div>';
  setStatus('Fetching BPMs\u2026');
  vscode.postMessage({ command: 'runBpmCompare', ...LAST_RUN });
}

function loadLayers() {
  if (!LAST_RUN) { setStatus('\u26A0 Run a compare first'); return; }
  if (LY_LOADED) return;
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
      BPM_LOADED = true;
      setStatus('');
      BPM_DATA = msg.data;
      document.getElementById('bpmBadge').textContent = BPM_DATA.total;
      renderBpmSummary(); bpmApply();
      break;
    case 'layersReady':
      LY_LOADED = true;
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
        sendDiff(msg.normA||'', msg.normB||'', msg.layerKey.replace(/[^a-zA-Z0-9._-]/g,'_')+'.json', LAST_RUN?.profileA, LAST_RUN?.profileB);
      }
      break;
    }
    case 'layerContentError':
      LAYER_CONTENT_CACHE[\`\${msg.appId}::\${msg.layerKey}\`] = { error: msg.message };
      { const bodyEl2 = document.getElementById('lrb_' + safeId(msg.appId + '_' + msg.layerKey));
        if (bodyEl2) bodyEl2.innerHTML = \`<div class="only-info" style="color:var(--c-only-a)">Error: \${esc(msg.message)}</div>\`; }
      break;
    case 'applyLayerStarted':
      setStatus(\`Applying "\${msg.layerKey || msg.appId}"\u2026\`);
      break;
    case 'applyLayerStatus':
      setStatus(msg.text);
      break;
    case 'applyLayerDone':
      setStatus('');
      // Re-fetch layer list to reflect the change
      if (LY_SEL === msg.appId) {
        delete LAYER_LIST_CACHE[msg.appId];
        if (msg.layerKey) delete LAYER_CONTENT_CACHE[\`\${msg.appId}::\${msg.layerKey}\`];
        vscode.postMessage({ command: 'fetchLayerList', appId: msg.appId, ...LAST_RUN });
      }
      break;
    case 'applyLayerCancelled':
      setStatus('');
      break;
    case 'applyLayerError':
      setStatus('Apply error: ' + msg.message);
      break;
    case 'error':
      document.getElementById('runBtn').disabled = false;
      setStatus('Error: ' + msg.message);
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
        return \`<div class="list-item s-\${l.status} \${l.libID===FN_SEL?'active':''}" onclick="fnSelect('\${esc(l.libID)}')">
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
  return \`<div class="fn-row" id="\${id}">
    <div class="fn-row-hdr" onclick="toggleFn('\${id}')">
      <span class="fn-badge" style="background:\${sc[fn.status]}22;color:\${sc[fn.status]}">\${sb[fn.status]}</span>
      <span class="fn-name">\${esc(fn.fnID)}</span>
      \${changed.length?\`<span class="fn-changed">\${changed.join(', ')}</span>\`:''}
      <button class="open-diff-btn" title="Open in VS Code diff editor" onclick="event.stopPropagation();openFnDiff('\${esc(libID)}','\${esc(fn.fnID)}')">\u2197 Diff</button>
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
    ? items.map(s => \`<div class="list-item s-\${s.status} \${s.svcKey===BPM_SEL?'active':''}" onclick="bpmSelect('\${esc(s.svcKey)}')">
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
      <button class="open-diff-btn" title="Open in VS Code diff editor" onclick="event.stopPropagation();openBpmDirDiff('\${esc(methodCode)}','\${esc(dir.name)}')">\u2197 Diff</button>
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
        return \`<div class="list-item \${cls} \${a.id===LY_SEL?'active':''}" onclick="layersSelect('\${esc(a.id)}')">
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
    ? \`<button class="open-diff-btn" title="Open in VS Code diff editor" onclick="event.stopPropagation();openLayerDiff('\${esc(appId)}','\${esc(key)}')">\u2197 Diff</button>\`
    : '';
  const applyAtoB = inA
    ? \`<button class="open-diff-btn" onclick="event.stopPropagation();applyLayerByKey('\${esc(appId)}','\${esc(key)}','aToB')">\u2192 \${esc(eb)}</button>\`
    : '';
  const applyBtoA = inB
    ? \`<button class="open-diff-btn" onclick="event.stopPropagation();applyLayerByKey('\${esc(appId)}','\${esc(key)}','bToA')">\u2192 \${esc(ea)}</button>\`
    : '';

  return \`<div class="fn-row" id="\${rid}">
    <div class="fn-row-hdr" onclick="toggleFn('\${rid}');loadLayerContent('\${esc(appId)}','\${esc(key)}')">
      <span class="fn-badge" style="background:\${sc[status]}22;color:\${sc[status]}">\${sb[status]}</span>
      <span class="fn-name">\${esc(key)}\${typeLabel}\${wipLabel}</span>
      \${compLabel}
      \${diffBtn}\${applyAtoB}\${applyBtoA}
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
  if (LAYER_CONTENT_CACHE[ck]) return; // already loaded or in-flight
  LAYER_CONTENT_CACHE[ck] = { loading: true };
  const layerA = LAYER_OBJECTS[\`\${appId}::\${layerKey}::a\`] || null;
  const layerB = LAYER_OBJECTS[\`\${appId}::\${layerKey}::b\`] || null;
  vscode.postMessage({ command: 'fetchLayerContent', appId, layerKey, layerA, layerB, ...LAST_RUN });
}

function openLayerDiff(appId, layerKey) {
  const c = LAYER_CONTENT_CACHE[\`\${appId}::\${layerKey}\`];
  if (c && !c.loading && !c.error) {
    sendDiff(c.normA||'', c.normB||'', layerKey.replace(/[^a-zA-Z0-9._-]/g,'_')+'.json', LAST_RUN?.profileA, LAST_RUN?.profileB);
    return;
  }
  PENDING_DIFF = { appId, layerKey };
  setStatus('Loading layer content for diff\u2026');
  loadLayerContent(appId, layerKey);
}

function applyLayerByKey(appId, layerKey, direction) {
  const side  = direction === 'aToB' ? 'a' : 'b';
  const layer = LAYER_OBJECTS[\`\${appId}::\${layerKey}::\${side}\`] || null;
  vscode.postMessage({ command: 'applyLayer', appId, layer, layerKey, direction, ...LAST_RUN });
}

// \u2500\u2500 Unified native diff helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function sendDiff(cA, cB, fileName, lA, lB) {
  vscode.postMessage({ command: 'openNativeDiff',
    contentA: cA, contentB: cB,
    fileName: fileName, labelA: lA || 'A', labelB: lB || 'B' });
}
function openFnDiff(libId, fnId) {
  const lib = (FN_DATA?.libraries||[]).find(l=>l.libID===libId);
  const fn  = (lib?.fnDiffs||[]).find(f=>f.fnID===fnId);
  if (!fn) return;
  sendDiff(fn.fa?._code||'', fn.fb?._code||'', fnId+'.cs', LAST_RUN?.profileA, LAST_RUN?.profileB);
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
        sendDiff(d.fields.Xaml.a||'', d.fields.Xaml.b||'', safe+'.widgets.txt', LAST_RUN?.profileA, LAST_RUN?.profileB);
      } else {
        sendDiff(d.da?._code||'', d.db?._code||'', safe+'.cs', LAST_RUN?.profileA, LAST_RUN?.profileB);
      }
      return;
    }
  }
}
function openLayerDiff_unused(appId, fileName) {
  // kept for reference only \u2014 replaced by openLayerDiff above
  if (!appId) return;
  sendDiff(f.normA||'', f.normB||'', fileName, LAST_RUN?.profileA, LAST_RUN?.profileB);
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
</html>`}};Kt.KEY="efxCompare";Kt.panels=new Map;ea.ComparePanel=Kt});var bc=exports&&exports.__createBinding||(Object.create?(function(t,e,r,n){n===void 0&&(n=r);var o=Object.getOwnPropertyDescriptor(e,r);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[r]}}),Object.defineProperty(t,n,o)}):(function(t,e,r,n){n===void 0&&(n=r),t[n]=e[r]})),yc=exports&&exports.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),fn=exports&&exports.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(r){var n=[];for(var o in r)Object.prototype.hasOwnProperty.call(r,o)&&(n[n.length]=o);return n},t(e)};return function(e){if(e&&e.__esModule)return e;var r={};if(e!=null)for(var n=t(e),o=0;o<n.length;o++)n[o]!=="default"&&bc(r,e,n[o]);return yc(r,e),r}})();Object.defineProperty(exports,"__esModule",{value:!0});exports.activate=Oc;exports.deactivate=jc;var m=fn(require("vscode")),ze=fn(require("path")),Be=fn(require("fs")),Fe=Pr(),vc=wn(),wc=Dn(),Ze=Zt(),un=Tn(),{openWidgetPanel:Ec}=qo(),ra=Go(),Dc=cn(),{ComparePanel:Cc}=ta(),Ar=new Map,De=new Map,dn=new Set,B=null,te=null,q,Ve,Br=null,Lr=null;function se(t){return String(t||"").toLowerCase()}function pn(t){return JSON.stringify(String(t))}function Ct(t,e,r,n){let o=0,a=!1,i=!1;for(let c=e;c<t.length;c++){let l=t[c];if(a){i?i=!1:l==="\\"?i=!0:l==='"'&&(a=!1);continue}if(l==='"'){a=!0;continue}if(l===r)o++;else if(l===n&&(o--,o===0))return c}return-1}function Ac(t,e,r){let o=t.indexOf('"EfxFunction"');if(o<0)throw new Error("EfxFunction array not found in raw tableset");let a=t.indexOf("[",o);if(a<0)throw new Error("EfxFunction array start not found in raw tableset");let i=Ct(t,a,"[","]");if(i<0)throw new Error("EfxFunction array end not found in raw tableset");let c='"LibraryID":'+pn(e),l='"FunctionID":'+pn(r),s=a+1;for(;s<i;){let f=t.indexOf("{",s);if(f<0||f>i)break;let g=Ct(t,f,"{","}");if(g<0||g>i)throw new Error("Malformed EfxFunction row object in raw tableset");let h=t.slice(f,g+1);if(h.includes(c)&&h.includes(l))return{start:f,end:g+1,row:h};s=g+1}throw new Error(`EfxFunction row not found in raw tableset for ${e}.${r}`)}function mn(t,e,r){let n='"'+e+'":',o=t.indexOf(n);if(o<0)throw new Error(`${e} property not found in target EfxFunction row`);let a=o+n.length;for(;/\s/.test(t[a]||"");)a++;if(t[a]!=='"')throw new Error(`${e} is not a JSON string in target EfxFunction row`);let i=a+1,c=!1;for(;i<t.length;i++){let l=t[i];if(c){c=!1;continue}if(l==="\\"){c=!0;continue}if(l==='"')break}if(i>=t.length)throw new Error(`${e} string did not terminate in target EfxFunction row`);return t.slice(0,a)+r+t.slice(i+1)}function xc(t,e,r){let n=Ac(t,e,r),o=mn(n.row,"RowMod",JSON.stringify("D"));if(o===n.row)throw new Error(`Target EfxFunction row did not change for ${e}.${r}`);let a=t.slice(0,n.start)+o+t.slice(n.end);return JSON.parse(a),a}function xr(t,e,r){let n=`"${e}":[`,o=t.indexOf(n);if(o===-1)throw new Error(`Array "${e}" not found in raw tableset`);let a=t.indexOf("[",o),i=Ct(t,a,"[","]");if(i<0)throw new Error(`Could not find end of "${e}" array`);let l=t.substring(a+1,i).trim().length>0?",":"";return t.substring(0,i)+l+r+t.substring(i)}function Tc(t,e){let n=t.indexOf('"EfxRefTable"');if(n<0)throw new Error("EfxRefTable array not found in raw tableset");let o=t.indexOf("[",n);if(o<0)throw new Error("EfxRefTable array start not found in raw tableset");let a=Ct(t,o,"[","]");if(a<0)throw new Error("EfxRefTable array end not found in raw tableset");let i='"TableID":'+pn(e),c=o+1;for(;c<a;){let l=t.indexOf("{",c);if(l<0||l>a)break;let s=Ct(t,l,"{","}");if(s<0||s>a)throw new Error("Malformed EfxRefTable row object in raw tableset");let f=t.slice(l,s+1);if(f.includes(i))return{start:l,end:s+1,row:f};c=s+1}throw new Error(`EfxRefTable row not found in raw tableset for ${e}`)}function Sc(t,e){let r=t.indexOf('"EfxLibrary":[');if(r<0)throw new Error("EfxLibrary array not found in raw tableset");let n=t.indexOf("[",r),o=t.indexOf("{",n);if(o<0)throw new Error("No EfxLibrary row found in raw tableset");let a=Ct(t,o,"{","}"),i=t.slice(o,a+1),c=mn(i,"RowMod",JSON.stringify(e));return t.slice(0,o)+c+t.slice(a+1)}function Ic(t,e,r){let n='"'+e+'":',o=t.indexOf(n);if(o<0)throw new Error(`${e} not found in object`);let a=o+n.length;for(;/\s/.test(t[a]||"");)a++;let i=t.startsWith("true",a),c=t.startsWith("false",a);if(!i&&!c)throw new Error(`${e} is not a boolean in object`);let l=a+(i?4:5);return t.slice(0,a)+String(r)+t.slice(l)}function Nc(t,e,r){let n=Tc(t,e),o=Ic(n.row,"Updatable",r);o=mn(o,"RowMod",JSON.stringify("U"));let a=t.slice(0,n.start)+o+t.slice(n.end);return a=Sc(a,"U"),JSON.parse(a),a}async function na(t){let e=se(t),r=m.workspace.textDocuments.find(n=>n.uri&&se(n.uri.fsPath)===e);if(r&&r.isDirty){dn.add(e);try{if(!await r.save())throw new Error(`Could not save ${t}`)}finally{dn.delete(e)}}}function oa(t){return t===1?m.DiagnosticSeverity.Warning:t===0?m.DiagnosticSeverity.Hint:m.DiagnosticSeverity.Error}function Bc(t){return Ir(t).content}function Ir(t){let e=t.split(/\r?\n/);if(!/^\/\/ (EFx Function|BPM Directive):/.test(e[0]||""))return{content:t,lineOffset:0};let r=s=>s.startsWith("// \u2500\u2500\u2500\u2500\u2500")||s.startsWith("// -----"),n=-1;for(let s=0;s<e.length;s++){if(r(e[s])){n=s;break}if(!e[s].startsWith("//")&&e[s].trim()!=="")break}if(n<0)return{content:t,lineOffset:0};let o=e[n],a=o.indexOf("// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),i=o.indexOf("// --------------------------------------------------"),c="";a>=0?c=o.slice(a+40).trimStart():i>=0&&(c=o.slice(i+53).trimStart());let l=e.slice(n+1);return c?{content:[c,...l].join(`
`),lineOffset:n}:{content:l.join(`
`),lineOffset:n+1}}function Tr(t){return String(t||"").replace(/\r\n/g,`
`).replace(/\r/g,`
`)}function Lc(t){return!t||t.length===0?"":t.map((e,r)=>{let n=e.ErrorLevel!==void 0?`Level ${e.ErrorLevel}`:"Error",o=e.ErrorType?` (${e.ErrorType})`:"",a=e.TableName?`
Table: ${e.TableName}`:"",i=e.ErrorText||e.Message||JSON.stringify(e);return`${r+1}. ${n}${o}${a}
${i}`}).join(`

`)}function Oc(t){q=new vc.EfxTreeProvider(null),Br=m.window.createTreeView("efxLibraries",{treeDataProvider:q}),t.subscriptions.push(Br),Ve=new un.BpmTreeProvider(null),Lr=m.window.createTreeView("bpmMethods",{treeDataProvider:Ve}),t.subscriptions.push(Lr),qc(t).then(()=>kr()),ra.registerUpdateCommand(t),ra.checkForUpdatesOnStartup(t);let e=async()=>{await ia(t)};t.subscriptions.push(m.commands.registerCommand("efx.manageProfiles",e)),t.subscriptions.push(m.commands.registerCommand("efx.configureConnection",e)),t.subscriptions.push(m.commands.registerCommand("efx.switchProfile",async()=>{await $c(t)})),t.subscriptions.push(m.commands.registerCommand("efx.switchCompany",async()=>{await Uc(t)})),t.subscriptions.push(m.commands.registerCommand("efx.refreshLibraries",async()=>{if(!B){m.window.showWarningMessage("EFx: Configure connection first");return}await q.refresh()})),t.subscriptions.push(m.commands.registerCommand("efx.pullFunction",async p=>{if(!B||!p)return;let u=p.libraryId,d=p.func.FunctionID;await m.window.withProgress({location:m.ProgressLocation.Notification,title:`Pulling ${d}...`},async()=>{try{q.invalidateCache(u);let v=await q.getLibraryTableset(u);if(!v)return;Ar.set(u,v);let b=v.EfxFunction.find(N=>N.FunctionID===d);if(!b){m.window.showErrorMessage(`Function ${d} not found`);return}let{code:w,usings:y}=Fe.EpicorClient.extractCode(b.Body),D=Sr(),E=ze.join(D,u);Be.mkdirSync(E,{recursive:!0});let C=ze.join(E,`${d}.cs`),A=[`// EFx Function: ${u}.${d}`,`// Pulled: ${new Date().toISOString()}`,y?`// Usings: ${y}`:"","// --------------------------------------------------",""].filter(N=>N!=="").join(`
`);Be.writeFileSync(C,A.replace(/\s*$/,"")+`

`+w,"utf-8"),De.set(se(C),{libraryId:u,functionId:d});let T=await m.workspace.openTextDocument(C);await m.window.showTextDocument(T,m.ViewColumn.One),m.window.showInformationMessage(`EFx: Pulled ${u}.${d}`)}catch(v){m.window.showErrorMessage(`EFx Pull failed: ${v.message}`)}})})),t.subscriptions.push(m.commands.registerCommand("efx.pushFunction",async(p,u=!1)=>{if(!B)return;let d,v,b;if(p){d=p.libraryId,v=p.func.FunctionID;let w=Sr();b=ze.join(w,d,`${v}.cs`)}else{let w=m.window.activeTextEditor;if(!w){m.window.showWarningMessage("EFx: No active file to push");return}b=w.document.uri.fsPath;let y=De.get(se(b));if(!y){m.window.showWarningMessage("EFx: This file is not a pulled EFx function");return}d=y.libraryId,v=y.functionId}if(!b||!Be.existsSync(b)){m.window.showErrorMessage("EFx: File not found. Pull the function first.");return}!u&&await m.window.showWarningMessage(`Push ${v} to ${d}?`,{modal:!0},"Push")!=="Push"||await m.window.withProgress({location:m.ProgressLocation.Notification,title:`Pushing ${v}...`},async()=>{try{await na(b);let w=q.libraryCache.get(d)||await B.getLibrary(d),y=w.EfxLibrary&&w.EfxLibrary[0];if(!y)throw new Error(`Library ${d} not found on server`);if(y.Frozen===!0){let K=y.Published?`${d} is promoted to production \u2014 demote it first (right-click the library \u2192 Demote from Production).`:`${d} is locked/frozen in Epicor. Unfreeze it before editing.`;throw new Error(K)}let D=Ir(Be.readFileSync(b,"utf-8")),E=D.content,C=D.lineOffset,A=w.EfxFunction.find(K=>K.FunctionID===v);if(!A)throw new Error(`Function ${v} not found on server`);let T=Fe.EpicorClient.extractCode(A.Body),N=await B.validateFunctionViaWrapper(d,v,E,T.usings,"Utilities","ApplyChangesWithDiagnostics"),F=m.Uri.file(b);if(!N.saved){let K=N.diagnostics||N.errors||[];if(K.length>0){let Oe=K.map(ne=>{if(typeof ne=="object"&&ne!==null){let O=Math.max(0,(ne.Line??1)-1)+C,G=Math.max(0,(ne.Column??1)-1),fe=[ne.Code,ne.Message].filter(Boolean).join(": ")||String(ne);return new m.Diagnostic(new m.Range(O,G,O,G+1),fe,m.DiagnosticSeverity.Error)}return new m.Diagnostic(new m.Range(0,0,0,1),String(ne),m.DiagnosticSeverity.Error)});n.set(F,Oe)}throw new Error(N.errors?.[0]||N.outMsg||N.outResult||"Wrapper save failed")}let x=(await B.getLibrary(d)).EfxFunction.find(K=>K.FunctionID===v);if(!x)throw new Error(`Verification failed: ${d}.${v} not found after save`);let S=Fe.EpicorClient.extractCode(x.Body).code;if(Tr(S)!==Tr(E))throw new Error("EFx Push verification failed: wrapper returned success, but server Body does not match editor text.");n.set(F,[]),m.window.showInformationMessage(`EFx: Verified save of ${d}.${v}`);let z=Ar.get(d)?.EfxFunction?.find(K=>K.FunctionID===v);z&&N.newBody&&(z.Body=N.newBody),q.invalidateCache(d)}catch(w){console.error("EFx Push failed:",w),m.window.showErrorMessage(`EFx Push failed: ${w.message}`)}})})),t.subscriptions.push(m.commands.registerCommand("efx.regenerateLibrary",async p=>{if(!B){m.window.showWarningMessage("EFx: Configure connection first");return}let u;if(p?.library?.LibraryID)u=p.library.LibraryID;else if(p?.libraryId)u=p.libraryId;else{let d=m.window.activeTextEditor;if(d){let v=De.get(se(d.document.uri.fsPath));v&&!v.isBpm&&(u=v.libraryId)}}u||(u=await m.window.showInputBox({prompt:"Library ID to regenerate / validate",placeHolder:"e.g. PimberlyFuncts"})),u&&await m.window.withProgress({location:m.ProgressLocation.Notification,title:`Validating ${u}...`},async()=>{try{let v=(await B.regenerateLibrary(u)).errors||[];if(v.length===0){m.window.showInformationMessage(`EFx: ${u} validated with no reported errors`);return}let b=Lc(v),w=await m.workspace.openTextDocument({language:"markdown",content:`# EFx Validation Errors: ${u}

\`\`\`text
${b}
\`\`\`
`});await m.window.showTextDocument(w,m.ViewColumn.Two),m.window.showWarningMessage(`EFx: ${u} has ${v.length} validation error(s)`)}catch(d){m.window.showErrorMessage(`EFx Validate failed: ${d.message}`)}})})),t.subscriptions.push(m.commands.registerCommand("efx.executeFunction",async p=>{if(!B||!p)return;let u=Or(),d=u?u.companies||[]:[],v=et()||d[0]||"",b=(q.libraries||[]).find(y=>y.LibraryID===p.libraryId),w=b?!b.Published:!1;wc.ExecutePanel.show(B,p.libraryId,p.func.FunctionID,p.signatures,d,v,q,w)})),t.subscriptions.push(m.commands.registerCommand("efx.demoteLibrary",async p=>{if(!(!B||!p||await m.window.showWarningMessage(`Demote ${p.library.LibraryID} from production?`,{modal:!0},"Demote")!=="Demote"))try{await B.demoteFromProduction(p.library.LibraryID),m.window.showInformationMessage(`EFx: Demoted ${p.library.LibraryID}`),await q.refresh()}catch(d){m.window.showErrorMessage(`EFx Demote failed: ${d.message}`)}})),t.subscriptions.push(m.commands.registerCommand("efx.promoteLibrary",async p=>{if(!(!B||!p||await m.window.showWarningMessage(`Promote ${p.library.LibraryID} to production?`,{modal:!0},"Promote")!=="Promote"))try{await B.promoteToProduction(p.library.LibraryID),m.window.showInformationMessage(`EFx: Promoted ${p.library.LibraryID}`),await q.refresh()}catch(d){m.window.showErrorMessage(`EFx Promote failed: ${d.message}`)}})),t.subscriptions.push(m.commands.registerCommand("efx.newFunction",async p=>{if(!B){m.window.showWarningMessage("EFx: Configure connection first");return}let u;if(p&&p.library?u=p.library.LibraryID:p&&p.libraryId?u=p.libraryId:u=await m.window.showInputBox({prompt:"Library ID to add the function to",placeHolder:"e.g. PaintLineFuncts"}),!u)return;let d=await m.window.showInputBox({prompt:"New Function ID",placeHolder:"e.g. MyNewFunction",validateInput:T=>!T||T.trim().length===0?"Function ID is required":/\s/.test(T)?"Function ID cannot contain spaces":null});if(!d)return;let v=await m.window.showInputBox({prompt:"Description (optional)",placeHolder:"Short description of the function"}),b=["string","int","decimal","bool","DateTime","System.Data.DataSet","System.Data.DataTable","Custom\u2026"];async function w(T){let N=[];for(;;){let F=await m.window.showInputBox({prompt:`${T} param name (leave blank to finish)`,placeHolder:"e.g. partNum",ignoreFocusOut:!0});if(!F)break;let j=await m.window.showQuickPick(b.map(S=>({label:S})),{placeHolder:`Data type for "${F}"`,ignoreFocusOut:!0});if(!j)break;let x=j.label;if(x==="Custom\u2026"){let S=await m.window.showInputBox({prompt:"Enter full .NET type name",placeHolder:"e.g. Erp.Tablesets.SalesOrderTableset",ignoreFocusOut:!0});if(!S)break;x=S}N.push({ArgumentName:F,DataType:x})}return N}let D=(await m.window.showQuickPick([{label:"Skip \u2014 add later",value:!1},{label:"Add request params now",value:!0}],{placeHolder:"Add request parameters?",ignoreFocusOut:!0}))?.value?await w("Request"):[],C=(await m.window.showQuickPick([{label:"Skip \u2014 add later",value:!1},{label:"Add response params now",value:!0}],{placeHolder:"Add response parameters?",ignoreFocusOut:!0}))?.value?await w("Response"):[],A=[...D.map((T,N)=>({...T,Response:!1,Order:N})),...C.map((T,N)=>({...T,Response:!0,Order:N}))];await m.window.withProgress({location:m.ProgressLocation.Notification,title:`Creating ${d}...`},async()=>{try{let T=await B.getLibraryRaw(u),N=JSON.stringify({Code:`// New function\r
`,Usings:""}),j=JSON.stringify({LibraryID:u,FunctionID:d,Description:v||null,Kind:2,RequireTransaction:!1,SingleRowMode:!1,Private:!1,Disabled:!1,Invalid:!1,Thumbnail:null,Body:N,Notes:null,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",BitFlag:0,RowMod:"A"}),x=T.indexOf('"EfxFunction":[');if(x===-1){m.window.showErrorMessage("EFx: Could not find EfxFunction array in tableset");return}let S=T.indexOf("[",x),L=0,z=-1;for(let O=S;O<T.length;O++){let G=T[O];if(G==='"'){for(O++;O<T.length;){if(T[O]==="\\")O++;else if(T[O]==='"')break;O++}continue}if(G==="["&&L++,G==="]"&&(L--,L===0)){z=O;break}}if(z===-1){m.window.showErrorMessage("EFx: Could not parse EfxFunction array");return}let Oe=T.substring(S+1,z).trim().length>0?",":"";T=T.substring(0,z)+Oe+j+T.substring(z);let ne=await B.applyChangesRaw(T);if(ne.diagnostics&&ne.diagnostics.length>0){let O=ne.diagnostics.join(`
`);m.window.showWarningMessage(`EFx: ${d} created with diagnostics:
${O}`)}else m.window.showInformationMessage(`EFx: Created ${u}.${d} \u2713`);if(A.length>0){let O=!1,G=null;for(let fe=0;fe<4;fe++){fe>0&&await new Promise(Ce=>setTimeout(Ce,800*fe));try{await B.saveSignatures(u,d,A),O=!0;break}catch(Ce){G=Ce}}O?m.window.showInformationMessage(`EFx: Saved ${A.length} parameter(s) for ${d} \u2713`):m.window.showWarningMessage(`EFx: Function created but signatures failed: ${G?.message}. Add them via \u2699 Edit Signatures in the Execute panel.`)}q.invalidateCache(u),await q.refresh()}catch(T){m.window.showErrorMessage(`EFx: Create function failed: ${T.message}`)}})})),t.subscriptions.push(m.commands.registerCommand("efx.deleteFunction",async p=>{if(!B){m.window.showWarningMessage("EFx: Configure connection first");return}if(!p){m.window.showWarningMessage("EFx: Delete must be invoked from a function in the tree.");return}let u=p.libraryId,d=p.func&&p.func.FunctionID;if(!u||!d){m.window.showErrorMessage("EFx: Could not determine library/function from selection.");return}await m.window.showWarningMessage(`Delete function "${d}" from library "${u}"? This cannot be undone.`,{modal:!0},"Delete")==="Delete"&&await m.window.withProgress({location:m.ProgressLocation.Notification,title:`Deleting ${d}...`},async()=>{try{let b=await B.getLibrary(u),w=b&&b.EfxLibrary&&b.EfxLibrary[0];if(!w)throw new Error(`Library ${u} not found on server`);if(w.Frozen===!0){let T=w.Published?`${u} is promoted to production \u2014 demote it first (right-click the library \u2192 Demote from Production).`:`${u} is locked/frozen in Epicor. Unfreeze it before deleting functions.`;throw new Error(T)}let y=await B.getLibraryRaw(u),D=xc(y,u,d),C=(await B.applyChangesRaw(D)).diagnostics||[];if(C.some(T=>typeof T=="object"?(T.Severity??2)>=2:/\berror\b/i.test(String(T)))){let T=C.map(N=>typeof N=="object"?N.ErrorText||JSON.stringify(N):String(N)).join(`
`);throw new Error(`Server rejected delete:
${T}`)}Ar.delete(u);for(let[T,N]of De.entries())N&&N.libraryId===u&&N.functionId===d&&De.delete(T);q.invalidateCache(u),await q.refresh(),m.window.showInformationMessage(`EFx: Deleted ${u}.${d} \u2713 (local .cs file, if any, was left in place)`)}catch(b){m.window.showErrorMessage(`EFx: Delete function failed: ${b.message}`)}})})),t.subscriptions.push(m.commands.registerCommand("efx.newLibrary",async()=>{if(!B){m.window.showWarningMessage("EFx: Configure connection first");return}let p=await m.window.showInputBox({prompt:"New Library ID",placeHolder:"e.g. MyNewLibrary",validateInput:d=>!d||d.trim().length===0?"Library ID is required":/\s/.test(d)?"Library ID cannot contain spaces":null});if(!p)return;let u=await m.window.showInputBox({prompt:"Description (optional)",placeHolder:"Short description of the library"});await m.window.withProgress({location:m.ProgressLocation.Notification,title:`Creating library ${p}...`},async()=>{try{let d=await B.getDefaultsRaw();d=d.replace(/"LibraryID":"@library"/g,`"LibraryID":"${p}"`),d=d.replace(/"OriginalID":"@library"/,`"OriginalID":"${p}"`),d=d.replace(/"FunctionID":"@function"/,'"FunctionID":"__placeholder__"'),u&&(d=d.replace(/"Description":null/,`"Description":"${u}"`)),d=d.replace(/("OriginalID":"[^"]*"[^}]*"RowMod":")(")/,"$1A$2"),d=d.replace('"AllowCustomCodeFunctions":false','"AllowCustomCodeFunctions":true'),d=d.replace('"DirectDBAccess":0','"DirectDBAccess":2');let v=d.indexOf('"EfxFunction":[');if(v!==-1){let w=d.indexOf("[",v),y=0,D=-1;for(let E=w;E<d.length;E++){let C=d[E];if(C==='"'){for(E++;E<d.length;){if(d[E]==="\\")E++;else if(d[E]==='"')break;E++}continue}if(C==="["&&y++,C==="]"&&(y--,y===0)){D=E;break}}D!==-1&&(d=d.substring(0,w)+"[]"+d.substring(D+1))}let b=await B.applyChangesRaw(d);if(b.diagnostics&&b.diagnostics.length>0){let w=b.diagnostics.join(`
`);m.window.showWarningMessage(`EFx: Library ${p} created with diagnostics:
${w}`)}else m.window.showInformationMessage(`EFx: Created library ${p} \u2713`);await q.refresh()}catch(d){m.window.showErrorMessage(`EFx: Create library failed: ${d.message}`)}})})),t.subscriptions.push(m.commands.registerCommand("efx.addTable",async p=>{if(!B||!p)return;let u=p.libraryId,d=["ERP.Part","ERP.PartBin","ERP.PartCost","ERP.PartPlant","ERP.PartUOM","ERP.PartWhse","ERP.PartCOO","ERP.PartPC","ERP.PartRev","ERP.Customer","ERP.CustCnt","ERP.ShipTo","ERP.OrderHed","ERP.OrderDtl","ERP.OrderRel","ERP.QuoteHed","ERP.QuoteDtl","ERP.JobHead","ERP.JobAsmbl","ERP.JobMtl","ERP.JobOper","ERP.ShipHead","ERP.ShipDtl","ERP.PurchaseOrder","ERP.PODetail","ERP.PORel","ERP.Vendor","ERP.VendPart","ERP.PriceLst","ERP.PriceLstParts","ERP.LaborDtl","ERP.LaborHed","ERP.PlantWhse","ERP.PartTran","ERP.Country","ERP.Currency","ERP.UD01","ERP.UD02","ERP.UD03","ERP.UD04","ERP.UD05","ERP.UD06","ERP.UD07","ERP.UD08","ERP.UD09","ERP.UD10","ICE.UD11","ICE.UD12","ICE.UD13","ICE.UD14","ICE.UD15","ICE.UD16","ICE.UD17","ICE.UD18","ICE.UD19","ICE.UD20"].sort(),v=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...d.map(D=>({label:D,manual:!1}))],b=await m.window.showQuickPick(v,{placeHolder:"Select a table or enter manually (format: ERP.Part)",matchOnDescription:!0});if(!b)return;let w;if(b.manual?w=await m.window.showInputBox({prompt:"Table ID",placeHolder:"e.g. ERP.PartBin or ICE.UD11",validateInput:D=>!D||!D.includes(".")?"Format must be NAMESPACE.TableName":null}):w=b.label,!w)return;let y=await m.window.showQuickPick([{label:"Read-only",value:!1},{label:"Updatable",value:!0}],{placeHolder:"Read-only or Updatable?"});y&&await m.window.withProgress({location:m.ProgressLocation.Notification,title:`Adding table ${w}...`},async()=>{try{let D=await B.getLibraryRaw(u),E=JSON.stringify({LibraryID:u,TableID:w,Updatable:y.value,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",RowMod:"A"});D=xr(D,"EfxRefTable",E);let C=await B.applyChangesRaw(D);C.diagnostics&&C.diagnostics.length>0?m.window.showWarningMessage(`EFx: Table added with diagnostics: ${C.diagnostics.join(", ")}`):m.window.showInformationMessage(`EFx: Added table ${w} to ${u} \u2713`),q.invalidateCache(u),q._onDidChangeTreeData.fire(void 0)}catch(D){m.window.showErrorMessage(`EFx: Add table failed: ${D.message}`)}})})),t.subscriptions.push(m.commands.registerCommand("efx.setTableUpdatable",async p=>{if(!B){m.window.showWarningMessage("EFx: Configure connection first");return}if(!p||!p.row){m.window.showWarningMessage("EFx: Must be invoked from a table in the tree.");return}let u=p.row.LibraryID,d=p.row.TableID,v=p.row.Updatable;if(!u||!d){m.window.showErrorMessage("EFx: Could not determine library/table from selection.");return}let b=await m.window.showQuickPick([{label:"$(lock) Read-only",value:!1,description:v===!1?"current":""},{label:"$(edit) Updatable",value:!0,description:v===!0?"current":""}],{placeHolder:`${d} \u2014 choose access mode`});!b||b.value===v||await m.window.withProgress({location:m.ProgressLocation.Notification,title:`Updating ${d}...`},async()=>{try{let w=await B.getLibraryRaw(u),y=Nc(w,d,b.value),E=(await B.applyChangesRaw(y)).diagnostics||[];if(E.some(A=>typeof A=="object"?(A.Severity??2)>=2:/\berror\b/i.test(String(A)))){let A=E.map(T=>typeof T=="object"?T.ErrorText||JSON.stringify(T):String(T)).join(`
`);throw new Error(`Server rejected update:
${A}`)}q.invalidateCache(u),q._onDidChangeTreeData.fire(void 0),m.window.showInformationMessage(`EFx: ${d} set to ${b.value?"Updatable":"Read-only"} \u2713`)}catch(w){m.window.showErrorMessage(`EFx: Set updatable failed: ${w.message}`)}})})),t.subscriptions.push(m.commands.registerCommand("efx.addService",async p=>{if(!B||!p)return;let u=p.libraryId,d=["ERP:BO:Part","ERP:BO:PartBin","ERP:BO:PartWhse","ERP:BO:PartCost","ERP:BO:PartTran","ERP:BO:Customer","ERP:BO:ShipTo","ERP:BO:SalesOrder","ERP:BO:QuoteMgr","ERP:BO:JobEntry","ERP:BO:JobStatus","ERP:BO:CustShip","ERP:BO:SubShipD","ERP:BO:PurchaseOrder","ERP:BO:Receipt","ERP:BO:Vendor","ERP:BO:LaborDtl","ERP:BO:PriceLst","ERP:BO:Currency","ERP:BO:Country","ERP:BO:Inventory","ICE:BO:UD11","ICE:BO:UD12","ICE:BO:UD13","ICE:BO:UD14","ICE:BO:UD15","ICE:BO:UD16","ICE:BO:UD17","ICE:BO:UD18","ICE:BO:UD19","ICE:BO:UD20","ICE:LIB:EfxLibraryDesigner"].sort(),v=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...d.map(y=>({label:y,manual:!1}))],b=await m.window.showQuickPick(v,{placeHolder:"Select a service or enter manually (format: ERP:BO:Part)"});if(!b)return;let w;b.manual?w=await m.window.showInputBox({prompt:"Service ID",placeHolder:"e.g. ERP:BO:Part or ICE:BO:UD11",validateInput:y=>!y||y.split(":").length<3?"Format must be NAMESPACE:TYPE:Name":null}):w=b.label,w&&await m.window.withProgress({location:m.ProgressLocation.Notification,title:`Adding service ${w}...`},async()=>{try{let y=await B.getLibraryRaw(u),D=JSON.stringify({LibraryID:u,ServiceID:w,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",RowMod:"A"});y=xr(y,"EfxRefService",D);let E=await B.applyChangesRaw(y);E.diagnostics&&E.diagnostics.length>0?m.window.showWarningMessage(`EFx: Service added with diagnostics: ${E.diagnostics.join(", ")}`):m.window.showInformationMessage(`EFx: Added service ${w} to ${u} \u2713`),q.invalidateCache(u),q._onDidChangeTreeData.fire(void 0)}catch(y){m.window.showErrorMessage(`EFx: Add service failed: ${y.message}`)}})})),t.subscriptions.push(m.commands.registerCommand("efx.addAssembly",async p=>{if(!B||!p)return;let u=p.libraryId,d=["Newtonsoft.Json.dll","Ice.Contracts.BO.DynamicQuery.dll","Ice.Contracts.BO.BAQDesigner.dll","Erp.Contracts.BO.Part.dll","Erp.Contracts.BO.JobEntry.dll","Erp.Contracts.BO.SalesOrder.dll","Erp.Contracts.BO.QuoteMgr.dll","Erp.Contracts.BO.CustShip.dll","Erp.Contracts.BO.PurchaseOrder.dll","Erp.Contracts.BO.LaborDtl.dll","Erp.Contracts.BO.Inventory.dll","Erp.Contracts.BO.Customer.dll","Erp.Contracts.BO.Vendor.dll","Ice.Contracts.BO.UD11.dll","Ice.Contracts.BO.UD15.dll","System.Net.Http.dll","System.Xml.dll","System.Linq.dll"].sort(),v=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...d.map(y=>({label:y,manual:!1}))],b=await m.window.showQuickPick(v,{placeHolder:"Select an assembly or enter manually (include .dll)"});if(!b)return;let w;b.manual?w=await m.window.showInputBox({prompt:"Assembly filename",placeHolder:"e.g. Newtonsoft.Json.dll",validateInput:y=>!y||!y.toLowerCase().endsWith(".dll")?"Must end in .dll":null}):w=b.label,w&&await m.window.withProgress({location:m.ProgressLocation.Notification,title:`Adding assembly ${w}...`},async()=>{try{let y=await B.getLibraryRaw(u),D=JSON.stringify({LibraryID:u,Assembly:w,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",RowMod:"A"});y=xr(y,"EfxRefAssembly",D);let E=await B.applyChangesRaw(y);E.diagnostics&&E.diagnostics.length>0?m.window.showWarningMessage(`EFx: Assembly added with diagnostics: ${E.diagnostics.join(", ")}`):m.window.showInformationMessage(`EFx: Added assembly ${w} to ${u} \u2713`),q.invalidateCache(u),q._onDidChangeTreeData.fire(void 0)}catch(y){m.window.showErrorMessage(`EFx: Add assembly failed: ${y.message}`)}})})),t.subscriptions.push(m.commands.registerCommand("efx.addLibraryRef",async p=>{if(!B||!p)return;let u=p.libraryId,v=(q.libraries||[]).map(E=>E.LibraryID).filter(E=>E!==u).sort(),b=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...v.map(E=>({label:E,manual:!1}))],w=await m.window.showQuickPick(b,{placeHolder:v.length>0?"Select a library to reference":"Enter library ID (refresh tree first to get suggestions)"});if(!w)return;let y;if(w.manual?y=await m.window.showInputBox({prompt:"Library ID to reference",placeHolder:"e.g. LogFuncts",validateInput:E=>!E||E.trim().length===0?"Library ID is required":null}):y=w.label,!y)return;let D=await m.window.showQuickPick([{label:"Normal (0)",value:0,description:"Standard reference"},{label:"Read-only (1)",value:1,description:"Cannot call mutating functions"},{label:"Hidden (2)",value:2,description:"Not visible in designer"}],{placeHolder:"Reference mode"});D&&await m.window.withProgress({location:m.ProgressLocation.Notification,title:`Adding library ref ${y}...`},async()=>{try{let E=await B.getLibraryRaw(u),C=JSON.stringify({LibraryID:u,LibraryRef:y,Mode:D.value,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",RowMod:"A"});E=xr(E,"EfxRefLibrary",C);let A=await B.applyChangesRaw(E);A.diagnostics&&A.diagnostics.length>0?m.window.showWarningMessage(`EFx: Library ref added with diagnostics: ${A.diagnostics.join(", ")}`):m.window.showInformationMessage(`EFx: Added library ref ${y} to ${u} \u2713`),q.invalidateCache(u),q._onDidChangeTreeData.fire(void 0)}catch(E){m.window.showErrorMessage(`EFx: Add library ref failed: ${E.message}`)}})}));let r=m.languages.createDiagnosticCollection("epicor-bpm");t.subscriptions.push(r);let n=m.languages.createDiagnosticCollection("epicor-efx");t.subscriptions.push(n);let o=new Map;function a(p){return o.has(p)||o.set(p,{status:"idle",timer:null}),o.get(p)}function i(p,u){let d=a(p);if(d.status==="running"||d.status==="dirty"){d.timer&&(clearTimeout(d.timer),d.timer=null),d.status="dirty";return}d.timer&&clearTimeout(d.timer),d.timer=setTimeout(()=>{d.timer=null,d.status="running",c(p,u)},500)}async function c(p,u){if(o.get(p))try{if(!te||!u.isBpm||!u.functionDefinition)return;let v=m.workspace.textDocuments.find(C=>se(C.uri.fsPath)===se(p)),b=Ir(v?v.getText():Be.readFileSync(p,"utf-8")),w=b.content,y=b.lineOffset,D=await te.validateCustomCode(w,u.functionDefinition),E=m.Uri.file(p);if(!D||D.length===0)r.set(E,[]);else{let C=D.map(A=>{let T=Math.max(0,(A.Span?.start?.line??1)-1),N=Math.max(T,(A.Span?.end?.line??T+1)-1),F=T+y,j=N+y,x=Math.max(0,A.Span?.start?.column??0),S=Math.max(0,A.Span?.end?.column??x+1),L=new m.Range(F,x,j,S),z=oa(A.Severity),K=`${A.Code}: ${A.Message}`;return new m.Diagnostic(L,K,z)});r.set(E,C)}}catch{}finally{let v=o.get(p);if(!v)return;let b=v.status==="dirty";v.status="idle",b&&(v.status="running",c(p,u))}}t.subscriptions.push(m.workspace.onDidChangeTextDocument(p=>{let u=p.document.uri.fsPath,d=De.get(se(u));d&&d.isBpm&&d.functionDefinition&&i(u,d),d&&!d.isBpm&&B&&f(u,d)})),t.subscriptions.push(m.workspace.onDidSaveTextDocument(async p=>{let u=se(p.uri.fsPath);if(dn.has(u))return;let d=De.get(u);!d||d.isBpm||!B||!Or()?.autoPush||await m.commands.executeCommand("efx.pushFunction",null,!0)})),t.subscriptions.push(m.workspace.onDidCloseTextDocument(p=>{let u=p.uri.fsPath,d=De.get(se(u));if(d&&d.isBpm){r.delete(p.uri);let v=o.get(u);v?.timer&&clearTimeout(v.timer),o.delete(u)}if(d&&!d.isBpm){n.delete(p.uri);let v=l.get(u);v?.timer&&clearTimeout(v.timer),l.delete(u)}}));let l=new Map;function s(p){return l.has(p)||l.set(p,{status:"idle",timer:null}),l.get(p)}function f(p,u){let d=s(p);if(d.status==="running"||d.status==="dirty"){d.timer&&(clearTimeout(d.timer),d.timer=null),d.status="dirty";return}d.timer&&clearTimeout(d.timer),d.timer=setTimeout(()=>{d.timer=null,d.status="running",g(p,u)},1500)}async function g(p,u){if(l.get(p))try{if(!B||!u.libraryId||!u.functionId)return;let v=m.workspace.textDocuments.find(j=>se(j.uri.fsPath)===se(p)),b=Ir(v?v.getText():Be.readFileSync(p,"utf-8")),w=b.content,y=b.lineOffset,D=Ar.get(u.libraryId),E=D?.EfxFunction?.find(j=>j.FunctionID===u.functionId);if(E){let j=Fe.EpicorClient.extractCode(E.Body).code;if(Tr(j)===Tr(w)){n.set(m.Uri.file(p),[]);return}}let C=E?Fe.EpicorClient.extractCode(E.Body).usings:"",{diagnostics:A,saved:T,newBody:N}=await B.validateFunctionViaWrapper(u.libraryId,u.functionId,w,C,"Utilities","ApplyChangesWithDiagnostics",D);T&&D&&E&&(E.Body=N);let F=m.Uri.file(p);if(!A||A.length===0)n.set(F,[]);else{let j=A.map(x=>{if(typeof x=="object"&&x!==null){let L=Number.isInteger(x.Line)?x.Line:void 0,z=Number.isInteger(x.Column)?x.Column-1:void 0,K=Math.max(0,(x.Span?.start?.line??L??1)-1),Oe=Math.max(K,(x.Span?.end?.line??L??K+1)-1),ne=K+y,O=Oe+y,G=Math.max(0,x.Span?.start?.column??z??0),fe=Math.max(0,x.Span?.end?.column??G+1),Ce=oa(x.Severity),ua=[x.Code,x.Message].filter(Boolean).join(": ");return new m.Diagnostic(new m.Range(ne,G,O,fe),ua||String(x),Ce)}let S=String(x).match(/\((\d+),(\d+)\).*?(error|warning|info)\s+(CS\w+)?:?\s*(.*)/i);if(S){let L=Math.max(0,parseInt(S[1])-1)+y,z=Math.max(0,parseInt(S[2])-1),K=S[3].toLowerCase();return new m.Diagnostic(new m.Range(L,z,L,z+1),`${S[4]?S[4]+": ":""}${S[5]}`,K==="warning"?m.DiagnosticSeverity.Warning:K==="info"?m.DiagnosticSeverity.Information:m.DiagnosticSeverity.Error)}return new m.Diagnostic(new m.Range(0,0,0,1),String(x),m.DiagnosticSeverity.Error)});n.set(F,j)}}catch{}finally{let v=l.get(p);if(!v)return;let b=v.status==="dirty";v.status="idle",b&&(v.status="running",g(p,u))}}t.subscriptions.push(m.commands.registerCommand("efx.bpm.refresh",async()=>{if(!te){m.window.showWarningMessage("BPM: Configure connection first");return}await Ve.refresh()})),t.subscriptions.push(m.commands.registerCommand("efx.bpm.openWidgetPanel",async p=>{if(!te){m.window.showWarningMessage("BPM: Configure connection first");return}let u;if((p?.directive||p instanceof un.BpmDirectiveNode)&&(u=p.directive),!u){m.window.showWarningMessage("BPM: Select a directive");return}Ec(t,te,u)})),t.subscriptions.push(m.commands.registerCommand("efx.bpm.pullDirective",async p=>{if(!te){m.window.showWarningMessage("BPM: Configure connection first");return}let u;if(p&&p.directive)u=p.directive;else if(p instanceof un.BpmDirectiveNode)u=p.directive;else{m.window.showWarningMessage("BPM: Select a directive to pull");return}let{code:d,hasCustomCode:v}=Ze.extractBpmCode(u.Body);if(!v){m.window.showWarningMessage(`BPM: "${u.Name}" has no custom C# code \u2014 it uses widget actions only`);return}await m.window.withProgress({location:m.ProgressLocation.Notification,title:`Pulling BPM: ${u.Name}...`},async()=>{try{let b=u.DirectiveType===1?"Pre":u.DirectiveType===3?"Post":u.DirectiveType===2?"Base":`Type${u.DirectiveType}`,w=Sr(),y=ze.join(w,"_BPM",u.BpMethodCode);Be.mkdirSync(y,{recursive:!0});let D=u.Name.replace(/[^a-zA-Z0-9_\-. ]/g,"_"),E=ze.join(y,`${b}_${D}.cs`),C=[`// BPM Directive: ${u.Name}`,`// Method: ${u.BpMethodCode}`,`// Type: ${b}`,`// Enabled: ${u.IsEnabled}`,`// Group: ${u.DirectiveGroup||"(none)"}`,`// DirectiveID: ${u.DirectiveID}`,`// Pulled: ${new Date().toISOString()}`,"// --------------------------------------------------",""].join(`
`);Be.writeFileSync(E,C+d,"utf-8");let A=await te.getBpmMethod("BO",u.BpMethodCode),T=A?.BpMethod?.[0],N=A?.BpArgument||[],F=T?Ze.buildFunctionDefinition(T,N):null;De.set(se(E),{libraryId:"__BPM__",functionId:u.DirectiveID,bpmMethodCode:u.BpMethodCode,directiveId:u.DirectiveID,directiveType:u.DirectiveType,isBpm:!0,functionDefinition:F});let j=await m.workspace.openTextDocument(E);if(await m.window.showTextDocument(j,m.ViewColumn.One),m.window.showInformationMessage(`BPM: Pulled ${b} directive "${u.Name}"`),F){let x=De.get(se(E));i(E,x)}}catch(b){m.window.showErrorMessage(`BPM Pull failed: ${b.message}`)}})})),t.subscriptions.push(m.commands.registerCommand("efx.bpm.pushDirective",async p=>{if(!te){m.window.showWarningMessage("BPM: Configure connection first");return}let u,d;if(p&&p.directive){let b=p.directive,w=b.DirectiveType===1?"Pre":b.DirectiveType===3?"Post":b.DirectiveType===2?"Base":`Type${b.DirectiveType}`,y=b.Name.replace(/[^a-zA-Z0-9_\-. ]/g,"_"),D=Sr();u=ze.join(D,"_BPM",b.BpMethodCode,`${w}_${y}.cs`),d=De.get(se(u))}else{let b=m.window.activeTextEditor;if(!b){m.window.showWarningMessage("BPM: No active file to push");return}u=b.document.uri.fsPath,d=De.get(se(u))}if(!d||!d.isBpm){m.window.showWarningMessage("BPM: This file is not a pulled BPM directive. Pull it first.");return}if(!u||!Be.existsSync(u)){m.window.showErrorMessage("BPM: File not found. Pull the directive first.");return}await m.window.showWarningMessage(`Push BPM directive to ${d.bpmMethodCode}?`,{modal:!0},"Push")==="Push"&&await m.window.withProgress({location:m.ProgressLocation.Notification,title:"Pushing BPM directive..."},async()=>{try{await na(u);let b=Be.readFileSync(u,"utf-8");b=Bc(b);let w=await te.getBpmMethodRaw("BO",d.bpmMethodCode),y=Ze.updateRawBpmDirective(w,d.directiveId,b);JSON.parse(`{"ds":${y}}`),await te.updateBpmRaw(y),m.window.showInformationMessage(`BPM: Pushed directive to ${d.bpmMethodCode} \u2713`),d.functionDefinition&&i(u,d);let D=d.bpmMethodCode.split(".");D.length>=3&&Ve.invalidateService(D[0].toUpperCase(),D[1],D[2])}catch(b){m.window.showErrorMessage(`BPM Push failed: ${b.message}`)}})}));async function h(p){let u=Le();if(u.length<1)return m.window.showWarningMessage("EFx: No profiles configured. Add profiles via Manage Profiles first."),null;let d=await m.window.showQuickPick(u.map(y=>({label:y.name,description:y.serverUrl,profile:y})),{placeHolder:p,ignoreFocusOut:!0});if(!d)return null;let v;if(d.profile.companies.length===1?v=d.profile.companies[0]:v=await m.window.showQuickPick(d.profile.companies,{placeHolder:`Company on ${d.profile.name}`,ignoreFocusOut:!0}),!v)return null;let b=await t.secrets.get(Q(d.profile.name,"password"));if(!b)return m.window.showErrorMessage(`EFx: No password stored for "${d.profile.name}".`),null;let w=await t.secrets.get(Q(d.profile.name,"apiKey"))||"";return new Dc.KineticMetaFXClient({serverUrl:d.profile.serverUrl,company:v,username:d.profile.username,password:b,apiKey:w})}t.subscriptions.push(m.commands.registerCommand("efx.dev.dumpBpmXaml",async()=>{if(!te){m.window.showErrorMessage("EFx: Not connected \u2014 configure a profile first.");return}let p=await m.window.showInputBox({prompt:"BPM method code",value:"Erp.BO.Labor.Update",ignoreFocusOut:!0});if(!p)return;let u=m.window.createOutputChannel("EFx Widget XAML Dump");u.show(!0),u.appendLine(`Fetching ${p}...`);try{let v=(await te.getBpmMethod("BO",p.trim()))?.BpDirective||[];u.appendLine(`Got ${v.length} directive(s)
`);for(let b of v){let w=b.DirectiveType===1?"Pre":b.DirectiveType===3?"Post":"Base";if(u.appendLine("=".repeat(70)),u.appendLine(`[${w}] "${b.Name}"  enabled=${b.IsEnabled}  group=${b.DirectiveGroup||"(none)"}`),!b.Body){u.appendLine("  (no body)");continue}let y=[...new Set([...b.Body.matchAll(/<(\w+Action)\b/g)].map(C=>C[1]))];u.appendLine(`  Action elements: ${y.join(", ")||"(none found)"}`);let D=0,E=0;for(;;){let C=b.Body.indexOf("CustomCodeAction",D);if(C<0)break;let A='Code="',T=b.Body.indexOf(A,C);if(T<0){D=C+1;continue}let N=T+A.length,F=N;for(;F<b.Body.length&&b.Body[F]!=='"';){if(b.Body[F]==="&"){let S=b.Body.indexOf(";",F);if(S<0)break;F=S+1;continue}F++}let j=b.Body.slice(N,F),x=Ze.xmlDecode(j);u.appendLine(`
  --- CustomCodeAction[${E++}] ---`),u.appendLine(x),D=F+1}E===0&&(u.appendLine(`
  No CustomCodeAction found \u2014 full XAML body:`),u.appendLine(b.Body))}}catch(d){u.appendLine(`ERROR: ${d.message}`)}})),t.subscriptions.push(m.commands.registerCommand("efx.compareLibraries",()=>{Cc.show(t)}))}var Qe={ignoreFocusOut:!0};function Le(){let e=m.workspace.getConfiguration("efx").get("profiles");return Array.isArray(e)?e:[]}async function hn(t){await m.workspace.getConfiguration("efx").update("profiles",t,m.ConfigurationTarget.Global)}function Pe(){return m.workspace.getConfiguration("efx").get("activeProfile")||""}async function gn(t){await m.workspace.getConfiguration("efx").update("activeProfile",t,m.ConfigurationTarget.Global)}function et(){return m.workspace.getConfiguration("efx").get("activeCompany")||""}async function _r(t){await m.workspace.getConfiguration("efx").update("activeCompany",t,m.ConfigurationTarget.Global)}function Or(){let t=Pe();return t&&Le().find(e=>e.name===t)||null}function Q(t,e){return`efx.profile.${t}.${e}`}function kr(){let t=Pe(),e=et(),r=t&&e?`${t} / ${e}`:t||"";Br&&(Br.description=r),Lr&&(Lr.description=r)}async function ia(t){let e=Le(),r=Pe(),n=[];n.push({label:"$(add) New Profile\u2026",description:"Create a new Epicor environment profile",action:"new"});for(let a of e){let i=a.name===r;n.push({label:`${i?"$(check) ":"$(blank) "}${a.name}`,description:a.serverUrl||"",detail:`${a.username||"(no user)"} \u2022 ${(a.companies||[]).join(", ")||"no companies"}`,action:"use",profileName:a.name})}e.length>0&&(n.push({label:"$(edit) Edit Profile\u2026",action:"edit"}),n.push({label:"$(trash) Delete Profile\u2026",action:"delete"}));let o=await m.window.showQuickPick(n,{placeHolder:e.length===0?"No profiles yet \u2014 create your first one":`Select a profile to activate, or manage profiles (${e.length} configured)`,ignoreFocusOut:!0});if(o){if(o.action==="new")await _c(t);else if(o.action==="use")await Mr(t,o.profileName);else if(o.action==="edit"){let a=await aa("Select profile to edit");a&&await Mc(t,a)}else if(o.action==="delete"){let a=await aa("Select profile to delete");a&&await Fc(t,a)}}}async function aa(t){let e=Le();if(e.length===0)return m.window.showInformationMessage("EFx: No profiles configured."),null;let r=await m.window.showQuickPick(e.map(n=>({label:n.name,description:n.serverUrl||"",detail:n.username||"",profileName:n.name})),{placeHolder:t,ignoreFocusOut:!0});return r?r.profileName:null}async function _c(t){let e={name:"",serverUrl:"",username:"",companies:[]};if(!await sa(t,e,!0))return;let n=Le();if(n.some(o=>o.name===e.name)){m.window.showErrorMessage(`EFx: Profile "${e.name}" already exists.`);return}n.push(e),await hn(n),n.length===1||await kc(e.name)?await Mr(t,e.name):m.window.showInformationMessage(`EFx: Profile "${e.name}" saved.`)}async function kc(t){let e=await m.window.showQuickPick([{label:"Activate now",value:!0},{label:"Save only",value:!1}],{placeHolder:`Activate profile "${t}"?`,ignoreFocusOut:!0});return e?e.value:!1}async function Mc(t,e){let r=Le(),n=r.findIndex(c=>c.name===e);if(n<0)return;let o=JSON.parse(JSON.stringify(r[n])),a=o.name;if(await sa(t,o,!1)){if(o.name!==a){let c=await t.secrets.get(Q(a,"password")),l=await t.secrets.get(Q(a,"apiKey"));c&&await t.secrets.store(Q(o.name,"password"),c),l&&await t.secrets.store(Q(o.name,"apiKey"),l),await t.secrets.delete(Q(a,"password")),await t.secrets.delete(Q(a,"apiKey")),Pe()===a&&await gn(o.name)}r[n]=o,await hn(r),Pe()===o.name?await Mr(t,o.name):m.window.showInformationMessage(`EFx: Profile "${o.name}" updated.`)}}async function Fc(t,e){if(await m.window.showWarningMessage(`Delete profile "${e}"? This will remove its stored credentials.`,{modal:!0},"Delete")!=="Delete")return;let n=Le().filter(o=>o.name!==e);await hn(n),await t.secrets.delete(Q(e,"password")),await t.secrets.delete(Q(e,"apiKey")),Pe()===e&&(await gn(""),await _r(""),B=null,te=null,q.setClient(null),Ve.setClient(null),kr()),m.window.showInformationMessage(`EFx: Profile "${e}" deleted.`)}async function sa(t,e,r){let n=await m.window.showInputBox({...Qe,prompt:r?"Profile name (e.g. Dev, Prod, Pilot)":"Profile name",value:e.name,validateInput:h=>!h||!h.trim()?"Name is required":/^[A-Za-z0-9_\-. ]+$/.test(h)?null:"Use letters, numbers, space, dash, dot, underscore"});if(n===void 0)return!1;e.name=n.trim();let o=await m.window.showInputBox({...Qe,prompt:"Epicor Server URL",value:e.serverUrl,placeHolder:"https://your-epicor-server/your-app",validateInput:h=>!h||!h.trim()?"Server URL is required":null});if(o===void 0)return!1;e.serverUrl=o.trim();let a=await m.window.showInputBox({...Qe,prompt:"Username",value:e.username,validateInput:h=>!h||!h.trim()?"Username is required":null});if(a===void 0)return!1;e.username=a.trim();let i=r?null:await t.secrets.get(Q(e.name,"password")),c=r;if(!r){let h=await m.window.showQuickPick([{label:"Keep existing password",value:!1},{label:"Change password",value:!0}],{placeHolder:"Password",ignoreFocusOut:!0});if(!h)return!1;c=h.value}if(c){let h=await m.window.showInputBox({...Qe,prompt:`Password for ${e.username}`,password:!0,validateInput:p=>p?null:"Password is required"});if(h===void 0)return!1;await t.secrets.store(Q(e.name,"password"),h),i=h}let l=r?"":await t.secrets.get(Q(e.name,"apiKey"))||"",s=r;if(!r){let h=await m.window.showQuickPick([{label:"Keep existing API key",value:!1},{label:"Change API key",value:!0},{label:"Clear API key",value:"clear"}],{placeHolder:"API Key",ignoreFocusOut:!0});if(!h)return!1;h.value==="clear"?(await t.secrets.delete(Q(e.name,"apiKey")),l="",s=!1):s=h.value===!0}if(s){let h=await m.window.showInputBox({...Qe,prompt:"API Key (leave blank if not required)",password:!0,value:""});if(h===void 0)return!1;await t.secrets.store(Q(e.name,"apiKey"),h||""),l=h||""}let f=await Pc(t,e,i,l);if(f===void 0)return!1;e.companies=f;let g=await m.window.showQuickPick([{label:"No \u2014 push manually",value:!1},{label:"Yes \u2014 auto-push on file save",value:!0}],{placeHolder:"Auto-push changes to Epicor when you save a .cs file?",ignoreFocusOut:!0});return g===void 0?!1:(e.autoPush=g.value,!0)}async function Pc(t,e,r,n){let o=!e.companies||e.companies.length===0,a;if(o)a="fetch";else{let i=[],c=Pe()===e.name,l=et();c&&e.companies.length>1&&i.push({label:"$(arrow-right) Switch active company",description:`currently ${l||"(none)"}`,value:"switch"}),i.push({label:"$(check) Keep current selection",description:(e.companies||[]).join(", "),value:"keep"}),i.push({label:"$(refresh) Re-fetch from server",description:"Discover companies again via UserFile",value:"fetch"}),i.push({label:"$(list-selection) Pick from current list",description:"Multi-select among already saved companies",value:"pick"}),i.push({label:"$(edit) Enter manually",description:"Comma-separated list",value:"manual"});let s=await m.window.showQuickPick(i,{placeHolder:"Companies",ignoreFocusOut:!0});if(!s)return;if(a=s.value,a==="keep")return e.companies;if(a==="switch"){let f=await m.window.showQuickPick(e.companies.map(g=>({label:`${g===l?"$(check) ":"$(blank) "}${g}`,company:g})),{placeHolder:`Active company (profile: ${e.name})`,ignoreFocusOut:!0});return f?(f.company!==l&&await la(t,f.company),e.companies):void 0}}if(a==="fetch"){let i=await Rc(e,r,n);return i===void 0?void 0:i}return a==="pick"?await ca(e.companies,e.companies):await Nr(e.companies)}async function Rc(t,e,r){if(!e)return m.window.showWarningMessage("EFx: Cannot fetch companies \u2014 no password available. Falling back to manual entry."),await Nr(t.companies);let n=t.companies&&t.companies[0]||"",o=await m.window.showInputBox({...Qe,prompt:"Default company (used to authenticate the discovery call)",placeHolder:"your default company code",value:n,validateInput:s=>!s||!s.trim()?"Default company is required":null});if(o===void 0)return;let a=o.trim(),i;try{i=await m.window.withProgress({location:m.ProgressLocation.Notification,title:`Fetching companies for ${t.username}...`},async()=>await new Fe.EpicorClient({serverUrl:t.serverUrl,company:a,username:t.username,password:e,apiKey:r||""}).getUserCompanies())}catch(s){return await m.window.showErrorMessage(`EFx: Could not fetch companies \u2014 ${s.message}`,{modal:!1},"Enter Manually","Cancel")!=="Enter Manually"?void 0:await Nr([a])}if(!i||i.length===0)return await m.window.showWarningMessage(`EFx: Server returned no companies for user "${t.username}". Enter manually?`,"Enter Manually","Cancel")!=="Enter Manually"?void 0:await Nr([a]);let c=Array.from(new Set([a,...i]));return await ca(c,c)}async function ca(t,e){let r=new Set(e||[]),n=t.map(a=>({label:a,picked:r.has(a)})),o=await m.window.showQuickPick(n,{canPickMany:!0,placeHolder:"Select companies to include in this profile",ignoreFocusOut:!0});if(o){if(o.length===0){m.window.showWarningMessage("EFx: At least one company is required.");return}return o.map(a=>a.label)}}async function Nr(t){let e=await m.window.showInputBox({...Qe,prompt:"Companies (comma-separated)",value:(t||[]).join(", "),validateInput:r=>!r||!r.trim()||r.split(",").map(o=>o.trim()).filter(Boolean).length===0?"At least one company is required":null});if(e!==void 0)return e.split(",").map(r=>r.trim()).filter(Boolean)}async function Mr(t,e){let r=Le().find(i=>i.name===e);if(!r){m.window.showErrorMessage(`EFx: Profile "${e}" not found.`);return}let n=await t.secrets.get(Q(e,"password"));if(!n){m.window.showErrorMessage(`EFx: No password stored for "${e}". Edit the profile to set one.`);return}let o=await t.secrets.get(Q(e,"apiKey"))||"",a=et();r.companies.includes(a)||(a=r.companies[0]),await gn(e),await _r(a),B=new Fe.EpicorClient({serverUrl:r.serverUrl,company:a,username:r.username,password:n,apiKey:o}),q.setClient(B),te=new Ze.BpmClient(B),Ve.setClient(te),await q.refresh(),kr(),m.window.showInformationMessage(`EFx: Active profile "${e}" (company ${a})`)}async function $c(t){let e=Le();if(e.length===0){await m.window.showInformationMessage("EFx: No profiles configured. Create one?","Create Profile")==="Create Profile"&&await ia(t);return}let r=Pe(),n=await m.window.showQuickPick(e.map(o=>({label:`${o.name===r?"$(check) ":"$(blank) "}${o.name}`,description:o.serverUrl||"",profileName:o.name})),{placeHolder:"Switch to profile",ignoreFocusOut:!0});n&&await Mr(t,n.profileName)}async function Uc(t){let e=Or();if(!e){m.window.showWarningMessage("EFx: No active profile. Manage Profiles first.");return}if(!e.companies||e.companies.length===0){m.window.showWarningMessage(`EFx: Profile "${e.name}" has no companies configured. Edit the profile to add some.`);return}if(e.companies.length===1){m.window.showInformationMessage(`EFx: Only one company in profile "${e.name}" (${e.companies[0]}).`);return}let r=et(),n=await m.window.showQuickPick(e.companies.map(o=>({label:`${o===r?"$(check) ":"$(blank) "}${o}`,company:o})),{placeHolder:`Active company (profile: ${e.name})`,ignoreFocusOut:!0});n&&n.company!==r&&await la(t,n.company)}async function la(t,e){let r=Or();if(!r)return;if(!r.companies.includes(e)){m.window.showErrorMessage(`EFx: "${e}" is not in profile "${r.name}".`);return}let n=await t.secrets.get(Q(r.name,"password"));if(!n){m.window.showErrorMessage(`EFx: No password stored for "${r.name}".`);return}let o=await t.secrets.get(Q(r.name,"apiKey"))||"";await _r(e),B=new Fe.EpicorClient({serverUrl:r.serverUrl,company:e,username:r.username,password:n,apiKey:o}),q.setClient(B),te=new Ze.BpmClient(B),Ve.setClient(te),await q.refresh(),kr(),m.window.showInformationMessage(`EFx: Active company \u2192 ${e}`)}function Sr(){let t=m.workspace.workspaceFolders;if(t&&t.length>0)return ze.join(t[0].uri.fsPath,".efx");let e=process.env.HOME||process.env.USERPROFILE||"/tmp";return ze.join(e,".efx")}async function qc(t){let e=Pe();if(!e)return;let r=Le().find(i=>i.name===e);if(!r)return;let n=await t.secrets.get(Q(e,"password"));if(!n)return;let o=await t.secrets.get(Q(e,"apiKey"))||"",a=et();r.companies.includes(a)||(a=r.companies[0]||""),a&&(a!==et()&&await _r(a),B=new Fe.EpicorClient({serverUrl:r.serverUrl,company:a,username:r.username,password:n,apiKey:o}),q.setClient(B),te=new Ze.BpmClient(B),Ve.setClient(te))}function jc(){}
