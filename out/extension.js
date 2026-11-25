"use strict";var de=(t,e)=>()=>{try{return e||t((e={exports:{}}).exports,e),e.exports}catch(n){throw e=0,n}};var To=de((sg,Zi)=>{"use strict";async function Rl(t,e){try{return await e(await t.authHeaders())}catch(n){if(n.status!==401||!t.retry401)throw n}try{return await e(await t.authHeaders({retry:!0}))}catch(n){throw n.status===401?Object.assign(new Error("Epicor rejected the Entra token (HTTP 401) \u2014 run EFx: Sign In."),{code:"login-required",status:401}):n}}Zi.exports={withAuthRetry:Rl}});var Dr=de(st=>{"use strict";var Ul=st&&st.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),ql=st&&st.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),ns=st&&st.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&Ul(n,e,r[o]);return ql(n,e),n}})();Object.defineProperty(st,"__esModule",{value:!0});st.EpicorClient=void 0;var es=ns(require("https")),ts=ns(require("http")),{withAuthRetry:jl}=To(),No=class t{constructor(e){this.config=e}_send(e){return jl(this.config,n=>e({"Content-Type":"application/json",...n}))}getDesignerUrl(e){return`${this.config.serverUrl.replace(/\/$/,"")}/api/v2/odata/${this.config.company}/Ice.LIB.EfxLibraryDesignerSvc/${e}`}getEfxUrl(e,n,r,o=!1){let i=this.config.serverUrl.replace(/\/$/,""),s=r||this.config.company;return o?`${i}/api/v2/efx/staging/${s}/${e}/${n}`:`${i}/api/v2/efx/${s}/${e}/${n}`}async request(e,n){let r=await this.requestRaw(e,typeof n=="string"?n:JSON.stringify(n));try{return r?JSON.parse(r):{}}catch{return r}}async requestGet(e){return this._send(n=>this._requestGetWith(e,n))}_requestGetWith(e,n){return new Promise((r,o)=>{let i=new URL(e),s=i.protocol==="https:",a=s?es:ts,c={hostname:i.hostname,port:i.port||(s?443:80),path:i.pathname+i.search,method:"GET",headers:n,rejectUnauthorized:!1},l=a.request(c,u=>{let m="";u.on("data",g=>{m+=g}),u.on("end",()=>{if(u.statusCode&&u.statusCode>=200&&u.statusCode<300)try{r(m?JSON.parse(m):{})}catch{r(m)}else{let g=`HTTP ${u.statusCode}`;try{let E=JSON.parse(m);g=E.ErrorMessage||E.error?.message||JSON.stringify(E,null,2)}catch{g=m||g}o(Object.assign(new Error(g),{status:u.statusCode}))}})});l.on("error",o),l.end()})}async getUserCompanies(){let e=this.config.serverUrl.replace(/\/$/,""),n=encodeURIComponent(this.config.username),r=`${e}/api/v2/odata/${this.config.company}/Ice.BO.UserFileSvc/UserFiles('${n}')/UserComps?$select=Company,Name`,o=await this.requestGet(r);return(Array.isArray(o?.value)?o.value:[]).map(s=>s.Company).filter(Boolean)}async requestRaw(e,n){return this._send(r=>this._requestRawWith(e,n,r))}_requestRawWith(e,n,r){return new Promise((o,i)=>{let s=new URL(e),a=s.protocol==="https:",c=a?es:ts,l={hostname:s.hostname,port:s.port||(a?443:80),path:s.pathname+s.search,method:"POST",headers:{...r,"Content-Length":Buffer.byteLength(n)},rejectUnauthorized:!1},u=c.request(l,m=>{let g="";m.on("data",E=>{g+=E}),m.on("end",()=>{if(m.statusCode&&m.statusCode>=200&&m.statusCode<300)o(g);else{let E=`HTTP ${m.statusCode}`;try{let C=JSON.parse(g);E=C.ErrorMessage||C.error?.message||JSON.stringify(C,null,2)}catch{E=g||E}console.error("EFx HTTP failure status:",m.statusCode),console.error("EFx HTTP failure body:",g),i(Object.assign(new Error(E),{status:m.statusCode}))}})});u.on("error",i),u.write(n),u.end()})}async getLibraryList(){return(await this.request(this.getDesignerUrl("GetLibraryList"),{options:{kind:0,startsWith:"",rollOutMode:2,status:0}})).returnObj?.EfxLibraryList||[]}async getLibrary(e){return(await this.request(this.getDesignerUrl("GetLibrary"),{libraryId:e})).returnObj}async getDefaults(){return(await this.request(this.getDesignerUrl("GetDefaults"),{})).returnObj}async getDefaultsRaw(){let e=await this.requestRaw(this.getDesignerUrl("GetDefaults"),"{}"),n=e.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);return n?n[1]:e}async getLibraryRaw(e){let n=await this.requestRaw(this.getDesignerUrl("GetLibrary"),JSON.stringify({libraryId:e})),r=n.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);return r?r[1]:n}async applyChangesRaw(e){let n=`{"libraryTableset":${e}}`,r=await this.requestRaw(this.getDesignerUrl("ApplyChangesWithDiagnostics"),n);try{let o=JSON.parse(r);return{diagnostics:o.returnObj?.diagnostics||o.parameters?.diagnostics||[]}}catch{return{diagnostics:[]}}}async applyChanges(e){let n=await this.request(this.getDesignerUrl("ApplyChangesWithDiagnostics"),{libraryTableset:e});return{tableset:n.returnObj?.libraryTableset||n.parameters?.libraryTableset||e,diagnostics:n.returnObj?.diagnostics||n.parameters?.diagnostics||[]}}async saveFunctionBody(e,n,r){let o=await this.getLibraryRaw(e),i=this._patchFunctionBody(o,n,r,"U"),{diagnostics:s}=await this.applyChangesRaw(i),a=(s||[]).filter(c=>typeof c=="object"?(c.Severity??2)>=2:/\berror\b/i.test(String(c)));if(a.length)throw new Error(a.map(c=>typeof c=="object"?c.Message||JSON.stringify(c):String(c)).join("; "));return{diagnostics:s||[]}}async promoteToProduction(e){await this.request(this.getDesignerUrl("PromoteToProduction"),{libraryID:e})}async regenerateLibrary(e){let n=await this.request(this.getDesignerUrl("RegenerateLibrary"),{libraryID:e});return console.log("EFx Regenerate raw result:",JSON.stringify(n,null,2)),{errors:n.returnObj?.BOUpdError||n.returnObj?.BOUpdErrorList||n.returnObj?.BOUpdErrorTableset?.BOUpdError||n.parameters?.result?.BOUpdError||n.parameters?.result?.BOUpdErrorList||n.parameters?.result?.BOUpdErrorTableset?.BOUpdError||n.parameters?.errors||n.errors||[],raw:n}}async demoteFromProduction(e){await this.request(this.getDesignerUrl("DemoteFromProduction"),{libraryID:e})}async lockLibrary(e){await this.request(this.getDesignerUrl("LockLibrary"),{libraryID:e})}async releaseLibrary(e){await this.request(this.getDesignerUrl("ReleaseLibrary"),{libraryID:e})}async validateFunctionRaw(e,n,r,o){let i=await this.getLibraryRaw(e),s=t.packCode(r,o||""),c=`{"libraryTableset":${this._patchFunctionBody(i,n,s,"U")}}`,l=await this.requestRaw(this.getDesignerUrl("ApplyChangesWithDiagnostics"),c);try{let u=JSON.parse(l),m=u.returnObj?.diagnostics||u.parameters?.diagnostics||[],g=m.some(E=>typeof E=="object"?(E.Severity??2)>=2:/\berror\b/i.test(String(E)));return{diagnostics:m,saved:!g,newBody:s}}catch{return{diagnostics:[],saved:!1,newBody:s}}}async validateFunctionViaWrapper(e,n,r,o,i="Utilities",s="ApplyChangesWithDiagnostics",a=null){let c=a;if((!c?.EfxLibrary?.[0]||!c.EfxFunction?.some(C=>C.FunctionID===n))&&(c=await this.getLibrary(e)),!c?.EfxLibrary?.[0]){let C=`Library '${e}' not found`;return{saved:!1,diagnostics:[{Severity:2,Message:C}],errors:[C],outResult:"",outMsg:"",raw:null,newBody:null}}let l=c.EfxFunction?.find(C=>C.FunctionID===n);if(!l){let C=`Function '${n}' not found in library '${e}'`;return{saved:!1,diagnostics:[{Severity:2,Message:C}],errors:[C],outResult:"",outMsg:"",raw:null,newBody:null}}let u={...c.EfxLibrary[0],RowMod:"U"},m={...l,Code:r,Usings:o||"",Body:"",RowMod:"U"},g={EfxLibrary:[u],EfxFunction:[m]},E;try{E=await this.request(this.getEfxUrl(i,s),{inFunctionID:n,inDS:g})}catch(C){if(/HTTP 404/.test(C.message))try{let A=await this.validateFunctionRaw(e,n,r,o);return{saved:A.saved,diagnostics:A.diagnostics||[],errors:A.saved?[]:A.diagnostics?.map(N=>N.Message||String(N))||["Save failed"],outResult:A.saved?"Success":"",outMsg:A.saved?"Saved Successfully":"Save failed",raw:null,newBody:A.saved?A.newBody:null}}catch(A){let N=A.message||String(A);return{saved:!1,diagnostics:[{Severity:2,Message:N}],errors:[N],outResult:"",outMsg:N,raw:null,newBody:null}}throw C}return this._parseWrapperOutput(E,r,o)}_parseWrapperOutput(e,n,r){let o=e?.outMsg??e?.parameters?.outMsg??"",i=e?.outResult??e?.parameters?.outResult??"",s=e?.outSuccess??e?.parameters?.outSuccess??!1,a=[],c=new Set,l=v=>{let x=v.trim();x&&!c.has(x)&&(c.add(x),a.push(x))};for(let v of String(o).split(/\r?\n/)){let x=v.match(/^Error:\s*(.+)$/i);if(x){l(x[1]);continue}/\(\d+,\d+\):\s*(?:error|warning)\s+CS/i.test(v)&&l(v)}let u=a.filter(v=>!/\(\d+,\d+\):\s*warning\s+CS/i.test(v)),m=s===!0||u.length===0&&/Saved Successfully/i.test(o),g=a.map(v=>{let x=v.match(/\((\d+),(\d+)\):\s*(?:error|warning)/i)||v.match(/\((\d+),(\d+)\)/)||v.match(/\bline\s+(\d+)/i);return{Severity:/\(\d+,\d+\):\s*warning\s+CS/i.test(v)?1:2,Message:v,Line:x?parseInt(x[1],10):void 0,Column:x&&x[2]!==void 0?parseInt(x[2],10):void 0}}),E=String(n).split(/\r?\n/),C=new Map;for(let v of g){if(!v.Line||!v.Column)continue;let x=v.Message.match(/'([^']+)'/);if(!(!x||!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(x[1]))){for(let k=0;k<E.length;k++)if(E[k].slice(v.Column-1).startsWith(x[1])){let L=v.Line-(k+1);L>=0&&C.set(L,(C.get(L)||0)+1)}}}let A=0,N=0,B=!1;for(let[v,x]of C)x>N?(N=x,A=v,B=!1):x===N&&v!==A&&(B=!0);if(N>0&&!B&&A>0)for(let v of g)v.Line&&(v.Line=Math.max(1,v.Line-A));return{saved:m,diagnostics:g,errors:a,outResult:i,outMsg:o,raw:e,newBody:t.packCode(n,r||"")}}async applyFunctionsViaWrapper(e,n,r,o="Utilities",i="ApplyChangesWithDiagnostics"){let s={...r.EfxLibrary[0],RowMod:"U"},a=n.map(B=>{let v=r.EfxFunction.find(x=>x.FunctionID===B.functionId);if(!v)throw new Error(`Function '${B.functionId}' not found in library '${e}'`);return{...v,Code:B.code,Usings:B.usings||"",Body:"",RowMod:"U"}}),c=await this.request(this.getEfxUrl(o,i),{inFunctionID:"",inDS:{EfxLibrary:[s],EfxFunction:a}}),l=c?.outMsg??c?.parameters?.outMsg??"",u=c?.outResult??c?.parameters?.outResult??"";if(/FunctionID '' not found in inDS\.EfxFunction/.test(l))return{saved:!1,perFunction:{},outMsg:l,outResult:u,oldWrapper:!0};let m=String(l).split(/\r?\n/),g=n.map(B=>B.functionId),E=B=>{let v=B.match(/(?:^|[\s:\\/])([A-Za-z_][A-Za-z0-9_]*)\.cs\(\d+,\d+\)/);return v&&g.includes(v[1])?v[1]:null},C=m.filter(B=>/^(Error|Unexpected|Message|Inner):/i.test(B)&&!E(B)),A={};for(let B of n){let x=[...m.filter(L=>E(L)===B.functionId),...C,.../Saved Successfully/i.test(l)?["Saved Successfully"]:[]].join(`
`),k=c?.outSuccess??c?.parameters?.outSuccess??!1;A[B.functionId]=this._parseWrapperOutput({outMsg:x,outResult:u,outSuccess:k},B.code,B.usings)}return{saved:(c?.outSuccess??c?.parameters?.outSuccess)===!0||/Saved Successfully/i.test(l)&&!m.some(B=>/^Error:/i.test(B)),perFunction:A,outMsg:l,outResult:u,oldWrapper:!1}}_patchFunctionBody(e,n,r,o){let i=`"FunctionID":${JSON.stringify(n)}`,s=JSON.stringify(r),a=this._setParentLibraryRowMod(e,o),c=a.indexOf('"EfxFunction":[');if(c<0)throw new Error("EfxFunction array not found");let u=a.indexOf("[",c)+1;for(;u<a.length;){let m=a.indexOf("{",u);if(m<0)break;let g=this._findJsonObjectEnd(a,m,"EfxFunction row"),E=a.slice(m,g+1);if(!E.includes(i)){u=g+1;continue}let C=this._replaceJsonStringValue(E,"Body",s);return C=this._replaceJsonStringValue(C,"RowMod",JSON.stringify(o)),a.slice(0,m)+C+a.slice(g+1)}throw new Error(`Function ${n} not found in raw tableset`)}_setParentLibraryRowMod(e,n){let r=e.indexOf('"EfxLibrary":[');if(r<0)throw new Error("EfxLibrary array not found");let o=e.indexOf("[",r),i=e.indexOf("{",o);if(i<0)throw new Error("No EfxLibrary row found");let s=this._findJsonObjectEnd(e,i,"EfxLibrary row"),a=e.slice(i,s+1),c=this._replaceJsonStringValue(a,"RowMod",JSON.stringify(n));return e.slice(0,i)+c+e.slice(s+1)}_findJsonObjectEnd(e,n,r){let o=0,i=!1,s=!1;for(let a=n;a<e.length;a++){let c=e[a];if(i){if(s){s=!1;continue}if(c==="\\"){s=!0;continue}c==='"'&&(i=!1);continue}if(c==='"'){i=!0;continue}if(c==="{")o++;else if(c==="}"&&(o--,o===0))return a}throw new Error(`Malformed ${r}`)}_replaceJsonStringValue(e,n,r){let o=`"${n}":`,i=e.lastIndexOf(o);if(i<0)throw new Error(`${n} not found in object`);let s=i+o.length;for(;/\s/.test(e[s]||"");)s++;if(e[s]!=='"')throw new Error(`${n} value is not a JSON string`);let a=s+1,c=!1;for(;a<e.length;a++){let l=e[a];if(c){c=!1;continue}if(l==="\\"){c=!0;continue}if(l==='"')break}return e.slice(0,s)+r+e.slice(a+1)}async executeFunction(e,n,r,o,i=!1){let s=this.getEfxUrl(e,n,o,i);return this.request(s,r)}async saveSignatures(e,n,r){let o=await this.getLibraryRaw(e),i=JSON.parse(o);if(!i?.EfxLibrary?.[0])throw new Error(`Library '${e}' not found`);if(!i.EfxFunction?.find(x=>x.FunctionID===n))throw new Error(`Function '${n}' not found in library '${e}'`);let s=(i.EfxFunctionSignature||[]).filter(x=>x.FunctionID===n),a=(i.EfxFunctionSignature||[]).reduce((x,k)=>Math.max(x,k.ParameterID||0),0)+1,l=o.indexOf('"EfxFunctionSignature":[');if(l<0)throw new Error("EfxFunctionSignature array not found");let u=o.indexOf("[",l),m=this._rawFindClose(o,u,"[","]"),g=[],E=u+1;for(;E<m;){let x=o.indexOf("{",E);if(x<0||x>=m)break;let k=this._rawFindClose(o,x,"{","}");if(k<0||k>=m)break;let L=o.slice(x,k+1),h=null;try{h=JSON.parse(L)}catch{}g.push({objStr:L,sigData:h}),E=k+1}let C=[];for(let{objStr:x,sigData:k}of g)(!k||k.FunctionID!==n)&&C.push(x);for(let x of r){let k=s.find(L=>L.ArgumentName===x.ArgumentName&&!!L.Response==!!x.Response);if(k){let{objStr:L}=g.find(d=>d.sigData?.ArgumentName===k.ArgumentName&&!!d.sigData?.Response==!!k.Response)||{};if(!L)continue;if(!(k.DataType!==(x.DataType??k.DataType)||k.DataTypeInfo!==(x.DataTypeInfo??k.DataTypeInfo)||!!k.Optional!=!!(x.Optional??k.Optional)||k.DefaultValue!==(x.DefaultValue??k.DefaultValue)||k.Order!==(x.Order??k.Order)))C.push(L);else{let d=L;d=this._rawSetStringProp(d,"DataType",x.DataType??k.DataType),d=this._rawSetStringProp(d,"DataTypeInfo",x.DataTypeInfo??k.DataTypeInfo??""),d=this._rawSetBoolProp(d,"Optional",x.Optional??k.Optional??!1),d=this._rawSetStringProp(d,"DefaultValue",x.DefaultValue??k.DefaultValue??""),d=this._rawSetIntProp(d,"Order",x.Order??k.Order),d=this._rawSetStringProp(d,"RowMod","U"),C.push(L),C.push(d)}}else{let L={LibraryID:e,FunctionID:n,Response:!!x.Response,ParameterID:a++,ArgumentName:x.ArgumentName,Order:x.Order??C.length,DataType:x.DataType||"System.String",DataTypeInfo:x.DataTypeInfo||"",Optional:x.Optional??!1,DefaultValue:x.DefaultValue??"",SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",BitFlag:0,RowMod:"A"};C.push(JSON.stringify(L))}}for(let x of s)if(!r.some(L=>L.ArgumentName===x.ArgumentName&&!!L.Response==!!x.Response)){let{objStr:L}=g.find(d=>d.sigData?.ArgumentName===x.ArgumentName&&!!d.sigData?.Response==!!x.Response)||{};if(!L)continue;let h=this._rawSetStringProp(L,"RowMod","D");C.push(L),C.push(h)}let A=o.slice(0,u+1)+C.join(",")+o.slice(m);A=this._setParentLibraryRowMod(A,"U"),A=this._setEfxFunctionRowMod(A,n,"U"),JSON.parse(A);let N=await this.applyChangesRaw(A),B=(N.diagnostics||[]).some(x=>typeof x=="object"?(x.Severity??2)>=2:/\berror\b/i.test(String(x))),v=r.map((x,k)=>{let L=s.find(h=>h.ArgumentName===x.ArgumentName&&!!h.Response==!!x.Response);return L?{...L,DataType:x.DataType??L.DataType,DataTypeInfo:x.DataTypeInfo??L.DataTypeInfo??"",Optional:x.Optional??L.Optional??!1,DefaultValue:x.DefaultValue??L.DefaultValue??"",Order:x.Order??k}:{LibraryID:e,FunctionID:n,Response:!!x.Response,ArgumentName:x.ArgumentName,DataType:x.DataType||"System.String",DataTypeInfo:x.DataTypeInfo||"",Optional:x.Optional??!1,DefaultValue:x.DefaultValue??"",Order:x.Order??k}});return{saved:!B,diagnostics:N.diagnostics||[],updatedSigs:v}}_rawFindClose(e,n,r,o){let i=0,s=!1,a=!1;for(let c=n;c<e.length;c++){let l=e[c];if(s){if(a){a=!1;continue}if(l==="\\"){a=!0;continue}l==='"'&&(s=!1);continue}if(l==='"'){s=!0;continue}if(l===r)i++;else if(l===o&&(i--,i===0))return c}return-1}_rawSetStringProp(e,n,r){let o=`"${n}":`,i=e.indexOf(o);if(i<0)throw new Error(`Property "${n}" not found`);let s=i+o.length;for(;e[s]===" ";)s++;let a;if(e[s]==='"'){a=s+1;let c=!1;for(;a<e.length;a++){let l=e[a];if(c){c=!1;continue}if(l==="\\"){c=!0;continue}if(l==='"'){a++;break}}}else for(a=s;a<e.length&&e[a]!==","&&e[a]!=="}"&&e[a]!==" "&&e[a]!==`
`&&e[a]!=="\r";)a++;return e.slice(0,s)+JSON.stringify(r)+e.slice(a)}_rawSetBoolProp(e,n,r){let o=`"${n}":`,i=e.indexOf(o);if(i<0)throw new Error(`Property "${n}" not found`);let s=i+o.length;for(;e[s]===" ";)s++;let a=s;for(;a<e.length&&e[a]!==","&&e[a]!=="}"&&e[a]!==" ";)a++;return e.slice(0,s)+(r?"true":"false")+e.slice(a)}_rawSetIntProp(e,n,r){let o=`"${n}":`,i=e.indexOf(o);if(i<0)throw new Error(`Property "${n}" not found`);let s=i+o.length;for(;e[s]===" ";)s++;let a=s;for(;a<e.length&&e[a]!==","&&e[a]!=="}"&&e[a]!==" ";)a++;return e.slice(0,s)+String(Math.floor(r))+e.slice(a)}_setEfxFunctionRowMod(e,n,r){let o=`"FunctionID":${JSON.stringify(n)}`,i=e.indexOf('"EfxFunction":[');if(i<0)throw new Error("EfxFunction array not found");let a=e.indexOf("[",i)+1;for(;a<e.length;){let c=e.indexOf("{",a);if(c<0)break;let l=this._findJsonObjectEnd(e,c,"EfxFunction row"),u=e.slice(c,l+1);if(u.includes(o)){let m=this._replaceJsonStringValue(u,"RowMod",JSON.stringify(r));return e.slice(0,c)+m+e.slice(l+1)}a=l+1}throw new Error(`EfxFunction row for '${n}' not found`)}static extractCode(e){try{let n=JSON.parse(e);return{code:n.Code||"",usings:n.Usings||""}}catch{return{code:e,usings:""}}}static packCode(e,n=""){return JSON.stringify({Code:e,Usings:n})}};st.EpicorClient=No});var Po=de((cg,gs)=>{"use strict";var Cr=require("fs"),$o=require("path"),Hl=require("https"),Wl=require("http"),is=require("crypto"),{spawn:zl}=require("child_process"),{StringDecoder:Vl}=require("string_decoder"),Kl=600*1e3,rs="homepage__erp.token.auth",Gl=300*1e3,Pt=t=>new Promise(e=>setTimeout(e,t));function Yl(){return process.env.EFX_PREVIEW_BROWSER?[process.env.EFX_PREVIEW_BROWSER]:process.platform==="darwin"?["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome","/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge","/Applications/Chromium.app/Contents/MacOS/Chromium"]:process.platform==="win32"?[process.env.PROGRAMFILES,process.env["PROGRAMFILES(X86)"],process.env.LOCALAPPDATA].filter(Boolean).flatMap(e=>[$o.join(e,"Google","Chrome","Application","chrome.exe"),$o.join(e,"Microsoft","Edge","Application","msedge.exe")]):["/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium","/usr/bin/chromium-browser","/usr/bin/microsoft-edge"]}function Jl(){let t=Yl(),e=t.find(n=>{try{return Cr.statSync(n).isFile()}catch{return!1}});if(!e)throw new Error(`No Chrome, Edge or Chromium found for previews. Tried: ${t.join(", ")}. Set EFX_PREVIEW_BROWSER to the browser executable.`);return e}var Lo=class{constructor(e){this.nextId=1,this.pending=new Map,this.listeners=new Set,this.buf="",this.decoder=new Vl("utf8"),this.toBrowser=e.stdio[3],this.dead=null,e.stdio[4].on("data",n=>this.onData(n)),this.toBrowser.on("error",n=>this.fail(n)),e.stdio[4].on("error",n=>this.fail(n)),e.on("error",n=>this.fail(n)),e.on("exit",()=>this.fail(new Error("Preview browser exited")))}fail(e){this.dead||(this.dead=e);for(let n of this.pending.values())n.reject(new Error(`Browser connection lost: ${e.message}`));this.pending.clear()}onData(e){this.buf+=this.decoder.write(e);let n;for(;(n=this.buf.indexOf("\0"))>=0;){let r=this.buf.slice(0,n);this.buf=this.buf.slice(n+1);let o;try{o=JSON.parse(r)}catch{continue}let i=o.id&&this.pending.get(o.id);if(i)this.pending.delete(o.id),o.error?i.reject(new Error(o.error.message)):i.resolve(o.result);else if(o.method)for(let s of this.listeners)s(o)}}send(e,n={},r){if(this.dead)return Promise.reject(new Error(`Browser connection lost: ${this.dead.message}`));let o=this.nextId++;return new Promise((i,s)=>{this.pending.set(o,{resolve:i,reject:s}),this.toBrowser.write(JSON.stringify({id:o,method:e,params:n,...r?{sessionId:r}:{}})+"\0",a=>{a&&this.pending.has(o)&&(this.pending.delete(o),s(new Error(`Browser connection lost: ${a.message}`)))})})}on(e){return this.listeners.add(e),()=>this.listeners.delete(e)}},kt={shot:null,window:null,signin:null,signinHidden:null},Xl=new Set(["shot","signinHidden"]),Ql=["--app=data:text/html,<title>Sign in</title>","--window-size=500,720"];function Ar(){let t=kt.shot;t&&(clearTimeout(t.idleTimer),t.idleTimer=setTimeout(()=>{Sr("shot")},Kl),t.idleTimer.unref&&t.idleTimer.unref())}async function Fo(t,e){let n=kt[t];if(n&&n.userDataDir===e&&n.proc.exitCode===null)return t==="shot"&&Ar(),n;await Sr(t);for(let[s,a]of Object.entries(kt))a&&a.userDataDir===e&&await Sr(s);qn.has(e)&&await qn.get(e),Cr.mkdirSync(e,{recursive:!0});let r=["--remote-debugging-pipe",`--user-data-dir=${e}`,"--no-first-run","--no-default-browser-check","--disable-extensions"];Xl.has(t)&&r.unshift("--headless=new"),t==="shot"&&r.push("--hide-scrollbars");let o=t==="signin"?Ql:["about:blank"],i=zl(Jl(),[...r,...o],{stdio:["ignore","ignore","ignore","pipe","pipe"]});return await new Promise((s,a)=>{i.once("spawn",s),i.once("error",a)}),kt[t]={proc:i,cdp:new Lo(i),userDataDir:e,idleTimer:null},t==="shot"&&Ar(),kt[t]}var qn=new Map;async function Sr(t){for(let e of t?[t]:Object.keys(kt)){let n=kt[e];if(kt[e]=null,e==="shot")for(let i of Mt.values())clearTimeout(i.timer);if(e==="shot"&&Mt.clear(),!n)continue;clearTimeout(n.idleTimer);let r=n.proc.exitCode!==null||n.proc.signalCode!==null?Promise.resolve():new Promise(i=>n.proc.once("exit",i)),o=(async()=>{try{await Promise.race([n.cdp.send("Browser.close"),Pt(2e3)])}catch{}await Promise.race([r,Pt(4e3)]),n.proc.exitCode===null&&n.proc.signalCode===null&&(n.proc.kill(),await Promise.race([r,Pt(2e3)]))})();qn.set(n.userDataDir,o);try{await o}finally{qn.get(n.userDataDir)===o&&qn.delete(n.userDataDir)}}}function ss(t,{app:e,layer:n,company:r,site:o}){let i=new URLSearchParams({channelid:is.randomUUID(),preview:"true",layerVersion:"0",baseAppVersion:"0",layerNames:n,company:r,autoload:"false"});return o&&i.set("site",o),`${t}/Apps/Erp/Home/#/view/preview/${encodeURIComponent(e)}?${i}`}function Oo(t,e,n){let r=new URL(t),o=r.protocol==="https:"?Hl:Wl,i=n??"";return new Promise((s,a)=>{let c=o.request(r,{method:"POST",headers:{...e,"Content-Length":Buffer.byteLength(i)},rejectUnauthorized:!1},l=>{let u="";l.on("data",m=>{u+=m}),l.on("end",()=>{if(l.statusCode<200||l.statusCode>=300)return a(new Error(`${r.pathname} returned HTTP ${l.statusCode}: ${u.slice(0,300)}`));try{s(JSON.parse(u))}catch{a(new Error(`${r.pathname} returned non-JSON`))}})});c.on("error",a),c.setTimeout(3e4,()=>c.destroy(new Error(`${r.pathname} timed out`))),c.end(i)})}var Bo=new Map;async function as(t,e,n){let r=`${t}|${e.username}`,o=Bo.get(r);if(!n&&o&&o.expiresUTC-Date.now()>Gl)return o;if(e.authType==="entra"){let m=await Zl(t,e);return Bo.set(r,m),m}let{Authorization:i}=await e.authHeaders(),s=await Oo(`${t}/api/TokenResource/`,{Authorization:i,Accept:"application/json","Content-Type":"application/x-www-form-urlencoded"});if(!s.AccessToken)throw new Error("TokenResource returned no AccessToken");let a=await Oo(`${t}/api/v2/Ice.Lib.SessionModSvc/Login`,{Authorization:`Bearer ${s.AccessToken}`,Accept:"application/json","Content-Type":"application/json",callSettings:JSON.stringify({Company:"",Plant:""}),contextheader:JSON.stringify({Context:{BpmData:[],Client:[]}})},"{}");if(!a.returnObj)throw new Error("SessionModSvc/Login returned no session id");let c=Date.now(),l=Number(s.ExpiresIn)||3600,u={token:s.AccessToken,createdUTC:c,expiresUTC:c+l*1e3,expiresInSecs:l,sessionId:a.returnObj};return Bo.set(r,u),u}async function Zl(t,e){let n=await e.authHeaders(),r=String(n.Authorization||"").replace(/^Bearer\s+/i,""),o=await Oo(`${t}/api/v2/Ice.Lib.SessionModSvc/Login`,{...n,Accept:"application/json","Content-Type":"application/json",callSettings:JSON.stringify({Company:"",Plant:""}),contextheader:JSON.stringify({Context:{BpmData:[],Client:[]}})},"{}");if(!o.returnObj)throw new Error("SessionModSvc/Login returned no session id");let i=Date.now(),s=i+3600*1e3;try{let a=JSON.parse(Buffer.from(r.split(".")[1],"base64").toString("utf-8")).exp;a&&(s=a*1e3)}catch{}return{token:r,createdUTC:i,expiresUTC:s,expiresInSecs:Math.max(60,Math.round((s-i)/1e3)),sessionId:o.returnObj}}async function cs(t,e,n,r){let o=new URL(e),i=`${o.pathname.replace(/\/+$/,"")}/Apps/Erp/Home`;await t("Network.deleteCookies",{name:rs,domain:o.hostname}),await t("Network.setCookie",{name:rs,value:encodeURIComponent(JSON.stringify({url:e,userId:n,password:"",token:r.token,createdUTC:r.createdUTC,expiresUTC:r.expiresUTC,expiresInSecs:r.expiresInSecs})),url:`${o.origin}${i}/`,path:i,secure:o.protocol==="https:",sameSite:"Strict",expires:Math.floor(r.expiresUTC/1e3)});let s=`appData.khp${i.toLowerCase()}/`,a={ep:{session:{server:{authMethod:1,availableAuthMethods:[1],azureUserId:"",configKey:"ep.session.server",idpUserId:"",inDemoMode:!1,objectCreationDate:new Date().toISOString(),objectKind:2,objectName:"EpErpSessionService",requestedAuthMethod:"",restPath:"api/v2/odata",restProtocol:o.protocol.replace(":",""),serverUrl:e,ssoUserId:"",systemCode:"ERP",userId:n}}},khp:{settings:{SessionId:r.sessionId,IsValidSession:!0,UserId:n,CurrentAuthMode:1,AppServerUrl:e,LicenseType:"Default"}}};await t("Page.addScriptToEvaluateOnNewDocument",{source:`try { if (location.pathname.toLowerCase().startsWith(${JSON.stringify(i.toLowerCase())})) localStorage.setItem(${JSON.stringify(s)}, ${JSON.stringify(JSON.stringify(a))}); } catch (e) {}`})}async function ls(t,e){let n=await t("Page.captureScreenshot",{format:"png"});Cr.mkdirSync($o.dirname(e),{recursive:!0}),Cr.writeFileSync(e,Buffer.from(n.data,"base64"))}var ed=new Set(["WebSocket","EventSource","Ping"]),td=/signalr|\/negotiate|\/poll|\/connect\b/i;function _o(t,e){let n=0;for(let r of t.inflight.values())r>=e&&n++;return n}async function ds(t,{cfg:e,app:n,layer:r,company:o,site:i,userDataDir:s,width:a,height:c},l,u){let m=e.serverUrl.replace(/\/+$/,""),g=await as(m,e,l),{cdp:E}=await Fo(t,s),{targetId:C}=await E.send("Target.createTarget",{url:"about:blank"}),{sessionId:A}=await E.send("Target.attachToTarget",{targetId:C,flatten:!0}),N={targetId:C,loaded:!1,lastNet:Date.now(),inflight:new Map,title:"",settled:!1,send:(v,x)=>E.send(v,x,A)},B=E.on(v=>{if(v.sessionId!==A)return;let x=v.params||{};if(v.method==="Page.loadEventFired")N.loaded=!0;else if(v.method==="Network.requestWillBeSent"){if(ed.has(x.type)||td.test(x.request&&x.request.url||""))return;N.inflight.set(x.requestId,Date.now()),N.lastNet=Date.now()}else(v.method==="Network.loadingFinished"||v.method==="Network.loadingFailed")&&N.inflight.delete(x.requestId)&&(N.lastNet=Date.now())});N.close=()=>{B(),E.send("Target.closeTarget",{targetId:C}).catch(()=>{})};try{return await N.send("Network.enable"),await N.send("Page.enable"),await N.send("Emulation.setDeviceMetricsOverride",{width:a,height:c,deviceScaleFactor:1,mobile:!1}),await cs(N.send,m,e.username,g),await N.send("Page.navigate",{url:ss(m,{app:n,layer:r,company:o,site:i})}),await us(N,{freshSession:l,failShot:u}),N}catch(v){throw N.close(),v}}async function us(t,{freshSession:e=!1,failShot:n,timeoutMs:r=45e3}={}){let o=Date.now(),i={},s=0;for(t.settled=!1;Date.now()-o<r;){await Pt(500);try{let l=await t.send("Runtime.evaluate",{expression:"({ hash: location.hash, title: document.title, invalid: /Invalid Session/i.test(document.body ? document.body.innerText : '') })",returnByValue:!0});i=l&&l.result&&l.result.value||i}catch{continue}if(i.invalid||/^#\/login/i.test(i.hash||"")){if(s=s||Date.now(),i.invalid||Date.now()-s>8e3){n&&await ls(t.send,n);let l=new Error(`Kinetic didn't accept the session (${i.invalid?"Invalid Session":"stayed on login"}).${n?` Screenshot of what it showed: ${n}`:""}`);throw l.sessionRejected=!e,l}continue}s=0;let a=Date.now()-t.lastNet>2e3&&!_o(t,Date.now()-5e3),c=/\|\s*Preview$/i.test(i.title||"");if(t.loaded&&a&&(c||Date.now()-o>15e3)){t.settled=!0;break}}t.title=i.title||""}async function ps(t){try{return await t(!1)}catch(e){if(!e.sessionRejected)throw e;return t(!0)}}function nd(t){return ps(async e=>{let n=t.width||1440,r=t.height||900,o=await ds("shot",{...t,width:n,height:r},e,t.outFile);try{return await Pt(400),await ls(o.send,t.outFile),{image:t.outFile,settled:o.settled,title:o.title,width:n,height:r}}finally{o.close(),Ar()}})}var rd=900*1e3,Mt=new Map,os={Enter:13,Tab:9,Backspace:8,Escape:27,Delete:46,ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40,Home:36,End:35,PageUp:33,PageDown:34};function fs(t){let e=Mt.get(t);e&&(clearTimeout(e.timer),e.timer=setTimeout(()=>{hs(t)},rd),e.timer.unref&&e.timer.unref(),Ar())}async function ms(t){let e=await t.send("Page.captureScreenshot",{format:"jpeg",quality:70}),n=t.title;try{n=(await t.send("Runtime.evaluate",{expression:"document.title",returnByValue:!0})).result.value}catch{}return{frame:e.data,mime:"image/jpeg",title:n}}var od=1500;async function id(t,e){let n=Date.now();for(await Pt(80);Date.now()-n<od&&(_o(t,e)||Date.now()-t.lastNet<120);)await Pt(40);return _o(t,e)}async function sd(t){let e=t.width||1280,n=t.height||760,r=await ps(i=>ds("shot",{...t,width:e,height:n},i)),o=is.randomUUID();return Mt.set(o,{page:r,timer:null}),fs(o),{viewId:o,width:e,height:n,...await ms(r)}}async function ad(t,e=[]){let n=Mt.get(t);if(!n)throw new Error("This preview has closed. Reopen it.");fs(t);let{page:r}=n,o=r.send,i=Date.now(),s=!1;for(let m of e)if(m.type==="click"||m.type==="dblclick"){let g=Number(m.x),E=Number(m.y),C=m.type==="dblclick"?2:Math.min(Math.max(Number(m.count)||1,1),3);await o("Input.dispatchMouseEvent",{type:"mouseMoved",x:g,y:E});for(let A=m.type==="dblclick"?1:C;A<=C;A++)await o("Input.dispatchMouseEvent",{type:"mousePressed",x:g,y:E,button:"left",clickCount:A}),await o("Input.dispatchMouseEvent",{type:"mouseReleased",x:g,y:E,button:"left",clickCount:A})}else if(m.type==="type"&&m.text)await o("Input.insertText",{text:String(m.text)});else if(m.type==="key"&&os[m.key]){let g={key:m.key,code:m.key,windowsVirtualKeyCode:os[m.key],modifiers:m.shift?8:0};await o("Input.dispatchKeyEvent",{type:"rawKeyDown",...g}),await o("Input.dispatchKeyEvent",{type:"keyUp",...g})}else m.type==="scroll"?await o("Input.dispatchMouseEvent",{type:"mouseWheel",x:Number(m.x)||0,y:Number(m.y)||0,deltaX:Number(m.dx)||0,deltaY:Number(m.dy)||0}):m.type==="reload"&&(r.loaded=!1,await o("Page.reload",{ignoreCache:!0}),s=!0);let a=Date.now(),c=0;s?await us(r,{freshSession:!0}):e.length&&(e.some(m=>m.type!=="wait")&&(r.inputAt=i),c=await id(r,r.inputAt||i));let l=Date.now();return{...await ms(r),pending:c,timing:{input:a-i,wait:l-a,shot:Date.now()-l}}}function hs(t){let e=Mt.get(t);return e?(Mt.delete(t),clearTimeout(e.timer),e.page.close(),!0):!1}async function cd({cfg:t,app:e,layer:n,company:r,site:o,userDataDir:i}){let s=t.serverUrl.replace(/\/+$/,""),a=await as(s,t,!1),{cdp:c}=await Fo("window",`${i}-window`),{targetId:l}=await c.send("Target.createTarget",{url:"about:blank",newWindow:!0}),{sessionId:u}=await c.send("Target.attachToTarget",{targetId:l,flatten:!0}),m=(E,C)=>c.send(E,C,u);await m("Network.enable"),await m("Page.enable"),await cs(m,s,t.username,a),await m("Page.navigate",{url:ss(s,{app:e,layer:n,company:r,site:o})}),await m("Page.bringToFront").catch(()=>{});let{targetInfos:g}=await c.send("Target.getTargets");for(let E of g)E.type==="page"&&E.targetId!==l&&E.url==="about:blank"&&c.send("Target.closeTarget",{targetId:E.targetId}).catch(()=>{});return{opened:!0,sessionExpires:new Date(a.expiresUTC).toISOString()}}gs.exports={capturePreview:nd,openPreviewWindow:cd,liveOpen:sd,liveInput:ad,liveClose:hs,closeBrowser:Sr,getBrowser:Fo}});var Mo=de((lg,ws)=>{"use strict";var{getBrowser:ld,closeBrowser:bs}=Po(),dd={silent:"signinHidden",window:"signin"},ud='<!doctype html><meta charset=utf-8><title>Signed in</title><body style="font:15px -apple-system,Segoe UI,sans-serif;padding:40px">Signed in to EFx Manager. This window closes by itself.</body>';function rn(t,e){return Object.assign(new Error(t),e||{})}function ys(t){let{mode:e,url:n,redirectPrefix:r,userDataDir:o,timeoutMs:i=300*1e3}=t,s=dd[e],a=null,c=!1,l=(async()=>{let m;try{m=await ld(s,o)}catch(A){throw rn(`Couldn't start Chrome or Edge for sign-in: ${A.message}`,{browser:!0})}let{cdp:g,proc:E}=m,C=()=>{};try{let A;if(e==="window"){let{targetInfos:x}=await g.send("Target.getTargets"),k=x.find(L=>L.type==="page");A=k?k.targetId:(await g.send("Target.createTarget",{url:"about:blank",newWindow:!0})).targetId}else A=(await g.send("Target.createTarget",{url:"about:blank"})).targetId;let{sessionId:N}=await g.send("Target.attachToTarget",{targetId:A,flatten:!0}),B=(x,k)=>g.send(x,k,N),v=new Promise((x,k)=>{let L=!1,h=()=>b(k,rn("Sign-in was cancelled.",{cancelled:!0})),d=setTimeout(()=>b(k,rn("Sign-in timed out.",{timeout:!0})),i);function b(S,T){L||(L=!0,clearTimeout(d),E.removeListener("exit",h),S(T))}a=h,E.once("exit",h),C=g.on(S=>{S.sessionId===N&&S.method==="Fetch.requestPaused"?(B("Fetch.fulfillRequest",{requestId:S.params.requestId,responseCode:200,responseHeaders:[{name:"Content-Type",value:"text/html; charset=utf-8"}],body:Buffer.from(ud).toString("base64")}).catch(()=>{}),b(x,S.params.request.url)):(S.method==="Target.targetDestroyed"&&S.params.targetId===A||S.method==="Target.detachedFromTarget"&&S.params.sessionId===N)&&h()})});if(c)throw rn("Sign-in was cancelled.",{cancelled:!0});return await g.send("Target.setDiscoverTargets",{discover:!0}).catch(()=>{}),await B("Fetch.enable",{patterns:[{urlPattern:`${r}*`,requestStage:"Request"}]}),await B("Page.enable"),await B("Page.navigate",{url:n}),e==="window"&&await B("Page.bringToFront").catch(()=>{}),await v}catch(A){throw A.cancelled||A.timeout||A.browser?A:c?rn("Sign-in was cancelled.",{cancelled:!0}):rn(`Sign-in browser failed: ${A.message}`,{browser:!0})}finally{C(),setTimeout(()=>{bs(s)},e==="window"?800:0)}})();function u(){c=!0,a&&a(),bs(s)}return{done:l,close:u}}function pd(t){return ys(t).done}ws.exports={open:ys,capture:pd}});var jn=de((dg,Os)=>{"use strict";var at=require("vscode"),Ir=require("crypto"),fd=require("https"),md=require("http"),hd=require("os"),gd=require("path"),Es=(process.env.EFX_ENTRA_AUTHORITY||"https://login.microsoftonline.com").replace(/\/+$/,""),vs=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,bd=/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/,yd=60*1e3,xs=300*1e3,wd=120*1e3,Ds=gd.join(hd.homedir(),".efx-manager","signin-browser"),vd=25*1e3,Ed=600*1e3,bt=null,Cs="",sn=new Map,kr=new Map,on=new Map,Uo=new Map,Tr=new Map,qo=0;function xd(t){bt=t.secrets,Cs=t.extension?t.extension.id:"cpi.epicor-efx-manager"}var $r=(t,e)=>`efx.profile.${t}.${e}`;function Rt(t){return t&&t.authType==="entra"?"entra":"basic"}function Lr(t,e){return Object.assign(new Error(t),{code:e})}function Dd(t){return Lr(`Sign-in required for EFx profile "${t.name}" \u2014 run EFx: Sign In.`,"login-required")}function jo(t){return vs.test(t.clientId||"")?!vs.test(t.tenantId||"")&&!bd.test(t.tenantId||"")?"tenantId must be a GUID or a domain":!t.scope||/\s/.test(t.scope)?"scope is required (one scope, no spaces)":null:"clientId must be a GUID"}function Ho(t){let e=jo(t);if(e)throw Lr(`EFx profile "${t.name}": ${e} (EFx: Profile Settings \u2192 Authentication).`,"config")}function As(t,e,n){let r={Authorization:`Basic ${Buffer.from(`${t}:${e}`).toString("base64")}`};return n&&(r["x-api-key"]=n),r}function Ss(){return`${at.env.uriScheme}://${Cs}/auth`}function ks(t){let e=String(t.redirectUri||"").trim();return/^https:\/\//i.test(e)?e:""}function Cd(t){let e=new URL(String(t||"").trim()),n=new URLSearchParams(e.search);return new URLSearchParams(e.hash.replace(/^#/,"")).forEach((r,o)=>{n.has(o)||n.set(o,r)}),n}function Or(t){let e=`${t.tenantId}|${t.clientId}|${t.scope}`.toLowerCase();return`efx.entra.${Ir.createHash("sha256").update(e).digest("hex").slice(0,24)}`}async function Is(t){let e=await bt.get(t);if(!e)return null;try{return JSON.parse(e)}catch{return null}}async function Ad(t,e){await bt.store(t,JSON.stringify(e))}async function Ts(t){sn.delete(t),await bt.delete(t)}var Ro=t=>t.toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");function Nr(t,e,n){let r=new URL(t),o=new URLSearchParams(e).toString(),i=r.protocol==="http:"?md:fd;return new Promise((s,a)=>{let c=i.request(r,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","Content-Length":Buffer.byteLength(o),...n||{}}},l=>{let u="";l.on("data",m=>{u+=m}),l.on("end",()=>{let m=null;try{m=JSON.parse(u)}catch{}if(l.statusCode>=200&&l.statusCode<300&&m)return s(m);let g=m&&(m.error_description||m.error)||u.slice(0,300)||`HTTP ${l.statusCode}`;a(Object.assign(new Error(String(g).split(/\r?\n/)[0]),{oauthError:m&&m.error,status:l.statusCode}))})});c.on("error",a),c.setTimeout(3e4,()=>c.destroy(new Error("Microsoft token endpoint timed out"))),c.end(o)})}var Br=t=>`${Es}/${encodeURIComponent(t.tenantId)}/oauth2/v2.0/token`,Wo=t=>`${t.scope} offline_access openid profile`;function Sd(t){try{let e=JSON.parse(Buffer.from(t.split(".")[1],"base64").toString("utf-8"));return e.preferred_username||e.upn||e.email||e.name||""}catch{return""}}async function zo(t,e,n){let r={refreshToken:e.refresh_token||n&&n.refreshToken,account:e.id_token&&Sd(e.id_token)||n&&n.account||"",origin:n&&n.origin||e._origin||void 0,savedAt:new Date().toISOString()};if(!r.refreshToken)throw new Error("Microsoft returned no refresh token (offline_access not granted?)");return await Ad(t,r),sn.set(t,{token:e.access_token,expiresAt:Date.now()+(Number(e.expires_in)||3600)*1e3}),r}function kd(t,e){if(kr.has(e))return kr.get(e);let n=(async()=>{let r=await Is(e);if(!r||!r.refreshToken)return null;try{let o=await Nr(Br(t),{client_id:t.clientId,grant_type:"refresh_token",refresh_token:r.refreshToken,scope:Wo(t)},r.origin?{Origin:r.origin}:null);return await zo(e,o,r),sn.get(e).token}catch(o){if(o.oauthError==="invalid_grant"||o.oauthError==="interaction_required"){let i=await Ld(t,e,r);return i||(await Ts(e),null)}throw o}})().finally(()=>kr.delete(e));return kr.set(e,n),n}function Id(t){let e=Date.now();e-(Uo.get(t.name)||0)<yd||(Uo.set(t.name,e),at.window.showWarningMessage(`EFx: Sign-in required for "${t.name}".`,"Sign In").then(n=>{n==="Sign In"&&at.commands.executeCommand("efx.signIn",t.name)}))}async function Ns(t,e={}){if(!bt)throw new Error("auth.init(context) was not called");let n=await bt.get($r(t.name,"apiKey"))||"";if(Rt(t)==="basic"){let a=await bt.get($r(t.name,"password"));if(!a)throw Lr(`No password stored for EFx profile "${t.name}" (EFx: Profile Settings \u2192 Authentication).`,"no-password");return As(t.username,a,n)}Ho(t);let r=Or(t);e.retry&&sn.delete(r);let o=sn.get(r),i=o&&o.expiresAt-Date.now()>wd?o.token:null;if(i||(i=await kd(t,r)),!i)throw Id(t),Dd(t);let s={Authorization:`Bearer ${i}`};return n&&(s["x-api-key"]=n),s}function Td(t){let e=new URLSearchParams(t.query),n=e.get("state")||"",r=on.get(n);if(!r){at.window.showWarningMessage("EFx: Ignored a sign-in link that doesn't match a sign-in in progress.");return}on.delete(n),clearTimeout(r.timer),e.get("error")?r.reject(new Error((e.get("error_description")||e.get("error")).split(/\r?\n/)[0])):e.get("code")?r.resolve(e.get("code")):r.reject(new Error("Microsoft's redirect had no code."))}function Bs(t,e){let n=Ro(Ir.randomBytes(32)),r=Ro(Ir.createHash("sha256").update(n).digest()),o=Ro(Ir.randomBytes(16)),i=ks(t),s=i||Ss(),a=Object.entries({client_id:t.clientId,response_type:"code",redirect_uri:s,response_mode:"query",scope:Wo(t),state:o,code_challenge:r,code_challenge_method:"S256",prompt:e}).map(([l,u])=>`${l}=${encodeURIComponent(u)}`).join("&");return{url:`${Es}/${encodeURIComponent(t.tenantId)}/oauth2/v2.0/authorize?${a}`,verifier:n,state:o,redirect:s,landing:i}}function $s(t,e){let n;try{n=Cd(t)}catch{throw new Error("Couldn't read the sign-in redirect.")}if(n.get("error"))throw Lr((n.get("error_description")||n.get("error")).split(/\r?\n/)[0],n.get("error"));if(n.get("state")!==e.state)throw new Error("The sign-in redirect didn't match this sign-in. Run Sign In again.");if(!n.get("code"))throw new Error("Microsoft's redirect had no code.");return n.get("code")}async function Ls(t,e,n){let r={client_id:t.clientId,grant_type:"authorization_code",code:e,redirect_uri:n.redirect,code_verifier:n.verifier,scope:Wo(t)};if(!n.landing)return Nr(Br(t),r);let o=new URL(n.landing).origin;try{let i=await Nr(Br(t),r,{Origin:o});return i._origin=o,i}catch(i){if(!/9002326/.test(i.message))throw i;return Nr(Br(t),r)}}async function Nd(t){if(Rt(t)!=="entra")throw new Error(`"${t.name}" uses Basic auth \u2014 nothing to sign in to.`);Ho(t);let e=Or(t),n=Bs(t,"select_account"),r;qo++;try{r=n.landing?$s(await $d(n,t),n):await Bd(n,t)}finally{qo--}let o=await Ls(t,r,n),i=await zo(e,o,null);return Uo.delete(t.name),Tr.delete(e),i.account||"your Microsoft account"}function Bd(t,e){return at.window.withProgress({location:at.ProgressLocation.Notification,title:`EFx: Finish signing in to "${e.name}" in your browser\u2026`,cancellable:!0},(n,r)=>new Promise((o,i)=>{let s=setTimeout(()=>{on.delete(t.state),i(new Error("Sign-in timed out."))},xs);on.set(t.state,{resolve:o,reject:i,timer:s}),r.onCancellationRequested(()=>{clearTimeout(s),on.delete(t.state),i(new Error("Sign-in was cancelled."))}),at.env.openExternal(at.Uri.parse(t.url,!0)).then(a=>{a||(clearTimeout(s),on.delete(t.state),i(new Error("Couldn't open the browser.")))})}))}function $d(t,e){let n=Mo();return at.window.withProgress({location:at.ProgressLocation.Notification,title:`EFx: Sign in to "${e.name}" in the sign-in window\u2026`,cancellable:!0},(r,o)=>{let i=n.open({mode:"window",url:t.url,redirectPrefix:t.landing,userDataDir:Ds,timeoutMs:xs});return o.onCancellationRequested(()=>i.close()),i.done})}async function Ld(t,e,n){let r=ks(t);if(!r||qo>0||Date.now()-(Tr.get(e)||0)<Ed)return null;let o=Bs(t,"none");try{let i=await Mo().capture({mode:"silent",url:o.url,redirectPrefix:r,userDataDir:Ds,timeoutMs:vd}),s=await Ls(t,$s(i,o),o);return await zo(e,s,n),Tr.delete(e),sn.get(e).token}catch(i){return console.log(`EFx: hidden sign-in renewal for "${t.name}" needs you \u2014 ${i.message}`),Tr.set(e,Date.now()),null}}async function Od(t){Rt(t)==="entra"&&(Ho(t),await Ts(Or(t)))}async function _d(t){if(Rt(t)!=="entra")return{state:"n/a"};if(jo(t))return{state:"login-required",error:"Entra settings incomplete"};let e=await Is(Or(t));return e&&e.refreshToken?{state:"ok",account:e.account}:{state:"login-required"}}async function Fd(t){return Rt(t)!=="basic"||bt&&await bt.get($r(t.name,"password"))?null:`No password stored for "${t.name}". Set it in EFx: Profile Settings.`}function Pd(t,e){let n=Rt(t)==="entra";return{serverUrl:t.serverUrl,company:e,username:t.username,authType:n?"entra":"basic",retry401:n,authHeaders:r=>Ns(t,r)}}function Md({serverUrl:t,company:e,username:n,password:r,apiKey:o}){return{serverUrl:t,company:e,username:n,authType:"basic",retry401:!1,authHeaders:async()=>As(n,r,o||"")}}Os.exports={init:xd,secretKey:$r,authTypeOf:Rt,entraFieldProblem:jo,getAuthHeader:Ns,signIn:Nd,signOut:Od,handleRedirect:Td,getAuthState:_d,preflight:Fd,redirectUri:Ss,clientConfig:Pd,draftBasicConfig:Md}});var qt=de(Fe=>{"use strict";function Rd(t,e,n){if(n===void 0&&(n=Array.prototype),t&&typeof n.find=="function")return n.find.call(t,e);for(var r=0;r<t.length;r++)if(Ut(t,r)){var o=t[r];if(e.call(void 0,o,r,t))return o}}function an(t,e){return e===void 0&&(e=Object),e&&typeof e.getOwnPropertyDescriptors=="function"&&(t=e.create(null,e.getOwnPropertyDescriptors(t))),e&&typeof e.freeze=="function"?e.freeze(t):t}function Ut(t,e){return Object.prototype.hasOwnProperty.call(t,e)}function Ud(t,e){if(t===null||typeof t!="object")throw new TypeError("target is not an object");for(var n in e)Ut(e,n)&&(t[n]=e[n]);return t}var _s=an({allowfullscreen:!0,async:!0,autofocus:!0,autoplay:!0,checked:!0,controls:!0,default:!0,defer:!0,disabled:!0,formnovalidate:!0,hidden:!0,ismap:!0,itemscope:!0,loop:!0,multiple:!0,muted:!0,nomodule:!0,novalidate:!0,open:!0,playsinline:!0,readonly:!0,required:!0,reversed:!0,selected:!0});function qd(t){return Ut(_s,t.toLowerCase())}var Fs=an({area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function jd(t){return Ut(Fs,t.toLowerCase())}var Hn=an({script:!1,style:!1,textarea:!0,title:!0});function Hd(t){var e=t.toLowerCase();return Ut(Hn,e)&&!Hn[e]}function Wd(t){var e=t.toLowerCase();return Ut(Hn,e)&&Hn[e]}function Ps(t){return t===Wn.HTML}function zd(t){return Ps(t)||t===Wn.XML_XHTML_APPLICATION}var Wn=an({HTML:"text/html",XML_APPLICATION:"application/xml",XML_TEXT:"text/xml",XML_XHTML_APPLICATION:"application/xhtml+xml",XML_SVG_IMAGE:"image/svg+xml"}),Vd=Object.keys(Wn).map(function(t){return Wn[t]});function Kd(t){return Vd.indexOf(t)>-1}var Gd=an({HTML:"http://www.w3.org/1999/xhtml",SVG:"http://www.w3.org/2000/svg",XML:"http://www.w3.org/XML/1998/namespace",XMLNS:"http://www.w3.org/2000/xmlns/"});Fe.assign=Ud;Fe.find=Rd;Fe.freeze=an;Fe.HTML_BOOLEAN_ATTRIBUTES=_s;Fe.HTML_RAW_TEXT_ELEMENTS=Hn;Fe.HTML_VOID_ELEMENTS=Fs;Fe.hasDefaultHTMLNamespace=zd;Fe.hasOwn=Ut;Fe.isHTMLBooleanAttribute=qd;Fe.isHTMLRawTextElement=Hd;Fe.isHTMLEscapableRawTextElement=Wd;Fe.isHTMLMimeType=Ps;Fe.isHTMLVoidElement=jd;Fe.isValidMimeType=Kd;Fe.MIME_TYPE=Wn;Fe.NAMESPACE=Gd});var Yn=de(Gn=>{"use strict";var Yd=qt();function Rs(t,e){t.prototype=Object.create(Error.prototype,{constructor:{value:t},name:{value:t.name,enumerable:!0,writable:e}})}var Vn=Yd.freeze({Error:"Error",IndexSizeError:"IndexSizeError",DomstringSizeError:"DomstringSizeError",HierarchyRequestError:"HierarchyRequestError",WrongDocumentError:"WrongDocumentError",InvalidCharacterError:"InvalidCharacterError",NoDataAllowedError:"NoDataAllowedError",NoModificationAllowedError:"NoModificationAllowedError",NotFoundError:"NotFoundError",NotSupportedError:"NotSupportedError",InUseAttributeError:"InUseAttributeError",InvalidStateError:"InvalidStateError",SyntaxError:"SyntaxError",InvalidModificationError:"InvalidModificationError",NamespaceError:"NamespaceError",InvalidAccessError:"InvalidAccessError",ValidationError:"ValidationError",TypeMismatchError:"TypeMismatchError",SecurityError:"SecurityError",NetworkError:"NetworkError",AbortError:"AbortError",URLMismatchError:"URLMismatchError",QuotaExceededError:"QuotaExceededError",TimeoutError:"TimeoutError",InvalidNodeTypeError:"InvalidNodeTypeError",DataCloneError:"DataCloneError",EncodingError:"EncodingError",NotReadableError:"NotReadableError",UnknownError:"UnknownError",ConstraintError:"ConstraintError",DataError:"DataError",TransactionInactiveError:"TransactionInactiveError",ReadOnlyError:"ReadOnlyError",VersionError:"VersionError",OperationError:"OperationError",NotAllowedError:"NotAllowedError",OptOutError:"OptOutError"}),Us=Object.keys(Vn);function qs(t){return typeof t=="number"&&t>=1&&t<=25}function Jd(t){return typeof t=="string"&&t.substring(t.length-Vn.Error.length)===Vn.Error}function Kn(t,e){qs(t)?(this.name=Us[t],this.message=e||""):(this.message=t,this.name=Jd(e)?e:Vn.Error),Error.captureStackTrace&&Error.captureStackTrace(this,Kn)}Rs(Kn,!0);Object.defineProperties(Kn.prototype,{code:{enumerable:!0,get:function(){var t=Us.indexOf(this.name);return qs(t)?t:0}}});var js={INDEX_SIZE_ERR:1,DOMSTRING_SIZE_ERR:2,HIERARCHY_REQUEST_ERR:3,WRONG_DOCUMENT_ERR:4,INVALID_CHARACTER_ERR:5,NO_DATA_ALLOWED_ERR:6,NO_MODIFICATION_ALLOWED_ERR:7,NOT_FOUND_ERR:8,NOT_SUPPORTED_ERR:9,INUSE_ATTRIBUTE_ERR:10,INVALID_STATE_ERR:11,SYNTAX_ERR:12,INVALID_MODIFICATION_ERR:13,NAMESPACE_ERR:14,INVALID_ACCESS_ERR:15,VALIDATION_ERR:16,TYPE_MISMATCH_ERR:17,SECURITY_ERR:18,NETWORK_ERR:19,ABORT_ERR:20,URL_MISMATCH_ERR:21,QUOTA_EXCEEDED_ERR:22,TIMEOUT_ERR:23,INVALID_NODE_TYPE_ERR:24,DATA_CLONE_ERR:25},Vo=Object.entries(js);for(zn=0;zn<Vo.length;zn++)Ms=Vo[zn][0],Kn[Ms]=Vo[zn][1];var Ms,zn;function Ko(t,e,n){this.message=t,this.locator=e,this.cause=n,Error.captureStackTrace&&Error.captureStackTrace(this,Ko)}Rs(Ko);Gn.DOMException=Kn;Gn.DOMExceptionName=Vn;Gn.ExceptionCode=js;Gn.ParseError=Ko});var ei=de(X=>{"use strict";function Gs(t){try{typeof t!="function"&&(t=RegExp);var e=new t("\u{1D306}","u").exec("\u{1D306}");return!!e&&e[0].length===2}catch{}return!1}var dn=Gs();function It(t){if(t.source[0]!=="[")throw new Error(t+" can not be used with chars");return t.source.slice(1,t.source.lastIndexOf("]"))}function cn(t,e){if(t.source[0]!=="[")throw new Error("/"+t.source+"/ can not be used with chars_without");if(!e||typeof e!="string")throw new Error(JSON.stringify(e)+" is not a valid search");if(t.source.indexOf(e)===-1)throw new Error('"'+e+'" is not is /'+t.source+"/");if(e==="-"&&t.source.indexOf(e)!==1)throw new Error('"'+e+'" is not at the first postion of /'+t.source+"/");return new RegExp(t.source.replace(e,""),dn?"u":"")}function ee(t){var e=this;return new RegExp(Array.prototype.slice.call(arguments).map(function(n){var r=typeof n=="string";if(r&&e===void 0&&n==="|")throw new Error("use regg instead of reg to wrap expressions with `|`!");return r?n:n.source}).join(""),dn?"u":"")}function Y(t){if(arguments.length===0)throw new Error("no parameters provided");return ee.apply(Y,["(?:"].concat(Array.prototype.slice.call(arguments),[")"]))}var Xd="\uFFFD",Tt=/[-\x09\x0A\x0D\x20-\x2C\x2E-\uD7FF\uE000-\uFFFD]/;dn&&(Tt=ee("[",It(Tt),"\\u{10000}-\\u{10FFFF}","]"));var Qd=new RegExp("[^"+It(Tt)+"]",dn?"u":""),_r=/[\x20\x09\x0D\x0A]/,Zd=It(_r),ue=ee(_r,"+"),ye=ee(_r,"*"),Jn=/[:_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;dn&&(Jn=ee("[",It(Jn),"\\u{10000}-\\u{10FFFF}","]"));var eu=It(Jn),Jo=ee("[",eu,It(/[-.0-9\xB7]/),It(/[\u0300-\u036F\u203F-\u2040]/),"]"),Qe=ee(Jn,Jo,"*"),tu=ee("^",Qe,"$"),Hs=ee(Jo,"+"),nu=ee("&",Qe,";"),ru=Y(/&#[0-9]+;|&#x[0-9a-fA-F]+;/),Xn=Y(nu,"|",ru),Qn=ee("%",Qe,";"),Xo=Y(ee('"',Y(/[^%&"]/,"|",Qn,"|",Xn),"*",'"'),"|",ee("'",Y(/[^%&']/,"|",Qn,"|",Xn),"*","'")),ou=Y('"',Y(/[^<&"]/,"|",Xn),"*",'"',"|","'",Y(/[^<&']/,"|",Xn),"*","'"),iu=cn(Jn,":"),su=cn(Jo,":"),Go=ee(iu,su,"*"),au=ee("^",Go,"$"),Zn=ee(Go,Y(":",Go),"?"),cu=ee("^",Zn,"$"),lu=ee("(",Zn,")"),ln=Y(/"[^"]*"|'[^']*'/),du=ee(/^<\?/,"(",Qe,")",Y(ue,"(?!",_r,")(",Tt,"*?)"),"?",/\?>/),Ws=/[\x20\x0D\x0Aa-zA-Z0-9-'()+,./:=?;!*#@$_%]/,er=Y('"',Ws,'*"',"|","'",cn(Ws,"'"),"*'"),Ys="<!--",Js="-->",uu=ee(Ys,Y(cn(Tt,"-"),"|",ee("-",cn(Tt,"-"))),"*",Js),zs="#PCDATA",pu=Y(ee(/\(/,ye,zs,Y(ye,/\|/,ye,Zn),"*",ye,/\)\*/),"|",ee(/\(/,ye,zs,ye,/\)/)),fu=/[?*+]?/,mu=ee(/\([^>]+\)/,fu),hu=Y("EMPTY","|","ANY","|",pu,"|",mu),gu="<!ELEMENT",bu=ee(gu,ue,Y(Zn,"|",Qn),ue,Y(hu,"|",Qn),ye,">"),yu=ee("NOTATION",ue,/\(/,ye,Qe,Y(ye,/\|/,ye,Qe),"*",ye,/\)/),wu=ee(/\(/,ye,Hs,Y(ye,/\|/,ye,Hs),"*",ye,/\)/),vu=Y(yu,"|",wu),Eu=Y(/CDATA|ID|IDREF|IDREFS|ENTITY|ENTITIES|NMTOKEN|NMTOKENS/,"|",vu),xu=Y(/#REQUIRED|#IMPLIED/,"|",Y(Y("#FIXED",ue),"?",ou)),Du=Y(ue,Qe,ue,Eu,ue,xu),Cu="<!ATTLIST",Au=ee(Cu,ue,Qe,Du,"*",ye,">"),Yo="about:legacy-compat",Su=Y('"'+Yo+'"',"|","'"+Yo+"'"),Qo="SYSTEM",Fr="PUBLIC",Pr=Y(Y(Qo,ue,ln),"|",Y(Fr,ue,er,ue,ln)),ku=ee("^",Y(Y(Qo,ue,"(?<SystemLiteralOnly>",ln,")"),"|",Y(Fr,ue,"(?<PubidLiteral>",er,")",ue,"(?<SystemLiteral>",ln,")"))),Iu=ee("^",er,"$"),Tu=ee("^",ln,"$"),Nu=Y(ue,"NDATA",ue,Qe),Bu=Y(Xo,"|",Y(Pr,Nu,"?")),Xs="<!ENTITY",$u=ee(Xs,ue,Qe,ue,Bu,ye,">"),Lu=Y(Xo,"|",Pr),Ou=ee(Xs,ue,"%",ue,Qe,ue,Lu,ye,">"),_u=Y($u,"|",Ou),Fu=ee(Fr,ue,er),Pu=ee("<!NOTATION",ue,Qe,ue,Y(Pr,"|",Fu),ye,">"),Zo=ee(ye,"=",ye),Vs=/1[.]\d+/,Mu=ee(ue,"version",Zo,Y("'",Vs,"'","|",'"',Vs,'"')),Ks=/[A-Za-z][-A-Za-z0-9._]*/,Ru=Y(ue,"encoding",Zo,Y('"',Ks,'"',"|","'",Ks,"'")),Uu=Y(ue,"standalone",Zo,Y("'",Y("yes","|","no"),"'","|",'"',Y("yes","|","no"),'"')),qu=ee(/^<\?xml/,Mu,Ru,"?",Uu,"?",ye,/\?>/),ju="<!DOCTYPE",Hu="<![CDATA[",Wu="]]>",zu=/<!\[CDATA\[/,Vu=/\]\]>/,Ku=ee(Tt,"*?",Vu),Gu=ee(zu,Ku);X.chars=It;X.chars_without=cn;X.detectUnicodeSupport=Gs;X.reg=ee;X.regg=Y;X.ABOUT_LEGACY_COMPAT=Yo;X.ABOUT_LEGACY_COMPAT_SystemLiteral=Su;X.AttlistDecl=Au;X.CDATA_START=Hu;X.CDATA_END=Wu;X.CDSect=Gu;X.Char=Tt;X.Comment=uu;X.COMMENT_START=Ys;X.COMMENT_END=Js;X.DOCTYPE_DECL_START=ju;X.elementdecl=bu;X.EntityDecl=_u;X.EntityValue=Xo;X.ExternalID=Pr;X.ExternalID_match=ku;X.Name=Qe;X.Name_exact=tu;X.NCName_exact=au;X.NotationDecl=Pu;X.Reference=Xn;X.PEReference=Qn;X.PI=du;X.PUBLIC=Fr;X.PubidLiteral=er;X.PubidLiteral_match=Iu;X.QName=Zn;X.QName_exact=cu;X.QName_group=lu;X.S=ue;X.SChar_s=Zd;X.S_OPT=ye;X.SYSTEM=Qo;X.SystemLiteral=ln;X.SystemLiteral_match=Tu;X.InvalidChar=Qd;X.UNICODE_REPLACEMENT_CHARACTER=Xd;X.UNICODE_SUPPORT=dn;X.XMLDecl=qu});var di=de(Ee=>{"use strict";var nt=qt(),lt=nt.find,Yu=nt.hasDefaultHTMLNamespace,pn=nt.hasOwn,Ju=nt.isHTMLMimeType,Xu=nt.isHTMLRawTextElement,Qu=nt.isHTMLVoidElement,tr=nt.MIME_TYPE,dt=nt.NAMESPACE,je=Symbol(),oa=Yn(),z=oa.DOMException,Re=oa.DOMExceptionName,ve=ei();function Ve(t){if(t!==je)throw new TypeError("Illegal constructor")}function Zu(t){return t!==""}function ep(t){return t?t.split(/[\t\n\f\r ]+/).filter(Zu):[]}function tp(t,e){return pn(t,e)||(t[e]=!0),t}function Qs(t){if(!t)return[];var e=ep(t);return Object.keys(e.reduce(tp,{}))}function np(t){return function(e){return t&&t.indexOf(e)!==-1}}function ia(t){if(!ve.QName_exact.test(t))throw new z(z.INVALID_CHARACTER_ERR,'invalid character in qualified name "'+t+'"')}function ni(t,e){ia(e),t=t||null;var n=null,r=e;if(e.indexOf(":")>=0){var o=e.split(":");n=o[0],r=o[1]}if(n!==null&&t===null)throw new z(z.NAMESPACE_ERR,"prefix is non-null and namespace is null");if(n==="xml"&&t!==nt.NAMESPACE.XML)throw new z(z.NAMESPACE_ERR,'prefix is "xml" and namespace is not the XML namespace');if((n==="xmlns"||e==="xmlns")&&t!==nt.NAMESPACE.XMLNS)throw new z(z.NAMESPACE_ERR,'either qualifiedName or prefix is "xmlns" and namespace is not the XMLNS namespace');if(t===nt.NAMESPACE.XMLNS&&n!=="xmlns"&&e!=="xmlns")throw new z(z.NAMESPACE_ERR,'namespace is the XMLNS namespace and neither qualifiedName nor prefix is "xmlns"');return[t,n,r]}function hn(t,e){for(var n in t)pn(t,n)&&(e[n]=t[n])}function Ke(t,e){var n=t.prototype;if(!(n instanceof e)){let r=function(){};r.prototype=e.prototype,r=new r,hn(n,r),t.prototype=n=r}n.constructor!=t&&(typeof t!="function"&&console.error("unknown Class:"+t),n.constructor=t)}var Ge={},tt=Ge.ELEMENT_NODE=1,fn=Ge.ATTRIBUTE_NODE=2,nr=Ge.TEXT_NODE=3,sa=Ge.CDATA_SECTION_NODE=4,aa=Ge.ENTITY_REFERENCE_NODE=5,rp=Ge.ENTITY_NODE=6,ri=Ge.PROCESSING_INSTRUCTION_NODE=7,oi=Ge.COMMENT_NODE=8,un=Ge.DOCUMENT_NODE=9,ca=Ge.DOCUMENT_TYPE_NODE=10,Nt=Ge.DOCUMENT_FRAGMENT_NODE=11,op=Ge.NOTATION_NODE=12,we=nt.freeze({DOCUMENT_POSITION_DISCONNECTED:1,DOCUMENT_POSITION_PRECEDING:2,DOCUMENT_POSITION_FOLLOWING:4,DOCUMENT_POSITION_CONTAINS:8,DOCUMENT_POSITION_CONTAINED_BY:16,DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:32});function la(t,e){if(e.length<t.length)return la(e,t);var n=null;for(var r in t){if(t[r]!==e[r])return n;n=t[r]}return n}function Zs(t){return t.guid||(t.guid=Math.random()),t.guid}function ke(){}ke.prototype={length:0,item:function(t){return t>=0&&t<this.length?this[t]:null},toString:function(t){var e;typeof t=="function"?e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:t}:t?e={requireWellFormed:!!t.requireWellFormed,splitCDATASections:t.splitCDATASections!==!1,nodeFilter:t.nodeFilter||null}:e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:null};for(var n=[],r=0;r<this.length;r++)li(this[r],n,null,e);return n.join("")},filter:function(t){return Array.prototype.filter.call(this,t)},indexOf:function(t){return Array.prototype.indexOf.call(this,t)}};ke.prototype[Symbol.iterator]=function(){var t=this,e=0;return{next:function(){return e<t.length?{value:t[e++],done:!1}:{done:!0}},return:function(){return{done:!0}}}};function ct(t,e){this._node=t,this._refresh=e,qr(this)}function qr(t){var e=t._node._inc||t._node.ownerDocument._inc;if(t._inc!==e){var n=t._refresh(t._node);if(va(t,"length",n.length),!t.$$length||n.length<t.$$length)for(var r=n.length;r in t;r++)pn(t,r)&&delete t[r];hn(n,t),t._inc=e}}ct.prototype.item=function(t){return qr(this),this[t]||null};Ke(ct,ke);function mn(){this._nsIndex=Object.create(null),this._noNsIndex=Object.create(null)}function da(t,e){for(var n=0;n<t.length;){if(t[n]===e)return n;n++}}function ii(t,e,n){if(!e)return t._noNsIndex;var r=t._nsIndex[e];return!r&&n&&(r=t._nsIndex[e]=Object.create(null)),r}function ip(t,e,n){var r=ii(t,e,!1),o=r&&r[n];return o||null}function sp(t,e){ii(t,e.namespaceURI,!0)[e.localName]=e}function ap(t,e){var n=ii(t,e.namespaceURI,!1);n&&delete n[e.localName]}function cp(t,e,n,r){if(r?e[da(e,r)]=n:(e[e.length]=n,e.length++),sp(e,n),t){n.ownerElement=t;var o=t.ownerDocument;o&&(r&&fa(o,t,r),lp(o,t,n))}}function ea(t,e,n){var r=da(e,n);if(r>=0){for(var o=e.length-1;r<=o;)e[r]=e[++r];if(e.length=o,ap(e,n),t){var i=t.ownerDocument;i&&fa(i,t,n),n.ownerElement=null}}}mn.prototype={length:0,item:ke.prototype.item,getNamedItem:function(t){this._ownerElement&&this._ownerElement._isInHTMLDocumentAndNamespace()&&(t=t.toLowerCase());for(var e=0;e<this.length;){var n=this[e];if(n.nodeName===t)return n;e++}return null},setNamedItem:function(t){var e=t.ownerElement;if(e&&e!==this._ownerElement)throw new z(z.INUSE_ATTRIBUTE_ERR);var n=ip(this,t.namespaceURI,t.localName);return n===t?t:(cp(this._ownerElement,this,t,n),n)},setNamedItemNS:function(t){return this.setNamedItem(t)},removeNamedItem:function(t){var e=this.getNamedItem(t);if(!e)throw new z(z.NOT_FOUND_ERR,t);return ea(this._ownerElement,this,e),e},removeNamedItemNS:function(t,e){var n=this.getNamedItemNS(t,e);if(!n)throw new z(z.NOT_FOUND_ERR,t?t+" : "+e:e);return ea(this._ownerElement,this,n),n},getNamedItemNS:function(t,e){t||(t=null);for(var n=0;n<this.length;){var r=this[n];if(r.localName===e&&r.namespaceURI===t)return r;n++}return null}};mn.prototype[Symbol.iterator]=function(){var t=this,e=0;return{next:function(){return e<t.length?{value:t[e++],done:!1}:{done:!0}},return:function(){return{done:!0}}}};function ua(){}ua.prototype={hasFeature:function(t,e){return!0},createDocument:function(t,e,n){var r=tr.XML_APPLICATION;t===dt.HTML?r=tr.XML_XHTML_APPLICATION:t===dt.SVG&&(r=tr.XML_SVG_IMAGE);var o=new wt(je,{contentType:r});if(o.implementation=this,o.childNodes=new ke,o.doctype=n||null,n&&o.appendChild(n),e){var i=o.createElementNS(t,e);o.appendChild(i)}return o},createDocumentType:function(t,e,n,r){ia(t);var o=new Wr(je);return o.name=t,o.nodeName=t,o.publicId=e||"",o.systemId=n||"",o.internalSubset=r||"",o.childNodes=new ke,o},createHTMLDocument:function(t){var e=new wt(je,{contentType:tr.HTML});if(e.implementation=this,e.childNodes=new ke,t!==!1){e.doctype=this.createDocumentType("html"),e.doctype.ownerDocument=e,e.appendChild(e.doctype);var n=e.createElement("html");e.appendChild(n);var r=e.createElement("head");if(n.appendChild(r),typeof t=="string"){var o=e.createElement("title");o.appendChild(e.createTextNode(t)),r.appendChild(o)}n.appendChild(e.createElement("body"))}return e}};function ae(t){Ve(t)}ae.prototype={firstChild:null,lastChild:null,previousSibling:null,nextSibling:null,parentNode:null,get parentElement(){return this.parentNode&&this.parentNode.nodeType===this.ELEMENT_NODE?this.parentNode:null},childNodes:null,ownerDocument:null,nodeValue:null,namespaceURI:null,prefix:null,localName:null,baseURI:"about:blank",get isConnected(){var t=this.getRootNode();return t&&t.nodeType===t.DOCUMENT_NODE},contains:function(t){if(!t)return!1;var e=t;do{if(this===e)return!0;e=e.parentNode}while(e);return!1},getRootNode:function(t){var e=this;do{if(!e.parentNode)return e;e=e.parentNode}while(e)},isEqualNode:function(t){if(!t)return!1;for(var e=[{node:this,other:t}];e.length>0;){var n=e.pop(),r=n.node,o=n.other;if(r.nodeType!==o.nodeType)return!1;switch(r.nodeType){case r.DOCUMENT_TYPE_NODE:if(r.name!==o.name||r.publicId!==o.publicId||r.systemId!==o.systemId)return!1;break;case r.ELEMENT_NODE:if(r.namespaceURI!==o.namespaceURI||r.prefix!==o.prefix||r.localName!==o.localName||r.attributes.length!==o.attributes.length)return!1;for(var i=0;i<r.attributes.length;i++){var s=r.attributes.item(i),a=o.getAttributeNodeNS(s.namespaceURI,s.localName);if(!a)return!1;e.push({node:s,other:a})}break;case r.ATTRIBUTE_NODE:if(r.namespaceURI!==o.namespaceURI||r.localName!==o.localName||r.value!==o.value)return!1;break;case r.PROCESSING_INSTRUCTION_NODE:if(r.target!==o.target||r.data!==o.data)return!1;break;case r.TEXT_NODE:case r.CDATA_SECTION_NODE:case r.COMMENT_NODE:if(r.data!==o.data)return!1;break}if(r.childNodes.length!==o.childNodes.length)return!1;for(var i=r.childNodes.length-1;i>=0;i--)e.push({node:r.childNodes[i],other:o.childNodes[i]})}return!0},isSameNode:function(t){return this===t},insertBefore:function(t,e){return Ur(this,t,e)},replaceChild:function(t,e){Ur(this,t,e,ga),e&&this.removeChild(e)},removeChild:function(t){return ma(this,t)},appendChild:function(t){return this.insertBefore(t,null)},hasChildNodes:function(){return this.firstChild!=null},cloneNode:function(t){return wa(this.ownerDocument||this,this,t)},normalize:function(){Pe(this,null,{enter:function(t){for(var e=t.firstChild;e;){var n=e.nextSibling;if(n!==null&&n.nodeType===nr&&e.nodeType===nr){for(var r=[],o=n;o!==null&&o.nodeType===nr;)r.push(o.data),o=o.nextSibling;for(var i=e.nextSibling;i!==o;){var s=i.nextSibling;i.parentNode=null,i.previousSibling=null,i.nextSibling=null,i=s}e.nextSibling=o,o!==null?o.previousSibling=e:t.lastChild=e,e.appendData(r.join("")),si(t.ownerDocument,t),e=o}else e=n}return!0}})},isSupported:function(t,e){return this.ownerDocument.implementation.hasFeature(t,e)},lookupPrefix:function(t){for(var e=this;e;){var n=e._nsMap;if(n){for(var r in n)if(pn(n,r)&&n[r]===t)return r}e=e.nodeType==fn?e.ownerDocument:e.parentNode}return null},lookupNamespaceURI:function(t){for(var e=this;e;){var n=e._nsMap;if(n&&pn(n,t))return n[t];e=e.nodeType==fn?e.ownerDocument:e.parentNode}return null},isDefaultNamespace:function(t){var e=this.lookupPrefix(t);return e==null},compareDocumentPosition:function(t){if(this===t)return 0;var e=t,n=this,r=null,o=null;if(e instanceof jt&&(r=e,e=r.ownerElement),n instanceof jt&&(o=n,n=o.ownerElement,r&&e&&n===e))for(var i=0,s;s=n.attributes[i];i++){if(s===r)return we.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC+we.DOCUMENT_POSITION_PRECEDING;if(s===o)return we.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC+we.DOCUMENT_POSITION_FOLLOWING}if(!e||!n||n.ownerDocument!==e.ownerDocument)return we.DOCUMENT_POSITION_DISCONNECTED+we.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC+(Zs(n.ownerDocument)>Zs(e.ownerDocument)?we.DOCUMENT_POSITION_FOLLOWING:we.DOCUMENT_POSITION_PRECEDING);if(o&&e===n)return we.DOCUMENT_POSITION_CONTAINS+we.DOCUMENT_POSITION_PRECEDING;if(r&&e===n)return we.DOCUMENT_POSITION_CONTAINED_BY+we.DOCUMENT_POSITION_FOLLOWING;for(var a=[],c=e.parentNode;c;){if(!o&&c===n)return we.DOCUMENT_POSITION_CONTAINED_BY+we.DOCUMENT_POSITION_FOLLOWING;a.push(c),c=c.parentNode}a.reverse();for(var l=[],u=n.parentNode;u;){if(!r&&u===e)return we.DOCUMENT_POSITION_CONTAINS+we.DOCUMENT_POSITION_PRECEDING;l.push(u),u=u.parentNode}l.reverse();var m=la(a,l);for(var g in m.childNodes){var E=m.childNodes[g];if(E===n)return we.DOCUMENT_POSITION_FOLLOWING;if(E===e)return we.DOCUMENT_POSITION_PRECEDING;if(l.indexOf(E)>=0)return we.DOCUMENT_POSITION_FOLLOWING;if(a.indexOf(E)>=0)return we.DOCUMENT_POSITION_PRECEDING}return 0}};function pa(t){return t=="<"&&"&lt;"||t==">"&&"&gt;"||t=="&"&&"&amp;"||t=='"'&&"&quot;"||"&#"+t.charCodeAt()+";"}hn(Ge,ae);hn(Ge,ae.prototype);hn(we,ae);hn(we,ae.prototype);function Rr(t,e){Pe(t,null,{enter:function(n){return e(n)?Pe.STOP:!0}})}function Pe(t,e,n){for(var r=[{node:t,context:e,phase:Pe.ENTER}];r.length>0;){var o=r.pop();if(o.phase===Pe.ENTER){var i=n.enter(o.node,o.context);if(i===Pe.STOP)return Pe.STOP;if(r.push({node:o.node,context:i,phase:Pe.EXIT}),i==null)continue;for(var s=o.node.lastChild;s;)r.push({node:s,context:i,phase:Pe.ENTER}),s=s.previousSibling}else n.exit&&n.exit(o.node,o.context)}}Pe.STOP=Symbol("walkDOM.STOP");Pe.ENTER=0;Pe.EXIT=1;function wt(t,e){Ve(t);var n=e||{};this.ownerDocument=this,this.contentType=n.contentType||tr.XML_APPLICATION,this.type=Ju(this.contentType)?"html":"xml"}function lp(t,e,n){t&&t._inc++;var r=n.namespaceURI;r===dt.XMLNS&&(e._nsMap[n.prefix?n.localName:""]=n.value)}function fa(t,e,n,r){t&&t._inc++;var o=n.namespaceURI;o===dt.XMLNS&&delete e._nsMap[n.prefix?n.localName:""]}function si(t,e,n){if(t&&t._inc){t._inc++;var r=e.childNodes;if(n&&!n.nextSibling)r[r.length++]=n;else{for(var o=e.firstChild,i=0;o;)r[i++]=o,o=o.nextSibling;r.length=i,delete r[r.length]}}}function ma(t,e){if(t!==e.parentNode)throw new z(z.NOT_FOUND_ERR,"child's parent is not parent");var n=e.previousSibling,r=e.nextSibling;return n?n.nextSibling=r:t.firstChild=r,r?r.previousSibling=n:t.lastChild=n,si(t.ownerDocument,t),e.parentNode=null,e.previousSibling=null,e.nextSibling=null,e}function dp(t){return t&&(t.nodeType===ae.DOCUMENT_NODE||t.nodeType===ae.DOCUMENT_FRAGMENT_NODE||t.nodeType===ae.ELEMENT_NODE)}function up(t){return t&&(t.nodeType===ae.CDATA_SECTION_NODE||t.nodeType===ae.COMMENT_NODE||t.nodeType===ae.DOCUMENT_FRAGMENT_NODE||t.nodeType===ae.DOCUMENT_TYPE_NODE||t.nodeType===ae.ELEMENT_NODE||t.nodeType===ae.PROCESSING_INSTRUCTION_NODE||t.nodeType===ae.TEXT_NODE)}function Bt(t){return t&&t.nodeType===ae.DOCUMENT_TYPE_NODE}function yt(t){return t&&t.nodeType===ae.ELEMENT_NODE}function ha(t){return t&&t.nodeType===ae.TEXT_NODE}function ta(t,e){var n=t.childNodes||[];if(lt(n,yt)||Bt(e))return!1;var r=lt(n,Bt);return!(e&&r&&n.indexOf(r)>n.indexOf(e))}function na(t,e){var n=t.childNodes||[];function r(i){return yt(i)&&i!==e}if(lt(n,r))return!1;var o=lt(n,Bt);return!(e&&o&&n.indexOf(o)>n.indexOf(e))}function pp(t,e,n){if(!dp(t))throw new z(z.HIERARCHY_REQUEST_ERR,"Unexpected parent node type "+t.nodeType);if(n&&n.parentNode!==t)throw new z(z.NOT_FOUND_ERR,"child not in parent");if(!up(e)||Bt(e)&&t.nodeType!==ae.DOCUMENT_NODE)throw new z(z.HIERARCHY_REQUEST_ERR,"Unexpected node type "+e.nodeType+" for parent node type "+t.nodeType)}function fp(t,e,n){var r=t.childNodes||[],o=e.childNodes||[];if(e.nodeType===ae.DOCUMENT_FRAGMENT_NODE){var i=o.filter(yt);if(i.length>1||lt(o,ha))throw new z(z.HIERARCHY_REQUEST_ERR,"More than one element or text in fragment");if(i.length===1&&!ta(t,n))throw new z(z.HIERARCHY_REQUEST_ERR,"Element in fragment can not be inserted before doctype")}if(yt(e)&&!ta(t,n))throw new z(z.HIERARCHY_REQUEST_ERR,"Only one element can be added and only after doctype");if(Bt(e)){if(lt(r,Bt))throw new z(z.HIERARCHY_REQUEST_ERR,"Only one doctype is allowed");var s=lt(r,yt);if(n&&r.indexOf(s)<r.indexOf(n))throw new z(z.HIERARCHY_REQUEST_ERR,"Doctype can only be inserted before an element");if(!n&&s)throw new z(z.HIERARCHY_REQUEST_ERR,"Doctype can not be appended since element is present")}}function ga(t,e,n){var r=t.childNodes||[],o=e.childNodes||[];if(e.nodeType===ae.DOCUMENT_FRAGMENT_NODE){var i=o.filter(yt);if(i.length>1||lt(o,ha))throw new z(z.HIERARCHY_REQUEST_ERR,"More than one element or text in fragment");if(i.length===1&&!na(t,n))throw new z(z.HIERARCHY_REQUEST_ERR,"Element in fragment can not be inserted before doctype")}if(yt(e)&&!na(t,n))throw new z(z.HIERARCHY_REQUEST_ERR,"Only one element can be added and only after doctype");if(Bt(e)){if(lt(r,function(c){return Bt(c)&&c!==n}))throw new z(z.HIERARCHY_REQUEST_ERR,"Only one doctype is allowed");var s=lt(r,yt);if(n&&r.indexOf(s)<r.indexOf(n))throw new z(z.HIERARCHY_REQUEST_ERR,"Doctype can only be inserted before an element")}}function Ur(t,e,n,r){pp(t,e,n),t.nodeType===ae.DOCUMENT_NODE&&(r||fp)(t,e,n);var o=e.parentNode;if(o&&o.removeChild(e),e.nodeType===Nt){var i=e.firstChild;if(i==null)return e;var s=e.lastChild}else i=s=e;var a=n?n.previousSibling:t.lastChild;i.previousSibling=a,s.nextSibling=n,a?a.nextSibling=i:t.firstChild=i,n==null?t.lastChild=s:n.previousSibling=s;do i.parentNode=t;while(i!==s&&(i=i.nextSibling));return si(t.ownerDocument||t,t,e),e.nodeType==Nt&&(e.firstChild=e.lastChild=null),e}wt.prototype={implementation:null,nodeName:"#document",nodeType:un,doctype:null,documentElement:null,_inc:1,insertBefore:function(t,e){if(t.nodeType===Nt){for(var n=t.firstChild;n;){var r=n.nextSibling;this.insertBefore(n,e),n=r}return t}return Ur(this,t,e),t.ownerDocument=this,this.documentElement===null&&t.nodeType===tt&&(this.documentElement=t),t},removeChild:function(t){var e=ma(this,t);return e===this.documentElement&&(this.documentElement=null),e},replaceChild:function(t,e){Ur(this,t,e,ga),t.ownerDocument=this,e&&this.removeChild(e),yt(t)&&(this.documentElement=t)},importNode:function(t,e){return mp(this,t,e)},getElementById:function(t){var e=null;return Rr(this.documentElement,function(n){if(n.nodeType==tt&&n.getAttribute("id")==t)return e=n,!0}),e},createElement:function(t){var e=new vt(je);e.ownerDocument=this,this.type==="html"&&(t=t.toLowerCase()),Yu(this.contentType)&&(e.namespaceURI=dt.HTML),e.nodeName=t,e.tagName=t,e.localName=t,e.childNodes=new ke;var n=e.attributes=new mn;return n._ownerElement=e,e},createDocumentFragment:function(){var t=new gn(je);return t.ownerDocument=this,t.childNodes=new ke,t},createTextNode:function(t){var e=new rr(je);return e.ownerDocument=this,e.childNodes=new ke,e.appendData(t),e},createComment:function(t){var e=new jr(je);return e.ownerDocument=this,e.childNodes=new ke,e.appendData(t),e},createCDATASection:function(t){if(t.indexOf("]]>")!==-1)throw new z(z.INVALID_CHARACTER_ERR,'data contains "]]>"');var e=new Hr(je);return e.ownerDocument=this,e.childNodes=new ke,e.appendData(t),e},createProcessingInstruction:function(t,e){var n=new Vr(je);return n.ownerDocument=this,n.childNodes=new ke,n.nodeName=n.target=t,n.nodeValue=n.data=e,n},createAttribute:function(t){if(!ve.QName_exact.test(t))throw new z(z.INVALID_CHARACTER_ERR,'invalid character in name "'+t+'"');return this.type==="html"&&(t=t.toLowerCase()),this._createAttribute(t)},_createAttribute:function(t){var e=new jt(je);return e.ownerDocument=this,e.childNodes=new ke,e.name=t,e.nodeName=t,e.localName=t,e.specified=!0,e},createEntityReference:function(t){if(!ve.Name_exact.test(t))throw new z(z.INVALID_CHARACTER_ERR,'not a valid xml name "'+t+'"');if(this.type==="html")throw new z("document is an html document",Re.NotSupportedError);var e=new zr(je);return e.ownerDocument=this,e.childNodes=new ke,e.nodeName=t,e},createElementNS:function(t,e){var n=ni(t,e),r=new vt(je),o=r.attributes=new mn;return r.childNodes=new ke,r.ownerDocument=this,r.nodeName=e,r.tagName=e,r.namespaceURI=n[0],r.prefix=n[1],r.localName=n[2],o._ownerElement=r,r},createAttributeNS:function(t,e){var n=ni(t,e),r=new jt(je);return r.ownerDocument=this,r.childNodes=new ke,r.nodeName=e,r.name=e,r.specified=!0,r.namespaceURI=n[0],r.prefix=n[1],r.localName=n[2],r}};Ke(wt,ae);function vt(t){Ve(t),this._nsMap=Object.create(null)}vt.prototype={nodeType:tt,attributes:null,getQualifiedName:function(){return this.prefix?this.prefix+":"+this.localName:this.localName},_isInHTMLDocumentAndNamespace:function(){return this.ownerDocument.type==="html"&&this.namespaceURI===dt.HTML},hasAttributes:function(){return!!(this.attributes&&this.attributes.length)},hasAttribute:function(t){return!!this.getAttributeNode(t)},getAttribute:function(t){var e=this.getAttributeNode(t);return e?e.value:null},getAttributeNode:function(t){return this._isInHTMLDocumentAndNamespace()&&(t=t.toLowerCase()),this.attributes.getNamedItem(t)},setAttribute:function(t,e){this._isInHTMLDocumentAndNamespace()&&(t=t.toLowerCase());var n=this.getAttributeNode(t);n?n.value=n.nodeValue=""+e:(n=this.ownerDocument._createAttribute(t),n.value=n.nodeValue=""+e,this.setAttributeNode(n))},removeAttribute:function(t){var e=this.getAttributeNode(t);e&&this.removeAttributeNode(e)},setAttributeNode:function(t){return this.attributes.setNamedItem(t)},setAttributeNodeNS:function(t){return this.attributes.setNamedItemNS(t)},removeAttributeNode:function(t){return this.attributes.removeNamedItem(t.nodeName)},removeAttributeNS:function(t,e){var n=this.getAttributeNodeNS(t,e);n&&this.removeAttributeNode(n)},hasAttributeNS:function(t,e){return this.getAttributeNodeNS(t,e)!=null},getAttributeNS:function(t,e){var n=this.getAttributeNodeNS(t,e);return n?n.value:null},setAttributeNS:function(t,e,n){var r=ni(t,e),o=r[2],i=this.getAttributeNodeNS(t,o);i?i.value=i.nodeValue=""+n:(i=this.ownerDocument.createAttributeNS(t,e),i.value=i.nodeValue=""+n,this.setAttributeNode(i))},getAttributeNodeNS:function(t,e){return this.attributes.getNamedItemNS(t,e)},getElementsByClassName:function(t){var e=Qs(t);return new ct(this,function(n){var r=[];return e.length>0&&Rr(n,function(o){if(o!==n&&o.nodeType===tt){var i=o.getAttribute("class");if(i){var s=t===i;if(!s){var a=Qs(i);s=e.every(np(a))}s&&r.push(o)}}}),r})},getElementsByTagName:function(t){var e=(this.nodeType===un?this:this.ownerDocument).type==="html",n=t.toLowerCase();return new ct(this,function(r){var o=[];return Rr(r,function(i){if(!(i===r||i.nodeType!==tt))if(t==="*")o.push(i);else{var s=i.getQualifiedName(),a=e&&i.namespaceURI===dt.HTML?n:t;s===a&&o.push(i)}}),o})},getElementsByTagNameNS:function(t,e){return new ct(this,function(n){var r=[];return Rr(n,function(o){o!==n&&o.nodeType===tt&&(t==="*"||o.namespaceURI===t)&&(e==="*"||o.localName==e)&&r.push(o)}),r})}};wt.prototype.getElementsByClassName=vt.prototype.getElementsByClassName;wt.prototype.getElementsByTagName=vt.prototype.getElementsByTagName;wt.prototype.getElementsByTagNameNS=vt.prototype.getElementsByTagNameNS;Ke(vt,ae);function jt(t){Ve(t),this.namespaceURI=null,this.prefix=null,this.ownerElement=null}jt.prototype.nodeType=fn;Ke(jt,ae);function $t(t){Ve(t)}$t.prototype={data:"",substringData:function(t,e){return this.data.substring(t,t+e)},appendData:function(t){t=this.data+t,this.nodeValue=this.data=t,this.length=t.length},insertData:function(t,e){this.replaceData(t,0,e)},deleteData:function(t,e){this.replaceData(t,e,"")},replaceData:function(t,e,n){var r=this.data.substring(0,t),o=this.data.substring(t+e);n=r+n+o,this.nodeValue=this.data=n,this.length=n.length}};Ke($t,ae);function rr(t){Ve(t)}rr.prototype={nodeName:"#text",nodeType:nr,splitText:function(t){var e=this.data,n=e.substring(t);e=e.substring(0,t),this.data=this.nodeValue=e,this.length=e.length;var r=this.ownerDocument.createTextNode(n);return this.parentNode&&this.parentNode.insertBefore(r,this.nextSibling),r}};Ke(rr,$t);function jr(t){Ve(t)}jr.prototype={nodeName:"#comment",nodeType:oi};Ke(jr,$t);function Hr(t){Ve(t)}Hr.prototype={nodeName:"#cdata-section",nodeType:sa};Ke(Hr,rr);function Wr(t){Ve(t)}Wr.prototype.nodeType=ca;Ke(Wr,ae);function ai(t){Ve(t)}ai.prototype.nodeType=op;Ke(ai,ae);function ci(t){Ve(t)}ci.prototype.nodeType=rp;Ke(ci,ae);function zr(t){Ve(t)}zr.prototype.nodeType=aa;Ke(zr,ae);function gn(t){Ve(t)}gn.prototype.nodeName="#document-fragment";gn.prototype.nodeType=Nt;Ke(gn,ae);function Vr(t){Ve(t)}Vr.prototype.nodeType=ri;Ke(Vr,$t);function ba(){}ba.prototype.serializeToString=function(t,e){return ya.call(t,e)};ae.prototype.toString=ya;function ya(t){var e;typeof t=="function"?e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:t}:t!=null?e={requireWellFormed:!!t.requireWellFormed,splitCDATASections:t.splitCDATASections!==!1,nodeFilter:t.nodeFilter||null}:e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:null};var n=[],r=this.nodeType===un&&this.documentElement||this,o=r.prefix,i=r.namespaceURI;if(i&&o==null){var o=r.lookupPrefix(i);if(o==null)var s=[{namespace:i,prefix:null}]}return li(this,n,s,e),n.join("")}function ra(t,e,n){var r=t.prefix||"",o=t.namespaceURI;if(!o||r==="xml"&&o===dt.XML||o===dt.XMLNS)return!1;for(var i=n.length;i--;){var s=n[i];if(s.prefix===r)return s.namespace!==o}return!0}function Mr(t,e,n,r){if(r&&!ve.QName_exact.test(e))throw new z('The attribute name "'+e+'" is not a valid XML QName',Re.InvalidStateError);t.push(" ",e,'="',n.replace(/[<>&"\t\n\r]/g,pa),'"')}function li(t,e,n,r){n||(n=[]);var o=r.nodeFilter,i=r.requireWellFormed,s=r.splitCDATASections,a=t.nodeType===un?t:t.ownerDocument,c=a.type==="html";Pe(t,{ns:n},{enter:function(l,u){var m=u.ns;if(o)if(l=o(l),l){if(typeof l=="string")return e.push(l),null}else return null;switch(l.nodeType){case tt:var g=l.attributes,E=g.length,C=l.tagName,A=C;if(!c&&!l.prefix&&l.namespaceURI){for(var N,B=0;B<g.length;B++)if(g.item(B).name==="xmlns"){N=g.item(B).value;break}if(!N)for(var v=m.length-1;v>=0;v--){var x=m[v];if(x.prefix===""&&x.namespace===l.namespaceURI){N=x.namespace;break}}if(N!==l.namespaceURI)for(var v=m.length-1;v>=0;v--){var x=m[v];if(x.namespace===l.namespaceURI){x.prefix&&(A=x.prefix+":"+C);break}}}if(i&&!ve.QName_exact.test(A))throw new z('The element name "'+A+'" is not a valid XML QName',Re.InvalidStateError);e.push("<",A);for(var k=m.slice(),L=0;L<E;L++){var h=g.item(L);h.prefix=="xmlns"?k.push({prefix:h.localName,namespace:h.value}):h.nodeName=="xmlns"&&k.push({prefix:"",namespace:h.value})}for(var L=0;L<E;L++){var h=g.item(L);if(ra(h,c,k)){var d=h.prefix||"",b=h.namespaceURI;Mr(e,d?"xmlns:"+d:"xmlns",b,i),k.push({prefix:d,namespace:b})}var S=o?o(h):h;S&&(typeof S=="string"?e.push(S):Mr(e,S.name,S.value,i))}if(C===A&&ra(l,c,k)){var T=l.prefix||"",b=l.namespaceURI;Mr(e,T?"xmlns:"+T:"xmlns",b,i),k.push({prefix:T,namespace:b})}var I=!l.firstChild;if(I&&(c||l.namespaceURI===dt.HTML)&&(I=Qu(C)),I)return e.push("/>"),null;if(e.push(">"),c&&Xu(C)){for(var P=l.firstChild;P;)P.data?e.push(P.data):li(P,e,k.slice(),r),P=P.nextSibling;return e.push("</",A,">"),null}return{ns:k,tag:A};case un:case Nt:if(i&&l.nodeType===un&&l.documentElement==null)throw new z("The Document has no documentElement",Re.InvalidStateError);return{ns:m};case fn:return Mr(e,l.name,l.value,i),null;case nr:if(i&&ve.InvalidChar.test(l.data))throw new z("The Text node data contains characters outside the XML Char production",Re.InvalidStateError);return e.push(l.data.replace(/[<&>]/g,pa)),null;case sa:if(i&&l.data.indexOf("]]>")!==-1)throw new z('The CDATASection data contains "]]>"',Re.InvalidStateError);return s?e.push(ve.CDATA_START,l.data.replace(/]]>/g,"]]]]><![CDATA[>"),ve.CDATA_END):e.push(ve.CDATA_START,l.data,ve.CDATA_END),null;case oi:if(i){if(ve.InvalidChar.test(l.data))throw new z("The comment node data contains characters outside the XML Char production",Re.InvalidStateError);if(l.data.indexOf("--")!==-1||l.data[l.data.length-1]==="-")throw new z('The comment node data contains "--" or ends with "-"',Re.InvalidStateError)}return e.push(ve.COMMENT_START,l.data,ve.COMMENT_END),null;case ca:var R=l.publicId,$=l.systemId;if(i){if(!ve.Name_exact.test(l.name))throw new z('The doctype name "'+l.name+'" is not a valid XML Name',Re.InvalidStateError);if(R&&!ve.PubidLiteral_match.test(R))throw new z("DocumentType publicId is not a valid PubidLiteral",Re.InvalidStateError);if($&&$!=="."&&!ve.SystemLiteral_match.test($))throw new z("DocumentType systemId is not a valid SystemLiteral",Re.InvalidStateError);if(l.internalSubset&&l.internalSubset.indexOf("]>")!==-1)throw new z('DocumentType internalSubset contains "]>"',Re.InvalidStateError)}return e.push(ve.DOCTYPE_DECL_START," ",l.name),R?(e.push(" ",ve.PUBLIC," ",R),$&&$!=="."&&e.push(" ",$)):$&&$!=="."&&e.push(" ",ve.SYSTEM," ",$),l.internalSubset&&e.push(" [",l.internalSubset,"]"),e.push(">"),null;case ri:if(i){if(!ve.NCName_exact.test(l.target)||l.target.toLowerCase()==="xml")throw new z('The processing instruction target "'+l.target+'" is not a valid XML NCName or is reserved',Re.InvalidStateError);if(ve.InvalidChar.test(l.data))throw new z("The ProcessingInstruction data contains characters outside the XML Char production",Re.InvalidStateError);if(l.data.indexOf("?>")!==-1)throw new z('The ProcessingInstruction data contains "?>"',Re.InvalidStateError)}return e.push("<?",l.target," ",l.data,"?>"),null;case aa:if(i&&!ve.Name_exact.test(l.nodeName))throw new z('The entity reference name "'+l.nodeName+'" is not a valid XML Name',Re.InvalidStateError);return e.push("&",l.nodeName,";"),null;default:return e.push("??",l.nodeName),null}},exit:function(l,u){u&&u.tag&&e.push("</",u.tag,">")}})}function mp(t,e,n){var r;return Pe(e,null,{enter:function(o,i){var s=o.cloneNode(!1);s.ownerDocument=t,s.parentNode=null,i===null?r=s:i.appendChild(s);var a=o.nodeType===fn||n;return a?s:null}}),r}function wa(t,e,n){var r;return Pe(e,null,{enter:function(o,i){var s=new o.constructor(je);for(var a in o)if(pn(o,a)){var c=o[a];typeof c!="object"&&c!=s[a]&&(s[a]=c)}o.childNodes&&(s.childNodes=new ke),s.ownerDocument=t;var l=n;switch(s.nodeType){case tt:var u=o.attributes,m=s.attributes=new mn,g=u.length;m._ownerElement=s;for(var E=0;E<g;E++)s.setAttributeNode(wa(t,u.item(E),!0));break;case fn:l=!0}return i!==null?i.appendChild(s):r=s,l?s:null}}),r}function va(t,e,n){t[e]=n}function ti(t){for(var e=[],n=t.firstChild;n;)n.nodeType===tt&&e.push(n),n=n.nextSibling;return e}try{Object.defineProperty&&(Object.defineProperty(ct.prototype,"length",{get:function(){return qr(this),this.$$length}}),Object.defineProperty(ae.prototype,"textContent",{get:function(){if(this.nodeType===tt||this.nodeType===Nt){var t=[];return Pe(this,null,{enter:function(e){if(e.nodeType===tt||e.nodeType===Nt)return!0;if(e.nodeType===ri||e.nodeType===oi)return null;t.push(e.nodeValue)}}),t.join("")}return this.nodeValue},set:function(t){switch(this.nodeType){case tt:case Nt:for(;this.firstChild;)this.removeChild(this.firstChild);(t||String(t))&&this.appendChild(this.ownerDocument.createTextNode(t));break;default:this.data=t,this.value=t,this.nodeValue=t}}}),Object.defineProperty($t.prototype,"data",{get:function(){return this._data!=null?this._data:""},set:function(t){this._data=t,this.length=typeof t=="string"?t.length:0}}),Object.defineProperty($t.prototype,"nodeValue",{get:function(){return this.data},set:function(t){this.data=t},enumerable:!0,configurable:!0}),Object.defineProperty(vt.prototype,"children",{get:function(){return new ct(this,ti)}}),Object.defineProperty(wt.prototype,"children",{get:function(){return new ct(this,ti)}}),Object.defineProperty(gn.prototype,"children",{get:function(){return new ct(this,ti)}}),va=function(t,e,n){t["$$"+e]=n})}catch{}Ee._updateLiveList=qr;Ee.Attr=jt;Ee.CDATASection=Hr;Ee.CharacterData=$t;Ee.Comment=jr;Ee.Document=wt;Ee.DocumentFragment=gn;Ee.DocumentType=Wr;Ee.DOMImplementation=ua;Ee.Element=vt;Ee.Entity=ci;Ee.EntityReference=zr;Ee.LiveNodeList=ct;Ee.NamedNodeMap=mn;Ee.Node=ae;Ee.NodeList=ke;Ee.Notation=ai;Ee.Text=rr;Ee.ProcessingInstruction=Vr;Ee.walkDOM=Pe;Ee.XMLSerializer=ba});var xa=de(or=>{"use strict";var Ea=qt().freeze;or.XML_ENTITIES=Ea({amp:"&",apos:"'",gt:">",lt:"<",quot:'"'});or.HTML_ENTITIES=Ea({Aacute:"\xC1",aacute:"\xE1",Abreve:"\u0102",abreve:"\u0103",ac:"\u223E",acd:"\u223F",acE:"\u223E\u0333",Acirc:"\xC2",acirc:"\xE2",acute:"\xB4",Acy:"\u0410",acy:"\u0430",AElig:"\xC6",aelig:"\xE6",af:"\u2061",Afr:"\u{1D504}",afr:"\u{1D51E}",Agrave:"\xC0",agrave:"\xE0",alefsym:"\u2135",aleph:"\u2135",Alpha:"\u0391",alpha:"\u03B1",Amacr:"\u0100",amacr:"\u0101",amalg:"\u2A3F",AMP:"&",amp:"&",And:"\u2A53",and:"\u2227",andand:"\u2A55",andd:"\u2A5C",andslope:"\u2A58",andv:"\u2A5A",ang:"\u2220",ange:"\u29A4",angle:"\u2220",angmsd:"\u2221",angmsdaa:"\u29A8",angmsdab:"\u29A9",angmsdac:"\u29AA",angmsdad:"\u29AB",angmsdae:"\u29AC",angmsdaf:"\u29AD",angmsdag:"\u29AE",angmsdah:"\u29AF",angrt:"\u221F",angrtvb:"\u22BE",angrtvbd:"\u299D",angsph:"\u2222",angst:"\xC5",angzarr:"\u237C",Aogon:"\u0104",aogon:"\u0105",Aopf:"\u{1D538}",aopf:"\u{1D552}",ap:"\u2248",apacir:"\u2A6F",apE:"\u2A70",ape:"\u224A",apid:"\u224B",apos:"'",ApplyFunction:"\u2061",approx:"\u2248",approxeq:"\u224A",Aring:"\xC5",aring:"\xE5",Ascr:"\u{1D49C}",ascr:"\u{1D4B6}",Assign:"\u2254",ast:"*",asymp:"\u2248",asympeq:"\u224D",Atilde:"\xC3",atilde:"\xE3",Auml:"\xC4",auml:"\xE4",awconint:"\u2233",awint:"\u2A11",backcong:"\u224C",backepsilon:"\u03F6",backprime:"\u2035",backsim:"\u223D",backsimeq:"\u22CD",Backslash:"\u2216",Barv:"\u2AE7",barvee:"\u22BD",Barwed:"\u2306",barwed:"\u2305",barwedge:"\u2305",bbrk:"\u23B5",bbrktbrk:"\u23B6",bcong:"\u224C",Bcy:"\u0411",bcy:"\u0431",bdquo:"\u201E",becaus:"\u2235",Because:"\u2235",because:"\u2235",bemptyv:"\u29B0",bepsi:"\u03F6",bernou:"\u212C",Bernoullis:"\u212C",Beta:"\u0392",beta:"\u03B2",beth:"\u2136",between:"\u226C",Bfr:"\u{1D505}",bfr:"\u{1D51F}",bigcap:"\u22C2",bigcirc:"\u25EF",bigcup:"\u22C3",bigodot:"\u2A00",bigoplus:"\u2A01",bigotimes:"\u2A02",bigsqcup:"\u2A06",bigstar:"\u2605",bigtriangledown:"\u25BD",bigtriangleup:"\u25B3",biguplus:"\u2A04",bigvee:"\u22C1",bigwedge:"\u22C0",bkarow:"\u290D",blacklozenge:"\u29EB",blacksquare:"\u25AA",blacktriangle:"\u25B4",blacktriangledown:"\u25BE",blacktriangleleft:"\u25C2",blacktriangleright:"\u25B8",blank:"\u2423",blk12:"\u2592",blk14:"\u2591",blk34:"\u2593",block:"\u2588",bne:"=\u20E5",bnequiv:"\u2261\u20E5",bNot:"\u2AED",bnot:"\u2310",Bopf:"\u{1D539}",bopf:"\u{1D553}",bot:"\u22A5",bottom:"\u22A5",bowtie:"\u22C8",boxbox:"\u29C9",boxDL:"\u2557",boxDl:"\u2556",boxdL:"\u2555",boxdl:"\u2510",boxDR:"\u2554",boxDr:"\u2553",boxdR:"\u2552",boxdr:"\u250C",boxH:"\u2550",boxh:"\u2500",boxHD:"\u2566",boxHd:"\u2564",boxhD:"\u2565",boxhd:"\u252C",boxHU:"\u2569",boxHu:"\u2567",boxhU:"\u2568",boxhu:"\u2534",boxminus:"\u229F",boxplus:"\u229E",boxtimes:"\u22A0",boxUL:"\u255D",boxUl:"\u255C",boxuL:"\u255B",boxul:"\u2518",boxUR:"\u255A",boxUr:"\u2559",boxuR:"\u2558",boxur:"\u2514",boxV:"\u2551",boxv:"\u2502",boxVH:"\u256C",boxVh:"\u256B",boxvH:"\u256A",boxvh:"\u253C",boxVL:"\u2563",boxVl:"\u2562",boxvL:"\u2561",boxvl:"\u2524",boxVR:"\u2560",boxVr:"\u255F",boxvR:"\u255E",boxvr:"\u251C",bprime:"\u2035",Breve:"\u02D8",breve:"\u02D8",brvbar:"\xA6",Bscr:"\u212C",bscr:"\u{1D4B7}",bsemi:"\u204F",bsim:"\u223D",bsime:"\u22CD",bsol:"\\",bsolb:"\u29C5",bsolhsub:"\u27C8",bull:"\u2022",bullet:"\u2022",bump:"\u224E",bumpE:"\u2AAE",bumpe:"\u224F",Bumpeq:"\u224E",bumpeq:"\u224F",Cacute:"\u0106",cacute:"\u0107",Cap:"\u22D2",cap:"\u2229",capand:"\u2A44",capbrcup:"\u2A49",capcap:"\u2A4B",capcup:"\u2A47",capdot:"\u2A40",CapitalDifferentialD:"\u2145",caps:"\u2229\uFE00",caret:"\u2041",caron:"\u02C7",Cayleys:"\u212D",ccaps:"\u2A4D",Ccaron:"\u010C",ccaron:"\u010D",Ccedil:"\xC7",ccedil:"\xE7",Ccirc:"\u0108",ccirc:"\u0109",Cconint:"\u2230",ccups:"\u2A4C",ccupssm:"\u2A50",Cdot:"\u010A",cdot:"\u010B",cedil:"\xB8",Cedilla:"\xB8",cemptyv:"\u29B2",cent:"\xA2",CenterDot:"\xB7",centerdot:"\xB7",Cfr:"\u212D",cfr:"\u{1D520}",CHcy:"\u0427",chcy:"\u0447",check:"\u2713",checkmark:"\u2713",Chi:"\u03A7",chi:"\u03C7",cir:"\u25CB",circ:"\u02C6",circeq:"\u2257",circlearrowleft:"\u21BA",circlearrowright:"\u21BB",circledast:"\u229B",circledcirc:"\u229A",circleddash:"\u229D",CircleDot:"\u2299",circledR:"\xAE",circledS:"\u24C8",CircleMinus:"\u2296",CirclePlus:"\u2295",CircleTimes:"\u2297",cirE:"\u29C3",cire:"\u2257",cirfnint:"\u2A10",cirmid:"\u2AEF",cirscir:"\u29C2",ClockwiseContourIntegral:"\u2232",CloseCurlyDoubleQuote:"\u201D",CloseCurlyQuote:"\u2019",clubs:"\u2663",clubsuit:"\u2663",Colon:"\u2237",colon:":",Colone:"\u2A74",colone:"\u2254",coloneq:"\u2254",comma:",",commat:"@",comp:"\u2201",compfn:"\u2218",complement:"\u2201",complexes:"\u2102",cong:"\u2245",congdot:"\u2A6D",Congruent:"\u2261",Conint:"\u222F",conint:"\u222E",ContourIntegral:"\u222E",Copf:"\u2102",copf:"\u{1D554}",coprod:"\u2210",Coproduct:"\u2210",COPY:"\xA9",copy:"\xA9",copysr:"\u2117",CounterClockwiseContourIntegral:"\u2233",crarr:"\u21B5",Cross:"\u2A2F",cross:"\u2717",Cscr:"\u{1D49E}",cscr:"\u{1D4B8}",csub:"\u2ACF",csube:"\u2AD1",csup:"\u2AD0",csupe:"\u2AD2",ctdot:"\u22EF",cudarrl:"\u2938",cudarrr:"\u2935",cuepr:"\u22DE",cuesc:"\u22DF",cularr:"\u21B6",cularrp:"\u293D",Cup:"\u22D3",cup:"\u222A",cupbrcap:"\u2A48",CupCap:"\u224D",cupcap:"\u2A46",cupcup:"\u2A4A",cupdot:"\u228D",cupor:"\u2A45",cups:"\u222A\uFE00",curarr:"\u21B7",curarrm:"\u293C",curlyeqprec:"\u22DE",curlyeqsucc:"\u22DF",curlyvee:"\u22CE",curlywedge:"\u22CF",curren:"\xA4",curvearrowleft:"\u21B6",curvearrowright:"\u21B7",cuvee:"\u22CE",cuwed:"\u22CF",cwconint:"\u2232",cwint:"\u2231",cylcty:"\u232D",Dagger:"\u2021",dagger:"\u2020",daleth:"\u2138",Darr:"\u21A1",dArr:"\u21D3",darr:"\u2193",dash:"\u2010",Dashv:"\u2AE4",dashv:"\u22A3",dbkarow:"\u290F",dblac:"\u02DD",Dcaron:"\u010E",dcaron:"\u010F",Dcy:"\u0414",dcy:"\u0434",DD:"\u2145",dd:"\u2146",ddagger:"\u2021",ddarr:"\u21CA",DDotrahd:"\u2911",ddotseq:"\u2A77",deg:"\xB0",Del:"\u2207",Delta:"\u0394",delta:"\u03B4",demptyv:"\u29B1",dfisht:"\u297F",Dfr:"\u{1D507}",dfr:"\u{1D521}",dHar:"\u2965",dharl:"\u21C3",dharr:"\u21C2",DiacriticalAcute:"\xB4",DiacriticalDot:"\u02D9",DiacriticalDoubleAcute:"\u02DD",DiacriticalGrave:"`",DiacriticalTilde:"\u02DC",diam:"\u22C4",Diamond:"\u22C4",diamond:"\u22C4",diamondsuit:"\u2666",diams:"\u2666",die:"\xA8",DifferentialD:"\u2146",digamma:"\u03DD",disin:"\u22F2",div:"\xF7",divide:"\xF7",divideontimes:"\u22C7",divonx:"\u22C7",DJcy:"\u0402",djcy:"\u0452",dlcorn:"\u231E",dlcrop:"\u230D",dollar:"$",Dopf:"\u{1D53B}",dopf:"\u{1D555}",Dot:"\xA8",dot:"\u02D9",DotDot:"\u20DC",doteq:"\u2250",doteqdot:"\u2251",DotEqual:"\u2250",dotminus:"\u2238",dotplus:"\u2214",dotsquare:"\u22A1",doublebarwedge:"\u2306",DoubleContourIntegral:"\u222F",DoubleDot:"\xA8",DoubleDownArrow:"\u21D3",DoubleLeftArrow:"\u21D0",DoubleLeftRightArrow:"\u21D4",DoubleLeftTee:"\u2AE4",DoubleLongLeftArrow:"\u27F8",DoubleLongLeftRightArrow:"\u27FA",DoubleLongRightArrow:"\u27F9",DoubleRightArrow:"\u21D2",DoubleRightTee:"\u22A8",DoubleUpArrow:"\u21D1",DoubleUpDownArrow:"\u21D5",DoubleVerticalBar:"\u2225",DownArrow:"\u2193",Downarrow:"\u21D3",downarrow:"\u2193",DownArrowBar:"\u2913",DownArrowUpArrow:"\u21F5",DownBreve:"\u0311",downdownarrows:"\u21CA",downharpoonleft:"\u21C3",downharpoonright:"\u21C2",DownLeftRightVector:"\u2950",DownLeftTeeVector:"\u295E",DownLeftVector:"\u21BD",DownLeftVectorBar:"\u2956",DownRightTeeVector:"\u295F",DownRightVector:"\u21C1",DownRightVectorBar:"\u2957",DownTee:"\u22A4",DownTeeArrow:"\u21A7",drbkarow:"\u2910",drcorn:"\u231F",drcrop:"\u230C",Dscr:"\u{1D49F}",dscr:"\u{1D4B9}",DScy:"\u0405",dscy:"\u0455",dsol:"\u29F6",Dstrok:"\u0110",dstrok:"\u0111",dtdot:"\u22F1",dtri:"\u25BF",dtrif:"\u25BE",duarr:"\u21F5",duhar:"\u296F",dwangle:"\u29A6",DZcy:"\u040F",dzcy:"\u045F",dzigrarr:"\u27FF",Eacute:"\xC9",eacute:"\xE9",easter:"\u2A6E",Ecaron:"\u011A",ecaron:"\u011B",ecir:"\u2256",Ecirc:"\xCA",ecirc:"\xEA",ecolon:"\u2255",Ecy:"\u042D",ecy:"\u044D",eDDot:"\u2A77",Edot:"\u0116",eDot:"\u2251",edot:"\u0117",ee:"\u2147",efDot:"\u2252",Efr:"\u{1D508}",efr:"\u{1D522}",eg:"\u2A9A",Egrave:"\xC8",egrave:"\xE8",egs:"\u2A96",egsdot:"\u2A98",el:"\u2A99",Element:"\u2208",elinters:"\u23E7",ell:"\u2113",els:"\u2A95",elsdot:"\u2A97",Emacr:"\u0112",emacr:"\u0113",empty:"\u2205",emptyset:"\u2205",EmptySmallSquare:"\u25FB",emptyv:"\u2205",EmptyVerySmallSquare:"\u25AB",emsp:"\u2003",emsp13:"\u2004",emsp14:"\u2005",ENG:"\u014A",eng:"\u014B",ensp:"\u2002",Eogon:"\u0118",eogon:"\u0119",Eopf:"\u{1D53C}",eopf:"\u{1D556}",epar:"\u22D5",eparsl:"\u29E3",eplus:"\u2A71",epsi:"\u03B5",Epsilon:"\u0395",epsilon:"\u03B5",epsiv:"\u03F5",eqcirc:"\u2256",eqcolon:"\u2255",eqsim:"\u2242",eqslantgtr:"\u2A96",eqslantless:"\u2A95",Equal:"\u2A75",equals:"=",EqualTilde:"\u2242",equest:"\u225F",Equilibrium:"\u21CC",equiv:"\u2261",equivDD:"\u2A78",eqvparsl:"\u29E5",erarr:"\u2971",erDot:"\u2253",Escr:"\u2130",escr:"\u212F",esdot:"\u2250",Esim:"\u2A73",esim:"\u2242",Eta:"\u0397",eta:"\u03B7",ETH:"\xD0",eth:"\xF0",Euml:"\xCB",euml:"\xEB",euro:"\u20AC",excl:"!",exist:"\u2203",Exists:"\u2203",expectation:"\u2130",ExponentialE:"\u2147",exponentiale:"\u2147",fallingdotseq:"\u2252",Fcy:"\u0424",fcy:"\u0444",female:"\u2640",ffilig:"\uFB03",fflig:"\uFB00",ffllig:"\uFB04",Ffr:"\u{1D509}",ffr:"\u{1D523}",filig:"\uFB01",FilledSmallSquare:"\u25FC",FilledVerySmallSquare:"\u25AA",fjlig:"fj",flat:"\u266D",fllig:"\uFB02",fltns:"\u25B1",fnof:"\u0192",Fopf:"\u{1D53D}",fopf:"\u{1D557}",ForAll:"\u2200",forall:"\u2200",fork:"\u22D4",forkv:"\u2AD9",Fouriertrf:"\u2131",fpartint:"\u2A0D",frac12:"\xBD",frac13:"\u2153",frac14:"\xBC",frac15:"\u2155",frac16:"\u2159",frac18:"\u215B",frac23:"\u2154",frac25:"\u2156",frac34:"\xBE",frac35:"\u2157",frac38:"\u215C",frac45:"\u2158",frac56:"\u215A",frac58:"\u215D",frac78:"\u215E",frasl:"\u2044",frown:"\u2322",Fscr:"\u2131",fscr:"\u{1D4BB}",gacute:"\u01F5",Gamma:"\u0393",gamma:"\u03B3",Gammad:"\u03DC",gammad:"\u03DD",gap:"\u2A86",Gbreve:"\u011E",gbreve:"\u011F",Gcedil:"\u0122",Gcirc:"\u011C",gcirc:"\u011D",Gcy:"\u0413",gcy:"\u0433",Gdot:"\u0120",gdot:"\u0121",gE:"\u2267",ge:"\u2265",gEl:"\u2A8C",gel:"\u22DB",geq:"\u2265",geqq:"\u2267",geqslant:"\u2A7E",ges:"\u2A7E",gescc:"\u2AA9",gesdot:"\u2A80",gesdoto:"\u2A82",gesdotol:"\u2A84",gesl:"\u22DB\uFE00",gesles:"\u2A94",Gfr:"\u{1D50A}",gfr:"\u{1D524}",Gg:"\u22D9",gg:"\u226B",ggg:"\u22D9",gimel:"\u2137",GJcy:"\u0403",gjcy:"\u0453",gl:"\u2277",gla:"\u2AA5",glE:"\u2A92",glj:"\u2AA4",gnap:"\u2A8A",gnapprox:"\u2A8A",gnE:"\u2269",gne:"\u2A88",gneq:"\u2A88",gneqq:"\u2269",gnsim:"\u22E7",Gopf:"\u{1D53E}",gopf:"\u{1D558}",grave:"`",GreaterEqual:"\u2265",GreaterEqualLess:"\u22DB",GreaterFullEqual:"\u2267",GreaterGreater:"\u2AA2",GreaterLess:"\u2277",GreaterSlantEqual:"\u2A7E",GreaterTilde:"\u2273",Gscr:"\u{1D4A2}",gscr:"\u210A",gsim:"\u2273",gsime:"\u2A8E",gsiml:"\u2A90",Gt:"\u226B",GT:">",gt:">",gtcc:"\u2AA7",gtcir:"\u2A7A",gtdot:"\u22D7",gtlPar:"\u2995",gtquest:"\u2A7C",gtrapprox:"\u2A86",gtrarr:"\u2978",gtrdot:"\u22D7",gtreqless:"\u22DB",gtreqqless:"\u2A8C",gtrless:"\u2277",gtrsim:"\u2273",gvertneqq:"\u2269\uFE00",gvnE:"\u2269\uFE00",Hacek:"\u02C7",hairsp:"\u200A",half:"\xBD",hamilt:"\u210B",HARDcy:"\u042A",hardcy:"\u044A",hArr:"\u21D4",harr:"\u2194",harrcir:"\u2948",harrw:"\u21AD",Hat:"^",hbar:"\u210F",Hcirc:"\u0124",hcirc:"\u0125",hearts:"\u2665",heartsuit:"\u2665",hellip:"\u2026",hercon:"\u22B9",Hfr:"\u210C",hfr:"\u{1D525}",HilbertSpace:"\u210B",hksearow:"\u2925",hkswarow:"\u2926",hoarr:"\u21FF",homtht:"\u223B",hookleftarrow:"\u21A9",hookrightarrow:"\u21AA",Hopf:"\u210D",hopf:"\u{1D559}",horbar:"\u2015",HorizontalLine:"\u2500",Hscr:"\u210B",hscr:"\u{1D4BD}",hslash:"\u210F",Hstrok:"\u0126",hstrok:"\u0127",HumpDownHump:"\u224E",HumpEqual:"\u224F",hybull:"\u2043",hyphen:"\u2010",Iacute:"\xCD",iacute:"\xED",ic:"\u2063",Icirc:"\xCE",icirc:"\xEE",Icy:"\u0418",icy:"\u0438",Idot:"\u0130",IEcy:"\u0415",iecy:"\u0435",iexcl:"\xA1",iff:"\u21D4",Ifr:"\u2111",ifr:"\u{1D526}",Igrave:"\xCC",igrave:"\xEC",ii:"\u2148",iiiint:"\u2A0C",iiint:"\u222D",iinfin:"\u29DC",iiota:"\u2129",IJlig:"\u0132",ijlig:"\u0133",Im:"\u2111",Imacr:"\u012A",imacr:"\u012B",image:"\u2111",ImaginaryI:"\u2148",imagline:"\u2110",imagpart:"\u2111",imath:"\u0131",imof:"\u22B7",imped:"\u01B5",Implies:"\u21D2",in:"\u2208",incare:"\u2105",infin:"\u221E",infintie:"\u29DD",inodot:"\u0131",Int:"\u222C",int:"\u222B",intcal:"\u22BA",integers:"\u2124",Integral:"\u222B",intercal:"\u22BA",Intersection:"\u22C2",intlarhk:"\u2A17",intprod:"\u2A3C",InvisibleComma:"\u2063",InvisibleTimes:"\u2062",IOcy:"\u0401",iocy:"\u0451",Iogon:"\u012E",iogon:"\u012F",Iopf:"\u{1D540}",iopf:"\u{1D55A}",Iota:"\u0399",iota:"\u03B9",iprod:"\u2A3C",iquest:"\xBF",Iscr:"\u2110",iscr:"\u{1D4BE}",isin:"\u2208",isindot:"\u22F5",isinE:"\u22F9",isins:"\u22F4",isinsv:"\u22F3",isinv:"\u2208",it:"\u2062",Itilde:"\u0128",itilde:"\u0129",Iukcy:"\u0406",iukcy:"\u0456",Iuml:"\xCF",iuml:"\xEF",Jcirc:"\u0134",jcirc:"\u0135",Jcy:"\u0419",jcy:"\u0439",Jfr:"\u{1D50D}",jfr:"\u{1D527}",jmath:"\u0237",Jopf:"\u{1D541}",jopf:"\u{1D55B}",Jscr:"\u{1D4A5}",jscr:"\u{1D4BF}",Jsercy:"\u0408",jsercy:"\u0458",Jukcy:"\u0404",jukcy:"\u0454",Kappa:"\u039A",kappa:"\u03BA",kappav:"\u03F0",Kcedil:"\u0136",kcedil:"\u0137",Kcy:"\u041A",kcy:"\u043A",Kfr:"\u{1D50E}",kfr:"\u{1D528}",kgreen:"\u0138",KHcy:"\u0425",khcy:"\u0445",KJcy:"\u040C",kjcy:"\u045C",Kopf:"\u{1D542}",kopf:"\u{1D55C}",Kscr:"\u{1D4A6}",kscr:"\u{1D4C0}",lAarr:"\u21DA",Lacute:"\u0139",lacute:"\u013A",laemptyv:"\u29B4",lagran:"\u2112",Lambda:"\u039B",lambda:"\u03BB",Lang:"\u27EA",lang:"\u27E8",langd:"\u2991",langle:"\u27E8",lap:"\u2A85",Laplacetrf:"\u2112",laquo:"\xAB",Larr:"\u219E",lArr:"\u21D0",larr:"\u2190",larrb:"\u21E4",larrbfs:"\u291F",larrfs:"\u291D",larrhk:"\u21A9",larrlp:"\u21AB",larrpl:"\u2939",larrsim:"\u2973",larrtl:"\u21A2",lat:"\u2AAB",lAtail:"\u291B",latail:"\u2919",late:"\u2AAD",lates:"\u2AAD\uFE00",lBarr:"\u290E",lbarr:"\u290C",lbbrk:"\u2772",lbrace:"{",lbrack:"[",lbrke:"\u298B",lbrksld:"\u298F",lbrkslu:"\u298D",Lcaron:"\u013D",lcaron:"\u013E",Lcedil:"\u013B",lcedil:"\u013C",lceil:"\u2308",lcub:"{",Lcy:"\u041B",lcy:"\u043B",ldca:"\u2936",ldquo:"\u201C",ldquor:"\u201E",ldrdhar:"\u2967",ldrushar:"\u294B",ldsh:"\u21B2",lE:"\u2266",le:"\u2264",LeftAngleBracket:"\u27E8",LeftArrow:"\u2190",Leftarrow:"\u21D0",leftarrow:"\u2190",LeftArrowBar:"\u21E4",LeftArrowRightArrow:"\u21C6",leftarrowtail:"\u21A2",LeftCeiling:"\u2308",LeftDoubleBracket:"\u27E6",LeftDownTeeVector:"\u2961",LeftDownVector:"\u21C3",LeftDownVectorBar:"\u2959",LeftFloor:"\u230A",leftharpoondown:"\u21BD",leftharpoonup:"\u21BC",leftleftarrows:"\u21C7",LeftRightArrow:"\u2194",Leftrightarrow:"\u21D4",leftrightarrow:"\u2194",leftrightarrows:"\u21C6",leftrightharpoons:"\u21CB",leftrightsquigarrow:"\u21AD",LeftRightVector:"\u294E",LeftTee:"\u22A3",LeftTeeArrow:"\u21A4",LeftTeeVector:"\u295A",leftthreetimes:"\u22CB",LeftTriangle:"\u22B2",LeftTriangleBar:"\u29CF",LeftTriangleEqual:"\u22B4",LeftUpDownVector:"\u2951",LeftUpTeeVector:"\u2960",LeftUpVector:"\u21BF",LeftUpVectorBar:"\u2958",LeftVector:"\u21BC",LeftVectorBar:"\u2952",lEg:"\u2A8B",leg:"\u22DA",leq:"\u2264",leqq:"\u2266",leqslant:"\u2A7D",les:"\u2A7D",lescc:"\u2AA8",lesdot:"\u2A7F",lesdoto:"\u2A81",lesdotor:"\u2A83",lesg:"\u22DA\uFE00",lesges:"\u2A93",lessapprox:"\u2A85",lessdot:"\u22D6",lesseqgtr:"\u22DA",lesseqqgtr:"\u2A8B",LessEqualGreater:"\u22DA",LessFullEqual:"\u2266",LessGreater:"\u2276",lessgtr:"\u2276",LessLess:"\u2AA1",lesssim:"\u2272",LessSlantEqual:"\u2A7D",LessTilde:"\u2272",lfisht:"\u297C",lfloor:"\u230A",Lfr:"\u{1D50F}",lfr:"\u{1D529}",lg:"\u2276",lgE:"\u2A91",lHar:"\u2962",lhard:"\u21BD",lharu:"\u21BC",lharul:"\u296A",lhblk:"\u2584",LJcy:"\u0409",ljcy:"\u0459",Ll:"\u22D8",ll:"\u226A",llarr:"\u21C7",llcorner:"\u231E",Lleftarrow:"\u21DA",llhard:"\u296B",lltri:"\u25FA",Lmidot:"\u013F",lmidot:"\u0140",lmoust:"\u23B0",lmoustache:"\u23B0",lnap:"\u2A89",lnapprox:"\u2A89",lnE:"\u2268",lne:"\u2A87",lneq:"\u2A87",lneqq:"\u2268",lnsim:"\u22E6",loang:"\u27EC",loarr:"\u21FD",lobrk:"\u27E6",LongLeftArrow:"\u27F5",Longleftarrow:"\u27F8",longleftarrow:"\u27F5",LongLeftRightArrow:"\u27F7",Longleftrightarrow:"\u27FA",longleftrightarrow:"\u27F7",longmapsto:"\u27FC",LongRightArrow:"\u27F6",Longrightarrow:"\u27F9",longrightarrow:"\u27F6",looparrowleft:"\u21AB",looparrowright:"\u21AC",lopar:"\u2985",Lopf:"\u{1D543}",lopf:"\u{1D55D}",loplus:"\u2A2D",lotimes:"\u2A34",lowast:"\u2217",lowbar:"_",LowerLeftArrow:"\u2199",LowerRightArrow:"\u2198",loz:"\u25CA",lozenge:"\u25CA",lozf:"\u29EB",lpar:"(",lparlt:"\u2993",lrarr:"\u21C6",lrcorner:"\u231F",lrhar:"\u21CB",lrhard:"\u296D",lrm:"\u200E",lrtri:"\u22BF",lsaquo:"\u2039",Lscr:"\u2112",lscr:"\u{1D4C1}",Lsh:"\u21B0",lsh:"\u21B0",lsim:"\u2272",lsime:"\u2A8D",lsimg:"\u2A8F",lsqb:"[",lsquo:"\u2018",lsquor:"\u201A",Lstrok:"\u0141",lstrok:"\u0142",Lt:"\u226A",LT:"<",lt:"<",ltcc:"\u2AA6",ltcir:"\u2A79",ltdot:"\u22D6",lthree:"\u22CB",ltimes:"\u22C9",ltlarr:"\u2976",ltquest:"\u2A7B",ltri:"\u25C3",ltrie:"\u22B4",ltrif:"\u25C2",ltrPar:"\u2996",lurdshar:"\u294A",luruhar:"\u2966",lvertneqq:"\u2268\uFE00",lvnE:"\u2268\uFE00",macr:"\xAF",male:"\u2642",malt:"\u2720",maltese:"\u2720",Map:"\u2905",map:"\u21A6",mapsto:"\u21A6",mapstodown:"\u21A7",mapstoleft:"\u21A4",mapstoup:"\u21A5",marker:"\u25AE",mcomma:"\u2A29",Mcy:"\u041C",mcy:"\u043C",mdash:"\u2014",mDDot:"\u223A",measuredangle:"\u2221",MediumSpace:"\u205F",Mellintrf:"\u2133",Mfr:"\u{1D510}",mfr:"\u{1D52A}",mho:"\u2127",micro:"\xB5",mid:"\u2223",midast:"*",midcir:"\u2AF0",middot:"\xB7",minus:"\u2212",minusb:"\u229F",minusd:"\u2238",minusdu:"\u2A2A",MinusPlus:"\u2213",mlcp:"\u2ADB",mldr:"\u2026",mnplus:"\u2213",models:"\u22A7",Mopf:"\u{1D544}",mopf:"\u{1D55E}",mp:"\u2213",Mscr:"\u2133",mscr:"\u{1D4C2}",mstpos:"\u223E",Mu:"\u039C",mu:"\u03BC",multimap:"\u22B8",mumap:"\u22B8",nabla:"\u2207",Nacute:"\u0143",nacute:"\u0144",nang:"\u2220\u20D2",nap:"\u2249",napE:"\u2A70\u0338",napid:"\u224B\u0338",napos:"\u0149",napprox:"\u2249",natur:"\u266E",natural:"\u266E",naturals:"\u2115",nbsp:"\xA0",nbump:"\u224E\u0338",nbumpe:"\u224F\u0338",ncap:"\u2A43",Ncaron:"\u0147",ncaron:"\u0148",Ncedil:"\u0145",ncedil:"\u0146",ncong:"\u2247",ncongdot:"\u2A6D\u0338",ncup:"\u2A42",Ncy:"\u041D",ncy:"\u043D",ndash:"\u2013",ne:"\u2260",nearhk:"\u2924",neArr:"\u21D7",nearr:"\u2197",nearrow:"\u2197",nedot:"\u2250\u0338",NegativeMediumSpace:"\u200B",NegativeThickSpace:"\u200B",NegativeThinSpace:"\u200B",NegativeVeryThinSpace:"\u200B",nequiv:"\u2262",nesear:"\u2928",nesim:"\u2242\u0338",NestedGreaterGreater:"\u226B",NestedLessLess:"\u226A",NewLine:`
`,nexist:"\u2204",nexists:"\u2204",Nfr:"\u{1D511}",nfr:"\u{1D52B}",ngE:"\u2267\u0338",nge:"\u2271",ngeq:"\u2271",ngeqq:"\u2267\u0338",ngeqslant:"\u2A7E\u0338",nges:"\u2A7E\u0338",nGg:"\u22D9\u0338",ngsim:"\u2275",nGt:"\u226B\u20D2",ngt:"\u226F",ngtr:"\u226F",nGtv:"\u226B\u0338",nhArr:"\u21CE",nharr:"\u21AE",nhpar:"\u2AF2",ni:"\u220B",nis:"\u22FC",nisd:"\u22FA",niv:"\u220B",NJcy:"\u040A",njcy:"\u045A",nlArr:"\u21CD",nlarr:"\u219A",nldr:"\u2025",nlE:"\u2266\u0338",nle:"\u2270",nLeftarrow:"\u21CD",nleftarrow:"\u219A",nLeftrightarrow:"\u21CE",nleftrightarrow:"\u21AE",nleq:"\u2270",nleqq:"\u2266\u0338",nleqslant:"\u2A7D\u0338",nles:"\u2A7D\u0338",nless:"\u226E",nLl:"\u22D8\u0338",nlsim:"\u2274",nLt:"\u226A\u20D2",nlt:"\u226E",nltri:"\u22EA",nltrie:"\u22EC",nLtv:"\u226A\u0338",nmid:"\u2224",NoBreak:"\u2060",NonBreakingSpace:"\xA0",Nopf:"\u2115",nopf:"\u{1D55F}",Not:"\u2AEC",not:"\xAC",NotCongruent:"\u2262",NotCupCap:"\u226D",NotDoubleVerticalBar:"\u2226",NotElement:"\u2209",NotEqual:"\u2260",NotEqualTilde:"\u2242\u0338",NotExists:"\u2204",NotGreater:"\u226F",NotGreaterEqual:"\u2271",NotGreaterFullEqual:"\u2267\u0338",NotGreaterGreater:"\u226B\u0338",NotGreaterLess:"\u2279",NotGreaterSlantEqual:"\u2A7E\u0338",NotGreaterTilde:"\u2275",NotHumpDownHump:"\u224E\u0338",NotHumpEqual:"\u224F\u0338",notin:"\u2209",notindot:"\u22F5\u0338",notinE:"\u22F9\u0338",notinva:"\u2209",notinvb:"\u22F7",notinvc:"\u22F6",NotLeftTriangle:"\u22EA",NotLeftTriangleBar:"\u29CF\u0338",NotLeftTriangleEqual:"\u22EC",NotLess:"\u226E",NotLessEqual:"\u2270",NotLessGreater:"\u2278",NotLessLess:"\u226A\u0338",NotLessSlantEqual:"\u2A7D\u0338",NotLessTilde:"\u2274",NotNestedGreaterGreater:"\u2AA2\u0338",NotNestedLessLess:"\u2AA1\u0338",notni:"\u220C",notniva:"\u220C",notnivb:"\u22FE",notnivc:"\u22FD",NotPrecedes:"\u2280",NotPrecedesEqual:"\u2AAF\u0338",NotPrecedesSlantEqual:"\u22E0",NotReverseElement:"\u220C",NotRightTriangle:"\u22EB",NotRightTriangleBar:"\u29D0\u0338",NotRightTriangleEqual:"\u22ED",NotSquareSubset:"\u228F\u0338",NotSquareSubsetEqual:"\u22E2",NotSquareSuperset:"\u2290\u0338",NotSquareSupersetEqual:"\u22E3",NotSubset:"\u2282\u20D2",NotSubsetEqual:"\u2288",NotSucceeds:"\u2281",NotSucceedsEqual:"\u2AB0\u0338",NotSucceedsSlantEqual:"\u22E1",NotSucceedsTilde:"\u227F\u0338",NotSuperset:"\u2283\u20D2",NotSupersetEqual:"\u2289",NotTilde:"\u2241",NotTildeEqual:"\u2244",NotTildeFullEqual:"\u2247",NotTildeTilde:"\u2249",NotVerticalBar:"\u2224",npar:"\u2226",nparallel:"\u2226",nparsl:"\u2AFD\u20E5",npart:"\u2202\u0338",npolint:"\u2A14",npr:"\u2280",nprcue:"\u22E0",npre:"\u2AAF\u0338",nprec:"\u2280",npreceq:"\u2AAF\u0338",nrArr:"\u21CF",nrarr:"\u219B",nrarrc:"\u2933\u0338",nrarrw:"\u219D\u0338",nRightarrow:"\u21CF",nrightarrow:"\u219B",nrtri:"\u22EB",nrtrie:"\u22ED",nsc:"\u2281",nsccue:"\u22E1",nsce:"\u2AB0\u0338",Nscr:"\u{1D4A9}",nscr:"\u{1D4C3}",nshortmid:"\u2224",nshortparallel:"\u2226",nsim:"\u2241",nsime:"\u2244",nsimeq:"\u2244",nsmid:"\u2224",nspar:"\u2226",nsqsube:"\u22E2",nsqsupe:"\u22E3",nsub:"\u2284",nsubE:"\u2AC5\u0338",nsube:"\u2288",nsubset:"\u2282\u20D2",nsubseteq:"\u2288",nsubseteqq:"\u2AC5\u0338",nsucc:"\u2281",nsucceq:"\u2AB0\u0338",nsup:"\u2285",nsupE:"\u2AC6\u0338",nsupe:"\u2289",nsupset:"\u2283\u20D2",nsupseteq:"\u2289",nsupseteqq:"\u2AC6\u0338",ntgl:"\u2279",Ntilde:"\xD1",ntilde:"\xF1",ntlg:"\u2278",ntriangleleft:"\u22EA",ntrianglelefteq:"\u22EC",ntriangleright:"\u22EB",ntrianglerighteq:"\u22ED",Nu:"\u039D",nu:"\u03BD",num:"#",numero:"\u2116",numsp:"\u2007",nvap:"\u224D\u20D2",nVDash:"\u22AF",nVdash:"\u22AE",nvDash:"\u22AD",nvdash:"\u22AC",nvge:"\u2265\u20D2",nvgt:">\u20D2",nvHarr:"\u2904",nvinfin:"\u29DE",nvlArr:"\u2902",nvle:"\u2264\u20D2",nvlt:"<\u20D2",nvltrie:"\u22B4\u20D2",nvrArr:"\u2903",nvrtrie:"\u22B5\u20D2",nvsim:"\u223C\u20D2",nwarhk:"\u2923",nwArr:"\u21D6",nwarr:"\u2196",nwarrow:"\u2196",nwnear:"\u2927",Oacute:"\xD3",oacute:"\xF3",oast:"\u229B",ocir:"\u229A",Ocirc:"\xD4",ocirc:"\xF4",Ocy:"\u041E",ocy:"\u043E",odash:"\u229D",Odblac:"\u0150",odblac:"\u0151",odiv:"\u2A38",odot:"\u2299",odsold:"\u29BC",OElig:"\u0152",oelig:"\u0153",ofcir:"\u29BF",Ofr:"\u{1D512}",ofr:"\u{1D52C}",ogon:"\u02DB",Ograve:"\xD2",ograve:"\xF2",ogt:"\u29C1",ohbar:"\u29B5",ohm:"\u03A9",oint:"\u222E",olarr:"\u21BA",olcir:"\u29BE",olcross:"\u29BB",oline:"\u203E",olt:"\u29C0",Omacr:"\u014C",omacr:"\u014D",Omega:"\u03A9",omega:"\u03C9",Omicron:"\u039F",omicron:"\u03BF",omid:"\u29B6",ominus:"\u2296",Oopf:"\u{1D546}",oopf:"\u{1D560}",opar:"\u29B7",OpenCurlyDoubleQuote:"\u201C",OpenCurlyQuote:"\u2018",operp:"\u29B9",oplus:"\u2295",Or:"\u2A54",or:"\u2228",orarr:"\u21BB",ord:"\u2A5D",order:"\u2134",orderof:"\u2134",ordf:"\xAA",ordm:"\xBA",origof:"\u22B6",oror:"\u2A56",orslope:"\u2A57",orv:"\u2A5B",oS:"\u24C8",Oscr:"\u{1D4AA}",oscr:"\u2134",Oslash:"\xD8",oslash:"\xF8",osol:"\u2298",Otilde:"\xD5",otilde:"\xF5",Otimes:"\u2A37",otimes:"\u2297",otimesas:"\u2A36",Ouml:"\xD6",ouml:"\xF6",ovbar:"\u233D",OverBar:"\u203E",OverBrace:"\u23DE",OverBracket:"\u23B4",OverParenthesis:"\u23DC",par:"\u2225",para:"\xB6",parallel:"\u2225",parsim:"\u2AF3",parsl:"\u2AFD",part:"\u2202",PartialD:"\u2202",Pcy:"\u041F",pcy:"\u043F",percnt:"%",period:".",permil:"\u2030",perp:"\u22A5",pertenk:"\u2031",Pfr:"\u{1D513}",pfr:"\u{1D52D}",Phi:"\u03A6",phi:"\u03C6",phiv:"\u03D5",phmmat:"\u2133",phone:"\u260E",Pi:"\u03A0",pi:"\u03C0",pitchfork:"\u22D4",piv:"\u03D6",planck:"\u210F",planckh:"\u210E",plankv:"\u210F",plus:"+",plusacir:"\u2A23",plusb:"\u229E",pluscir:"\u2A22",plusdo:"\u2214",plusdu:"\u2A25",pluse:"\u2A72",PlusMinus:"\xB1",plusmn:"\xB1",plussim:"\u2A26",plustwo:"\u2A27",pm:"\xB1",Poincareplane:"\u210C",pointint:"\u2A15",Popf:"\u2119",popf:"\u{1D561}",pound:"\xA3",Pr:"\u2ABB",pr:"\u227A",prap:"\u2AB7",prcue:"\u227C",prE:"\u2AB3",pre:"\u2AAF",prec:"\u227A",precapprox:"\u2AB7",preccurlyeq:"\u227C",Precedes:"\u227A",PrecedesEqual:"\u2AAF",PrecedesSlantEqual:"\u227C",PrecedesTilde:"\u227E",preceq:"\u2AAF",precnapprox:"\u2AB9",precneqq:"\u2AB5",precnsim:"\u22E8",precsim:"\u227E",Prime:"\u2033",prime:"\u2032",primes:"\u2119",prnap:"\u2AB9",prnE:"\u2AB5",prnsim:"\u22E8",prod:"\u220F",Product:"\u220F",profalar:"\u232E",profline:"\u2312",profsurf:"\u2313",prop:"\u221D",Proportion:"\u2237",Proportional:"\u221D",propto:"\u221D",prsim:"\u227E",prurel:"\u22B0",Pscr:"\u{1D4AB}",pscr:"\u{1D4C5}",Psi:"\u03A8",psi:"\u03C8",puncsp:"\u2008",Qfr:"\u{1D514}",qfr:"\u{1D52E}",qint:"\u2A0C",Qopf:"\u211A",qopf:"\u{1D562}",qprime:"\u2057",Qscr:"\u{1D4AC}",qscr:"\u{1D4C6}",quaternions:"\u210D",quatint:"\u2A16",quest:"?",questeq:"\u225F",QUOT:'"',quot:'"',rAarr:"\u21DB",race:"\u223D\u0331",Racute:"\u0154",racute:"\u0155",radic:"\u221A",raemptyv:"\u29B3",Rang:"\u27EB",rang:"\u27E9",rangd:"\u2992",range:"\u29A5",rangle:"\u27E9",raquo:"\xBB",Rarr:"\u21A0",rArr:"\u21D2",rarr:"\u2192",rarrap:"\u2975",rarrb:"\u21E5",rarrbfs:"\u2920",rarrc:"\u2933",rarrfs:"\u291E",rarrhk:"\u21AA",rarrlp:"\u21AC",rarrpl:"\u2945",rarrsim:"\u2974",Rarrtl:"\u2916",rarrtl:"\u21A3",rarrw:"\u219D",rAtail:"\u291C",ratail:"\u291A",ratio:"\u2236",rationals:"\u211A",RBarr:"\u2910",rBarr:"\u290F",rbarr:"\u290D",rbbrk:"\u2773",rbrace:"}",rbrack:"]",rbrke:"\u298C",rbrksld:"\u298E",rbrkslu:"\u2990",Rcaron:"\u0158",rcaron:"\u0159",Rcedil:"\u0156",rcedil:"\u0157",rceil:"\u2309",rcub:"}",Rcy:"\u0420",rcy:"\u0440",rdca:"\u2937",rdldhar:"\u2969",rdquo:"\u201D",rdquor:"\u201D",rdsh:"\u21B3",Re:"\u211C",real:"\u211C",realine:"\u211B",realpart:"\u211C",reals:"\u211D",rect:"\u25AD",REG:"\xAE",reg:"\xAE",ReverseElement:"\u220B",ReverseEquilibrium:"\u21CB",ReverseUpEquilibrium:"\u296F",rfisht:"\u297D",rfloor:"\u230B",Rfr:"\u211C",rfr:"\u{1D52F}",rHar:"\u2964",rhard:"\u21C1",rharu:"\u21C0",rharul:"\u296C",Rho:"\u03A1",rho:"\u03C1",rhov:"\u03F1",RightAngleBracket:"\u27E9",RightArrow:"\u2192",Rightarrow:"\u21D2",rightarrow:"\u2192",RightArrowBar:"\u21E5",RightArrowLeftArrow:"\u21C4",rightarrowtail:"\u21A3",RightCeiling:"\u2309",RightDoubleBracket:"\u27E7",RightDownTeeVector:"\u295D",RightDownVector:"\u21C2",RightDownVectorBar:"\u2955",RightFloor:"\u230B",rightharpoondown:"\u21C1",rightharpoonup:"\u21C0",rightleftarrows:"\u21C4",rightleftharpoons:"\u21CC",rightrightarrows:"\u21C9",rightsquigarrow:"\u219D",RightTee:"\u22A2",RightTeeArrow:"\u21A6",RightTeeVector:"\u295B",rightthreetimes:"\u22CC",RightTriangle:"\u22B3",RightTriangleBar:"\u29D0",RightTriangleEqual:"\u22B5",RightUpDownVector:"\u294F",RightUpTeeVector:"\u295C",RightUpVector:"\u21BE",RightUpVectorBar:"\u2954",RightVector:"\u21C0",RightVectorBar:"\u2953",ring:"\u02DA",risingdotseq:"\u2253",rlarr:"\u21C4",rlhar:"\u21CC",rlm:"\u200F",rmoust:"\u23B1",rmoustache:"\u23B1",rnmid:"\u2AEE",roang:"\u27ED",roarr:"\u21FE",robrk:"\u27E7",ropar:"\u2986",Ropf:"\u211D",ropf:"\u{1D563}",roplus:"\u2A2E",rotimes:"\u2A35",RoundImplies:"\u2970",rpar:")",rpargt:"\u2994",rppolint:"\u2A12",rrarr:"\u21C9",Rrightarrow:"\u21DB",rsaquo:"\u203A",Rscr:"\u211B",rscr:"\u{1D4C7}",Rsh:"\u21B1",rsh:"\u21B1",rsqb:"]",rsquo:"\u2019",rsquor:"\u2019",rthree:"\u22CC",rtimes:"\u22CA",rtri:"\u25B9",rtrie:"\u22B5",rtrif:"\u25B8",rtriltri:"\u29CE",RuleDelayed:"\u29F4",ruluhar:"\u2968",rx:"\u211E",Sacute:"\u015A",sacute:"\u015B",sbquo:"\u201A",Sc:"\u2ABC",sc:"\u227B",scap:"\u2AB8",Scaron:"\u0160",scaron:"\u0161",sccue:"\u227D",scE:"\u2AB4",sce:"\u2AB0",Scedil:"\u015E",scedil:"\u015F",Scirc:"\u015C",scirc:"\u015D",scnap:"\u2ABA",scnE:"\u2AB6",scnsim:"\u22E9",scpolint:"\u2A13",scsim:"\u227F",Scy:"\u0421",scy:"\u0441",sdot:"\u22C5",sdotb:"\u22A1",sdote:"\u2A66",searhk:"\u2925",seArr:"\u21D8",searr:"\u2198",searrow:"\u2198",sect:"\xA7",semi:";",seswar:"\u2929",setminus:"\u2216",setmn:"\u2216",sext:"\u2736",Sfr:"\u{1D516}",sfr:"\u{1D530}",sfrown:"\u2322",sharp:"\u266F",SHCHcy:"\u0429",shchcy:"\u0449",SHcy:"\u0428",shcy:"\u0448",ShortDownArrow:"\u2193",ShortLeftArrow:"\u2190",shortmid:"\u2223",shortparallel:"\u2225",ShortRightArrow:"\u2192",ShortUpArrow:"\u2191",shy:"\xAD",Sigma:"\u03A3",sigma:"\u03C3",sigmaf:"\u03C2",sigmav:"\u03C2",sim:"\u223C",simdot:"\u2A6A",sime:"\u2243",simeq:"\u2243",simg:"\u2A9E",simgE:"\u2AA0",siml:"\u2A9D",simlE:"\u2A9F",simne:"\u2246",simplus:"\u2A24",simrarr:"\u2972",slarr:"\u2190",SmallCircle:"\u2218",smallsetminus:"\u2216",smashp:"\u2A33",smeparsl:"\u29E4",smid:"\u2223",smile:"\u2323",smt:"\u2AAA",smte:"\u2AAC",smtes:"\u2AAC\uFE00",SOFTcy:"\u042C",softcy:"\u044C",sol:"/",solb:"\u29C4",solbar:"\u233F",Sopf:"\u{1D54A}",sopf:"\u{1D564}",spades:"\u2660",spadesuit:"\u2660",spar:"\u2225",sqcap:"\u2293",sqcaps:"\u2293\uFE00",sqcup:"\u2294",sqcups:"\u2294\uFE00",Sqrt:"\u221A",sqsub:"\u228F",sqsube:"\u2291",sqsubset:"\u228F",sqsubseteq:"\u2291",sqsup:"\u2290",sqsupe:"\u2292",sqsupset:"\u2290",sqsupseteq:"\u2292",squ:"\u25A1",Square:"\u25A1",square:"\u25A1",SquareIntersection:"\u2293",SquareSubset:"\u228F",SquareSubsetEqual:"\u2291",SquareSuperset:"\u2290",SquareSupersetEqual:"\u2292",SquareUnion:"\u2294",squarf:"\u25AA",squf:"\u25AA",srarr:"\u2192",Sscr:"\u{1D4AE}",sscr:"\u{1D4C8}",ssetmn:"\u2216",ssmile:"\u2323",sstarf:"\u22C6",Star:"\u22C6",star:"\u2606",starf:"\u2605",straightepsilon:"\u03F5",straightphi:"\u03D5",strns:"\xAF",Sub:"\u22D0",sub:"\u2282",subdot:"\u2ABD",subE:"\u2AC5",sube:"\u2286",subedot:"\u2AC3",submult:"\u2AC1",subnE:"\u2ACB",subne:"\u228A",subplus:"\u2ABF",subrarr:"\u2979",Subset:"\u22D0",subset:"\u2282",subseteq:"\u2286",subseteqq:"\u2AC5",SubsetEqual:"\u2286",subsetneq:"\u228A",subsetneqq:"\u2ACB",subsim:"\u2AC7",subsub:"\u2AD5",subsup:"\u2AD3",succ:"\u227B",succapprox:"\u2AB8",succcurlyeq:"\u227D",Succeeds:"\u227B",SucceedsEqual:"\u2AB0",SucceedsSlantEqual:"\u227D",SucceedsTilde:"\u227F",succeq:"\u2AB0",succnapprox:"\u2ABA",succneqq:"\u2AB6",succnsim:"\u22E9",succsim:"\u227F",SuchThat:"\u220B",Sum:"\u2211",sum:"\u2211",sung:"\u266A",Sup:"\u22D1",sup:"\u2283",sup1:"\xB9",sup2:"\xB2",sup3:"\xB3",supdot:"\u2ABE",supdsub:"\u2AD8",supE:"\u2AC6",supe:"\u2287",supedot:"\u2AC4",Superset:"\u2283",SupersetEqual:"\u2287",suphsol:"\u27C9",suphsub:"\u2AD7",suplarr:"\u297B",supmult:"\u2AC2",supnE:"\u2ACC",supne:"\u228B",supplus:"\u2AC0",Supset:"\u22D1",supset:"\u2283",supseteq:"\u2287",supseteqq:"\u2AC6",supsetneq:"\u228B",supsetneqq:"\u2ACC",supsim:"\u2AC8",supsub:"\u2AD4",supsup:"\u2AD6",swarhk:"\u2926",swArr:"\u21D9",swarr:"\u2199",swarrow:"\u2199",swnwar:"\u292A",szlig:"\xDF",Tab:"	",target:"\u2316",Tau:"\u03A4",tau:"\u03C4",tbrk:"\u23B4",Tcaron:"\u0164",tcaron:"\u0165",Tcedil:"\u0162",tcedil:"\u0163",Tcy:"\u0422",tcy:"\u0442",tdot:"\u20DB",telrec:"\u2315",Tfr:"\u{1D517}",tfr:"\u{1D531}",there4:"\u2234",Therefore:"\u2234",therefore:"\u2234",Theta:"\u0398",theta:"\u03B8",thetasym:"\u03D1",thetav:"\u03D1",thickapprox:"\u2248",thicksim:"\u223C",ThickSpace:"\u205F\u200A",thinsp:"\u2009",ThinSpace:"\u2009",thkap:"\u2248",thksim:"\u223C",THORN:"\xDE",thorn:"\xFE",Tilde:"\u223C",tilde:"\u02DC",TildeEqual:"\u2243",TildeFullEqual:"\u2245",TildeTilde:"\u2248",times:"\xD7",timesb:"\u22A0",timesbar:"\u2A31",timesd:"\u2A30",tint:"\u222D",toea:"\u2928",top:"\u22A4",topbot:"\u2336",topcir:"\u2AF1",Topf:"\u{1D54B}",topf:"\u{1D565}",topfork:"\u2ADA",tosa:"\u2929",tprime:"\u2034",TRADE:"\u2122",trade:"\u2122",triangle:"\u25B5",triangledown:"\u25BF",triangleleft:"\u25C3",trianglelefteq:"\u22B4",triangleq:"\u225C",triangleright:"\u25B9",trianglerighteq:"\u22B5",tridot:"\u25EC",trie:"\u225C",triminus:"\u2A3A",TripleDot:"\u20DB",triplus:"\u2A39",trisb:"\u29CD",tritime:"\u2A3B",trpezium:"\u23E2",Tscr:"\u{1D4AF}",tscr:"\u{1D4C9}",TScy:"\u0426",tscy:"\u0446",TSHcy:"\u040B",tshcy:"\u045B",Tstrok:"\u0166",tstrok:"\u0167",twixt:"\u226C",twoheadleftarrow:"\u219E",twoheadrightarrow:"\u21A0",Uacute:"\xDA",uacute:"\xFA",Uarr:"\u219F",uArr:"\u21D1",uarr:"\u2191",Uarrocir:"\u2949",Ubrcy:"\u040E",ubrcy:"\u045E",Ubreve:"\u016C",ubreve:"\u016D",Ucirc:"\xDB",ucirc:"\xFB",Ucy:"\u0423",ucy:"\u0443",udarr:"\u21C5",Udblac:"\u0170",udblac:"\u0171",udhar:"\u296E",ufisht:"\u297E",Ufr:"\u{1D518}",ufr:"\u{1D532}",Ugrave:"\xD9",ugrave:"\xF9",uHar:"\u2963",uharl:"\u21BF",uharr:"\u21BE",uhblk:"\u2580",ulcorn:"\u231C",ulcorner:"\u231C",ulcrop:"\u230F",ultri:"\u25F8",Umacr:"\u016A",umacr:"\u016B",uml:"\xA8",UnderBar:"_",UnderBrace:"\u23DF",UnderBracket:"\u23B5",UnderParenthesis:"\u23DD",Union:"\u22C3",UnionPlus:"\u228E",Uogon:"\u0172",uogon:"\u0173",Uopf:"\u{1D54C}",uopf:"\u{1D566}",UpArrow:"\u2191",Uparrow:"\u21D1",uparrow:"\u2191",UpArrowBar:"\u2912",UpArrowDownArrow:"\u21C5",UpDownArrow:"\u2195",Updownarrow:"\u21D5",updownarrow:"\u2195",UpEquilibrium:"\u296E",upharpoonleft:"\u21BF",upharpoonright:"\u21BE",uplus:"\u228E",UpperLeftArrow:"\u2196",UpperRightArrow:"\u2197",Upsi:"\u03D2",upsi:"\u03C5",upsih:"\u03D2",Upsilon:"\u03A5",upsilon:"\u03C5",UpTee:"\u22A5",UpTeeArrow:"\u21A5",upuparrows:"\u21C8",urcorn:"\u231D",urcorner:"\u231D",urcrop:"\u230E",Uring:"\u016E",uring:"\u016F",urtri:"\u25F9",Uscr:"\u{1D4B0}",uscr:"\u{1D4CA}",utdot:"\u22F0",Utilde:"\u0168",utilde:"\u0169",utri:"\u25B5",utrif:"\u25B4",uuarr:"\u21C8",Uuml:"\xDC",uuml:"\xFC",uwangle:"\u29A7",vangrt:"\u299C",varepsilon:"\u03F5",varkappa:"\u03F0",varnothing:"\u2205",varphi:"\u03D5",varpi:"\u03D6",varpropto:"\u221D",vArr:"\u21D5",varr:"\u2195",varrho:"\u03F1",varsigma:"\u03C2",varsubsetneq:"\u228A\uFE00",varsubsetneqq:"\u2ACB\uFE00",varsupsetneq:"\u228B\uFE00",varsupsetneqq:"\u2ACC\uFE00",vartheta:"\u03D1",vartriangleleft:"\u22B2",vartriangleright:"\u22B3",Vbar:"\u2AEB",vBar:"\u2AE8",vBarv:"\u2AE9",Vcy:"\u0412",vcy:"\u0432",VDash:"\u22AB",Vdash:"\u22A9",vDash:"\u22A8",vdash:"\u22A2",Vdashl:"\u2AE6",Vee:"\u22C1",vee:"\u2228",veebar:"\u22BB",veeeq:"\u225A",vellip:"\u22EE",Verbar:"\u2016",verbar:"|",Vert:"\u2016",vert:"|",VerticalBar:"\u2223",VerticalLine:"|",VerticalSeparator:"\u2758",VerticalTilde:"\u2240",VeryThinSpace:"\u200A",Vfr:"\u{1D519}",vfr:"\u{1D533}",vltri:"\u22B2",vnsub:"\u2282\u20D2",vnsup:"\u2283\u20D2",Vopf:"\u{1D54D}",vopf:"\u{1D567}",vprop:"\u221D",vrtri:"\u22B3",Vscr:"\u{1D4B1}",vscr:"\u{1D4CB}",vsubnE:"\u2ACB\uFE00",vsubne:"\u228A\uFE00",vsupnE:"\u2ACC\uFE00",vsupne:"\u228B\uFE00",Vvdash:"\u22AA",vzigzag:"\u299A",Wcirc:"\u0174",wcirc:"\u0175",wedbar:"\u2A5F",Wedge:"\u22C0",wedge:"\u2227",wedgeq:"\u2259",weierp:"\u2118",Wfr:"\u{1D51A}",wfr:"\u{1D534}",Wopf:"\u{1D54E}",wopf:"\u{1D568}",wp:"\u2118",wr:"\u2240",wreath:"\u2240",Wscr:"\u{1D4B2}",wscr:"\u{1D4CC}",xcap:"\u22C2",xcirc:"\u25EF",xcup:"\u22C3",xdtri:"\u25BD",Xfr:"\u{1D51B}",xfr:"\u{1D535}",xhArr:"\u27FA",xharr:"\u27F7",Xi:"\u039E",xi:"\u03BE",xlArr:"\u27F8",xlarr:"\u27F5",xmap:"\u27FC",xnis:"\u22FB",xodot:"\u2A00",Xopf:"\u{1D54F}",xopf:"\u{1D569}",xoplus:"\u2A01",xotime:"\u2A02",xrArr:"\u27F9",xrarr:"\u27F6",Xscr:"\u{1D4B3}",xscr:"\u{1D4CD}",xsqcup:"\u2A06",xuplus:"\u2A04",xutri:"\u25B3",xvee:"\u22C1",xwedge:"\u22C0",Yacute:"\xDD",yacute:"\xFD",YAcy:"\u042F",yacy:"\u044F",Ycirc:"\u0176",ycirc:"\u0177",Ycy:"\u042B",ycy:"\u044B",yen:"\xA5",Yfr:"\u{1D51C}",yfr:"\u{1D536}",YIcy:"\u0407",yicy:"\u0457",Yopf:"\u{1D550}",yopf:"\u{1D56A}",Yscr:"\u{1D4B4}",yscr:"\u{1D4CE}",YUcy:"\u042E",yucy:"\u044E",Yuml:"\u0178",yuml:"\xFF",Zacute:"\u0179",zacute:"\u017A",Zcaron:"\u017D",zcaron:"\u017E",Zcy:"\u0417",zcy:"\u0437",Zdot:"\u017B",zdot:"\u017C",zeetrf:"\u2128",ZeroWidthSpace:"\u200B",Zeta:"\u0396",zeta:"\u03B6",Zfr:"\u2128",zfr:"\u{1D537}",ZHcy:"\u0416",zhcy:"\u0436",zigrarr:"\u21DD",Zopf:"\u2124",zopf:"\u{1D56B}",Zscr:"\u{1D4B5}",zscr:"\u{1D4CF}",zwj:"\u200D",zwnj:"\u200C"});or.entityMap=or.HTML_ENTITIES});var Ba=de(Gr=>{"use strict";var En=qt(),Q=ei(),Sa=Yn(),hp=En.isHTMLEscapableRawTextElement,gp=En.isHTMLMimeType,bp=En.isHTMLRawTextElement,ar=En.hasOwn,Da=En.NAMESPACE,yp=Sa.ParseError,wp=Sa.DOMException,bn=0,Lt=1,yn=2,ir=3,wn=4,vn=5,sr=6,Kr=7;function ka(){}ka.prototype={parse:function(t,e,n){var r=this.domBuilder;r.startDocument(),Dp(e,e=Object.create(null)),vp(t,e,n,r,this.errorHandler),r.endDocument()}};var ui=/&#?\w+;?/g;function vp(t,e,n,r,o){var i=gp(r.mimeType);t.indexOf(Q.UNICODE_REPLACEMENT_CHARACTER)>=0&&o.warning("Unicode replacement character detected, source encoding issues?");function s(K){if(K>65535){K-=65536;var f=55296+(K>>10),y=56320+(K&1023);return String.fromCharCode(f,y)}else return String.fromCharCode(K)}function a(K){var f=K[K.length-1]===";"?K:K+";";if(!i&&f!==K)return o.error("EntityRef: expecting ;"),K;var y=Q.Reference.exec(f);if(!y||y[0].length!==f.length)return o.error("entity not matching Reference production: "+K),K;var w=f.slice(1,-1);return ar(n,w)?n[w]:w.charAt(0)==="#"?s(parseInt(w.substring(1).replace("x","0x"))):(o.error("entity not found:"+K),K)}function c(K){if(K>N){var f=t.substring(N,K).replace(ui,a);g&&E(N),r.characters(f,0,K-N),N=K}}var l=0,u=0,m=/\r\n?|\n|$/g,g=r.locator;function E(K,f){for(;K>=u&&(f=m.exec(t));)l=u,u=f.index+f[0].length,g.lineNumber++;g.columnNumber=K-l+1}for(var C=[{currentNSMap:e}],A=[],N=0;;){try{var B=t.indexOf("<",N);if(B<0){if(!i&&A.length>0)return o.fatalError("unclosed xml tag(s): "+A.join(", "));if(!t.substring(N).match(/^\s*$/)){var v=r.doc,x=v.createTextNode(t.substring(N));if(v.documentElement)return o.error("Extra content at the end of the document");v.appendChild(x),r.currentElement=x}return}if(B>N){var k=t.substring(N,B);!i&&A.length===0&&(k=k.replace(new RegExp(Q.S_OPT.source,"g"),""),k&&o.error("Unexpected content outside root element: '"+k+"'")),c(B)}switch(t.charAt(B+1)){case"/":var U=t.indexOf(">",B+2),L=t.substring(B+2,U>0?U:void 0);if(!L)return o.fatalError("end tag name missing");var h=Q.reg("^",Q.QName_group,Q.S_OPT,"$"),d=U>0&&h.exec(L);if(!d){var b=U>0&&Q.reg("^",Q.QName_group).exec(L);if(i&&b)o.warning('end tag name contains invalid trailing characters: "'+L+'"'),d=b;else if(b&&new RegExp(h.source,h.flags+"m").test(L))o.error('end tag name is followed by a line break and trailing content: "'+L+'"'),d=b;else return o.fatalError('end tag name contains invalid characters: "'+L+'"')}if(!r.currentElement&&!r.doc.documentElement)return;var S=A[A.length-1]||r.currentElement.tagName||r.doc.documentElement.tagName||"";if(S!==d[1]){var T=d[1].toLowerCase();if(!i||S.toLowerCase()!==T)return o.fatalError('Opening and ending tag mismatch: "'+S+'" != "'+L+'"')}var I=C.pop();A.pop();var P=I.localNSMap;if(r.endElement(I.uri,I.localName,S),P)for(var R in P)ar(P,R)&&r.endPrefixMapping(R);U++;break;case"?":g&&E(B),U=Ap(t,B,r,o);break;case"!":g&&E(B),U=Ta(t,B,r,o,i);break;default:g&&E(B);var $=new Na,_=C[C.length-1].currentNSMap,U=Ep(t,B,$,_,a,o,i),H=$.length;if($.closed||(i&&En.isHTMLVoidElement($.tagName)?$.closed=!0:A.push($.tagName)),g&&H){for(var J=Ca(g,{}),ne=0;ne<H;ne++){var re=$[ne];E(re.offset),re.locator=Ca(g,{})}r.locator=J,Aa($,r,_)&&C.push($),r.locator=g}else Aa($,r,_)&&C.push($);i&&!$.closed?U=xp(t,U,$.tagName,a,r):U++}}catch(K){if(K instanceof yp)throw K;if(K instanceof wp)return o.fatalError("Error constructing the DOM: "+K.name+": "+K.message,K);o.error("element parse error: "+K),U=-1}U>N?N=U:c(Math.max(B,N)+1)}}function Ca(t,e){return e.lineNumber=t.lineNumber,e.columnNumber=t.columnNumber,e}function Ep(t,e,n,r,o,i,s){function a(E,C,A){if(ar(n.attributeNames,E))return i.fatalError("Attribute "+E+" redefined");if(!s&&C.indexOf("<")>=0)return i.fatalError("Unescaped '<' not allowed in attributes values");n.addValue(E,C.replace(/[\t\n\r]/g," ").replace(ui,o),A)}for(var c,l,u=++e,m=bn;;){var g=t.charAt(u);if(m===bn&&g==="<")throw new Error("unexpected < in tag name: "+t.slice(e,u));switch(g){case"=":if(m===Lt)c=t.slice(e,u),m=ir;else if(m===yn)m=ir;else throw new Error("attribute equal must after attrName");break;case"'":case'"':if(m===ir||m===Lt)if(m===Lt&&(i.warning('attribute value must after "="'),c=t.slice(e,u)),e=u+1,u=t.indexOf(g,e),u>0)l=t.slice(e,u),a(c,l,e-1),m=vn;else throw new Error("attribute value no end '"+g+"' match");else if(m==wn)l=t.slice(e,u),a(c,l,e),i.warning('attribute "'+c+'" missed start quot('+g+")!!"),e=u+1,m=vn;else throw new Error('attribute value must after "="');break;case"/":switch(m){case bn:n.setTagName(t.slice(e,u));case vn:case sr:case Kr:m=Kr,n.closed=!0;case wn:case Lt:break;case yn:n.closed=!0;break;default:throw new Error("attribute invalid close char('/')")}break;case"":return i.error("unexpected end of input"),m==bn&&n.setTagName(t.slice(e,u)),u;case">":switch(m){case bn:n.setTagName(t.slice(e,u));case vn:case sr:case Kr:break;case wn:case Lt:l=t.slice(e,u),l.slice(-1)==="/"&&(n.closed=!0,l=l.slice(0,-1));case yn:m===yn&&(l=c),m==wn?(i.warning('attribute "'+l+'" missed quot(")!'),a(c,l,e)):(s||i.warning('attribute "'+l+'" missed value!! "'+l+'" instead!!'),a(l,l,e));break;case ir:if(!s)return i.fatalError(`AttValue: ' or " expected`)}return u;case"\x80":g=" ";default:if(g<=" ")switch(m){case bn:n.setTagName(t.slice(e,u)),m=sr;break;case Lt:c=t.slice(e,u),m=yn;break;case wn:var l=t.slice(e,u);i.warning('attribute "'+l+'" missed quot(")!!'),a(c,l,e);case vn:m=sr;break}else switch(m){case yn:s||i.warning('attribute "'+c+'" missed value!! "'+c+'" instead2!!'),a(c,c,e),e=u,m=Lt;break;case vn:i.warning('attribute space is required"'+c+'"!!');case sr:m=Lt,e=u;break;case ir:m=wn,e=u;break;case Kr:throw new Error("elements closed character '/' and '>' must be connected to")}}u++}}function Aa(t,e,n){for(var r=t.tagName,o=null,m=t.length;m--;){var i=t[m],s=i.qName,a=i.value,g=s.indexOf(":");if(g>0)var c=i.prefix=s.slice(0,g),l=s.slice(g+1),u=c==="xmlns"&&l;else l=s,c=null,u=s==="xmlns"&&"";i.localName=l,u!==!1&&(o==null&&(o=Object.create(null),n=Object.create(n)),n[u]=o[u]=a,i.uri=Da.XMLNS,e.startPrefixMapping(u,a))}for(var m=t.length;m--;)i=t[m],i.prefix&&(i.prefix==="xml"&&(i.uri=Da.XML),i.prefix!=="xmlns"&&(i.uri=n[i.prefix]));var g=r.indexOf(":");g>0?(c=t.prefix=r.slice(0,g),l=t.localName=r.slice(g+1)):(c=null,l=t.localName=r);var E=t.uri=n[c||""];if(e.startElement(E,l,r,t),t.closed){if(e.endElement(E,l,r),o)for(c in o)ar(o,c)&&e.endPrefixMapping(c)}else return t.currentNSMap=n,t.localNSMap=o,!0}function xp(t,e,n,r,o){var i=hp(n);if(i||bp(n)){var s=new RegExp("</"+n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+">","ig");s.lastIndex=e;var a=s.exec(t),c=a?a.index:-1;if(c<0)return e+1;var l=t.substring(e+1,c);return i&&(l=l.replace(ui,r)),o.characters(l,0,l.length),c}return e+1}function Dp(t,e){for(var n in t)ar(t,n)&&(e[n]=t[n])}function Ia(t,e){var n=e;function r(u){return u=u||0,t.charAt(n+u)}function o(u){u=u||1,n+=u}function i(){for(var u=0;n<t.length;){var m=r();if(m!==" "&&m!==`
`&&m!=="	"&&m!=="\r")return u;u++,o()}return-1}function s(){return t.substring(n)}function a(u){return t.substring(n,n+u.length)===u}function c(u){return t.substring(n,n+u.length).toUpperCase()===u.toUpperCase()}function l(u){var m=Q.reg("^",u),g=m.exec(s());return g?(o(g[0].length),g[0]):null}return{char:r,getIndex:function(){return n},getMatch:l,getSource:function(){return t},skip:o,skipBlanks:i,substringFromIndex:s,substringStartsWith:a,substringStartsWithCaseInsensitive:c}}function Cp(t,e){function n(a,c){var l=Q.PI.exec(a.substringFromIndex());return l?l[1].toLowerCase()==="xml"?c.fatalError("xml declaration is only allowed at the start of the document, but found at position "+a.getIndex()):(a.skip(l[0].length),l[0]):c.fatalError("processing instruction is not well-formed at position "+a.getIndex())}var r=t.getSource();if(t.char()==="["){t.skip(1);for(var o=t.getIndex();t.getIndex()<r.length;){if(t.skipBlanks(),t.char()==="]"){var i=r.substring(o,t.getIndex());return t.skip(1),i}var s=null;if(t.char()==="<"&&t.char(1)==="!")switch(t.char(2)){case"E":t.char(3)==="L"?s=t.getMatch(Q.elementdecl):t.char(3)==="N"&&(s=t.getMatch(Q.EntityDecl));break;case"A":s=t.getMatch(Q.AttlistDecl);break;case"N":s=t.getMatch(Q.NotationDecl);break;case"-":s=t.getMatch(Q.Comment);break}else if(t.char()==="<"&&t.char(1)==="?")s=n(t,e);else if(t.char()==="%")s=t.getMatch(Q.PEReference);else return e.fatalError("Error detected in Markup declaration");if(!s)return e.fatalError("Error in internal subset at position "+t.getIndex())}return e.fatalError("doctype internal subset is not well-formed, missing ]")}}function Ta(t,e,n,r,o){var i=Ia(t,e);switch(o?i.char(2).toUpperCase():i.char(2)){case"-":var s=i.getMatch(Q.Comment);return s?(n.comment(s,Q.COMMENT_START.length,s.length-Q.COMMENT_START.length-Q.COMMENT_END.length),i.getIndex()):r.fatalError("comment is not well-formed at position "+i.getIndex());case"[":var a=i.getMatch(Q.CDSect);return a?!o&&!n.currentElement?r.fatalError("CDATA outside of element"):(n.startCDATA(),n.characters(a,Q.CDATA_START.length,a.length-Q.CDATA_START.length-Q.CDATA_END.length),n.endCDATA(),i.getIndex()):r.fatalError("Invalid CDATA starting at position "+e);case"D":{if(n.doc&&n.doc.documentElement)return r.fatalError("Doctype not allowed inside or after documentElement at position "+i.getIndex());if(o?!i.substringStartsWithCaseInsensitive(Q.DOCTYPE_DECL_START):!i.substringStartsWith(Q.DOCTYPE_DECL_START))return r.fatalError("Expected "+Q.DOCTYPE_DECL_START+" at position "+i.getIndex());if(i.skip(Q.DOCTYPE_DECL_START.length),i.skipBlanks()<1)return r.fatalError("Expected whitespace after "+Q.DOCTYPE_DECL_START+" at position "+i.getIndex());var c={name:void 0,publicId:void 0,systemId:void 0,internalSubset:void 0};if(c.name=i.getMatch(Q.Name),!c.name)return r.fatalError("doctype name missing or contains unexpected characters at position "+i.getIndex());if(o&&c.name.toLowerCase()!=="html"&&r.warning("Unexpected DOCTYPE in HTML document at position "+i.getIndex()),i.skipBlanks(),i.substringStartsWith(Q.PUBLIC)||i.substringStartsWith(Q.SYSTEM)){var l=Q.ExternalID_match.exec(i.substringFromIndex());if(!l)return r.fatalError("doctype external id is not well-formed at position "+i.getIndex());l.groups.SystemLiteralOnly!==void 0?c.systemId=l.groups.SystemLiteralOnly:(c.systemId=l.groups.SystemLiteral,c.publicId=l.groups.PubidLiteral),i.skip(l[0].length)}else if(o&&i.substringStartsWithCaseInsensitive(Q.SYSTEM)){if(i.skip(Q.SYSTEM.length),i.skipBlanks()<1)return r.fatalError("Expected whitespace after "+Q.SYSTEM+" at position "+i.getIndex());if(c.systemId=i.getMatch(Q.ABOUT_LEGACY_COMPAT_SystemLiteral),!c.systemId)return r.fatalError("Expected "+Q.ABOUT_LEGACY_COMPAT+" in single or double quotes after "+Q.SYSTEM+" at position "+i.getIndex())}return o&&c.systemId&&!Q.ABOUT_LEGACY_COMPAT_SystemLiteral.test(c.systemId)&&r.warning("Unexpected doctype.systemId in HTML document at position "+i.getIndex()),o||(i.skipBlanks(),c.internalSubset=Cp(i,r)),i.skipBlanks(),i.char()!==">"?r.fatalError("doctype not terminated with > at position "+i.getIndex()):(i.skip(1),n.startDTD(c.name,c.publicId,c.systemId,c.internalSubset),n.endDTD(),i.getIndex())}default:return r.fatalError('Not well-formed XML starting with "<!" at position '+e)}}function Ap(t,e,n,r){var o=t.substring(e).match(Q.PI);if(!o)return r.fatalError("Invalid processing instruction starting at position "+e);if(o[1].toLowerCase()==="xml"){if(e>0)return r.fatalError("processing instruction at position "+e+" is an xml declaration which is only at the start of the document");if(!Q.XMLDecl.test(t.substring(e)))return r.fatalError("xml declaration is not well-formed")}return n.processingInstruction(o[1],o[2]),e+o[0].length}function Na(){this.attributeNames=Object.create(null)}Na.prototype={setTagName:function(t){if(!Q.QName_exact.test(t))throw new Error("invalid tagName:"+t);this.tagName=t},addValue:function(t,e,n){if(!Q.QName_exact.test(t))throw new Error("invalid attribute:"+t);this.attributeNames[t]=this.length,this[this.length++]={qName:t,value:e,offset:n}},length:0,getLocalName:function(t){return this[t].localName},getLocator:function(t){return this[t].locator},getQName:function(t){return this[t].qName},getURI:function(t){return this[t].uri},getValue:function(t){return this[t].value}};Gr.XMLReader=ka;Gr.parseUtils=Ia;Gr.parseDoctypeCommentOrCData=Ta});var Ma=de(Dn=>{"use strict";var Ht=qt(),Sp=di(),kp=Yn(),$a=xa(),Ip=Ba(),Tp=Sp.DOMImplementation,Np=Ht.hasDefaultHTMLNamespace,Bp=Ht.isHTMLMimeType,$p=Ht.isValidMimeType,_a=Ht.MIME_TYPE,pi=Ht.NAMESPACE,La=kp.ParseError,Lp=Ip.XMLReader;function Fa(t){return t.replace(/\r[\n\u0085]/g,`
`).replace(/[\r\u0085\u2028\u2029]/g,`
`)}function Pa(t){if(t=t||{},t.locator===void 0&&(t.locator=!0),this.assign=t.assign||Ht.assign,this.domHandler=t.domHandler||Jr,this.onError=t.onError||t.errorHandler,t.errorHandler&&typeof t.errorHandler!="function")throw new TypeError("errorHandler object is no longer supported, switch to onError!");t.errorHandler&&t.errorHandler("warning","The `errorHandler` option has been deprecated, use `onError` instead!",this),this.normalizeLineEndings=t.normalizeLineEndings||Fa,this.locator=!!t.locator,this.xmlns=this.assign(Object.create(null),t.xmlns)}Pa.prototype.parseFromString=function(t,e){if(!$p(e))throw new TypeError('DOMParser.parseFromString: the provided mimeType "'+e+'" is not valid.');var n=this.assign(Object.create(null),this.xmlns),r=$a.XML_ENTITIES,o=n[""]||null;Np(e)?(r=$a.HTML_ENTITIES,o=pi.HTML):e===_a.XML_SVG_IMAGE&&(o=pi.SVG),n[""]=o,n.xml=n.xml||pi.XML;var i=new this.domHandler({mimeType:e,defaultNamespace:o,onError:this.onError}),s=this.locator?{}:void 0;this.locator&&i.setDocumentLocator(s);var a=new Lp;a.errorHandler=i,a.domBuilder=i;var c=!Ht.isHTMLMimeType(e);return c&&typeof t!="string"&&a.errorHandler.fatalError("source is not a string"),a.parse(this.normalizeLineEndings(String(t)),n,r),i.doc.documentElement||a.errorHandler.fatalError("missing root element"),i.doc};function Jr(t){var e=t||{};this.mimeType=e.mimeType||_a.XML_APPLICATION,this.defaultNamespace=e.defaultNamespace||null,this.cdata=!1,this.currentElement=void 0,this.doc=void 0,this.locator=void 0,this.onError=e.onError}function xn(t,e){e.lineNumber=t.lineNumber,e.columnNumber=t.columnNumber}Jr.prototype={startDocument:function(){var t=new Tp;this.doc=Bp(this.mimeType)?t.createHTMLDocument(!1):t.createDocument(this.defaultNamespace,"")},startElement:function(t,e,n,r){var o=this.doc,i=o.createElementNS(t,n||e),s=r.length;Yr(this,i),this.currentElement=i,this.locator&&xn(this.locator,i);for(var a=0;a<s;a++){var t=r.getURI(a),c=r.getValue(a),n=r.getQName(a),l=o.createAttributeNS(t,n);this.locator&&xn(r.getLocator(a),l),l.value=l.nodeValue=c,i.setAttributeNode(l)}},endElement:function(t,e,n){this.currentElement=this.currentElement.parentNode},startPrefixMapping:function(t,e){},endPrefixMapping:function(t){},processingInstruction:function(t,e){var n=this.doc.createProcessingInstruction(t,e);this.locator&&xn(this.locator,n),Yr(this,n)},ignorableWhitespace:function(t,e,n){},characters:function(t,e,n){if(t=Oa.apply(this,arguments),t){if(this.cdata)var r=this.doc.createCDATASection(t);else var r=this.doc.createTextNode(t);this.currentElement?this.currentElement.appendChild(r):/^\s*$/.test(t)&&this.doc.appendChild(r),this.locator&&xn(this.locator,r)}},skippedEntity:function(t){},endDocument:function(){this.doc.normalize()},setDocumentLocator:function(t){t&&(t.lineNumber=0),this.locator=t},comment:function(t,e,n){t=Oa.apply(this,arguments);var r=this.doc.createComment(t);this.locator&&xn(this.locator,r),Yr(this,r)},startCDATA:function(){this.cdata=!0},endCDATA:function(){this.cdata=!1},startDTD:function(t,e,n,r){var o=this.doc.implementation;if(o&&o.createDocumentType){var i=o.createDocumentType(t,e,n,r);this.locator&&xn(this.locator,i),Yr(this,i),this.doc.doctype=i}},reportError:function(t,e){if(typeof this.onError=="function")try{this.onError(t,e,this)}catch(n){throw new La("Reporting "+t+' "'+e+'" caused '+n,this.locator)}else console.error("[xmldom "+t+"]	"+e,Op(this.locator))},warning:function(t){this.reportError("warning",t)},error:function(t){this.reportError("error",t)},fatalError:function(t,e){throw this.reportError("fatalError",t),new La(t,this.locator,e)}};function Op(t){if(t)return`
@#[line:`+t.lineNumber+",col:"+t.columnNumber+"]"}function Oa(t,e,n){return typeof t=="string"?t.substr(e,n):t.length>=e+n||e?new java.lang.String(t,e,n)+"":t}"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g,function(t){Jr.prototype[t]=function(){return null}});function Yr(t,e){t.currentElement?t.currentElement.appendChild(e):t.doc.appendChild(e)}function _p(t){if(t==="error")throw"onErrorStopParsing"}function Fp(){throw"onWarningStopParsing"}Dn.__DOMHandler=Jr;Dn.DOMParser=Pa;Dn.normalizeLineEndings=Fa;Dn.onErrorStopParsing=_p;Dn.onWarningStopParsing=Fp});var Ra=de(ce=>{"use strict";var Cn=qt();ce.assign=Cn.assign;ce.hasDefaultHTMLNamespace=Cn.hasDefaultHTMLNamespace;ce.isHTMLMimeType=Cn.isHTMLMimeType;ce.isValidMimeType=Cn.isValidMimeType;ce.MIME_TYPE=Cn.MIME_TYPE;ce.NAMESPACE=Cn.NAMESPACE;var Xr=Yn();ce.DOMException=Xr.DOMException;ce.DOMExceptionName=Xr.DOMExceptionName;ce.ExceptionCode=Xr.ExceptionCode;ce.ParseError=Xr.ParseError;var Ie=di();ce.Attr=Ie.Attr;ce.CDATASection=Ie.CDATASection;ce.CharacterData=Ie.CharacterData;ce.Comment=Ie.Comment;ce.Document=Ie.Document;ce.DocumentFragment=Ie.DocumentFragment;ce.DocumentType=Ie.DocumentType;ce.DOMImplementation=Ie.DOMImplementation;ce.Element=Ie.Element;ce.Entity=Ie.Entity;ce.EntityReference=Ie.EntityReference;ce.LiveNodeList=Ie.LiveNodeList;ce.NamedNodeMap=Ie.NamedNodeMap;ce.Node=Ie.Node;ce.NodeList=Ie.NodeList;ce.Notation=Ie.Notation;ce.ProcessingInstruction=Ie.ProcessingInstruction;ce.Text=Ie.Text;ce.XMLSerializer=Ie.XMLSerializer;var Qr=Ma();ce.DOMParser=Qr.DOMParser;ce.normalizeLineEndings=Qr.normalizeLineEndings;ce.onErrorStopParsing=Qr.onErrorStopParsing;ce.onWarningStopParsing=Qr.onWarningStopParsing});var zt=de((wg,Wa)=>{"use strict";var{DOMParser:Pp,XMLSerializer:An}=Ra(),qa="http://schemas.microsoft.com/winfx/2006/xaml";function ie(t,e){for(let n=0;n<t.childNodes.length;n++){let r=t.childNodes[n];if(r.nodeType===1&&r.localName===e)return r}return null}function ut(t){if(!t)return null;for(let e=0;e<t.childNodes.length;e++)if(t.childNodes[e].nodeType===1)return t.childNodes[e];return null}function Mp(t){return t.getAttributeNS(qa,"Name")||t.getAttribute("x:Name")||null}function Rp(t){return t.getAttributeNS(qa,"Key")||t.getAttribute("x:Key")||null}function Up(t){let e=ie(t,"VisualPropertiesStorage");if(e)return e;for(let n=0;n<t.childNodes.length;n++){let r=t.childNodes[n];if(!(r.nodeType!==1||!r.localName.includes("."))&&(e=ie(r,"VisualPropertiesStorage"),e))return e}return null}function qp(t){let e=Up(t);if(!e)return{x:0,y:0};let n=0,r=0;for(let o=0;o<e.childNodes.length;o++){let i=e.childNodes[o];if(i.nodeType!==1)continue;let s=Rp(i);s==="ElementX"&&(n=parseFloat(i.textContent)||0),s==="ElementY"&&(r=parseFloat(i.textContent)||0)}return{x:n,y:r}}function Wt(t){let e=ie(t,"DirectiveStep.Action");if(e)return ut(e);for(let n=0;n<t.childNodes.length;n++){let r=t.childNodes[n];if(r.nodeType===1&&!(r.localName.includes(".")||r.localName==="VisualPropertiesStorage"))return r}return null}function Zr(t){let e=ie(t,"DirectiveCondition.Condition");if(e)return ut(e);for(let n=0;n<t.childNodes.length;n++){let r=t.childNodes[n];if(r.nodeType===1&&!(r.localName.includes(".")||r.localName==="VisualPropertiesStorage"))return r}return null}var jp={CustomCodeAction:"Execute Custom Code",EnableDirectivesAction:"Enable Post Directive",RaiseExceptionAction:"Raise Exception",SetDataFieldAction:"Set Data Field",CallMethodAction:"Invoke BO Method",CompleteMethodCallAction:"Complete Method Call",SendEmailAction:"Send E-mail",ActivityTrackingAction:"Activity Tracking",LogMessageAction:"Log Message",ShowMessageAction:"Show Message",AttachDataTagAction:"Attach Data Tag",RemoveDataTagAction:"Remove Data Tag",AttachHoldAction:"Attach Hold",RemoveHoldsAction:"Remove Holds",EnablePostDirectiveAction:"Enable Post Directive",InvokeFunctionAction:"Invoke Function",InvokeExternalMethodAction:"Invoke External Method"},Hp={CustomCodeCondition:"C# Condition",FieldCondition:"Field Condition"};function Ua(t){if(!t)return null;let e=t.localName,n={};for(let u=0;u<t.attributes.length;u++){let m=t.attributes[u];m.name.startsWith("xmlns")||(n[m.name]=m.value)}let r=t.hasAttribute("Code")?t.getAttribute("Code"):null,o=null,i=ut(t);i&&i.localName==="String"&&(o=i.textContent);let s=null,a=null;if(e==="SetBpmDataFieldAction"){let u=ie(t,e+".Expression");if(u){let g=ie(u,"ExpressionDefinition");g&&(s=g.getAttribute("Text"))}let m=ie(t,e+".Field");if(m){let g=ie(m,"ColumnInfo");g&&(a={tableName:g.getAttribute("TableName"),columnName:g.getAttribute("ColumnName")})}}let c=null;if(e==="InvokeEpicorFunctionAction2"||e==="InvokeEpicorFunctionAction"){c=[];for(let u of["InputParameters","OutputParameters"]){let m=ie(t,e+"."+u);if(!m)continue;let g=ie(m,"Array")||m;for(let E=0;E<g.childNodes.length;E++){let C=g.childNodes[E];if(C.nodeType!==1||C.localName!=="ParameterBinding2")continue;let A=ie(C,"ParameterBinding2.BindingTarget"),N=A?ie(A,"VariableBindingTarget"):null;c.push({paramName:C.getAttribute("ParameterName")||"",paramDirection:C.getAttribute("ParameterDirection")||"Input",variableName:N&&N.getAttribute("VariableName")||""})}}}let l=null;if(e==="ConditionBlock"){l=[];let m=ie(t,"ConditionBlock.Items")||t;for(let g=0;g<m.childNodes.length;g++){let E=m.childNodes[g];if(E.nodeType!==1||E.localName!=="ConditionBlockItem")continue;let C=E.getAttribute("Operator")||"None",A=ie(E,"ConditionBlockItem.Condition"),N=A?ut(A):null;if(!N)continue;let B=N.localName,v={};for(let d=0;d<N.attributes.length;d++){let b=N.attributes[d];b.name.startsWith("xmlns")||(v[b.name]=b.value)}let x=null,k=ie(N,B+".Expression");if(k){let d=ie(k,"ExpressionDefinition");d&&(x=d.getAttribute("Text"))}let L=null,h=ie(N,B+".Field");if(h){let d=ie(h,"ColumnInfo");d&&(L={tableName:d.getAttribute("TableName"),columnName:d.getAttribute("ColumnName")})}l.push({localName:B,attrs:v,itemOperator:C,expressionText:x,fieldInfo:L})}}return{localName:e,attrs:n,code:r,message:o,conditions:l,actionExpressionText:s,actionFieldInfo:a,paramBindings:c,label:jp[e]||Hp[e]||e}}function Wp(t){for(let e=0;e<t.childNodes.length;e++){let n=t.childNodes[e];if(n.nodeType===1&&n.localName.endsWith(".StartNode"))return ut(n)}for(let e=0;e<t.childNodes.length;e++){let n=t.childNodes[e];if(n.nodeType===1&&(n.localName==="DirectiveStep"||n.localName==="DirectiveCondition"))return n}return null}function Et(t){if(!t)return null;let e=new Pp({onError:(c,l)=>{if(c==="fatalError")throw new Error(l)}}).parseFromString(t,"text/xml"),n=e.documentElement;if(!n)return null;let r=[],o=[],i=new Set;function s(c,l,u){if(!c||c.localName==="Null"||c.getAttribute("x:Null")!==null)return;let m=Mp(c)||`_node${r.length}`;if(i.has(m)){l!==null&&o.push({from:l,to:m,label:u});return}i.add(m),l!==null&&o.push({from:l,to:m,label:u});let{x:g,y:E}=qp(c);if(c.localName==="DirectiveCondition"){r.push({id:m,type:"condition",widget:Ua(Zr(c)),x:g,y:E,_el:c});let C=ie(c,"DirectiveCondition.True"),A=ie(c,"DirectiveCondition.False"),N=C?ut(C):null;N?s(N,m,"True"):o.push({from:m,to:null,label:"True"});let B=c.getAttribute("False"),v=A?ut(A):null;v?s(v,m,"False"):(!B||B==="{x:Null}")&&o.push({from:m,to:null,label:"False"})}else if(c.localName==="DirectiveStep"){r.push({id:m,type:"step",widget:Ua(Wt(c)),x:g,y:E,_el:c});let C=ie(c,"DirectiveStep.Next");C&&s(ut(C),m,null)}}let a=Wp(n);return a&&s(a,null,null),{nodes:r,edges:o,startNodeId:r[0]?.id??null,doc:e,root:n}}var zp=new Set(["CustomCodeAction","CustomCodeCondition"]);function ja(t){return!!t&&zp.has(t.localName)}function Ha(t){if(!t)return!1;let e=String(t).trimStart().slice(0,400);return e.startsWith("<")&&/Directive(Step|Condition|Definition)/.test(e)}function Vp(t){if(!Ha(t))return null;let e;try{e=Et(t)}catch{return null}if(!e||e.nodes.length===0)return null;let n=e.nodes.filter(r=>ja(r.widget)).map(r=>({id:r.id,type:r.type,label:r.widget.label,localName:r.widget.localName,code:r.widget.code||""}));return{nodeCount:e.nodes.length,codeNodes:n,onlyCustomCode:e.nodes.length===1&&n.length===1}}function Kp(t,e,n){let r=Et(t);if(!r)throw new Error("Failed to parse directive XAML");let o=r.nodes.find(s=>s.id===e);if(!o)throw new Error(`Node "${e}" not found`);let i=o.type==="condition"?Zr(o._el):Wt(o._el);if(!i)throw new Error(`No widget element found in node "${e}"`);if(!i.hasAttribute("Code"))throw new Error(`Widget ${i.localName} has no Code attribute`);return i.setAttribute("Code",n),new An().serializeToString(r.doc)}function Gp(t,e,n){let r=Et(t);if(!r)throw new Error("Failed to parse directive XAML");let o=r.nodes.find(a=>a.id===e);if(!o||o.type!=="step")throw new Error(`Step node "${e}" not found`);let i=Wt(o._el);if(!i||i.localName!=="RaiseExceptionAction")throw new Error(`Node "${e}" is not a RaiseExceptionAction`);let s=ut(i);return s&&s.localName==="String"&&(s.textContent=n),new An().serializeToString(r.doc)}function Yp(t,e,n){let r=Et(t);if(!r)throw new Error("Failed to parse directive XAML");let o=r.nodes.find(l=>l.id===e);if(!o)throw new Error(`Node "${e}" not found`);let i=o.type==="condition"?Zr(o._el):Wt(o._el);if(!i||i.localName!=="ConditionBlock")throw new Error("Not a ConditionBlock node");let a=ie(i,"ConditionBlock.Items")||i,c=[];for(let l=0;l<a.childNodes.length;l++){let u=a.childNodes[l];u.nodeType===1&&u.localName==="ConditionBlockItem"&&c.push(u)}for(let{index:l,conditionAttrs:u,expressionText:m,itemOperator:g,fieldInfo:E}of n){let C=c[l];if(!C)continue;g!==void 0&&C.setAttribute("Operator",g);let A=ie(C,"ConditionBlockItem.Condition"),N=A?ut(A):null;if(N){if(u)for(let[B,v]of Object.entries(u))N.setAttribute(B,v);if(m!==void 0){let B=ie(N,N.localName+".Expression");if(B){let v=ie(B,"ExpressionDefinition");v&&v.setAttribute("Text",m)}}if(E){let B=ie(N,N.localName+".Field");if(B){let v=ie(B,"ColumnInfo");v&&(E.tableName!==void 0&&v.setAttribute("TableName",E.tableName),E.columnName!==void 0&&v.setAttribute("ColumnName",E.columnName))}}}}return new An().serializeToString(r.doc)}function Jp(t,e,n){let r=Et(t);if(!r)throw new Error("Failed to parse directive XAML");let o=r.nodes.find(s=>s.id===e);if(!o)throw new Error(`Node "${e}" not found`);let i=o.type==="condition"?Zr(o._el):Wt(o._el);if(!i)throw new Error(`No widget element found in node "${e}"`);for(let[s,a]of Object.entries(n))i.setAttribute(s,a);return new An().serializeToString(r.doc)}function Xp(t,e,n,r){let o=Et(t);if(!o)throw new Error("Failed to parse directive XAML");let i=o.nodes.find(a=>a.id===e);if(!i)throw new Error(`Node "${e}" not found`);let s=Wt(i._el);if(!s)throw new Error(`No action element found in node "${e}"`);for(let[a,c]of Object.entries(n))s.setAttribute(a,c);for(let{paramName:a,variableName:c}of r)for(let l of["InputParameters","OutputParameters"]){let u=ie(s,s.localName+"."+l);if(!u)continue;let m=ie(u,"Array")||u;for(let g=0;g<m.childNodes.length;g++){let E=m.childNodes[g];if(E.nodeType!==1||E.localName!=="ParameterBinding2"||E.getAttribute("ParameterName")!==a)continue;let C=ie(E,"ParameterBinding2.BindingTarget"),A=C?ie(C,"VariableBindingTarget"):null;A&&A.setAttribute("VariableName",c)}}return new An().serializeToString(o.doc)}function Qp(t,e,n,r){let o=Et(t);if(!o)throw new Error("Failed to parse directive XAML");let i=o.nodes.find(a=>a.id===e);if(!i)throw new Error(`Node "${e}" not found`);let s=Wt(i._el);if(!s)throw new Error(`No action element found in node "${e}"`);if(n!==void 0){let a=ie(s,s.localName+".Expression");if(a){let c=ie(a,"ExpressionDefinition");c&&c.setAttribute("Text",n)}}if(r){let a=ie(s,s.localName+".Field");if(a){let c=ie(a,"ColumnInfo");c&&(r.tableName!==void 0&&c.setAttribute("TableName",r.tableName),r.columnName!==void 0&&c.setAttribute("ColumnName",r.columnName))}}return new An().serializeToString(o.doc)}var Zp=new Set(["Id","ValidationState","IsNewRow","RowMod","BitFlag","SysRevID","SysRowID","Code"]);function ef(t,e){let n=[];if(!t)return n.push(e+"(no widget)"),n;let r=Object.entries(t.attrs||{}).filter(([o])=>!o.startsWith("xmlns")&&!o.startsWith("x:")&&!Zp.has(o)).sort(([o],[i])=>o.localeCompare(i));for(let[o,i]of r)n.push(e+o+" = "+i);t.message!=null&&n.push(e+"Message = "+t.message),t.actionFieldInfo&&n.push(e+"Field = "+(t.actionFieldInfo.tableName||"")+"."+(t.actionFieldInfo.columnName||"")),t.actionExpressionText!=null&&n.push(e+"Expression = "+t.actionExpressionText);for(let o of t.paramBindings||[])n.push(e+"Param "+o.paramDirection+" "+o.paramName+" <-> "+o.variableName);if((t.conditions||[]).forEach((o,i)=>{let s=[];if(i>0&&s.push(o.itemOperator),s.push(o.localName),o.fieldInfo&&s.push((o.fieldInfo.tableName||"")+"."+(o.fieldInfo.columnName||"")),o.attrs&&o.attrs.Operator&&s.push(o.attrs.Operator),o.expressionText!=null&&s.push(o.expressionText),o.attrs&&o.attrs.Filter!==void 0&&s.push("["+o.attrs.Filter+"]"),n.push(e+"Condition "+(i+1)+": "+s.join(" ")),o.attrs&&o.attrs.Code)for(let a of String(o.attrs.Code).split(`
`))n.push(e+"  | "+a)}),t.code!=null){n.push(e+"Code:");for(let o of String(t.code).split(`
`))n.push(e+"  | "+o)}return n}function tf(t){let e;try{e=Et(t)}catch{return null}if(!e||e.nodes.length===0)return null;let n=new Map(e.nodes.map((i,s)=>[i.id,s+1])),r=i=>i==null?"(end)":"["+(n.get(i)??"?")+"]",o=[];return e.nodes.forEach((i,s)=>{o.push("["+(s+1)+"] "+(i.type==="condition"?"Condition":"Step")+": "+(i.widget?.label||i.widget?.localName||"(unknown)")),o.push(...ef(i.widget,"    "));for(let a of e.edges.filter(c=>c.from===i.id))o.push("    "+(a.label?a.label+" -> ":"-> ")+r(a.to));o.push("")}),o.join(`
`)}Wa.exports={parseDirective:Et,summarizeFlow:Vp,looksLikeFlowXaml:Ha,isCustomCodeWidget:ja,setNodeCode:Kp,setRaiseExceptionMessage:Gp,setNodeAttrs:Jp,setConditionChildren:Yp,setInvokeFunctionAction:Xp,setActionField:Qp,directiveToCanonicalText:tf}});var Vt=de((vg,Ga)=>{"use strict";var{looksLikeFlowXaml:za,summarizeFlow:Va,setNodeCode:nf}=zt();function fi(t){let e=t==null?"":String(t);if(!e.trim())return{kind:"code",code:"",usings:"",flow:null};if(za(e)){let r=Va(e);return r?{kind:"flow",xaml:e,xamlProp:null,envelope:null,code:"",usings:"",flow:r}:{kind:"code",code:e,usings:"",flow:null,unparsedFlow:!0}}let n=null;try{n=JSON.parse(e)}catch{}if(n&&typeof n=="object"){for(let[r,o]of Object.entries(n)){if(typeof o!="string"||!za(o))continue;let i=Va(o);if(i)return{kind:"flow",xaml:o,xamlProp:r,envelope:n,code:typeof n.Code=="string"?n.Code:"",usings:typeof n.Usings=="string"?n.Usings:"",flow:i}}return{kind:"code",code:n.Code||"",usings:n.Usings||"",flow:null}}return{kind:"code",code:e,usings:"",flow:null}}function Ka(t,e){if(t.kind!=="flow")throw new Error("Function body is not a widget flow");return t.xamlProp?JSON.stringify({...t.envelope,[t.xamlProp]:e}):e}function rf(t,e,n){let r=fi(t);return Ka(r,nf(r.xaml,e,n))}function of(t){let e=fi(t);return e.unparsedFlow?"":e.kind!=="flow"?e.code||"":e.flow.codeNodes.map(n=>(e.flow.codeNodes.length>1?`// \u2500\u2500 ${n.label} (${n.id}) \u2500\u2500
`:"")+n.code).join(`

`)}function sf(t){if(t.unparsedFlow)return"Unrecognised widget body";if(t.kind!=="flow")return"Code-based";if(t.flow.onlyCustomCode)return"Widget flow \u2014 custom code only";let e=t.flow.codeNodes.length;return`Widget flow \u2014 ${t.flow.nodeCount} widgets, ${e} with custom code`}function af(t){return String(t||"").replace(/\r\n?/g,`
`).split(`
`).map(e=>e.replace(/[ \t]+$/,"")).join(`
`).replace(/^\n+/,"").replace(/\n+$/,"")}Ga.exports={describeBody:fi,packFlowXaml:Ka,setBodyNodeCode:rf,bodyCodeText:of,bodyKindLabel:sf,normalizeCode:af}});var Ya=de(Ye=>{"use strict";var cf=Ye&&Ye.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),lf=Ye&&Ye.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),df=Ye&&Ye.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&cf(n,e,r[o]);return lf(n,e),n}})();Object.defineProperty(Ye,"__esModule",{value:!0});Ye.EfxTreeProvider=Ye.FunctionNode=Ye.LibraryNode=void 0;var fe=df(require("vscode")),{describeBody:uf,bodyKindLabel:pf}=Vt(),cr=class extends fe.TreeItem{constructor(e){super(e.LibraryID,fe.TreeItemCollapsibleState.Collapsed),this.library=e;let n=[];e.Published?n.push("$(cloud) Promoted"):n.push("Unpromoted / Editable"),e.Disabled&&n.push("$(circle-slash) Disabled"),e.LockedBy&&n.push(`$(lock) ${e.LockedBy}`),e.OwnedByCompany&&n.push(e.OwnedByCompany),this.description=e.Description||"",this.tooltip=[e.LibraryID,e.Description||"",`Status: ${e.Published?"Promoted":"Unpromoted / Editable"}`,e.LockedBy?`Locked by: ${e.LockedBy}`:"Unlocked",e.Disabled?"DISABLED":"",`Company: ${e.OwnedByCompany||"System"}`].filter(Boolean).join(`
`),this.contextValue=e.Published?"library-promoted":"library-unpromoted",e.Published?this.iconPath=new fe.ThemeIcon("cloud",new fe.ThemeColor("charts.green")):e.Disabled?this.iconPath=new fe.ThemeIcon("circle-slash",new fe.ThemeColor("charts.red")):e.LockedBy?this.iconPath=new fe.ThemeIcon("lock",new fe.ThemeColor("charts.yellow")):this.iconPath=new fe.ThemeIcon("package")}};Ye.LibraryNode=cr;var eo=class extends fe.TreeItem{constructor(e,n,r){super(n.FunctionID,fe.TreeItemCollapsibleState.None),this.libraryId=e,this.func=n,this.signatures=r;let o=r.filter(c=>!c.Response).map(c=>c.ArgumentName),i=r.filter(c=>c.Response).map(c=>c.ArgumentName),s=uf(n.Body),a=s.kind==="flow"&&!s.flow.onlyCustomCode;this.description=[n.Description||"",a?`${s.flow.nodeCount} widgets`:""].filter(Boolean).join(" \xB7 "),this.tooltip=[`${n.LibraryID}.${n.FunctionID}`,n.Description||"",pf(s),o.length?`Request: ${o.join(", ")}`:"Request: (none)",`Response: ${i.join(", ")}`,n.Disabled?"DISABLED":"",n.Invalid?"INVALID":""].filter(Boolean).join(`
`),this.contextValue=a?"function-widgets":"function",this.iconPath=new fe.ThemeIcon(n.Invalid?"warning":n.Disabled?"circle-slash":a?"type-hierarchy":"symbol-function"),this.command=a?{command:"efx.openFunctionWidgets",title:"Open Widget Graph",arguments:[{libraryId:this.libraryId,func:this.func}]}:{command:"efx.pullFunction",title:"Pull Function",arguments:[{libraryId:this.libraryId,func:this.func,signatures:this.signatures}]}}},to=class extends fe.TreeItem{constructor(e,n){super(`Functions (${n})`,fe.TreeItemCollapsibleState.Collapsed),this.libraryId=e,this.contextValue="function-group",this.iconPath=new fe.ThemeIcon("symbol-function")}},Kt=class extends fe.TreeItem{constructor(e,n,r,o){super(`${r} (${o})`,fe.TreeItemCollapsibleState.Collapsed),this.libraryId=e,this.kind=n,this.contextValue=`reference-group-${n}`;let i={tables:"database",services:"server",libraries:"library",assemblies:"package"};this.iconPath=new fe.ThemeIcon(i[n]||"references")}},Sn=class extends fe.TreeItem{constructor(e,n){let r="",o="",i="",s="references";e==="tables"?(r=n.TableID,o=n.Updatable?"Updatable":"Read-only",i=[n.TableID,`Updatable: ${n.Updatable?"Yes":"No"}`,`SysRowID: ${n.SysRowID||""}`].join(`
`),s=n.Updatable?"edit":"lock"):e==="services"?(r=n.ServiceID,o="Service",i=[n.ServiceID,`SysRowID: ${n.SysRowID||""}`].join(`
`),s="server"):e==="libraries"?(r=n.LibraryRef,o=n.Mode===1?"Read-only":n.Mode===2?"Hidden":"Normal",i=[n.LibraryRef,`Mode: ${n.Mode}`,`SysRowID: ${n.SysRowID||""}`].join(`
`),s="library"):e==="assemblies"&&(r=n.Assembly,o="Assembly",i=[n.Assembly,`SysRowID: ${n.SysRowID||""}`].join(`
`),s="package"),super(r||"(unknown)",fe.TreeItemCollapsibleState.None),this.kind=e,this.row=n,this.description=o,this.tooltip=i,this.contextValue=`reference-item-${e}`,this.iconPath=new fe.ThemeIcon(s)}};Ye.FunctionNode=eo;var mi=class{constructor(e){this.client=e,this._onDidChangeTreeData=new fe.EventEmitter,this.onDidChangeTreeData=this._onDidChangeTreeData.event,this.libraries=[],this.libraryCache=new Map}setClient(e){this.client=e}async refresh(){if(!this.client){fe.window.showWarningMessage("EFx: Configure connection first (gear icon)");return}try{this.libraries=await this.client.getLibraryList(),this.libraryCache.clear(),this._onDidChangeTreeData.fire(void 0),fe.window.showInformationMessage(`EFx: Loaded ${this.libraries.length} libraries`)}catch(e){fe.window.showErrorMessage(`EFx: Failed to load libraries: ${e.message}`)}}async getLibraryTableset(e){if(this.client){if(this.libraryCache.has(e))return this.libraryCache.get(e);try{let n=await this.client.getLibrary(e);return this.libraryCache.set(e,n),n}catch(n){fe.window.showErrorMessage(`EFx: Failed to load ${e}: ${n.message}`);return}}}invalidateCache(e){this.libraryCache.delete(e)}getTreeItem(e){return e}async getChildren(e){if(!this.client)return[];if(!e)return this.libraries.sort((n,r)=>n.LibraryID.localeCompare(r.LibraryID)).map(n=>new cr(n));if(e instanceof cr){let n=await this.getLibraryTableset(e.library.LibraryID);if(!n)return[];let r=[],o=n.EfxFunction||[],i=n.EfxRefTable||[],s=n.EfxRefService||[],a=n.EfxRefLibrary||[],c=n.EfxRefAssembly||[];return o.length>0,o.length>0&&r.push(new to(e.library.LibraryID,o.length)),r.push(new Kt(e.library.LibraryID,"tables","Tables",i.length)),r.push(new Kt(e.library.LibraryID,"services","Services",s.length)),r.push(new Kt(e.library.LibraryID,"libraries","Libraries",a.length)),r.push(new Kt(e.library.LibraryID,"assemblies","Assemblies",c.length)),r}if(e instanceof to){let n=await this.getLibraryTableset(e.libraryId);return n?(n.EfxFunction||[]).sort((r,o)=>r.FunctionID.localeCompare(o.FunctionID)).map(r=>{let o=(n.EfxFunctionSignature||[]).filter(i=>i.FunctionID===r.FunctionID);return new eo(e.libraryId,r,o)}):[]}if(e instanceof Kt){let n=await this.getLibraryTableset(e.libraryId);return n?e.kind==="tables"?(n.EfxRefTable||[]).sort((r,o)=>r.TableID.localeCompare(o.TableID)).map(r=>new Sn("tables",r)):e.kind==="services"?(n.EfxRefService||[]).sort((r,o)=>r.ServiceID.localeCompare(o.ServiceID)).map(r=>new Sn("services",r)):e.kind==="libraries"?(n.EfxRefLibrary||[]).sort((r,o)=>r.LibraryRef.localeCompare(o.LibraryRef)).map(r=>new Sn("libraries",r)):e.kind==="assemblies"?(n.EfxRefAssembly||[]).sort((r,o)=>r.Assembly.localeCompare(o.Assembly)).map(r=>new Sn("assemblies",r)):[]:[]}return[]}};Ye.EfxTreeProvider=mi});var Ja=de(pt=>{"use strict";var ff=pt&&pt.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),mf=pt&&pt.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),hf=pt&&pt.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&ff(n,e,r[o]);return mf(n,e),n}})();Object.defineProperty(pt,"__esModule",{value:!0});pt.ExecuteViewProvider=void 0;var gf=hf(require("vscode")),hi=class{constructor(){this.view=null,this.loaded=!1,this.client=null,this.libraryId="",this.functionId="",this.signatures=[],this.companies=[],this.defaultCompany="",this.treeProvider=null,this.staging=!1}resolveWebviewView(e){this.view=e,e.webview.options={enableScripts:!0},e.webview.onDidReceiveMessage(async n=>{this.loaded&&(n.command==="execute"&&await this.execute(n.payload,n.company),n.command==="saveSignatures"&&await this.saveSignatures(n.signatures))}),e.onDidDispose(()=>{this.view=null}),e.webview.html=this.loaded?this.getHtml():this.getEmptyHtml()}async load(e,n,r,o,i,s,a,c=!1){this.client=e,this.libraryId=n,this.functionId=r,this.signatures=o,this.companies=Array.isArray(i)&&i.length>0?i:s?[s]:[],this.defaultCompany=s||this.companies[0]||"",this.treeProvider=a||null,this.staging=c,this.loaded=!0,await gf.commands.executeCommand("efxExecuteView.focus"),this.view&&(this.view.webview.html=this.getHtml())}async execute(e,n){this.view.webview.postMessage({command:"executing"});try{let r=await this.client.executeFunction(this.libraryId,this.functionId,e,n||void 0,this.staging);this.view.webview.postMessage({command:"result",data:JSON.stringify(r,null,2),success:!0})}catch(r){this.view.webview.postMessage({command:"result",data:r.message,success:!1})}}async saveSignatures(e){this.view.webview.postMessage({command:"sigSaving"});try{let{saved:n,diagnostics:r,updatedSigs:o}=await this.client.saveSignatures(this.libraryId,this.functionId,e);if(!n){let s=(r||[]).map(a=>typeof a=="object"?a.Message||JSON.stringify(a):String(a));this.view.webview.postMessage({command:"sigError",error:s.join(`
`)||"Epicor rejected the signature change"});return}let i=this.signatures.filter(s=>s.FunctionID!==this.functionId);this.signatures=[...i,...o],this.treeProvider&&this.treeProvider.invalidateCache(this.libraryId),this.view.webview.postMessage({command:"sigSaved",signatures:o})}catch(n){this.view.webview.postMessage({command:"sigError",error:n.message})}}getHtml(){let e=this.signatures.filter(g=>!g.Response),n=this.signatures.filter(g=>g.Response),r={};for(let g of e)g.DataType.includes("Int")||g.DataType.includes("Decimal")||g.DataType.includes("Double")?r[g.ArgumentName]=0:g.DataType.includes("Boolean")?r[g.ArgumentName]=!1:g.DataType.includes("DataSet")||g.DataType.includes("DataTable")?r[g.ArgumentName]={}:r[g.ArgumentName]="";let o=e.map(g=>`<span class="param">${g.ArgumentName} <span class="type">${g.DataType.split(".").pop()}${g.Optional?"?":""}</span></span>`).join("")||'<span class="param none">No request parameters</span>',i=n.map(g=>`<span class="param">${g.ArgumentName} <span class="type">${g.DataType.split(".").pop()}</span></span>`).join(""),s=(this.companies||[]).map(g=>`<option value="${g}"${g===this.defaultCompany?" selected":""}>${g}</option>`).join(""),a=this.companies&&this.companies.length>0?`<div class="company-row">
        <label for="companySelect">Company</label>
        <select id="companySelect">${s}</select>
        <button class="btn-secondary" id="toggleSigBtn" onclick="toggleSigEditor()">\u2699 Edit Signatures</button>
    </div>`:`<div class="company-row">
        <button class="btn-secondary" id="toggleSigBtn" onclick="toggleSigEditor()">\u2699 Edit Signatures</button>
    </div>`,c=g=>({ArgumentName:g.ArgumentName,DataType:g.DataType||"System.String",Optional:!!g.Optional,Response:!!g.Response,Order:g.Order??0}),l=JSON.stringify(e.map(c)),u=JSON.stringify(n.map(c)),m=[["System.String","String"],["System.Int32","Int32"],["System.Int64","Int64"],["System.Decimal","Decimal"],["System.Double","Double"],["System.Boolean","Boolean"],["System.DateTime","DateTime"],["System.Data.DataSet","DataSet"],["System.Data.DataTable","DataTable"]].map(([g,E])=>`<option value="${g}">${E}</option>`).join("")+'<option value="__custom__">Custom\u2026</option>';return`<!DOCTYPE html>
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
            ${a}

            <div class="sig-editor" id="sigEditor">
                <div class="sig-tabs">
                    <button class="sig-tab active" id="tabReq"  onclick="switchTab('request')">Request Params</button>
                    <button class="sig-tab"        id="tabResp" onclick="switchTab('response')">Response Params</button>
                </div>
                <div class="sig-col-headers"><span>Argument Name</span><span>Data Type</span><span>Optional</span><span></span></div>
                <div class="sig-rows" id="sigRows"></div>
                <div class="sig-footer">
                    <input  id="newArgName"    placeholder="ArgumentName" />
                    <select id="newDataType">${m}</select>
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

        let reqSigs  = ${l};
        let respSigs = ${u};
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
</html>`}};pt.ExecuteViewProvider=hi});var Gt=de(Ne=>{"use strict";Object.defineProperty(Ne,"__esModule",{value:!0});Ne.BpmClient=void 0;var bf={PRE:1,BASE:2,POST:3};Ne.DIRECTIVE_TYPE=bf;var Xa=["BO","DB","DQ"];Ne.BPM_SOURCES=Xa;var Qa={BO:{1:"Pre",2:"Base",3:"Post"},DQ:{1:"Pre",2:"Base",3:"Post"},DB:{0:"InTran",1:"Standard"}};function yf(t){let e=String(t?.Source??t?.source??"").trim().toUpperCase();return Xa.includes(e)?e:"BO"}Ne.bpmSourceOf=yf;function wf(t,e){return Qa[t||"BO"]?.[e]||`Type${e}`}Ne.directiveTypeLabel=wf;function vf(t,e){let n=Qa[t||"BO"]||{};for(let[r,o]of Object.entries(n))if(o===e)return parseInt(r,10);return parseInt(String(e).replace("Type",""),10)}Ne.directiveTypeFromLabel=vf;function Ef(t){let e=String(t||"");return e.includes("/")?"DQ":e.split(".").length===3?"DB":"BO"}Ne.inferBpmSource=Ef;function Za(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\t/g,"&#x9;").replace(/\r\n/g,"&#xA;").replace(/\n/g,"&#xA;").replace(/\r/g,"&#xA;")}function ec(t){return t.replace(/&#xA;/gi,`
`).replace(/&#xD;/gi,"\r").replace(/&#x9;/gi,"	").replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")}Ne.xmlDecode=ec;Ne.xmlEncode=Za;function xf(t){if(!t)return{code:"",hasCustomCode:!1};let e=t.indexOf("CustomCodeAction");if(e<0)return{code:"",hasCustomCode:!1};let n='Code="',r=t.indexOf(n,e);if(r<0)return{code:"",hasCustomCode:!1};let o=r+n.length,i=o;for(;i<t.length&&t[i]!=='"';){if(t[i]==="&"){let a=t.indexOf(";",i);if(a<0)break;i=a+1;continue}i++}let s=t.slice(o,i);return{code:ec(s),hasCustomCode:!0}}Ne.extractBpmCode=xf;function tc(t,e){let n=t.indexOf("CustomCodeAction");if(n<0)throw new Error("No CustomCodeAction found in directive body");let r='Code="',o=t.indexOf(r,n);if(o<0)throw new Error("No Code= attribute found in CustomCodeAction");let i=o+r.length,s=i;for(;s<t.length&&t[s]!=='"';){if(t[s]==="&"){let a=t.indexOf(";",s);if(a<0)break;s=a+1;continue}s++}return t.slice(0,i)+Za(e)+t.slice(s)}Ne.replaceBpmCode=tc;function Df(t){return t?String(t).replace(/></g,`>
<`):""}Ne.formatBpmBodyXaml=Df;function Cf(t,e,n){let o=t.indexOf('"BpDirective":[');if(o<0)throw new Error("BpDirective array not found in raw tableset");let i=t.indexOf("[",o),s=`"DirectiveID":"${e}"`,a=i+1;for(;a<t.length;){let c=t.indexOf("{",a);if(c<0)break;let l=0,u=!1,m=!1,g=-1;for(let C=c;C<t.length;C++){let A=t[C];if(u){if(m){m=!1;continue}if(A==="\\"){m=!0;continue}A==='"'&&(u=!1);continue}if(A==='"'){u=!0;continue}if(A==="{")l++;else if(A==="}"&&(l--,l===0)){g=C;break}}if(g<0)throw new Error("Malformed BpDirective object in raw tableset");let E=t.slice(c,g+1);if(E.includes(s)){let C='"Body":"',A=E.indexOf(C);if(A<0)throw new Error("Body field not found in BpDirective row");let N=A+C.length,B=N,v=!1;for(;B<E.length;){let _=E[B];if(v){v=!1,B++;continue}if(_==="\\"){v=!0,B++;continue}if(_==='"')break;B++}if(B>=E.length)throw new Error("Body string value did not terminate");let x=B,k='"'+E.slice(N,x)+'"',L;try{L=JSON.parse(k)}catch(_){throw new Error("Failed to JSON-parse Body value: "+_.message)}let h=tc(L,n),d=JSON.stringify(h).slice(1,-1),b=E.slice(0,N)+d+E.slice(x),S=t.slice(0,c)+E+","+b+t.slice(g+1),T='"BitFlag":0,"RowMod":""',I='"BitFlag":0,"RowMod":"U"',P=c+E.length+1,R=P+b.length,$=S.indexOf(T,P);if($<0||$>R)throw new Error(`BitFlag/RowMod anchor not found for directive ${e}`);return S.slice(0,$)+I+S.slice($+T.length)}a=g+1}throw new Error(`Directive ${e} not found in raw tableset`)}Ne.updateRawBpmDirective=Cf;function nc(t){let e=t.indexOf('"returnObj"');if(e<0)return null;let n=t.indexOf("{",e);if(n<0)return null;let r=0,o=!1,i=!1;for(let s=n;s<t.length;s++){let a=t[s];if(o){i?i=!1:a==="\\"?i=!0:a==='"'&&(o=!1);continue}if(a==='"')o=!0;else if(a==="{")r++;else if(a==="}"&&--r===0)return t.slice(n,s+1)}return null}Ne.extractReturnObjRaw=nc;var gi=class{constructor(e){this._client=e}getBpmUrl(e){return`${this._client.config.serverUrl.replace(/\/$/,"")}/api/v2/odata/${this._client.config.company}/Ice.BO.BpMethodSvc/${e}`}async request(e,n){return this._client.request(e,n)}async requestRaw(e,n){return this._client.requestRaw(e,n)}async getBpmServices(){return(await this.request(this.getBpmUrl("GetBpmDirectiveServicesTS"),{})).returnObj?.BpDirectiveService||[]}async getBpmMethodsByService(e,n,r,o="BO"){let s=(await this.request(this.getBpmUrl("GetRowsEx"),{source:o,whereClauseBpMethod:`SystemCode = '${e}' and ObjectNS = '${n}' and BusinessObject = '${r}'`,whereClauseBpDirective:"",pageSize:500,absolutePage:1})).returnObj;return{methods:s?.BpMethod||[],directives:s?.BpDirective||[]}}async getBpmMethod(e,n){try{return(await this.request(this.getBpmUrl("GetByIDBpMethod"),{source:e,bpMethodCode:n})).returnObj}catch(r){if(!/record not found/i.test(r.message))throw r;let i=(await this.request(this.getBpmUrl("GetRowsEx"),this._oneMethodQuery(e,n))).returnObj;if(!i||!(i.BpMethod||[]).length)throw r;return i}}async getBpmMethodRaw(e,n){try{let r=await this.requestRaw(this.getBpmUrl("GetByIDBpMethod"),JSON.stringify({source:e,bpMethodCode:n})),o=r.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);return o?o[1]:r}catch(r){if(!/record not found/i.test(r.message))throw r;let o=await this.requestRaw(this.getBpmUrl("GetRowsEx"),JSON.stringify(this._oneMethodQuery(e,n))),i=nc(o);if(!i||!/"BpMethod":\[\s*\{/.test(i))throw r;return i}}_oneMethodQuery(e,n){let r=String(n).replace(/'/g,"''");return{source:e,whereClauseBpMethod:`BpMethodCode = '${r}'`,whereClauseBpDirective:`BpMethodCode = '${r}'`,pageSize:0,absolutePage:0}}async updateBpmRaw(e){let n=`{"ds":${e}}`,r=await this.requestRaw(this.getBpmUrl("Update"),n);try{return JSON.parse(r)}catch{return{}}}async getBpmRowsBySource(e){let r=(await this.request(this.getBpmUrl("GetRowsEx"),{source:e,whereClauseBpMethod:"",whereClauseBpDirective:"",pageSize:0,absolutePage:0})).returnObj;return{methods:r?.BpMethod||[],directives:r?.BpDirective||[]}}async getKineticDirective(e){let n=await this._client.requestGet(this.getBpmUrl("GetKineticDirective")+"?directiveId="+encodeURIComponent(e)),r=n?.returnObj??n;if(typeof r=="string")try{return JSON.parse(r)}catch{return null}return r&&typeof r=="object"?r:null}async validateCustomCode(e,n){let r=JSON.stringify({Code:e,IsCondition:!1});return(await this.request(this.getBpmUrl("ValidateCustomCode"),{codeSnippetWithScope:r,functionDefinition:JSON.stringify(n),isAsync:!1})).returnObj?.diagnostics||null}};Ne.BpmClient=gi;function Af(t,e){let n=t.SystemCode||"Erp",r=n.charAt(0).toUpperCase()+n.slice(1).toLowerCase(),o={INPUT:0,OUTPUT:1,"INPUT-OUTPUT":2};return{FunctionKind:0,Target:{kind:0,id:t.BpMethodCode,alias:t.BpMethodCode,productCode:{value:r},name:t.BusinessObject,method:t.Name,hasRootTransaction:t.HasRootTransaction},SupportsAdvancedFeatures:!0,SupportsDbAccessInCode:0,DebugMode:t.DebugMode||!1,Arguments:(e||[]).map(i=>({Name:i.BpArgumentName,Type:i.TypeInfo,TypeName:i.Type,Direction:o[i.Direction]??2,Kind:o[i.Direction]??2})),LocalVariables:[],CustomReferences:[{Name:"Assemblies",IsStandard:!1,IsEditable:!0,References:{}},{Name:"Externals",IsStandard:!1,IsEditable:!0,References:{}},{Name:"Standard",IsStandard:!0,IsEditable:!0,References:{}}],CustomUsings:""}}Ne.buildFunctionDefinition=Af});var oc=de(He=>{"use strict";var Sf=He&&He.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&kf(n,e,r[o]);return If(n,e),n}})(),kf=He&&He.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),If=He&&He.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e});Object.defineProperty(He,"__esModule",{value:!0});He.BpmTreeProvider=void 0;var le=Sf(require("vscode")),kn=Gt(),rc={BO:"Method Directives",DB:"Data Directives",DQ:"UBAQ Directives"},In=class extends le.TreeItem{constructor(e){super(rc[e],le.TreeItemCollapsibleState.Collapsed),this.source=e,this.contextValue="bpm-group",this.iconPath=new le.ThemeIcon(e==="DB"?"database":e==="DQ"?"table":"server-process")}},lr=class extends le.TreeItem{constructor(e,n){super(e.replace(/^Ice\./,""),le.TreeItemCollapsibleState.Collapsed),this.queryKey=e,this.methods=n,this.contextValue="bpm-query",this.iconPath=new le.ThemeIcon("table");let r=n.reduce((o,i)=>o+i.directives.length,0);this.description=`${r} directive${r===1?"":"s"}`,this.tooltip=e}},dr=class extends le.TreeItem{constructor(e){let n=`${e.SystemCode}.${e.ServiceKind}.${e.ServiceName}`;super(n,le.TreeItemCollapsibleState.Collapsed),this.svc=e,this.contextValue="bpm-service",this.iconPath=new le.ThemeIcon("server"),this.tooltip=`${e.SystemCode} / ${e.ServiceKind} / ${e.ServiceName}`}},Yt=class extends le.TreeItem{constructor(e,n,r){super(r||e.Name,le.TreeItemCollapsibleState.Collapsed),this.method=e,this.directives=n,this.contextValue="bpm-method";let o=kn.bpmSourceOf(e),i=[];if(o==="BO")e.HasPreProcessing&&i.push("Pre"),e.HasBaseProcessing&&i.push("Base"),e.HasPostProcessing&&i.push("Post");else for(let s of[...new Set((n||[]).map(a=>a.DirectiveType))].sort())i.push(kn.directiveTypeLabel(o,s));e.Disabled&&i.push("Disabled"),e.HasOutdatedDirectives&&i.push("\u26A0 Outdated"),this.description=i.join(" \xB7 ")||"No directives",this.tooltip=[`${e.BpMethodCode}`,`Source: ${e.Source}`,i.length?`Flags: ${i.join(", ")}`:""].filter(Boolean).join(`
`),e.Disabled?this.iconPath=new le.ThemeIcon("circle-slash",new le.ThemeColor("charts.red")):e.HasOutdatedDirectives?this.iconPath=new le.ThemeIcon("warning",new le.ThemeColor("charts.yellow")):i.length>0?this.iconPath=new le.ThemeIcon("symbol-event",new le.ThemeColor("charts.blue")):this.iconPath=new le.ThemeIcon("symbol-event")}},no=class extends le.TreeItem{constructor(e){super(e.Name,le.TreeItemCollapsibleState.None),this.directive=e;let n=kn.directiveTypeLabel(kn.bpmSourceOf(e),e.DirectiveType),{hasCustomCode:r}=kn.extractBpmCode(e.Body);this.description=[n,e.IsEnabled?"":"Disabled",r?"":"No code",e.DirectiveGroup?`[${e.DirectiveGroup}]`:""].filter(Boolean).join(" \xB7 "),this.contextValue=r?"bpm-directive-code":"bpm-directive-nocode",r||(this.command={command:"efx.bpm.openWidgetPanel",title:"Open Widget Panel",arguments:[{directive:e}]}),this.tooltip=[e.Name,`Type: ${n}`,`Enabled: ${e.IsEnabled}`,`Group: ${e.DirectiveGroup||"(none)"}`,r?"Has custom C# code":"No custom code (widget/condition only)",e.CompilerDiagnostics?`Diagnostics: ${e.CompilerDiagnostics}`:""].filter(Boolean).join(`
`),e.IsEnabled?r?e.DirectiveType===1?this.iconPath=new le.ThemeIcon("arrow-up",new le.ThemeColor("charts.blue")):e.DirectiveType===3?this.iconPath=new le.ThemeIcon("arrow-down",new le.ThemeColor("charts.green")):this.iconPath=new le.ThemeIcon("symbol-event"):this.iconPath=new le.ThemeIcon("gear"):this.iconPath=new le.ThemeIcon("circle-slash",new le.ThemeColor("charts.red")),r&&(this.command={command:"efx.bpm.pullDirective",title:"Pull Directive Code",arguments:[{directive:e}]})}};He.BpmGroupNode=In;He.BpmQueryNode=lr;He.BpmServiceNode=dr;He.BpmMethodNode=Yt;He.BpmDirectiveNode=no;var bi=class{constructor(e){this.bpmClient=e,this._onDidChangeTreeData=new le.EventEmitter,this.onDidChangeTreeData=this._onDidChangeTreeData.event,this.services=[],this.methodCache=new Map,this.sourceCache=new Map}setClient(e){this.bpmClient=e}async refresh(){if(!this.bpmClient){le.window.showWarningMessage("BPM: Configure EFx connection first");return}try{this.services=await this.bpmClient.getBpmServices(),this.methodCache.clear(),this.sourceCache.clear(),this._onDidChangeTreeData.fire(void 0),le.window.showInformationMessage(`BPM: Loaded ${this.services.length} services`)}catch(e){le.window.showErrorMessage(`BPM: Failed to load services: ${e.message}`)}}invalidateService(e,n,r){let o=`${e}.${n}.${r}`;this.methodCache.delete(o)}invalidateSource(e){this.sourceCache.delete(e)}async _loadSource(e){let n=this.sourceCache.get(e);if(n)return n;let r=await this.bpmClient.getBpmRowsBySource(e);return n={methods:r.methods.map(o=>({...o,Source:e})),directives:r.directives.map(o=>({...o,Source:e}))},this.sourceCache.set(e,n),n}_methodsWithDirectives(e){let n=new Map;for(let o of e.directives)n.has(o.BpMethodCode)||n.set(o.BpMethodCode,[]),n.get(o.BpMethodCode).push(o);let r=[];for(let[o,i]of n){let s=e.methods.find(a=>a.BpMethodCode===o)||{BpMethodCode:o,Name:o.split(".").pop(),Source:i[0].Source};r.push({method:s,directives:i})}return r.sort((o,i)=>o.method.BpMethodCode.localeCompare(i.method.BpMethodCode))}getTreeItem(e){return e}async getChildren(e){if(!this.bpmClient)return[];if(!e)return kn.BPM_SOURCES.map(n=>new In(n));if(e instanceof In&&e.source!=="BO"){let n;try{n=await this._loadSource(e.source)}catch(i){return le.window.showErrorMessage(`BPM: Failed to load ${rc[e.source]}: ${i.message}`),[]}let r=this._methodsWithDirectives(n);if(e.source==="DB")return r.map(({method:i,directives:s})=>new Yt(i,s,i.BpMethodCode.replace(/\.Update$/,"")));let o=new Map;for(let i of r){let s=i.method.BpMethodCode,a=s.slice(0,s.lastIndexOf("."));o.has(a)||o.set(a,[]),o.get(a).push(i)}return[...o.entries()].sort((i,s)=>i[0].localeCompare(s[0])).map(([i,s])=>new lr(i,s))}if(e instanceof lr)return e.methods.map(({method:n,directives:r})=>new Yt(n,r,n.BpMethodCode.split(".").pop()));if(e instanceof In)return this.services.sort((n,r)=>{let o=`${n.SystemCode}.${n.ServiceKind}.${n.ServiceName}`,i=`${r.SystemCode}.${r.ServiceKind}.${r.ServiceName}`;return o.localeCompare(i)}).map(n=>new dr(n));if(e instanceof dr){let{SystemCode:n,ServiceKind:r,ServiceName:o}=e.svc,i=`${n}.${r}.${o}`,s=this.methodCache.get(i);if(!s)try{s=await this.bpmClient.getBpmMethodsByService(n,r,o),this.methodCache.set(i,s)}catch(l){return le.window.showErrorMessage(`BPM: Failed to load methods: ${l.message}`),[]}let{methods:a,directives:c}=s;return a.sort((l,u)=>l.Name.localeCompare(u.Name)).map(l=>{let u=c.filter(m=>m.BpMethodCode===l.BpMethodCode);return new Yt(l,u)})}if(e instanceof Yt){let n=e.directives;return!n||n.length===0?[]:n.sort((r,o)=>r.DirectiveType!==o.DirectiveType?r.DirectiveType-o.DirectiveType:(r.Order||0)-(o.Order||0)).map(r=>new no(r))}return[]}};He.BpmTreeProvider=bi});var oo=de((Ag,sc)=>{"use strict";var Jt=require("vscode"),{parseDirective:Tf,setNodeCode:ic,setRaiseExceptionMessage:Nf,setNodeAttrs:Bf,setConditionChildren:$f,setInvokeFunctionAction:Lf,setActionField:Of}=zt(),ro=new Map;async function _f(t,e){let n=ro.get(e.key);if(n){n.panel.reveal(Jt.ViewColumn.One);return}let r;try{r=await e.loadXaml()}catch(s){Jt.window.showErrorMessage(`Widget panel: could not load ${e.title} \u2014 ${s.message}`);return}let o=Jt.window.createWebviewPanel("epicorWidgets",e.title,Jt.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),i={panel:o,host:e,xaml:r,render:()=>{}};ro.set(e.key,i),o.onDidDispose(()=>ro.delete(e.key),null,t.subscriptions),i.render=()=>{let s=Tf(i.xaml);if(!s||s.nodes.length===0){o.webview.html=Pf("Could not parse the widget XAML, or no widget nodes were found.<br>This may be a pure C# implementation with no visual widgets.");return}let a={nodes:s.nodes.map(c=>({id:c.id,type:c.type,widget:c.widget?{localName:c.widget.localName,label:c.widget.label,code:c.widget.code,message:c.widget.message,attrs:c.widget.attrs,conditions:c.widget.conditions,paramBindings:c.widget.paramBindings,actionExpressionText:c.widget.actionExpressionText,actionFieldInfo:c.widget.actionFieldInfo}:null,x:c.x,y:c.y})),edges:s.edges};o.webview.html=Mf(e.heading,e.badge||"",a)},i.render(),o.webview.onDidReceiveMessage(async s=>{s.type==="saveCode"?await Tn(i,()=>ic(i.xaml,s.nodeId,s.code)):s.type==="saveMessage"?await Tn(i,()=>Nf(i.xaml,s.nodeId,s.message)):s.type==="saveAttrs"?await Tn(i,()=>Bf(i.xaml,s.nodeId,s.attrs)):s.type==="saveConditions"?await Tn(i,()=>$f(i.xaml,s.nodeId,s.conditions)):s.type==="saveInvokeFunction"?await Tn(i,()=>Lf(i.xaml,s.nodeId,s.attrs,s.paramBindings)):s.type==="saveActionField"?await Tn(i,()=>Of(i.xaml,s.nodeId,s.expressionText,s.fieldInfo)):s.type==="openCode"&&await Jt.commands.executeCommand("efx.widget.openCode",{panelKey:e.key,meta:e.meta,title:e.title,nodeId:s.nodeId,label:s.label||"Custom Code",code:s.code||""})},null,t.subscriptions)}async function Tn(t,e){let{panel:n,host:r}=t;try{n.webview.postMessage({type:"saving"});let o=e();await r.saveXaml(o),t.xaml=o,n.webview.postMessage({type:"saved"}),Jt.window.showInformationMessage(`${r.heading}: saved.`)}catch(o){n.webview.postMessage({type:"saveError",message:o.message}),Jt.window.showErrorMessage(`Widget push failed: ${o.message}`)}}async function Ff(t,e,n){let r=await t.loadXaml(),o=ic(r,e,n);await t.saveXaml(o);let i=ro.get(t.key);return i&&(i.xaml=o,i.render()),o}function Pf(t){return`<!DOCTYPE html><html><body style="color:#f87171;font-family:sans-serif;padding:24px;background:#1e1e1e;font-size:13px">${t}</body></html>`}function Mf(t,e,n){let r=Rf(),o=JSON.stringify(n),i=JSON.stringify(t),s=JSON.stringify(e);return`<!DOCTYPE html>
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
const G=${o},DN=${i},TL=${s};
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
const isCode=n=>n?.widget?.localName==='CustomCodeAction'||n?.widget?.localName==='CustomCodeCondition';
G.nodes.forEach(n=>{
  const w=n.type==='condition'?CW:NW,h=n.type==='condition'?CH:NH;
  const s=ST[n.widget?.localName]||DS;
  const d=document.createElement('div');
  d.className='nd';d.dataset.id=n.id;
  d.style.cssText='left:'+n.x+'px;top:'+n.y+'px;width:'+w+'px;height:'+h+'px;background:'+s.bg+';border-color:'+s.bd+';color:'+s.fg;
  const l=document.createElement('div');l.className='nl';
  l.textContent=n.widget?.label||(n.type==='condition'?'Condition':'Step');
  d.appendChild(l);
  if(isCode(n)){
    const ss=document.createElement('div');ss.className='ns';ss.textContent='double-click to edit C#';d.appendChild(ss);
    d.title='Double-click to open this widget\u2019s C# in an editor';
    d.addEventListener('dblclick',()=>openCode(n));
  } else if(n.type==='condition'){const ss=document.createElement('div');ss.className='ns';ss.textContent='True / False';d.appendChild(ss);}
  d.addEventListener('click',()=>sel(n.id));
  cv.appendChild(d);
});
function openCode(n){
  vscode.postMessage({type:'openCode',nodeId:n.id,label:n.widget?.label||'Custom Code',code:n.widget?.code||''});
}
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
    const hint=document.createElement('div');
    hint.style.cssText='font-size:11px;color:#9ca3af;margin-bottom:4px';
    hint.textContent='Double-click the widget to edit this C# in a full editor.';
    pb.appendChild(hint);
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
</body></html>`}function Rf(){let t="",e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let n=0;n<32;n++)t+=e[Math.floor(Math.random()*e.length)];return t}sc.exports={openWidgetPanel:_f,pushNodeCode:Ff}});var dc=de((Sg,lc)=>{"use strict";var{openWidgetPanel:Uf}=oo(),{bpmSourceOf:qf,directiveTypeLabel:jf}=Gt();function ac(t,e="BO"){return jf(e,t)}function cc(t,e){let n=qf(e),r=ac(e.DirectiveType,n),o=e.Body||null;return{key:`bpm:${e.DirectiveID}`,title:`BPM: ${r} ${e.Name||e.DirectiveID}`,heading:e.Name||e.DirectiveID,badge:r,meta:{kind:"bpm",source:n,bpMethodCode:e.BpMethodCode,directiveId:e.DirectiveID,directiveType:e.DirectiveType,name:e.Name||e.DirectiveID},async loadXaml(){if(o)return o;let s=((await t.getBpmMethod(n,e.BpMethodCode))?.BpDirective||[]).find(a=>a.DirectiveID===e.DirectiveID);if(!s)throw new Error(`Directive ${e.DirectiveID} not found on ${e.BpMethodCode}`);return o=s.Body,o},async saveXaml(i){let s=await t.getBpmMethodRaw(n,e.BpMethodCode),a=Wf(s,e.DirectiveID,i),l=((await t.updateBpmRaw(a))?.returnObj?.BpMessageSvc||[]).filter(u=>u.Severity>1);if(l.length)throw new Error(l.map(u=>u.Message).join("; "));o=i,e.Body=i}}}function Hf(t,e,n){return Uf(t,cc(e,n))}function Wf(t,e,n){let r=t.indexOf('"BpDirective":[');if(r<0)throw new Error("BpDirective array not found in tableset");let o=`"DirectiveID":"${e}"`,i=t.indexOf("[",r)+1;for(;i<t.length;){let s=t.indexOf("{",i);if(s<0)break;let a=0,c=!1,l=!1,u=-1;for(let h=s;h<t.length;h++){let d=t[h];if(c){if(l){l=!1;continue}if(d==="\\"){l=!0;continue}d==='"'&&(c=!1);continue}if(d==='"'){c=!0;continue}if(d==="{")a++;else if(d==="}"&&(a--,!a)){u=h;break}}if(u<0)throw new Error("Malformed BpDirective object in tableset");let m=t.slice(s,u+1);if(!m.includes(o)){i=u+1;continue}let g='"Body":"',E=m.indexOf(g);if(E<0)throw new Error("Body field not found in directive row");let C=E+g.length,A=C,N=!1;for(;A<m.length;){let h=m[A];if(N){N=!1,A++;continue}if(h==="\\"){N=!0,A++;continue}if(h==='"')break;A++}let B=JSON.stringify(n).slice(1,-1),v=m.slice(0,C)+B+m.slice(A),x=t.slice(0,s)+m+","+v+t.slice(u+1),k='"BitFlag":0,"RowMod":""',L=x.indexOf(k,s+m.length+1);if(L<0)throw new Error(`RowMod anchor not found for directive ${e}`);return x.slice(0,L)+'"BitFlag":0,"RowMod":"U"'+x.slice(L+k.length)}throw new Error(`Directive ${e} not found in tableset`)}lc.exports={openBpmWidgetPanel:Hf,createBpmHost:cc,typeLabelOf:ac}});var mc=de((kg,fc)=>{"use strict";var{openWidgetPanel:zf}=oo(),{describeBody:uc,packFlowXaml:Vf}=Vt();function pc(t,e,n,r){let o=r?uc(r):null;async function i(){if(!o){let a=((await t.getLibrary(e))?.EfxFunction||[]).find(c=>c.FunctionID===n);if(!a)throw new Error(`Function ${e}.${n} not found on server`);o=uc(a.Body)}if(o.kind!=="flow")throw new Error(`${e}.${n} has no widget flow \u2014 it is a code-based function`);return o}return{key:`efx:${e}.${n}`,title:`Function: ${e}.${n}`,heading:`${e}.${n}`,badge:"Function",meta:{kind:"efx",libraryId:e,functionId:n},async loadXaml(){return(await i()).xaml},async saveXaml(s){let a=await i();await t.saveFunctionBody(e,n,Vf(a,s)),o={...a,xaml:s}}}}function Kf(t,e,n,r,o){return zf(t,pc(e,n,r,o))}fc.exports={openEfxWidgetPanel:Kf,createEfxHost:pc}});var vi=de(Xt=>{"use strict";var ur=Xt&&Xt.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&(n[r[o]]=e[r[o]]);return n.default=e,n}})();Object.defineProperty(Xt,"__esModule",{value:!0});Xt.registerUpdateCommand=tm;Xt.checkForUpdatesOnStartup=nm;Xt.mcpOutdated=Xf;var Te=ur(require("vscode")),bc=ur(require("https")),Nn=ur(require("fs")),yc=ur(require("path")),wc=ur(require("os")),Gf="mbcpi",Yf="epicor-customcode-manager",Jf="cpi",vc=`https://api.github.com/repos/${Gf}/${Yf}/releases/latest`,hc="efx.updateSnoozedVersion";function Ec(t,e){let n=l=>String(l||"0").replace(/^v/,"").split(".").map(u=>parseInt(u)||0),[r,o,i]=n(t),[s,a,c]=n(e);return s!==r?s>r:a!==o?a>o:c>i}function yi(t,e=3){return new Promise((n,r)=>{let o=bc.get(t,{headers:{"User-Agent":"epicor-efx-manager-vscode"}},i=>{if((i.statusCode===301||i.statusCode===302)&&i.headers.location&&e>0)return n(yi(i.headers.location,e-1));if(i.statusCode!==200)return i.resume(),r(new Error(`GitHub API returned ${i.statusCode}`));let s="";i.on("data",a=>{s+=a}),i.on("end",()=>{try{n(JSON.parse(s))}catch{r(new Error("Failed to parse GitHub API response"))}})});o.on("error",r),o.setTimeout(1e4,()=>{o.destroy(),r(new Error("Update check timed out"))})})}function wi(t,e,n=5){return new Promise((r,o)=>{let i=Nn.createWriteStream(e),s=bc.get(t,{headers:{"User-Agent":"epicor-efx-manager-vscode"}},a=>{if((a.statusCode===301||a.statusCode===302)&&a.headers.location&&n>0)return i.close(),Nn.unlink(e,()=>{}),r(wi(a.headers.location,e,n-1));if(a.statusCode!==200)return i.close(),Nn.unlink(e,()=>{}),o(new Error(`Download failed: HTTP ${a.statusCode}`));a.pipe(i),i.on("finish",()=>i.close(r)),i.on("error",c=>{Nn.unlink(e,()=>{}),o(c)})});s.on("error",a=>{Nn.unlink(e,()=>{}),o(a)}),s.setTimeout(6e4,()=>{s.destroy(),o(new Error("Download timed out"))})})}var gc=!1;function Xf(t,e){let n=t.extension&&t.extension.packageJSON&&t.extension.packageJSON.version;if(!n||e&&!Ec(e,n))return null;let r=e?`v${e}`:"an older version";return gc||(gc=!0,Te.window.showWarningMessage(`EFx: Claude's EFx MCP server is ${r}; this extension is v${n}. Install the matching MCP for Claude Desktop.`,"Install update","Later").then(async o=>{if(o==="Install update")try{await Qf()}catch(i){Te.window.showErrorMessage(`EFx: MCP update failed \u2014 ${i.message}`)}})),`The EFx MCP server Claude is using is ${r}, older than the VS Code extension (v${n}). Tell the user to update it: click "Install update" in VS Code, or download the .mcpb from the latest GitHub release and open it, then restart Claude Desktop.`}async function Qf(){let e=((await yi(vc)).assets||[]).find(r=>r.name&&r.name.endsWith(".mcpb"));if(!e)throw new Error("No .mcpb in the latest GitHub release");let n=yc.join(wc.tmpdir(),e.name);await Te.window.withProgress({location:Te.ProgressLocation.Notification,title:`EFx: Downloading ${e.name}...`,cancellable:!1},()=>wi(e.browser_download_url,n)),await Te.env.openExternal(Te.Uri.file(n)),Te.window.showInformationMessage("EFx: Claude Desktop should ask to install the MCP update. Restart Claude Desktop afterwards.")}async function Zf(){let t=await yi(vc),e=(t.assets||[]).find(n=>n.name&&n.name.endsWith(".vsix"));if(!e)throw new Error("No .vsix asset found in latest GitHub release");return{version:(t.tag_name||"").replace(/^v/,""),tagName:t.tag_name||"",releaseNotes:t.body||"",downloadUrl:e.browser_download_url,assetName:e.name}}async function em(t){let e=yc.join(wc.tmpdir(),t.assetName);await Te.window.withProgress({location:Te.ProgressLocation.Notification,title:`EFx: Downloading v${t.version}...`,cancellable:!1},async()=>{await wi(t.downloadUrl,e)});let n=Te.Uri.file(e);await Te.commands.executeCommand("workbench.extensions.installExtension",n),setTimeout(()=>{try{Nn.unlinkSync(e)}catch{}},5e3),await Te.window.showInformationMessage(`EFx Manager updated to v${t.version}. Reload window to activate?`,"Reload Now","Later")==="Reload Now"&&await Te.commands.executeCommand("workbench.action.reloadWindow")}async function xc(t,e=!1){let r=Te.extensions.getExtension(`${Jf}.epicor-efx-manager`)?.packageJSON?.version||"0.0.0",o;try{o=await Zf()}catch(a){e||Te.window.showWarningMessage(`EFx: Update check failed \u2014 ${a.message}`);return}if(!Ec(r,o.version)){e||Te.window.showInformationMessage(`EFx Manager is up to date (v${r})`);return}let i=t.globalState.get(hc,"");if(e&&i===o.version)return;let s=await Te.window.showInformationMessage(`EFx Manager v${o.version} is available (you have v${r})`,"Update Now","Later");if(s==="Update Now")try{await em(o)}catch(a){Te.window.showErrorMessage(`EFx: Update failed \u2014 ${a.message}`)}else s==="Later"&&await t.globalState.update(hc,o.version)}function tm(t){t.subscriptions.push(Te.commands.registerCommand("efx.checkForUpdates",async()=>{await xc(t,!1)}))}function nm(t){setTimeout(()=>{xc(t,!0).catch(()=>{})},5e3)}});var so=de(io=>{"use strict";var Dc=require("https"),Cc=require("http"),{withAuthRetry:rm}=To();function Ac(t){let e={layout:"layout",events:"events",dataviews:"dataviews",pages:"pages",rules:"rules",tools:"tools",classicLayout:"classicLayout",orphans:"orphans",properties:"properties"},n={};for(let[r,o]of Object.entries(t||{})){if(!o)continue;let i=r.replace(/\.jsonc?$/,"");if(e[i])try{n[e[i]]=JSON.parse(o)}catch{}}return n}var pr=class{constructor(e){this.config=e}_send(e){return rm(this.config,n=>e({"Content-Type":"application/json",...n}))}_methodUrl(e){return`${this.config.serverUrl.replace(/\/$/,"")}/api/v2/odata/${this.config.company}/Ice.LIB.MetaFXSvc/${e}`}_call(e,n){return this._send(r=>this._callWith(e,n,r))}_callWith(e,n,r){return new Promise((o,i)=>{let s=this._methodUrl(e),a=new URL(s),c=a.protocol==="https:",l=c?Dc:Cc,u=JSON.stringify(n),m={hostname:a.hostname,port:a.port||(c?443:80),path:a.pathname+a.search,method:"POST",headers:{...r,"Content-Length":Buffer.byteLength(u)},rejectUnauthorized:!1},g=l.request(m,E=>{let C="";E.on("data",A=>{C+=A}),E.on("end",()=>{if(E.statusCode>=200&&E.statusCode<300)try{o(C?JSON.parse(C):null)}catch{o(C)}else{let A=`HTTP ${E.statusCode}`;try{let N=JSON.parse(C);A=N.error?.message||N.ErrorMessage||JSON.stringify(N,null,2)}catch{A=C||A}console.error(`[MetaFX] ${e} failed ${E.statusCode}: body=`,C.slice(0,2e3)),console.error(`[MetaFX] ${e} request body was:`,u.slice(0,1e3)),i(Object.assign(new Error(A),{status:E.statusCode}))}})});g.on("error",i),g.write(u),g.end()})}_get(e,n){return this._send(r=>this._getWith(e,n,r))}_getWith(e,n,r){return new Promise((o,i)=>{let s=this._methodUrl(e),a=new URL(s);a.searchParams.set("request",JSON.stringify(n));let c=a.protocol==="https:",l=c?Dc:Cc,u={...r};delete u["Content-Type"];let m={hostname:a.hostname,port:a.port||(c?443:80),path:a.pathname+"?"+a.searchParams.toString(),method:"GET",headers:u,rejectUnauthorized:!1},g=l.request(m,E=>{let C="";E.on("data",A=>{C+=A}),E.on("end",()=>{if(E.statusCode>=200&&E.statusCode<300)try{o(C?JSON.parse(C):null)}catch{o(C)}else{let A=`HTTP ${E.statusCode}`;try{let N=JSON.parse(C);A=N.error?.message||N.ErrorMessage||C}catch{A=C||A}console.error(`[MetaFX] GET ${e} failed ${E.statusCode}:`,C.slice(0,1e3)),i(Object.assign(new Error(A),{status:E.statusCode}))}})});g.on("error",i),g.end()})}async listApps(){let e=await this._call("GetApplications",{request:{Type:"view",SubType:"",SearchText:"",IncludeAllLayers:!0}});return Array.isArray(e?.returnObj)?e.returnObj:[]}async getLayers(e){let n=await this._call("GetLayers",{request:{ViewId:e,IncludeUnpublishedLayers:!0}}),r=n?.returnObj,o=i=>Array.isArray(i)&&i.length>0&&typeof i[0]=="object"&&i[0]!==null&&("LayerName"in i[0]||"LayerDescription"in i[0]||"TypeCode"in i[0]);if(Array.isArray(r))return r;if(r&&typeof r=="object"){let i=["Layers","layers","EpMetaFXLayerForApplicationList","LayerList","value","Value","data","Data","items","Items","Result","result","EpMetaFXLayerList","AppLayerList","LayerDescriptors"];for(let s of i)if(o(r[s]))return r[s];for(let[s,a]of Object.entries(r))if(o(a))return console.error("[MetaFX] GetLayers used layer-shaped fallback key:",s,"shape keys:",Object.keys(r)),a;for(let s of i)if(Array.isArray(r[s])&&r[s].length>0)return r[s];for(let[s,a]of Object.entries(r))if(Array.isArray(a)&&a.length>0)return console.error("[MetaFX] GetLayers used fallback key:",s,"shape keys:",Object.keys(r)),a;for(let s of i)if(Array.isArray(r[s]))return r[s]}return r!=null?console.error("[MetaFX] GetLayers returnObj (no array found):",JSON.stringify(r).slice(0,600)):console.error("[MetaFX] GetLayers result:",JSON.stringify(n).slice(0,600)),[]}async applicationExists(e){return(await this._call("ApplicationExists",{viewId:e}))?.returnObj===!0}async deleteApp(e){await this._call("DeleteApp",{viewId:e})}async exportApp(e){return(await this._call("ExportApp",{viewId:e}))?.returnObj||null}async getAppForLayer(e,n,r="Desktop"){console.log(`[MetaFX] getAppForLayer \u2192 viewId="${e}" layer="${n}"`);let o={id:e,properties:{deviceType:r||"Desktop",layers:[n],baseAppVersion:0,layerVersion:0,mode:"AppStudio",applicationType:"view",ignorePersonalization:!1,additionalContext:{doValidation:!0,menuId:"preview",inPreviewMode:!0},checkDuplicateIds:!1,debug:!1}};console.log("[MetaFX] getAppForLayer request:",JSON.stringify(o));try{let i=await this._get("GetApp",o),s=i?.returnObj;return s?(console.log("[MetaFX] getAppForLayer OK \u2014 top-level keys:",Object.keys(s)),s):(console.error("[MetaFX] getAppForLayer: empty returnObj. Full response:",JSON.stringify(i).slice(0,500)),null)}catch(i){throw console.error(`[MetaFX] getAppForLayer failed for layer="${n}":`,i.message),i}}async getApplicationInfo(e){return(await this.listApps()).find(r=>r.Id===e)||null}async getNewApplication(e,n,r){await this._call("GetNewApplication",{request:{Id:e,Type:n,SubType:r}})}_buildLayerInfo(e,n={},r=!0){let o=n.layerDescription||"";return{ViewId:e,LayerDescription:o,LayerName:o,TypeCode:n.typeCode||"KNTCCustLayer",WIP:r,IsNew:n.isNew||!1,Company:n.company||this.config.company||"",DeviceType:"Desktop",CGCCode:"",SystemFlag:!1,HasDraftContent:r,PublishParentLayers:!1,CommentText:n.comment||"",ParentLayers:null,UserName:null,Content:null,ChangedOn:new Date().toISOString().slice(0,10)+"T00:00:00",LayerUpdatedToPropDiffFormat:null,ProcessedInfo:null,LastUpdatedBy:""}}async saveApp(e,n,r={}){let o=Ac(n),i=r.subType||o.layout?.viewType||"Dashboard";return(await this._call("SaveApp",{request:{id:e,viewType:i,...o,applicationType:"view",subApplicationType:i,uxAppVersion:0,commentText:r.comment||"",deviceType:"Desktop",layerInfo:this._buildLayerInfo(e,r,!0)}}))?.returnObj}async publishApp(e,n,r={}){let o=Ac(n),i=r.subType||o.layout?.viewType||"Dashboard";return(await this._call("PublishApp",{request:{id:e,viewType:i,...o,applicationType:"view",subApplicationType:i,uxAppVersion:0,commentText:r.comment||"",deviceType:"Desktop",layerInfo:this._buildLayerInfo(e,r,!1)}}))?.returnObj}async saveAppRequest(e){let n=await this._call("SaveApp",{request:e}),r=n&&typeof n=="object"&&(n.error?.message||n.ErrorMessage||n.returnObj?.ErrorMessage);if(r)throw new Error(r);return n?.returnObj}async exportLayers(e){return(await this._call("ExportLayers",{apps:e}))?.returnObj??null}async importLayers(e,n=!0){let r=await this._call("ImportLayers",{fileContent:{content:e,overwrite:n}});if(r&&typeof r=="object"){let o=r.error?.message||r.ErrorMessage||r.returnObj?.ErrorMessage||null;if(o)throw new Error(o)}return r}};io.KineticMetaFXClient=pr;io.KineticLayerClient=pr;io.KineticAppClient=pr});var $c=de((Ng,Bc)=>{"use strict";var{parseDirective:om,directiveToCanonicalText:im,looksLikeFlowXaml:sm}=zt(),{formatBpmBodyXaml:am,directiveTypeLabel:cm}=Gt();function Di(t){if(t&&typeof t=="object")return t;if(typeof t!="string")return null;let e=t.trim();if(!e.startsWith("{"))return null;try{return JSON.parse(e)}catch{return null}}function fr(t){if(!t||!String(t).trim())return"empty";let e=Di(t);return e&&(e.Nodes||e.Links||e.Version!==void 0)?"json":sm(t)?"xaml":"other"}function co(t){if(Array.isArray(t))return t.map(co);if(t&&typeof t=="object"){if(Array.isArray(t.$values))return t.$values.map(co);let e={};for(let n of Object.keys(t))e[n]=co(t[n]);return e}return t}function ao(t){if(!t)return"";let e=String(t).split(",")[0];return e.slice(e.lastIndexOf(".")+1)}function xi(t){return Array.isArray(t)?t.map(xi):t&&typeof t=="object"?Object.keys(t).sort().reduce((e,n)=>(e[n]=xi(t[n]),e),{}):t}var Qt=t=>t&&typeof t=="object"?JSON.stringify(xi(t)):String(t),lm=new Set(["$type","Id","Code","VisualProperties","ValidationState"]);function Ei(t,e){let n=[];if(!t||typeof t!="object")return n;for(let r of Object.keys(t).sort()){if(lm.has(r)||r.startsWith("_"))continue;let o=t[r];o==null||o===""||n.push(e+r+" = "+Qt(o))}return n}function Sc(t,e){return String(t).replace(/\r\n/g,`
`).split(`
`).map(n=>e+"| "+n)}function Tc(t){let e=Di(t);if(!e)return null;let n=co(e),r=Array.isArray(n.Nodes)?n.Nodes:[],o=n.Links||n,i=o.NextNodes||{},s=o.TrueNodes||{},a=o.FalseNodes||{},c=new Map(r.map(v=>[String(v.Id),v])),l=[],u=new Set,m=v=>{v!=null&&(v=String(v),!(u.has(v)||!c.has(v))&&(u.add(v),l.push(v),m(i[v]),m(s[v]),m(a[v])))};m(o.StartNodeId);for(let v of r)u.has(String(v.Id))||(u.add(String(v.Id)),l.push(String(v.Id)));let g=new Map(l.map((v,x)=>[v,x+1])),E=v=>v==null?"(end)":"["+(g.get(String(v))??"?")+"]",C=[],A=[],N=[],B={nodes:[],edges:[]};if(n.AdditionalUsings&&C.push("Usings = "+Qt(n.AdditionalUsings)),n.AdditionalReferences&&(!Array.isArray(n.AdditionalReferences)||n.AdditionalReferences.length)&&C.push("References = "+Qt(n.AdditionalReferences)),Array.isArray(n.Variables)&&n.Variables.length)for(let v of n.Variables)C.push("Variable "+(v.Name||"?")+" : "+Qt(v.TypeData||v.Type||""));return C.length&&C.push(""),n.VisualProperties&&N.push("(directive) "+Qt(n.VisualProperties)),l.forEach((v,x)=>{let k=c.get(v),L=x+1,h=ao(k.$type),d=h==="DirectiveCondition"||!!k.Condition,b=d?"Condition":ao(k.Action&&k.Action.$type)||h||"(unknown)",S="["+L+"] "+(d?"Condition":"Step")+": "+b+(k.DisplayName?'  "'+k.DisplayName+'"':""),T=C.length;if(C.push(S),d)(k.Condition&&k.Condition.Items||[]).forEach((R,$)=>{let _=R.Condition||{};C.push("    Condition "+($+1)+": "+($>0&&R.Operator!=null?R.Operator+" ":"")+ao(_.$type)),C.push(...Ei(_,"        ")),_.Code&&(C.push(...Sc(_.Code,"        ")),A.push("// ["+L+"] condition "+($+1)+" "+ao(_.$type),String(_.Code),""))}),C.push(...Ei(k.Condition,"    ").filter(R=>!R.trim().startsWith("Items ="))),C.push("    True -> "+E(s[v])),C.push("    False -> "+E(a[v]));else{let P=k.Action||{};C.push(...Ei(P,"    ")),P.Code&&(C.push("    Code:",...Sc(P.Code,"      ")),A.push("// ["+L+"] "+b+(k.DisplayName?' "'+k.DisplayName+'"':""),String(P.Code),"")),C.push("    -> "+E(i[v]))}let I=k.VisualProperties||{};B.nodes.push({n:L,kind:d?"condition":"step",widget:b,label:k.DisplayName||"",x:+I.ElementX||0,y:+I.ElementY||0,sig:C.slice(T+1).filter(P=>!/^\s*(True |False )?-> /.test(P)).join(`
`)}),d?(B.edges.push({from:L,to:g.get(String(s[v]))||null,label:"True"}),B.edges.push({from:L,to:g.get(String(a[v]))||null,label:"False"})):i[v]!=null&&B.edges.push({from:L,to:g.get(String(i[v]))||null,label:""}),C.push(""),N.push("["+L+"] "+b+"  "+Qt(I))}),{text:C.join(`
`),code:A.join(`
`),layout:N.join(`
`),graph:B}}function dm(t){let e=im(t);if(e==null)return{text:am(t),code:"",layout:"",graph:null};let n=[],r=[],o={nodes:[],edges:[]};try{let i=om(t),s=new Map((i?.nodes||[]).map((a,c)=>[a.id,c+1]));for(let a of i?.edges||[])s.has(a.from)&&o.edges.push({from:s.get(a.from),to:a.to==null?null:s.get(a.to)||null,label:a.label||""});(i?.nodes||[]).forEach((a,c)=>{let l=a.widget||{},u=c+1,{attrs:m,...g}=l,E={};for(let C of Object.keys(m||{}).sort())!C.startsWith("x:")&&!C.startsWith("xmlns")&&C!=="Id"&&C!=="ValidationState"&&(E[C]=m[C]);o.nodes.push({n:u,kind:a.type==="condition"?"condition":"step",widget:a.type==="condition"?"Condition":l.localName||a.type,label:a._el&&a._el.getAttribute&&a._el.getAttribute("DisplayName")||"",x:+a.x||0,y:+a.y||0,sig:Qt({...g,attrs:E})}),l.code!=null&&n.push("// ["+u+"] "+(l.localName||""),String(l.code),""),(l.conditions||[]).forEach((C,A)=>{C.attrs&&C.attrs.Code&&n.push("// ["+u+"] condition "+(A+1)+" "+C.localName,String(C.attrs.Code),"")}),r.push("["+u+"] "+(l.localName||a.type)+"  x="+a.x+" y="+a.y)})}catch{}return{text:e,code:n.join(`
`),layout:r.join(`
`),graph:o}}function Nc(t){let e=fr(t);return e==="empty"?{format:e,text:"",code:"",layout:"",graph:null}:e==="json"?{format:e,...Tc(t)||{text:String(t),code:"",layout:"",graph:null}}:e==="xaml"?{format:e,...dm(t)}:{format:e,text:String(t),code:"",layout:"",graph:null}}function lo(t){return[t.Source||"BO",t.BpMethodCode,t.DirectiveType,t.Name].join("|")}function kc(t,e){let n=t._canon||Nc(t.Body||"");return{key:lo(t),Source:t.Source||"BO",BpMethodCode:t.BpMethodCode,DirectiveID:t.DirectiveID||"",Name:t.Name||"",DirectiveType:t.DirectiveType,IsEnabled:t.IsEnabled,Order:t.Order??t.Sequence??"",DirectiveGroup:t.DirectiveGroup||"",MethodDisabled:!!(e&&e.Disabled),format:n.format,origFormat:t._origFormat||n.format,normalized:!!t._normalized,text:n.text,code:n.code,layout:n.layout,graph:n.graph||null}}var um=[["Widgets","text"],["Code","code"]],pm=["DirectiveType","IsEnabled","Order","DirectiveGroup","MethodDisabled"];function Ic(t,e){let n={},r=!1;for(let[o,i]of um){let s=(t[i]||"")===(e[i]||"");s||(r=!0),n[o]={same:s}}for(let o of pm){let i=String(t[o]??""),s=String(e[o]??""),a=i===s;a||(r=!0),n[o]={a:i,b:s,same:a}}return n.Layout={same:(t.layout||"")===(e.layout||""),infoOnly:!0},n.Format={a:t.origFormat,b:e.origFormat,same:t.origFormat===e.origFormat,infoOnly:!0},n.hasDiff=r,n}function fm(t,e,n,r){let o=v=>(v.Source||"BO")+"|"+v.BpMethodCode,i=new Map(t.map(v=>[o(v),v])),s=new Map(n.map(v=>[o(v),v])),a=new Map,c=new Map;for(let v of e){let x=kc(v,i.get((v.Source||"BO")+"|"+v.BpMethodCode));a.set(x.key,x)}for(let v of r){let x=kc(v,s.get((v.Source||"BO")+"|"+v.BpMethodCode));c.set(x.key,x)}let l=[],u=[...new Set([...a.keys(),...c.keys()])].sort();for(let v of u){let x=a.get(v)||null,k=c.get(v)||null;if(x&&k){let L=Ic(x,k);l.push({key:v,status:L.hasDiff?"diff":"match",a:x,b:k,fields:L,layoutDiff:!L.Layout.same})}else l.push({key:v,status:x?"only-a":"only-b",a:x,b:k,fields:null,layoutDiff:!1})}let m=l.filter(v=>v.status==="only-a"&&v.a.DirectiveID),g=l.filter(v=>v.status==="only-b"&&v.b.DirectiveID),E=new Set;for(let v of m){let x=g.find(k=>!E.has(k)&&k.b.DirectiveID===v.a.DirectiveID&&k.b.BpMethodCode===v.a.BpMethodCode&&k.b.Source===v.a.Source);x&&(E.add(x),v.b=x.b,v.status="renamed",v.fields=Ic(v.a,v.b),v.layoutDiff=!v.fields.Layout.same,v.renamedTo=x.b.Name)}let C=l.filter(v=>!E.has(v)),A=new Map;for(let v of C){let x=v.a||v.b,k=i.get(x.Source+"|"+x.BpMethodCode)||s.get(x.Source+"|"+x.BpMethodCode)||{},L=k.SystemCode||String(x.BpMethodCode).split(".")[0]||"Erp",h=k.BusinessObject||String(x.BpMethodCode).split(".").slice(-2,-1)[0]||x.BpMethodCode,d=x.Source+":"+L+":"+h;A.has(d)||A.set(d,{svcKey:d,source:x.Source,systemCode:L,businessObject:h,methods:new Map});let b=A.get(d);b.methods.has(x.BpMethodCode)||b.methods.set(x.BpMethodCode,{methodCode:x.BpMethodCode,methodName:k.Name||String(x.BpMethodCode).split(".").pop(),inA:i.has(x.Source+"|"+x.BpMethodCode),inB:s.has(x.Source+"|"+x.BpMethodCode),dirs:[]}),b.methods.get(x.BpMethodCode).dirs.push({...v,typeLabel:cm(x.Source,x.DirectiveType)})}let N={match:0,diff:0,"only-a":0,"only-b":0,renamed:0};for(let v of C)N[v.status]++;let B=[...A.values()].map(v=>{let x=[...v.methods.values()].map(h=>(h.dirs.sort((d,b)=>(d.a||d.b).DirectiveType-(b.a||b.b).DirectiveType||String((d.a||d.b).Order).localeCompare(String((b.a||b.b).Order))||(d.a||d.b).Name.localeCompare((b.a||b.b).Name)),h.status=h.dirs.some(d=>d.status!=="match")?"diff":"match",h)).sort((h,d)=>h.methodName.localeCompare(d.methodName)),k=x.reduce((h,d)=>h+d.dirs.filter(b=>b.status!=="match").length,0),L=x.reduce((h,d)=>h+d.dirs.length,0);return{svcKey:v.svcKey,source:v.source,systemCode:v.systemCode,businessObject:v.businessObject,status:k?"diff":"match",diffCount:k,dirCount:L,methods:x}}).sort((v,x)=>(v.status===x.status?0:v.status==="diff"?-1:1)||v.businessObject.localeCompare(x.businessObject));return{services:B,counts:N,total:C.length,serviceTotal:B.length}}function mm(t,e){let n=new Map(t.map(o=>[lo(o),o])),r=[];for(let o of e){let i=n.get(lo(o));if(!i)continue;let s=fr(i.Body),a=fr(o.Body);s!==a&&s!=="empty"&&a!=="empty"&&r.push({a:i,b:o})}return r}function hm(t){let e=fr(t);if(e==="empty")return"";if(e==="json")return JSON.stringify(Di(t),null,2);let n=String(t).match(/<[^>]+>|[^<]+/g)||[],r=[],o=0,i=()=>"  ".repeat(Math.max(0,o));for(let s of n){if(!s.trim())continue;if(!s.startsWith("<")){r.push(i()+s.trim());continue}let a=s.startsWith("</"),c=s.endsWith("/>")||s.startsWith("<?")||s.startsWith("<!");if(a&&o--,s.length>120&&!a){let l=s.split(/\s+(?=[\w:.]+=")/);r.push(i()+l[0]);for(let u of l.slice(1))r.push(i()+"    "+u)}else r.push(i()+s);!a&&!c&&o++}return r.join(`
`)}Bc.exports={bodyFormat:fr,canonicalizeBody:Nc,jsonToCanonical:Tc,buildBpmCompare:fm,mixedFormatPairs:mm,directiveKey:lo,prettyBody:hm}});var Mc=de((Bg,Pc)=>{"use strict";var gm="KNTCCustLayer";function Oc(t){return!!t&&t.TypeCode===gm&&!t.SystemFlag&&!!t.LayerName}function Zt(t){let e=[t.LayerName];return t.DeviceType&&t.DeviceType!=="Desktop"&&e.push(t.DeviceType),e.join(" \xB7 ")}function bm(t){return t?{LayerName:t.LayerName,TypeCode:t.TypeCode,DeviceType:t.DeviceType||"Desktop",Company:t.Company||"",IsPublished:t.IsPublished,HasDraftContent:t.HasDraftContent,LastUpdated:t.LastUpdated||"",LastUpdatedBy:t.LastUpdatedBy||"",CGCCode:t.CGCCode||""}:null}function ym(t,e,n){let r=g=>{let E=new Map;for(let C of g||[]){let A=(C.Layers||[]).filter(Oc).map(bm);A.length&&E.set(C.Id,{app:C,layers:A})}return E},o=g=>g.Company||"",i=(g,E)=>{let C=[...g],A=[...E],N=[],B=k=>{for(let L=0;L<C.length;L++){let h=A.findIndex(d=>k(C[L],d));h<0||(N.push([C[L],A[h]]),C.splice(L--,1),A.splice(h,1))}};n&&B((k,L)=>Zt(k)===Zt(L)&&o(k)===o(L)),B((k,L)=>Zt(k)===Zt(L));for(let k of C)N.push([k,null]);for(let k of A)N.push([null,k]);let v=new Map;for(let[k,L]of N){let h=Zt(k||L);v.set(h,(v.get(h)||0)+1)}let x=new Set;return N.map(([k,L])=>{let h=k||L,d=Zt(h),b=v.get(d)>1?d+" \xB7 "+(o(h)||"all companies"):d,S=2,T=b;for(;x.has(b);)b=T+" #"+S++;return x.add(b),{key:b,lA:k,lB:L}})},s=r(t),a=r(e),c=[...new Set([...s.keys(),...a.keys()])].sort(),l={"only-a":0,"only-b":0,"layers-differ":0,"in-both":0},u=c.map(g=>{let E=s.get(g),C=a.get(g),A=(E||C).app,N=i(E?E.layers:[],C?C.layers:[]).map(({key:v,lA:x,lB:k})=>({key:v,lA:x,lB:k,status:x&&k?"in-both":x?"only-a":"only-b",updatedDiffers:!!(x&&k&&(x.LastUpdated!==k.LastUpdated||x.LastUpdatedBy!==k.LastUpdatedBy)),companyDiffers:!!(x&&k&&o(x)!==o(k)),publishDiffers:!!(x&&k&&x.IsPublished!==k.IsPublished)})).sort((v,x)=>v.key.localeCompare(x.key)),B=E?C?N.some(v=>v.status!=="in-both")?"layers-differ":"in-both":"only-a":"only-b";return l[B]++,{id:g,status:B,type:A.Type,subType:A.SubType,systemApp:!!A.SystemFlag,layerCount:N.length,layerDelta:N.filter(v=>v.status!=="in-both").length,updatedDelta:N.filter(v=>v.updatedDiffers).length,layers:N}}),m={"only-a":0,"only-b":1,"layers-differ":2,"in-both":3};return u.sort((g,E)=>m[g.status]-m[E.status]||g.id.localeCompare(E.id)),{apps:u,counts:l,total:u.length}}var _c=t=>t&&typeof t=="object"&&!Array.isArray(t)&&typeof t.sourceTypeId=="string";function Ot(t,e=[]){if(Array.isArray(t)){for(let n of t)Ot(n,e);return e}if(!t||typeof t!="object")return e;if(_c(t))return e.push(t),e;for(let n of Object.keys(t))Ot(t[n],e);return e}function wm(t){let e=[];for(let n of Object.keys(t))n!=="sourceTypeId"&&Ot(t[n],e);return e}function vm(t){let e=r=>{if(Array.isArray(r))return r.map(e);if(!r||typeof r!="object")return r;if(_c(r))return{"@child":r.id};let o={};for(let i of Object.keys(r))o[i]=e(r[i]);return o},n={};for(let r of Object.keys(t))n[r]=e(t[r]);return n}function Fc(t){let e=t.model||{};return e.labelText||e.title||e.caption||e.text||e.headerText||t.id}function uo(t,e,n,r){let o=e,i=2;for(;t.has(o);)o=e+" #"+i++;t.set(o,{key:o,label:n,value:r})}function Lc(t,e){let n=new Map,r=t?t[e]:void 0;if(e==="Layout"||e==="Pages"){let o=e==="Layout"?r?[r]:[]:r||[];for(let i of o){let s=e==="Layout"?"(layout)":i.name||i.guid||"?",a={};for(let l of Object.keys(i))l!=="components"&&(a[l]=i[l]);uo(n,s+" / (page)",s,a);let c=l=>{uo(n,s+" / "+(l.id||l.model?.guid||"?"),l.sourceTypeId+"  "+Fc(l),vm(l));for(let u of wm(l))c(u)};for(let l of Ot(i.components||[]))c(l)}return n}return Array.isArray(r)?(r.forEach((o,i)=>{let s=o&&(o.id??o.Id??o.name??o.Name);uo(n,s!=null?String(s):"#"+i,s!=null?String(s):"#"+i,o)}),n):(r!=null&&uo(n,"(value)",e,r),n)}function fo(t,e,n){if(Array.isArray(t))t.length||(n[e||"(root)"]="[]"),t.forEach((r,o)=>fo(r,e+"["+o+"]",n));else if(t&&typeof t=="object"){let r=Object.keys(t);r.length||(n[e||"(root)"]="{}");for(let o of r.sort())fo(t[o],e?e+"."+o:o,n)}else n[e||"(root)"]=JSON.stringify(t);return n}function Ci(t){return Array.isArray(t)?t.map(Ci):t&&typeof t=="object"?Object.keys(t).sort().reduce((e,n)=>(e[n]=Ci(t[n]),e),{}):t}var po=t=>JSON.stringify(Ci(t),null,2),Em=["Layout","Pages","Events","DataViews","Rules","ToolBar","Orphans","Properties"],xm=300;function Dm(t,e){let n=[...new Set([...Em,...Object.keys(t||{}),...Object.keys(e||{})])],r=[];for(let o of n){let i=Lc(t,o),s=Lc(e,o);if(!i.size&&!s.size)continue;let a={added:0,removed:0,changed:0,same:0},c=[],l=[...new Set([...i.keys(),...s.keys()])];for(let u of l){let m=i.get(u),g=s.get(u);if(m&&g){let E=fo(m.value,"",{}),C=fo(g.value,"",{}),A=[];for(let B of[...new Set([...Object.keys(E),...Object.keys(C)])].sort())E[B]!==C[B]&&A.push({path:B,a:E[B]??null,b:C[B]??null});if(!A.length){a.same++;continue}a.changed++;let N=A.every(B=>B.path.includes("@child"));c.push({key:u,label:m.label,status:"changed",structural:N,fields:A.slice(0,xm),fieldCount:A.length,a:po(m.value),b:po(g.value)})}else m?(a.removed++,c.push({key:u,label:m.label,status:"only-a",fields:[],fieldCount:0,a:po(m.value),b:""})):(a.added++,c.push({key:u,label:g.label,status:"only-b",fields:[],fieldCount:0,a:"",b:po(g.value)}))}r.push({name:o,counts:a,items:c})}return r}var Cm={expandedHeaderComponents:"header",extensionComponents:"ext"};function Am(t){let e=[];for(let r of Ot(t.components||[]))e.push([r,"body"]);let n=t.model||{};for(let r of Object.keys(n))if(r!=="gridModel")for(let o of Ot(n[r]))e.push([o,Cm[r]||"body"]);return e}function Sm(t){let e=t.model||{},n={};for(let r of["title","labelText","flexBasis","columns","orientation","readonly","required","disabled","isKeyField","hidden","enableSearch","enabledCaption","disabledCaption","status","comboBoxLabel","trueCaption","falseCaption","expanded","textHAlign","fullScreenButtonVisible"])e[r]!==void 0&&e[r]!==null&&typeof e[r]!="object"?n[r]=e[r]:r==="columns"&&Array.isArray(e[r])&&(n.navColumns=e[r].filter(o=>typeof o=="string"));return e.gridModel&&Array.isArray(e.gridModel.columns)&&(n.gridColumns=e.gridModel.columns.map(r=>r&&(r.title||r.caption||r.field)).filter(Boolean).slice(0,40)),Array.isArray(e.data)&&t.sourceTypeId==="metafx-tabstrip"&&(n.tabs=e.data.map(r=>({title:r.title||r.id,page:r.page||"",selected:!!r.selected}))),Array.isArray(e.data)&&t.sourceTypeId==="erp-radio-button"&&(n.options=e.data.map(r=>r&&(r.text||r.label||r.Val||r.value)).filter(Boolean).slice(0,8)),n}function Ai(t,e,n){let r=t.model||{};return{key:e+" / "+(t.id||r.guid||"?"),id:t.id||"",type:t.sourceTypeId,slot:n||"body",label:Fc(t),binding:r.epBinding||"",props:Sm(t),children:Am(t).map(([o,i])=>Ai(o,e,i))}}function km(t){if(!t)return[];let e=[];t.Layout&&e.push({key:"(layout)",caption:t.Layout.caption||"(layout)",roots:Ot(t.Layout.components||[]).map(n=>Ai(n,"(layout)","body"))});for(let n of t.Pages||[]){let r=n.name||n.guid||"?";e.push({key:r,caption:n.caption||r,roots:Ot(n.components||[]).map(o=>Ai(o,r,"body"))})}return e}Pc.exports={buildLayerApps:ym,diffAppSections:Dm,buildWireframe:km,isCustomLayer:Oc,layerKey:Zt}});var Rc=de(($g,Im)=>{Im.exports=`// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// Compare panel \u2014 BPM + Layers tabs (webview side).
// Plain browser JS, injected after the panel's main <script>, so it shares that
// script's globals (BPM_DATA, LY_DATA, LAST_RUN, esc, jsAttr, chip, sideBySide,
// sendDiff, toggleFn, switchFnTab, setStatus, \u2026).
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

const STATUS_COLOR = { match: 'var(--c-match)', diff: 'var(--c-diff)', changed: 'var(--c-diff)', renamed: 'var(--c-diff)',
  'only-a': 'var(--c-only-a)', 'only-b': 'var(--c-only-b)', 'in-both': 'var(--vscode-descriptionForeground)',
  'layers-differ': 'var(--c-diff)' };
const pre = (t, dim) => \`<div class="pre-block\${dim ? ' dim' : ''}">\${esc(t || '')}</div>\`;
const tag = (t, cls) => \`<span class="tag\${cls ? ' ' + cls : ''}">\${esc(t)}</span>\`;
// Turn any string into a valid HTML id fragment (also used by the main script's handlers).
function safeId(s) { return String(s).replace(/[^a-zA-Z0-9_-]/g, '_'); }

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// BPM TAB
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

let BPM_INDEX = new Map(); // directive key -> dir entry

function bpmFilter(f, el) {
  BPM_FILTER = f;
  document.querySelectorAll('[data-chip="bpmFilter"]').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  bpmApply();
}

function renderBpmSummary() {
  const c = BPM_DATA.counts, ea = esc(LAST_RUN.profileA), eb = esc(LAST_RUN.profileB);
  BPM_INDEX = new Map();
  for (const s of BPM_DATA.services) for (const m of s.methods) for (const d of m.dirs) BPM_INDEX.set(d.key, d);
  document.getElementById('bpmSummary').innerHTML =
    chip('all',     'chip-all',    'All',            'bpmFilter', BPM_DATA.total) +
    chip('diff',    'chip-diff',   'Different',      'bpmFilter', c.diff) +
    chip('only-a',  'chip-only-a', 'Deleted (not in ' + eb + ')',  'bpmFilter', c['only-a']) +
    chip('only-b',  'chip-only-b', 'Added (not in ' + ea + ')',    'bpmFilter', c['only-b']) +
    chip('renamed', 'chip-diff',   'Renamed',        'bpmFilter', c.renamed) +
    chip('match',   'chip-match',  'Match',          'bpmFilter', c.match);
  let w = document.getElementById('bpmWarn');
  if (!w) {
    w = document.createElement('div'); w.id = 'bpmWarn';
    const sum = document.getElementById('bpmSummary'); sum.parentNode.insertBefore(w, sum);
  }
  w.innerHTML = (BPM_DATA.warnings || []).map(t => \`<div class="err-banner">\${esc(t)}</div>\`).join('');
  document.getElementById('bpmBadge').textContent = BPM_DATA.total;
}

function bpmDirVisible(d, q) {
  const e = d.a || d.b;
  if (BPM_FILTER !== 'all' && d.status !== BPM_FILTER) return false;
  if (document.getElementById('bpmHideDisabled')?.checked && !((d.a && d.a.IsEnabled) || (d.b && d.b.IsEnabled))) return false;
  if (document.getElementById('bpmCodeOnly')?.checked && !(d.fields ? !d.fields.Code.same : !!e.code)) return false;
  if (q && !(String(e.Name).toLowerCase().includes(q) || String(e.BpMethodCode).toLowerCase().includes(q)
      || (d.renamedTo || '').toLowerCase().includes(q))) return false;
  return true;
}

function bpmVisibleServices() {
  const q = (document.getElementById('bpmSearch').value || '').toLowerCase().trim();
  const src = document.getElementById('bpmSource')?.value || '';
  const out = [];
  for (const s of BPM_DATA.services) {
    if (src && s.source !== src) continue;
    const svcHit = q && s.businessObject.toLowerCase().includes(q);
    const methods = s.methods.map(m => ({ m, dirs: m.dirs.filter(d => bpmDirVisible(d, svcHit ? '' : q)) }))
      .filter(x => x.dirs.length);
    if (methods.length) out.push({ s, methods });
  }
  return out;
}

function bpmApply() {
  if (!BPM_DATA) return;
  const vis = bpmVisibleServices();
  document.getElementById('bpmList').innerHTML = vis.length
    ? vis.map(({ s, methods }) => {
        const delta = methods.reduce((n, x) => n + x.dirs.filter(d => d.status !== 'match').length, 0);
        const cls = delta ? 's-diff' : 's-match';
        return \`<div class="list-item \${cls} \${s.svcKey === BPM_SEL ? 'active' : ''}" data-key="\${esc(s.svcKey)}" onclick="bpmSelect('\${jsAttr(s.svcKey)}')">
          <div class="list-dot"></div>
          <span class="list-name" title="\${esc(s.systemCode + '.' + s.businessObject)}">\${esc(s.businessObject)}</span>
          \${s.source === 'DB' ? '<span class="list-delta">DATA</span>' : s.source === 'DQ' ? '<span class="list-delta">UBAQ</span>' : ''}
          \${delta ? \`<span class="list-delta">\${delta} diff</span>\` : ''}
          <span class="list-badge">\${delta ? 'DIFF' : 'MATCH'}</span>
        </div>\`;
      }).join('')
    : '<div class="no-results">No directives match</div>';
  if (BPM_SEL) {
    const hit = vis.find(x => x.s.svcKey === BPM_SEL);
    if (hit) renderBpmDetail(hit.s, hit.methods);
    else document.getElementById('bpmDetail').innerHTML = '<div class="empty-state"><span>Select a service</span></div>';
  }
}

function bpmSelect(svcKey) {
  BPM_SEL = svcKey;
  document.querySelectorAll('#bpmList .list-item').forEach(el => el.classList.toggle('active', el.dataset.key === svcKey));
  const hit = bpmVisibleServices().find(x => x.s.svcKey === svcKey);
  if (hit) renderBpmDetail(hit.s, hit.methods);
}

function renderBpmDetail(svc, methods) {
  const ea = LAST_RUN.profileA, eb = LAST_RUN.profileB;
  const n = methods.reduce((k, x) => k + x.dirs.length, 0);
  let html = \`<div class="detail-hdr">
    <div class="detail-title">\${esc(svc.businessObject)}</div>
    <div class="detail-meta">
      <span>\${esc(svc.systemCode)}</span>
      <span>\${svc.source === 'DB' ? 'Data directives' : svc.source === 'DQ' ? 'UBAQ directives' : 'Method directives'}</span>
      <span>| \${methods.length} method\${methods.length !== 1 ? 's' : ''} \xB7 \${n} directive\${n !== 1 ? 's' : ''} shown</span>
    </div>
  </div><div class="fn-section">\`;
  for (const { m, dirs } of methods) {
    const side = !m.inA ? \` \${tag('method added in ' + eb)}\` : !m.inB ? \` \${tag('method deleted in ' + eb)}\` : '';
    html += \`<div class="section-lbl">\${esc(m.methodName)}<span style="opacity:.5;font-weight:400;letter-spacing:0;text-transform:none"> \xB7 \${esc(m.methodCode)}</span>\${side}</div>\`;
    for (const d of dirs) html += renderBpmDirRow(d, ea, eb);
  }
  html += '</div>';
  document.getElementById('bpmDetail').innerHTML = html;
}

function renderBpmDirRow(d, ea, eb) {
  const e = d.a || d.b;
  const id = 'bpm_' + safeId(d.key);
  const sb = { match: 'MATCH', diff: 'DIFF', renamed: 'RENAMED', 'only-a': 'DELETED', 'only-b': 'ADDED' };
  const bc = { ...STATUS_COLOR, 'only-a': LY_COLOR['only-a'], 'only-b': LY_COLOR['only-b'] };
  const changed = d.fields ? Object.entries(d.fields).filter(([k, v]) => k !== 'hasDiff' && v && !v.same && !v.infoOnly).map(([k]) => k) : [];
  const tags = [];
  if (d.a && d.b && d.a.IsEnabled !== d.b.IsEnabled) tags.push(tag('enabled ' + (d.a.IsEnabled ? ea : eb) + ' only', 'warn'));
  else if (!e.IsEnabled) tags.push(tag('disabled'));
  if (e.DirectiveGroup) tags.push(tag(e.DirectiveGroup));
  if (d.fields && !d.fields.Format.same) tags.push(tag('xaml vs json, normalized', 'warn'));
  else if (e.origFormat === 'json') tags.push(tag('json'));
  if (d.layoutDiff) tags.push(tag('layout changed'));
  const name = d.status === 'renamed' ? \`\${esc(d.a.Name)} -> \${esc(d.renamedTo)}\` : esc(e.Name);
  const hasCode = !!((d.a && d.a.code) || (d.b && d.b.code));
  return \`<div class="fn-row" id="\${id}">
    <div class="fn-row-hdr" onclick="bpmToggle('\${jsAttr(d.key)}')">
      <span class="fn-badge" style="background:\${bc[d.status]}22;color:\${bc[d.status]}">\${esc(sb[d.status])}</span>
      <span class="fn-name">\${name} <span style="opacity:.5;font-size:10px">[\${esc(d.typeLabel)}]</span>\${tags.join('')}</span>
      \${changed.length ? \`<span class="fn-changed">\${esc(changed.join(', '))}</span>\` : ''}
      <button class="open-diff-btn" title="Widgets + code, canonical" onclick="event.stopPropagation();openBpmDirDiff('\${jsAttr(d.key)}','text')">Diff</button>
      \${hasCode ? \`<button class="open-diff-btn" title="Custom code blocks only" onclick="event.stopPropagation();openBpmDirDiff('\${jsAttr(d.key)}','code')">Code</button>\` : ''}
      <button class="open-diff-btn" title="Stored body as saved (XAML or Kinetic JSON)" onclick="event.stopPropagation();openBpmRawDiff('\${jsAttr(d.key)}')">\${e.origFormat === 'json' ? 'JSON' : 'XML'}</button>
      <span class="chevron"></span>
    </div>
    <div class="fn-body" data-filled="0"></div>
  </div>\`;
}

function bpmToggle(key) {
  const row = document.getElementById('bpm_' + safeId(key));
  if (!row) return;
  row.classList.toggle('open');
  const body = row.querySelector('.fn-body');
  if (body.dataset.filled === '1') return;
  body.dataset.filled = '1';
  body.innerHTML = renderBpmDirBody(BPM_INDEX.get(key), LAST_RUN.profileA, LAST_RUN.profileB);
}

function renderBpmDirBody(d, ea, eb) {
  if (!d) return '';
  const fid = safeId(d.key);
  const tabs = [], panes = [];
  const add = (name, label, html) => {
    const first = !tabs.length;
    tabs.push(\`<button class="tab\${first ? ' active' : ''}" onclick="switchFnTab(this,'\${fid}','\${name}')">\${label}</button>\`);
    panes.push(\`<div class="pane\${first ? ' active' : ''}" data-fn="\${fid}" data-tab="\${name}">\${html}</div>\`);
  };
  if (d.status === 'only-a' || d.status === 'only-b') {
    const e = d.a || d.b, env = d.status === 'only-a' ? ea : eb;
    add('f', 'Flow', bpmFlowHtml(d, ea, eb));
    add('w', 'Widgets', \`<div class="only-info">\${d.status === 'only-a' ? 'DELETED: in ' + esc(ea) + ' (control), missing from ' + esc(eb) : 'ADDED: in ' + esc(eb) + ', not in ' + esc(ea) + ' (control)'}</div>\` + pre(e.text));
    if (e.code) add('c', 'Code', pre(e.code));
    if (e.layout) add('l', 'Layout', pre(e.layout, true));
    return \`<div class="tabs">\${tabs.join('')}</div>\${panes.join('')}\`;
  }
  const f = d.fields || {};
  const mark = k => (f[k] && !f[k].same ? ' *' : '');
  add('f', 'Flow' + mark('Widgets'), bpmFlowHtml(d, ea, eb));
  add('w', 'Widgets' + mark('Widgets'), f.Widgets && f.Widgets.same ? pre(d.a.text, true) : sideBySide(d.a.text || '', d.b.text || '', ea, eb));
  if (d.a.code || d.b.code) add('c', 'Code' + mark('Code'), f.Code && f.Code.same ? pre(d.a.code, true) : sideBySide(d.a.code || '', d.b.code || '', ea, eb));
  add('l', 'Layout' + (d.layoutDiff ? ' *' : ''), d.layoutDiff ? sideBySide(d.a.layout || '', d.b.layout || '', ea, eb) : pre(d.a.layout, true));
  const rows = ['DirectiveType', 'IsEnabled', 'Order', 'DirectiveGroup', 'MethodDisabled', 'Format'].map(k => {
    const x = f[k]; if (!x) return '';
    return \`<tr \${!x.same ? 'class="changed"' : ''}><td>\${k}</td><td class="\${x.same ? 'vs' : 'va'}">\${esc(x.a || '\u2014')}</td><td class="\${x.same ? 'vs' : 'vb'}">\${esc(x.b || '\u2014')}</td></tr>\`;
  }).join('') + \`<tr><td>DirectiveID</td><td>\${esc(d.a.DirectiveID)}</td><td>\${esc(d.b.DirectiveID)}</td></tr>\`;
  const note = d.a.normalized || d.b.normalized ? '<div class="only-info">Stored formats differ \u2014 both sides loaded through GetKineticDirective so they compare like-for-like.</div>' : '';
  const meta = ['DirectiveType', 'IsEnabled', 'Order', 'DirectiveGroup', 'MethodDisabled'].some(k => f[k] && !f[k].same);
  add('m', 'Settings' + (meta ? ' *' : ''), note + \`<table class="meta-tbl"><thead><tr><th>Field</th><th>A (control) \${esc(ea)}</th><th>B \${esc(eb)}</th></tr></thead><tbody>\${rows}</tbody></table>\`);
  return \`<div class="tabs">\${tabs.join('')}</div>\${panes.join('')}\`;
}

function openBpmRawDiff(key) {
  const d = BPM_INDEX.get(key); if (!d) return;
  vscode.postMessage({ command: 'openBpmRaw', keyA: d.a && d.a.key, keyB: d.b && d.b.key,
    name: (d.a || d.b).Name, labelA: LAST_RUN.profileA, labelB: LAST_RUN.profileB });
}

function openBpmDirDiff(key, which) {
  const d = BPM_INDEX.get(key); if (!d) return;
  const e = d.a || d.b;
  const safe = String(e.Name).replace(/[^a-zA-Z0-9._-]/g, '_');
  sendDiff((d.a && d.a[which]) || '', (d.b && d.b[which]) || '', safe + (which === 'code' ? '.cs' : '.bpm.txt'),
    LAST_RUN.profileA, LAST_RUN.profileB, e.Source + '_' + e.BpMethodCode + '_' + e.DirectiveType);
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// LAYERS TAB
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

let LAYER_SECTIONS = {}; // appId::layerKey -> { sections, wireA, wireB }

window.addEventListener('message', ({ data: msg }) => {
  if (msg.command === 'layerSectionsReady') {
    LAYER_SECTIONS[msg.appId + '::' + msg.layerKey] = { sections: msg.sections, wireA: msg.wireA, wireB: msg.wireB };
  } else if (msg.command === 'compareStarted') {
    LAYER_SECTIONS = {};
  }
});

function lyFilter(f, el) {
  LY_FILTER = f;
  document.querySelectorAll('[data-chip="lyFilter"]').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  layersApply();
}

function renderLayersSummary() {
  const c = LY_DATA.counts;
  document.getElementById('layersSummary').innerHTML =
    chip('all',           'chip-all',    'All',                                    'lyFilter', LY_DATA.total) +
    chip('layers-differ', 'chip-diff',   'Layers differ',                          'lyFilter', c['layers-differ']) +
    chip('only-a',        'chip-only-a', 'Deleted app (not in ' + esc(LAST_RUN.profileB) + ')', 'lyFilter', c['only-a']) +
    chip('only-b',        'chip-only-b', 'Added app (not in ' + esc(LAST_RUN.profileA) + ')',   'lyFilter', c['only-b']) +
    chip('in-both',       'chip-match',  'Same layer set',                         'lyFilter', c['in-both']);
}

function layersApply() {
  if (!LY_DATA) return;
  const q = (document.getElementById('layersSearch').value || '').toLowerCase().trim();
  const items = LY_DATA.apps.filter(a => (LY_FILTER === 'all' || a.status === LY_FILTER)
    && (!q || a.id.toLowerCase().includes(q) || a.layers.some(l => l.key.toLowerCase().includes(q))));
  const cls = { 'only-a': 's-only-a', 'only-b': 's-only-b', 'layers-differ': 's-diff', 'in-both': 's-in-both' };
  const badge = a => a.status === 'only-a' ? 'DELETED' : a.status === 'only-b' ? 'ADDED' : a.status === 'layers-differ' ? 'DIFF' : 'BOTH';
  document.getElementById('layersList').innerHTML = items.length
    ? items.map(a => \`<div class="list-item \${cls[a.status]} \${a.id === LY_SEL ? 'active' : ''}" data-key="\${esc(a.id)}" onclick="layersSelect('\${jsAttr(a.id)}')">
        <div class="list-dot"></div>
        <span class="list-name" title="\${esc(a.id)}">\${esc(a.id)}</span>
        <span class="list-delta">\${a.layerDelta ? a.layerDelta + ' diff' : a.layerCount + ' layers'}</span>
        <span class="list-badge">\${esc(badge(a))}</span>
      </div>\`).join('')
    : '<div class="no-results">No apps match</div>';
}

function layersSelect(appId) {
  LY_SEL = appId;
  document.querySelectorAll('#layersList .list-item').forEach(el => el.classList.toggle('active', el.dataset.key === appId));
  renderLayerList(appId);
}

function renderLayerList(appId) {
  const app = LY_DATA && LY_DATA.apps.find(a => a.id === appId);
  if (!app) return;
  const ea = LAST_RUN.profileA, eb = LAST_RUN.profileB;
  for (const r of app.layers) {
    if (r.lA) LAYER_OBJECTS[appId + '::' + r.key + '::a'] = r.lA; else delete LAYER_OBJECTS[appId + '::' + r.key + '::a'];
    if (r.lB) LAYER_OBJECTS[appId + '::' + r.key + '::b'] = r.lB; else delete LAYER_OBJECTS[appId + '::' + r.key + '::b'];
  }
  const nA = app.layers.filter(r => r.lA).length, nB = app.layers.filter(r => r.lB).length;
  let html = \`<div class="detail-hdr">
    <div style="font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--vscode-descriptionForeground);margin-bottom:4px">\${esc(app.subType || 'App')}\${app.systemApp ? ' \xB7 Epicor app' : ' \xB7 custom app'}</div>
    <div class="detail-title" title="\${esc(appId)}">\${esc(appId)}</div>
    <div class="detail-meta">
      <span>A (control) \${esc(ea)}: \${nA} custom layer\${nA !== 1 ? 's' : ''}</span>
      <span>B \${esc(eb)}: \${nB} custom layer\${nB !== 1 ? 's' : ''}</span>
    </div>
  </div><div class="fn-section">\`;
  const groups = [['only-a', 'Deleted (in ' + ea + ', missing from ' + eb + ')', ''], ['only-b', 'Added (in ' + eb + ', not in ' + ea + ')', ''], ['in-both', 'In both', '']];
  for (const [st, label, color] of groups) {
    const rows = app.layers.filter(r => r.status === st);
    if (!rows.length) continue;
    html += \`<div class="section-lbl"\${color ? \` style="color:\${color}"\` : ''}>\${esc(label)} (\${rows.length})</div>\`;
    for (const r of rows) html += renderLayerRow(r, appId, ea, eb);
  }
  html += '</div>';
  document.getElementById('layersDetail').innerHTML = html;
}

function layerStamp(l) { return l ? \`\${(l.LastUpdated || '').slice(0, 10)}\${l.LastUpdatedBy ? ' \xB7 ' + l.LastUpdatedBy : ''}\` : '\u2014'; }

function renderLayerRow(row, appId, ea, eb) {
  const { key, lA, lB, status } = row;
  const rid = 'lr_' + safeId(appId + '_' + key), rbid = 'lrb_' + safeId(appId + '_' + key);
  const sb = LY_WORD;
  const meta = lA || lB;
  const tags = [];
  if (meta.DeviceType && meta.DeviceType !== 'Desktop') tags.push(tag(meta.DeviceType));
  const scope = l => (l.Company ? l.Company : 'all companies');
  if (row.companyDiffers) tags.push(tag('company: ' + ea + ' ' + scope(lA) + ' / ' + eb + ' ' + scope(lB), 'warn'));
  else if (meta.Company) tags.push(tag(meta.Company));
  if (row.publishDiffers) tags.push(tag('unpublished in ' + (lA.IsPublished === false ? ea : eb), 'warn'));
  else if ((lA && lA.IsPublished === false) || (lB && lB.IsPublished === false)) tags.push(tag('unpublished'));
  const stamp = lA && lB
    ? \`<span class="fn-changed" \${row.updatedDiffers ? 'style="color:var(--c-diff)"' : ''} title="Last updated">\${esc(ea)} \${esc(layerStamp(lA))} | \${esc(eb)} \${esc(layerStamp(lB))}</span>\`
    : \`<span class="fn-changed">\${esc(layerStamp(meta))}</span>\`;
  const diffBtn = (lA && lB)
    ? \`<button class="open-diff-btn" title="Open full merged JSON in VS Code diff" onclick="event.stopPropagation();openLayerDiff('\${jsAttr(appId)}','\${jsAttr(key)}')">Diff</button>\` : '';
  return \`<div class="fn-row" id="\${rid}">
    <div class="fn-row-hdr" onclick="toggleFn('\${rid}');loadLayerContent('\${jsAttr(appId)}','\${jsAttr(key)}')">
      <span class="fn-badge" style="background:\${LY_COLOR[status]}22;color:\${LY_COLOR[status]}">\${esc(sb[status])}</span>
      <span class="fn-name">\${esc(key)}\${tags.join('')}</span>
      \${stamp}
      \${diffBtn}
      <span class="chevron"></span>
    </div>
    <div class="fn-body" id="\${rbid}">\${renderLayerRowBody(appId + '::' + key, !!lA, !!lB, ea, eb)}</div>
  </div>\`;
}

function loadLayerContent(appId, layerKey) {
  const ck = appId + '::' + layerKey;
  const cached = LAYER_CONTENT_CACHE[ck];
  if (cached && !cached.error) return;
  LAYER_CONTENT_CACHE[ck] = { loading: true };
  const layerA = LAYER_OBJECTS[ck + '::a'] || null, layerB = LAYER_OBJECTS[ck + '::b'] || null;
  vscode.postMessage({ command: 'fetchLayerContent', appId, layerKey, layerA, layerB, ...LAST_RUN });
}

function openLayerDiff(appId, layerKey) {
  const c = LAYER_CONTENT_CACHE[appId + '::' + layerKey];
  if (c && !c.loading && !c.error) {
    sendDiff(c.normA || '', c.normB || '', layerKey.replace(/[^a-zA-Z0-9._-]/g, '_') + '.json', LAST_RUN.profileA, LAST_RUN.profileB, appId);
    return;
  }
  PENDING_DIFF = { appId, layerKey };
  setStatus('Loading layer content for diff\u2026');
  loadLayerContent(appId, layerKey);
}

function renderLayerRowBody(ck, inA, inB, ea, eb) {
  const c = LAYER_CONTENT_CACHE[ck];
  if (!c) return '<div class="only-info">Click row to load\u2026</div>';
  if (c.loading) return '<div class="only-info">Loading\u2026</div>';
  if (c.error) return \`<div class="only-info" style="color:var(--c-only-a)">Error: \${esc(c.error)}</div>\`;
  const sec = LAYER_SECTIONS[ck];
  const fid = safeId(ck);
  const totals = { added: 0, removed: 0, changed: 0 };
  for (const s of (sec ? sec.sections : [])) { totals.added += s.counts.added; totals.removed += s.counts.removed; totals.changed += s.counts.changed; }
  const head = c.same
    ? '<div class="only-info" style="color:var(--c-match)">Identical merged content</div>'
    : \`<div class="only-info">vs \${esc(ea)} (control): \${totals.changed} changed \xB7 \${totals.removed} deleted \xB7 \${totals.added} added</div>\`;
  return \`<div class="tabs">
      <button class="tab active" onclick="switchFnTab(this,'\${fid}','chg')">Changes</button>
      <button class="tab" onclick="switchFnTab(this,'\${fid}','wf');lyWireInit('\${jsAttr(ck)}')">Preview</button>
      <button class="tab" onclick="switchFnTab(this,'\${fid}','json');lyJsonInit('\${jsAttr(ck)}')">Full JSON</button>
    </div>
    <div class="pane active" data-fn="\${fid}" data-tab="chg">\${head}\${sec ? lySectionsHtml(ck, ea, eb) : ''}</div>
    <div class="pane" data-fn="\${fid}" data-tab="wf"><div id="wf_\${fid}" class="only-info">Loading preview\u2026</div></div>
    <div class="pane" data-fn="\${fid}" data-tab="json"><div id="js_\${fid}" class="only-info">Rendering\u2026</div></div>\`;
}

function lyItemRowHtml(ck, si, ii, it, lbl, ea, eb) {
  const id = 'lyi_' + safeId(ck) + '_' + si + '_' + ii;
  const shortKey = String(it.key).split(' / ').slice(1).join(' / ') || it.key;
  return \`<div class="fn-row" id="\${id}">
    <div class="fn-row-hdr" onclick="lyItemToggle('\${jsAttr(ck)}',\${si},\${ii})">
      <span class="fn-badge" style="background:\${LY_COLOR[it.status]}22;color:\${LY_COLOR[it.status]}">\${esc(lbl[it.status])}</span>
      <span class="fn-name">\${esc(it.label)} <span style="opacity:.5;font-size:10px">\${esc(shortKey)}</span></span>
      \${(it.fields || []).some(f => /(^|\\.)epBinding$/i.test(f.path)) ? \`<span class="tag warn">binding changed</span>\` : ''}
      \${it.fieldCount ? \`<span class="fn-changed">\${it.structural ? 'children only' : it.fieldCount + ' field' + (it.fieldCount !== 1 ? 's' : '')}</span>\` : ''}
      <button class="open-diff-btn" onclick="event.stopPropagation();lyItemDiff('\${jsAttr(ck)}',\${si},\${ii})">Diff</button>
      <span class="chevron"></span>
    </div>
    <div class="fn-body" data-filled="0"></div>
  </div>\`;
}

const LY_PAGE_SECTIONS = new Set(['Layout', 'Pages']);

function lyCountNodes(roots) { let n = 0; const w = a => { for (const x of a || []) { n++; w(x.children); } }; w(roots); return n; }

function lySectionsHtml(ck, ea, eb) {
  const sec = LAYER_SECTIONS[ck];
  const inA = !!LAYER_OBJECTS[ck + '::a'], inB = !!LAYER_OBJECTS[ck + '::b'];
  let html = \`<table class="meta-tbl"><thead><tr><th>Section</th><th>changed</th><th>deleted</th><th>added</th><th>same</th></tr></thead><tbody>\`;
  for (const s of sec.sections) {
    const any = s.counts.changed + s.counts.added + s.counts.removed;
    html += \`<tr \${any ? 'class="changed"' : ''}><td>\${esc(s.name)}</td><td>\${s.counts.changed}</td><td>\${s.counts.removed}</td><td>\${s.counts.added}</td><td>\${s.counts.same}</td></tr>\`;
  }
  html += '</tbody></table>';

  // One-sided layer: nothing to pair up \u2014 list its pages, not every component.
  if (!inA || !inB) {
    const pages = (inA ? sec.wireA : sec.wireB) || [];
    html += \`<div class="only-info">\${inA ? 'DELETED: layer is in ' + esc(ea) + ' (control) but missing from ' + esc(eb) : 'ADDED: layer is in ' + esc(eb) + ' but not in ' + esc(ea) + ' (control)'} - see Preview / Full JSON for its content.</div>\`;
    html += \`<table class="meta-tbl"><thead><tr><th>Page</th><th>Caption</th><th>Components</th></tr></thead><tbody>\${
      pages.map(p => \`<tr><td>\${esc(p.key)}</td><td>\${esc(p.caption)}</td><td>\${lyCountNodes(p.roots)}</td></tr>\`).join('')}</tbody></table>\`;
    return html;
  }

  const lbl = LY_WORD;
  sec.sections.forEach((s, si) => {
    if (!s.items.length) return;
    html += \`<div class="section-lbl" style="margin-top:10px">\${esc(s.name)} (\${s.items.length})</div>\`;
    if (!LY_PAGE_SECTIONS.has(s.name)) {
      s.items.forEach((it, ii) => { html += lyItemRowHtml(ck, si, ii, it, lbl, ea, eb); });
      return;
    }
    // Group component items under their page; rows render when a page opens.
    const groups = new Map();
    s.items.forEach((it, ii) => {
      const page = String(it.key).split(' / ')[0];
      if (!groups.has(page)) groups.set(page, []);
      groups.get(page).push(ii);
    });
    let gi = 0;
    for (const [page, idx] of groups) {
      const c = { changed: 0, 'only-a': 0, 'only-b': 0 };
      for (const ii of idx) c[s.items[ii].status]++;
      const gid = 'lyg_' + safeId(ck) + '_' + si + '_' + (gi++);
      const parts = [];
      if (c.changed) parts.push(c.changed + ' changed');
      if (c['only-a']) parts.push(c['only-a'] + ' deleted');
      if (c['only-b']) parts.push(c['only-b'] + ' added');
      html += \`<div class="fn-row ly-group" id="\${gid}" data-ck="\${esc(ck)}" data-si="\${si}" data-idx="\${idx.join(',')}">
        <div class="fn-row-hdr" onclick="lyGroupToggle('\${gid}')">
          <span class="fn-name"><b>\${esc(page)}</b></span>
          <span class="fn-changed">\${esc(parts.join(' | '))}</span>
          <span class="chevron"></span>
        </div>
        <div class="fn-body" data-filled="0" style="padding:0 0 4px 14px"></div>
      </div>\`;
    }
  });
  return html;
}

function lyGroupToggle(gid) {
  const row = document.getElementById(gid);
  if (!row) return;
  row.classList.toggle('open');
  const body = row.querySelector('.fn-body');
  if (body.dataset.filled === '1') return;
  body.dataset.filled = '1';
  const ck = row.dataset.ck, si = +row.dataset.si, sec = LAYER_SECTIONS[ck];
  const ea = LAST_RUN.profileA, eb = LAST_RUN.profileB, lbl = LY_WORD;
  body.innerHTML = row.dataset.idx.split(',').map(Number)
    .map(ii => lyItemRowHtml(ck, si, ii, sec.sections[si].items[ii], lbl, ea, eb)).join('');
}

function lyItem(ck, si, ii) { const s = LAYER_SECTIONS[ck]; return s && s.sections[si] && s.sections[si].items[ii]; }

function lyItemToggle(ck, si, ii) {
  const row = document.getElementById('lyi_' + safeId(ck) + '_' + si + '_' + ii);
  if (!row) return;
  row.classList.toggle('open');
  const body = row.querySelector('.fn-body');
  if (body.dataset.filled === '1') return;
  body.dataset.filled = '1';
  const it = lyItem(ck, si, ii), ea = LAST_RUN.profileA, eb = LAST_RUN.profileB;
  if (it.status !== 'changed') { body.innerHTML = pre(it.a || it.b); return; }
  const rows = it.fields.map(f => \`<tr class="changed"><td>\${esc(f.path)}</td><td class="va">\${esc(f.a ?? '\u2014')}</td><td class="vb">\${esc(f.b ?? '\u2014')}</td></tr>\`).join('');
  const more = it.fieldCount > it.fields.length ? \`<div class="only-info">\${it.fieldCount - it.fields.length} more \u2014 use Diff</div>\` : '';
  body.innerHTML = \`<table class="meta-tbl"><thead><tr><th>Path</th><th>A (control) \${esc(ea)}</th><th>B \${esc(eb)}</th></tr></thead><tbody>\${rows}</tbody></table>\${more}\`;
}

function lyItemDiff(ck, si, ii) {
  const it = lyItem(ck, si, ii); if (!it) return;
  const name = String(it.key).replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80) + '.json';
  sendDiff(it.a || '', it.b || '', name, LAST_RUN.profileA, LAST_RUN.profileB, ck);
}

function lyJsonInit(ck) {
  const el = document.getElementById('js_' + safeId(ck));
  if (!el || el.dataset.done) return;
  el.dataset.done = '1';
  const c = LAYER_CONTENT_CACHE[ck];
  if (!c || c.loading || c.error) { el.textContent = 'Not loaded'; return; }
  el.className = '';
  el.innerHTML = sideBySide(c.normA || '', c.normB || '', LAST_RUN.profileA, LAST_RUN.profileB);
}

// \u2500\u2500 Wireframe \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

// A (left) is the control: only-a = deleted in B, only-b = added in B.
// Value: { st: 'changed'|'deleted'|'added'|'struct', fields: [changed paths] }.
function lyStatusMap(ck) {
  const m = {};
  const sec = LAYER_SECTIONS[ck];
  const st = { changed: 'changed', 'only-a': 'deleted', 'only-b': 'added' };
  for (const s of (sec ? sec.sections : [])) {
    if (s.name !== 'Pages' && s.name !== 'Layout') continue;
    for (const it of s.items) {
      m[it.key] = { st: it.status === 'changed' && it.structural ? 'struct' : st[it.status],
        fields: (it.fields || []).filter(f => !f.path.includes('@child')).map(f => f.path) };
    }
  }
  return m;
}

// Layers tab vocabulary/colours (A = control).
const LY_WORD = { changed: 'CHANGED', 'only-a': 'DELETED', 'only-b': 'ADDED', 'in-both': 'BOTH' };
const LY_COLOR = { changed: '#d9a400', 'only-a': '#e5534b', 'only-b': 'var(--c-match)', 'in-both': 'var(--vscode-descriptionForeground)' };

// \u2500\u2500 Kinetic-style preview \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Re-draws the layer's component tree the way Kinetic lays it out: metafx-div
// rows of metafx-col columns (flexBasis), panel cards with header controls,
// grids with their real columns, tab strips that switch pages, floating-label
// inputs. Light canvas regardless of the VS Code theme. Diff status is drawn
// as an outline on top of each component.

let LY_VIEW = {};   // ck -> 'both' | 'a' | 'b'
let LY_PAGE = {};   // ck -> current page key
let LY_TAB = {};    // ck::tabstripKey -> selected page
// Bindings and hidden components are shown. Differences: only the changed
// control gets a yellow border, on the B side (A is the control); controls
// deleted in B keep a dashed yellow border on the A side. No tints.
const LY_OPTS = { diff: true, bind: true, hidden: true };

const KIN_ICON = {
  search: '<svg viewBox="0 0 16 16" class="kin-ic"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10.4 10.4 14 14" stroke="currentColor" stroke-width="1.6"/></svg>',
  combo: '<svg viewBox="0 0 16 16" class="kin-ic"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  date: '<svg viewBox="0 0 16 16" class="kin-ic"><rect x="2.5" y="3.5" width="11" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" stroke="currentColor" stroke-width="1.3"/></svg>',
  time: '<svg viewBox="0 0 16 16" class="kin-ic"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 5v3.3l2.2 1.4" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  chev: '<svg viewBox="0 0 16 16" class="kin-ic"><path d="M5 10l3-3 3 3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  more: '<svg viewBox="0 0 16 16" class="kin-ic"><circle cx="8" cy="3.5" r="1.3" fill="currentColor"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="8" cy="12.5" r="1.3" fill="currentColor"/></svg>',
  full: '<svg viewBox="0 0 16 16" class="kin-ic"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  plus: '<svg viewBox="0 0 16 16" class="kin-ic"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6"/></svg>',
  prev: '<svg viewBox="0 0 16 16" class="kin-ic"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  next: '<svg viewBox="0 0 16 16" class="kin-ic"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
};

const KIN_FIELD = {
  'erp-text-box': 'text', 'ep-text-box': 'text', 'ep-masked-text-box': 'text', 'erp-part-rev-desc': 'partrev',
  'erp-numeric-box': 'number', 'ep-numeric-box': 'number', 'erp-currency-box': 'currency', 'erp-currency-child-box': 'currency',
  'erp-date-picker': 'date', 'ep-date-picker': 'date', 'ep-date-time-picker': 'date', 'erp-time-picker': 'time', 'ep-time-picker': 'time',
  'erp-combo-box': 'combo', 'ep-combo-box': 'combo', 'erp-link-combo-box': 'combo', 'ep-dropdown': 'combo', 'ep-multi-select': 'combo',
  'erp-currency-selector': 'combo', 'erp-printer-selector': 'combo', 'erp-gl-account-editor': 'text', 'erp-gl-multibook-account-editor': 'text',
  'erp-text-area': 'area', 'ep-text-area': 'area', 'erp-rich-text-editor': 'area', 'ep-rich-text-editor': 'area', 'erp-qty-uom': 'qtyuom',
  'erp-file-box': 'text', 'erp-server-file-box': 'text', 'erp-server-folder-box': 'text', 'erp-token-date': 'date',
};

function kinStatus(n, cx) {
  const e = cx.sm[n.key];
  if (!e || e.st === 'struct') return null;
  if (cx.side === 'b' && (e.st === 'changed' || e.st === 'added')) return e;
  if (cx.side === 'a' && e.st === 'deleted') return e;
  return null;
}

function kinStatusCls(n, cx) {
  const e = kinStatus(n, cx);
  return !e ? '' : e.st === 'deleted' ? ' kin-del' : ' kin-ch';
}

function kinWrapAttrs(n, cx, extraCls) {
  const p = n.props || {};
  const hid = p.hidden === true || p.hidden === 'true';
  const e = kinStatus(n, cx);
  const what = !e ? '' : e.st === 'added' ? ' | ADDED in B' : e.st === 'deleted' ? ' | DELETED in B'
    : ' | CHANGED: ' + e.fields.slice(0, 8).map(f => f.replace(/^model\\./, '')).join(', ') + (e.fields.length > 8 ? ', ...' : '');
  const tip = n.type + ' | ' + n.id + (n.binding ? ' | ' + n.binding : '') + (hid ? ' | hidden' : '') + what;
  return \`class="\${extraCls}\${kinStatusCls(n, cx)}\${hid ? ' kin-hidden' : ''}" title="\${esc(tip)}"\`;
}

function kinField(n, cx, kind) {
  const p = n.props || {};
  const label = p.labelText || n.label || n.id;
  const ro = p.readonly === true || p.disabled === true;
  const value = n.binding && LY_OPTS.bind ? \`<span class="kin-bind">\${esc(n.binding)}</span>\` : '';
  const right = kind === 'number' ? '<span class="kin-num">0</span>' : kind === 'currency' ? '<span class="kin-num">0.00</span>' : '';
  let icon = '';
  if (kind === 'combo') icon = KIN_ICON.combo;
  else if (kind === 'date') icon = KIN_ICON.date;
  else if (kind === 'time') icon = KIN_ICON.time;
  else if (p.isKeyField === true || p.enableSearch === true) icon = KIN_ICON.search;
  const req = p.required === true ? '<span class="kin-req">*</span>' : '';
  const box = (lbl, val, ic, cls) => \`<div class="kin-input\${cls || ''}\${ro ? ' kin-ro' : ''}"><div class="kin-flabel">\${esc(lbl)}\${req}</div><div class="kin-val">\${val}</div>\${ic ? \`<div class="kin-icon">\${ic}</div>\` : ''}</div>\`;
  if (kind === 'partrev') {
    return \`<div \${kinWrapAttrs(n, cx, 'kin-field kin-multi')}>\${box('Part', value, KIN_ICON.search)}\${box('Rev', '', KIN_ICON.combo, ' kin-narrow')}\${box('Description', '', '')}</div>\`;
  }
  if (kind === 'qtyuom') {
    return \`<div \${kinWrapAttrs(n, cx, 'kin-field kin-multi')}>\${box(label, value + '<span class="kin-num">0</span>', '')}\${box('UOM', '', KIN_ICON.combo, ' kin-narrow')}</div>\`;
  }
  return \`<div \${kinWrapAttrs(n, cx, 'kin-field')}>\${box(label, value + right, icon, kind === 'area' ? ' kin-area' : '')}</div>\`;
}

function kinKids(n, cx, slot) {
  return (n.children || []).filter(c => (c.slot || 'body') === slot).map(c => kinNode(c, cx)).join('');
}

function kinPanelHeader(n, cx, title) {
  const p = n.props || {};
  const collapsed = p.expanded === false;
  return \`<div class="kin-card-hdr"><span class="kin-chev\${collapsed ? ' kin-collapsed' : ''}">\${KIN_ICON.chev}</span>
    <span class="kin-card-title">\${esc(title || '')}</span>
    <span class="kin-card-hdr-items">\${kinKids(n, cx, 'header')}</span></div>\`;
}

function kinFull(p) {
  return p.fullScreenButtonVisible === false ? '' : \`<div class="kin-fullscreen"><span>\${KIN_ICON.full}Full Screen</span></div>\`;
}

function kinGrid(n, cx) {
  const p = n.props || {};
  const cols = (p.gridColumns && p.gridColumns.length ? p.gridColumns : ['(columns from provider)']);
  const head = cols.map(c => \`<th>\${esc(c)}</th>\`).join('');
  const row = cols.map(() => '<td></td>').join('');
  return \`<div class="kin-grid-tools"><span class="kin-tool">\${KIN_ICON.plus}</span><span class="kin-gsearch">\${KIN_ICON.search}<span>Search...</span></span></div>
    <div class="kin-grid-scroll"><table class="kin-grid"><thead><tr><th class="kin-gsel"></th>\${head}</tr></thead>
    <tbody><tr><td class="kin-gsel"></td>\${row}</tr><tr><td class="kin-gsel"></td>\${row}</tr><tr><td class="kin-gsel"></td>\${row}</tr></tbody></table></div>
    \${n.binding && LY_OPTS.bind ? \`<div class="kin-grid-foot">\${esc(n.binding)}</div>\` : ''}\`;
}

function kinNode(n, cx) {
  if (!n || cx.depth > 40) return '';
  cx = { ...cx, depth: cx.depth + 1 };
  const p = n.props || {}, t = n.type;
  if ((p.hidden === true || p.hidden === 'true') && !LY_OPTS.hidden) return '';
  const heading = txt => txt && String(txt).trim() ? \`<div class="kin-group-lbl">\${esc(txt)}</div>\` : '';

  if (t === 'metafx-panel-card' || t === 'ep-panel-card' || t === 'metafx-panel-card-classic' || t === 'ep-group-box') {
    const collapsed = p.expanded === false;
    return \`<div \${kinWrapAttrs(n, cx, 'kin-card' + (collapsed ? ' kin-collapsed-card' : ''))}>\${kinPanelHeader(n, cx, p.title || p.labelText || '')}
      \${collapsed ? '' : \`<div class="kin-card-body">\${kinKids(n, cx, 'body')}\${kinKids(n, cx, 'ext')}</div>\${kinFull(p)}\`}</div>\`;
  }
  if (t === 'metafx-panel-card-grid' || t === 'ep-panel-card-grid' || t === 'erp-grid' || t === 'ep-grid') {
    const collapsed = p.expanded === false;
    return \`<div \${kinWrapAttrs(n, cx, 'kin-card' + (collapsed ? ' kin-collapsed-card' : ''))}>\${kinPanelHeader(n, cx, p.title || p.labelText || '')}
      \${collapsed ? '' : \`<div class="kin-card-body kin-card-grid">\${kinGrid(n, cx)}\${kinKids(n, cx, 'body')}</div>\${kinFull(p)}\`}</div>\`;
  }
  if (t === 'metafx-panel-card-stack' || t === 'ep-panel-card-stack') {
    return \`<div \${kinWrapAttrs(n, cx, 'kin-stack')}>\${kinKids(n, cx, 'body')}</div>\`;
  }
  if (t === 'metafx-div') {
    const kids = (n.children || []).filter(c => c.slot !== 'header');
    const cols = kids.map(c => c.type === 'metafx-col' ? kinNode(c, cx) : \`<div class="kin-col" style="flex-basis:100%;max-width:100%">\${kinNode(c, cx)}</div>\`).join('');
    return \`<div \${kinWrapAttrs(n, cx, 'kin-div')}>\${heading(p.labelText)}<div class="kin-row\${p.orientation === 'horizontal' ? ' kin-horiz' : ''}">\${cols}</div></div>\`;
  }
  if (t === 'metafx-col') {
    const fb = String(p.flexBasis || '100%');
    return \`<div \${kinWrapAttrs(n, cx, 'kin-col')} style="flex-basis:\${esc(fb)};max-width:\${esc(fb)}">\${heading(p.labelText)}\${kinKids(n, cx, 'body')}</div>\`;
  }
  if (t === 'metafx-flex-box' || t === 'ep-flex-box') {
    return \`<div \${kinWrapAttrs(n, cx, 'kin-div')}>\${heading(p.labelText)}<div class="kin-flex">\${kinKids(n, cx, 'body')}</div></div>\`;
  }
  if (t === 'metafx-tabstrip' || t === 'ep-tab-strip') {
    const tabs = p.tabs || [];
    const tk = cx.ck + '::' + n.key;
    const sel = LY_TAB[tk] || (tabs.find(x => x.selected) || tabs[0] || {}).page;
    const bar = tabs.map(tb => \`<span class="kin-tab\${tb.page === sel ? ' kin-tab-on' : ''}" onclick="kinTab('\${jsAttr(cx.ck)}','\${jsAttr(tk)}','\${jsAttr(tb.page)}')">\${esc(tb.title)}</span>\`).join('');
    const page = cx.pages[sel];
    const body = page && !cx.seen.has(sel)
      ? kinPageBody(page, { ...cx, seen: new Set([...cx.seen, sel]) })
      : \`<div class="kin-empty">\${sel ? 'Page ' + esc(sel) + ' not in this environment' : ''}</div>\`;
    return \`<div \${kinWrapAttrs(n, cx, 'kin-tabstrip')}><div class="kin-tabs">\${bar}</div><div class="kin-tab-body">\${body}</div></div>\`;
  }
  if (KIN_FIELD[t]) return kinField(n, cx, KIN_FIELD[t]);
  if (t === 'erp-check-box' || t === 'ep-check-box' || t === 'ep-switch') {
    return \`<div \${kinWrapAttrs(n, cx, 'kin-field kin-check')}><span class="kin-cb\${p.readonly ? ' kin-ro' : ''}"></span><span class="kin-cb-lbl">\${esc(p.labelText || n.label)}</span></div>\`;
  }
  if (t === 'erp-radio-button' || t === 'ep-radio-button') {
    const opts = p.options && p.options.length ? p.options : [p.labelText || n.label];
    return \`<div \${kinWrapAttrs(n, cx, 'kin-field kin-radios')}>\${opts.map((o, i) => \`<span class="kin-radio"><span class="kin-rb\${i === 0 ? ' kin-rb-on' : ''}"></span>\${esc(o)}</span>\`).join('')}</div>\`;
  }
  if (t === 'erp-button' || t === 'ep-button' || t === 'ep-dropdown-button') {
    return \`<span \${kinWrapAttrs(n, cx, 'kin-btn')}>\${esc(p.labelText || n.label)}</span>\`;
  }
  if (t === 'erp-shape') {
    const tone = { 1: 'ok', 2: 'warn', 3: 'err' }[p.status] || 'info';
    return \`<span \${kinWrapAttrs(n, cx, 'kin-shape kin-shape-' + tone)}><span class="kin-shape-lbl">\${esc(p.enabledCaption || p.labelText || n.id)}</span></span>\`;
  }
  if (t === 'erp-tag' || t === 'ep-tag' || t === 'ep-badge' || t === 'ep-status') {
    return \`<span \${kinWrapAttrs(n, cx, 'kin-shape')}><span class="kin-shape-lbl">\${esc(p.trueCaption || p.labelText || n.label)}</span></span>\`;
  }
  if (t === 'ep-label') {
    return \`<div \${kinWrapAttrs(n, cx, 'kin-label')}>\${esc(p.labelText || n.label)}</div>\`;
  }
  if (t === 'ep-row-navigator') {
    return \`<div \${kinWrapAttrs(n, cx, 'kin-field kin-rownav')}><div class="kin-input"><div class="kin-flabel">\${esc(p.labelText || n.label)}</div>
      <div class="kin-val">\${LY_OPTS.bind ? \`<span class="kin-bind">\${esc((p.navColumns || []).join(', ') || n.binding)}</span>\` : ''}</div>
      <div class="kin-icon">\${KIN_ICON.prev}<span class="kin-navtxt">1 of 1</span>\${KIN_ICON.next}</div></div></div>\`;
  }
  // Unknown component: keep its place, show what it is.
  const kids = (n.children || []).map(c => kinNode(c, cx)).join('');
  return \`<div \${kinWrapAttrs(n, cx, 'kin-unknown')}><div class="kin-unknown-lbl">\${esc(n.label || n.id)} <span>\${esc(t)}</span></div>\${kids}</div>\`;
}

function kinPageBody(page, cx) {
  return page.roots.map(r => kinNode(r, cx)).join('') || '<div class="kin-empty">Empty page</div>';
}

function kinTab(ck, tk, page) {
  LY_TAB[tk] = page;
  lyWireRender(ck, LY_PAGE[ck]);
}

function lyWireInit(ck) {
  const el = document.getElementById('wf_' + safeId(ck));
  if (!el || el.dataset.done) return;
  const sec = LAYER_SECTIONS[ck];
  if (!sec) { el.textContent = 'Not loaded'; return; }
  el.dataset.done = '1';
  const sm = lyStatusMap(ck);
  const pageKeys = [...new Set([...(sec.wireA || []).map(p => p.key), ...(sec.wireB || []).map(p => p.key)])];
  const changedPages = new Set(Object.keys(sm).map(k => k.split(' / ')[0]));
  // Main (tab host) first, then pages with changes, then the rest.
  const rank = k => (k === 'Main' ? 0 : changedPages.has(k) ? 1 : 2);
  pageKeys.sort((x, y) => rank(x) - rank(y) || x.localeCompare(y));
  const both = !!LAYER_OBJECTS[ck + '::a'] && !!LAYER_OBJECTS[ck + '::b'];
  LY_VIEW[ck] = LY_VIEW[ck] || (both ? 'both' : (LAYER_OBJECTS[ck + '::a'] ? 'a' : 'b'));
  el.className = '';
  el.innerHTML = \`<div class="wf-bar">Page <select id="wfp_\${safeId(ck)}" onchange="lyWireRender('\${jsAttr(ck)}',this.value)">\${pageKeys.map(k =>
      \`<option value="\${esc(k)}">\${esc(k)}\${changedPages.has(k) ? ' (changed)' : ''}</option>\`).join('')}</select>
      \${both ? \`<span class="kin-viewsw">\${['both', 'a', 'b'].map(v => \`<span class="kin-vs\${LY_VIEW[ck] === v ? ' on' : ''}" data-v="\${v}" onclick="kinView('\${jsAttr(ck)}','\${v}')">\${v === 'both' ? 'Side by side' : esc(v === 'a' ? LAST_RUN.profileA : LAST_RUN.profileB)}</span>\`).join('')}</span>\` : ''}
      <span class="wf-legend"><i class="kin-lg-ch"></i>changed / added in B <i class="kin-lg-del"></i>deleted in B | hover a control for what changed</span></div>
    <div id="wfv_\${safeId(ck)}"></div>\`;
  if (pageKeys.length) lyWireRender(ck, pageKeys[0]);
}

function kinView(ck, v) {
  LY_VIEW[ck] = v;
  document.querySelectorAll('#wf_' + safeId(ck) + ' .kin-vs').forEach(x => x.classList.toggle('on', x.dataset.v === v));
  lyWireRender(ck, LY_PAGE[ck]);
}

function lyWireRender(ck, pageKey) {
  const sec = LAYER_SECTIONS[ck], el = document.getElementById('wfv_' + safeId(ck));
  if (!sec || !el) return;
  LY_PAGE[ck] = pageKey;
  const sel = document.getElementById('wfp_' + safeId(ck)); if (sel && sel.value !== pageKey) sel.value = pageKey;
  const sm = LY_OPTS.diff ? lyStatusMap(ck) : {};
  const col = (pages, label, side) => {
    const map = {}; for (const p of pages || []) map[p.key] = p;
    const p = map[pageKey];
    const cx = { sm, pages: map, ck, depth: 0, seen: new Set([pageKey]), side };
    return \`<div class="kin-col-wrap"><div class="diff-col-hdr kin-side">\${esc(label)}\${p ? ' - ' + esc(p.caption) : ''}</div>
      <div class="kin-canvas">\${p ? kinPageBody(p, cx) : '<div class="kin-empty">Page not in this environment</div>'}</div></div>\`;
  };
  const v = LY_VIEW[ck] || 'both';
  const parts = [];
  if (v === 'both' || v === 'a') parts.push(col(sec.wireA, 'A (control): ' + LAST_RUN.profileA, 'a'));
  if (v === 'both' || v === 'b') parts.push(col(sec.wireB, 'B: ' + LAST_RUN.profileB, 'b'));
  el.innerHTML = \`<div class="\${parts.length > 1 ? 'wf-grid' : 'kin-single'}">\${parts.join('')}</div>\`;
}

// \u2500\u2500 BPM flow diagram (SVG, no library) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Positions come from the designer (ElementX/ElementY); when a body has none,
// nodes are laid out by depth from the start node. Node status compares the
// same walk-order number on the other side.

function bpmFlowStatus(g, other, selfIsA) {
  const m = {};
  for (const n of (g && g.nodes) || []) {
    const o = other && other.nodes ? other.nodes.find(x => x.n === n.n) : null;
    if (selfIsA) m[n.n] = o ? '' : 'del';
    else m[n.n] = !o ? 'changed' : (o.widget === n.widget && o.sig === n.sig ? '' : 'changed');
  }
  return m;
}

function bpmWidgetShort(w) {
  return String(w || '').replace(/Action2?$/, '').replace(/Condition$/, ' Cond').replace(/([a-z])([A-Z])/g, '$1 $2');
}

function bpmFlowSvg(g, sm) {
  if (!g || !g.nodes || !g.nodes.length) return '<div class="only-info">No widget graph</div>';
  const W = 176, H = 46, SW = 72, SH = 30;
  const pos = new Map();
  if (g.nodes.some(n => n.x || n.y)) {
    // Designer boxes are much smaller than ours: spread the coordinates until
    // no two boxes overlap (keeps the designer's arrangement, just scaled).
    let need = 1;
    for (let i = 0; i < g.nodes.length; i++) for (let j = i + 1; j < g.nodes.length; j++) {
      const a = g.nodes[i], c = g.nodes[j];
      const fit = Math.max(Math.abs(a.x - c.x) / (W + 24), Math.abs(a.y - c.y) / (H + 24));
      if (fit > 0 && fit < 1) need = Math.max(need, 1 / fit);
    }
    const k = Math.min(need, 4);
    for (const n of g.nodes) pos.set(n.n, { x: n.x * k, y: n.y * k, w: W, h: H });
  } else {
    const depth = new Map([[g.nodes[0].n, 0]]), q = [g.nodes[0].n];
    while (q.length) {
      const c = q.shift();
      for (const e of g.edges) if (e.from === c && e.to != null && !depth.has(e.to)) { depth.set(e.to, depth.get(c) + 1); q.push(e.to); }
    }
    const rows = {};
    for (const n of g.nodes) {
      const d = depth.has(n.n) ? depth.get(n.n) : 0;
      rows[d] = (rows[d] || 0) + 1;
      pos.set(n.n, { x: d * (W + 80), y: (rows[d] - 1) * (H + 50), w: W, h: H });
    }
  }
  // Start marker, up-left of the first node (the designer keeps its own spot
  // for it, which neither body format exposes).
  const first = pos.get(g.nodes[0].n);
  pos.set('start', { x: first.x - SW - 60, y: first.y - SH - 40, w: SW, h: SH });
  const edgesIn = [{ from: 'start', to: g.nodes[0].n, label: '' }, ...g.edges];

  const all = [...pos.values()];
  const minX = Math.min(...all.map(p => p.x)), minY = Math.min(...all.map(p => p.y)), PAD = 30;
  for (const p of all) { p.x = p.x - minX + PAD; p.y = p.y - minY + PAD; }
  const width = Math.max(...all.map(p => p.x + p.w)) + PAD + 90;
  const height = Math.max(...all.map(p => p.y + p.h)) + PAD + 30;

  // Port routing: leave/enter on the side facing the other box.
  const port = (p, side, shift) => side === 'r' ? [p.x + p.w, p.y + p.h / 2 + shift] : side === 'l' ? [p.x, p.y + p.h / 2 + shift]
    : side === 'b' ? [p.x + p.w / 2 + shift, p.y + p.h] : [p.x + p.w / 2 + shift, p.y];
  const dirv = { r: [1, 0], l: [-1, 0], b: [0, 1], t: [0, -1] };
  let edges = '', labels = '';
  for (const e of edgesIn) {
    const a = pos.get(e.from); if (!a) continue;
    const shift = e.label === 'True' ? -10 : e.label === 'False' ? 10 : 0;
    const b = e.to != null ? pos.get(e.to) : null;
    if (!b) {
      if (!e.label) continue;
      const [x1, y1] = port(a, 'r', shift);
      edges += \`<path d="M\${x1},\${y1} h16" class="bf-edge bf-end" />\`;
      labels += \`<text x="\${x1 + 20}" y="\${y1 + 3}" class="bf-elbl">\${esc(e.label)}: end</text>\`;
      continue;
    }
    const dx = (b.x + b.w / 2) - (a.x + a.w / 2), dy = (b.y + b.h / 2) - (a.y + a.h / 2);
    const vertical = Math.abs(dy) > Math.abs(dx) * 0.6;
    const sa = vertical ? (dy > 0 ? 'b' : 't') : (dx > 0 ? 'r' : 'l');
    const sb = vertical ? (dy > 0 ? 't' : 'b') : (dx > 0 ? 'l' : 'r');
    const [x1, y1] = port(a, sa, shift), [x2, y2] = port(b, sb, 0);
    const k = Math.max(30, Math.min(120, (vertical ? Math.abs(dy) : Math.abs(dx)) / 2));
    const c1 = [x1 + dirv[sa][0] * k, y1 + dirv[sa][1] * k], c2 = [x2 + dirv[sb][0] * k, y2 + dirv[sb][1] * k];
    edges += \`<path d="M\${x1},\${y1} C\${c1[0]},\${c1[1]} \${c2[0]},\${c2[1]} \${x2},\${y2}" class="bf-edge" marker-end="url(#bfArrow)" />\`;
    if (e.label) labels += \`<text x="\${x1 + dirv[sa][0] * 6 + (vertical ? 4 : 0)}" y="\${y1 + dirv[sa][1] * 12 + (vertical ? 0 : -4)}" class="bf-elbl">\${esc(e.label)}</text>\`;
  }
  const s = pos.get('start');
  let nodes = \`<g class="bf-node bf-start"><rect x="\${s.x}" y="\${s.y}" width="\${s.w}" height="\${s.h}" rx="4" /><text x="\${s.x + s.w / 2}" y="\${s.y + 19}" class="bf-t1" text-anchor="middle">Start</text></g>\`;
  for (const n of g.nodes) {
    const p = pos.get(n.n), st = sm[n.n] || '';
    const label = (n.label || '').length > 26 ? n.label.slice(0, 25) + '...' : (n.label || '');
    nodes += \`<g class="bf-node bf-\${n.kind}\${st ? ' bf-' + st : ''}"><title>\${esc('[' + n.n + '] ' + n.widget + (n.label ? ' - ' + n.label : '') + '\\n\\n' + String(n.sig || '').slice(0, 1200))}</title>
      <rect x="\${p.x}" y="\${p.y}" width="\${p.w}" height="\${p.h}" rx="\${n.kind === 'condition' ? 14 : 4}" />
      <text x="\${p.x + 8}" y="\${p.y + 18}" class="bf-t1">[\${n.n}] \${esc(bpmWidgetShort(n.widget))}</text>
      \${label ? \`<text x="\${p.x + 8}" y="\${p.y + 34}" class="bf-t2">\${esc(label)}</text>\` : ''}
    </g>\`;
  }
  return \`<svg class="bf-svg" width="\${width}" height="\${height}" viewBox="0 0 \${width} \${height}">
    <defs><marker id="bfArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="bf-arrow" /></marker></defs>
    \${edges}\${nodes}\${labels}</svg>\`;
}

function bpmFlowHtml(d, ea, eb) {
  const col = (e, other, isA, label) => \`<div><div class="diff-col-hdr kin-side">\${esc(label)}</div>
    <div class="bf-wrap">\${e ? bpmFlowSvg(e.graph, bpmFlowStatus(e.graph, other && other.graph, isA)) : \`<div class="only-info">\${isA ? 'Not in ' + esc(ea) + ' (added in B)' : 'Not in ' + esc(eb) + ' (deleted in B)'}</div>\`}</div></div>\`;
  return \`<div class="wf-bar"><span class="wf-legend"><i class="kin-lg-ch"></i>changed / added in B <i class="kin-lg-del"></i>deleted in B | hover a node for its settings/code</span></div>
    <div class="wf-grid">\${col(d.a, d.b, true, 'A (control): ' + ea)}\${col(d.b, d.a, false, 'B: ' + eb)}</div>\`;
}
`});var Ii=de(go=>{"use strict";var Je=require("vscode"),{EpicorClient:Si}=Dr(),{BpmClient:Uc}=Gt(),Ze=$c(),mo=Mc(),Tm=Rc(),{directiveToCanonicalText:Nm}=zt(),{describeBody:zc,normalizeCode:qc}=Vt(),{KineticMetaFXClient:Bm}=so(),jc=jn();function $m(t){let e=zc(t);return e.kind!=="flow"?{code:e.code,usings:e.usings,isFlow:!1}:{code:Nm(e.xaml)||e.xaml,usings:e.usings,isFlow:!0}}function Hc(t){let e=t.EfxFunction||[],n=t.EfxFunctionSignature||[],r=t.EfxLibrary||[],o={};for(let l of n){let u=`${l.LibraryID}|${l.FunctionID}`;o[u]||(o[u]={inputs:[],outputs:[]});let m={name:l.ArgumentName,type:l.DataType,order:l.Order};(l.Response?o[u].outputs:o[u].inputs).push(m)}for(let l of Object.keys(o))o[l].inputs.sort((u,m)=>u.order-m.order),o[l].outputs.sort((u,m)=>u.order-m.order);let i={},s=(l,u,m)=>{(i[l]=i[l]||{})[u]=(i[l]||{})[u]||[],i[l][u].push(m)};for(let l of t.EfxRefLibrary||[])s(l.LibraryID,"libs",l.LibraryRef);for(let l of t.EfxRefAssembly||[])s(l.LibraryID,"assemblies",l.Assembly);for(let l of t.EfxRefService||[])s(l.LibraryID,"services",l.ServiceID);for(let l of t.EfxRefTable||[])s(l.LibraryID,"tables",`${l.TableID} (${l.Updatable?"rw":"ro"})`);let a={};for(let l of r)a[l.LibraryID]=l;let c={};for(let l of e){let{code:u,usings:m,isFlow:g}=$m(l.Body);c[l.LibraryID]||(c[l.LibraryID]={}),c[l.LibraryID][l.FunctionID]={...l,_code:u,_usings:m,_isFlow:g,_sig:o[`${l.LibraryID}|${l.FunctionID}`]||{inputs:[],outputs:[]}}}return{fnMap:c,refMap:i,libDetail:a}}function Lm(t,e){let n={},r=!1;for(let[a,c]of[["_code","Code"],["_usings","Usings"]]){let l=t[a]||"",u=e[a]||"",m=qc(l)===qc(u);m||(r=!0),n[c]={a:l,b:u,same:m}}for(let a of["Description","Kind","RequireTransaction","SingleRowMode","Private","Disabled"]){let c=String(t[a]??""),l=String(e[a]??""),u=c===l;u||(r=!0),n[a]={a:c,b:l,same:u}}let o=a=>(a||[]).map(c=>`${c.name}: ${c.type}`).join(", "),i=t._sig||{},s=e._sig||{};for(let[a,c]of[["Inputs","inputs"],["Outputs","outputs"]]){let l=o(i[c]),u=o(s[c]),m=l===u;m||(r=!0),n[a]={a:l,b:u,same:m,params_a:i[c]||[],params_b:s[c]||[]}}return n.hasDiff=r,n}var Om=["DirectDBAccess","AllowCustomCodeFunctions","AllowCustomCodeWidgets","Frozen","Disabled"],_m=["Description","Owner","Revision","EpicorVersion","Mode","Notes","Package","PackageVersion","Publisher","LockedBy","LockedOn","DebugMode","DumpSources","AdvTracing"];function Fm(t,e,n,r){let o={},i=!1;for(let s of["libs","assemblies","services","tables"]){let a=[...t[s]||[]].sort().join(`
`),c=[...e[s]||[]].sort().join(`
`),l=a===c;l||(i=!0),o[s]={a,b:c,same:l}}for(let s of Om){let a=String((n||{})[s]??""),c=String((r||{})[s]??""),l=a===c;l||(i=!0),o[s]={a,b:c,same:l}}for(let s of _m){let a=String((n||{})[s]??""),c=String((r||{})[s]??"");o[s]={a,b:c,same:a===c,infoOnly:!0}}return o.hasDiff=i,o}function ho(t){return t?{FunctionID:t.FunctionID||"",Description:t.Description||"",Kind:t.Kind,RequireTransaction:t.RequireTransaction,SingleRowMode:t.SingleRowMode,Private:t.Private,Disabled:t.Disabled,_code:t._code||"",_usings:t._usings||"",_sig:t._sig||{inputs:[],outputs:[]}}:null}function Pm(t,e,n,r,o,i,s,a){let c=[...new Set([...t.map(u=>u.LibraryID),...e.map(u=>u.LibraryID),...Object.keys(n),...Object.keys(r)])].sort(),l=[];for(let u of c){let m=u in n||u in s,g=u in r||u in a,E=n[u]||{},C=r[u]||{},A=[...new Set([...Object.keys(E),...Object.keys(C)])].sort(),N=[];for(let x of A){let k=E[x],L=C[x];if(!k)N.push({fnID:x,status:"only-b",fa:null,fb:ho(L)});else if(!L)N.push({fnID:x,status:"only-a",fa:ho(k),fb:null});else{let h=Lm(k,L);N.push({fnID:x,status:h.hasDiff?"diff":"match",fa:ho(k),fb:ho(L),fields:h})}}let B=Fm(o[u]||{},i[u]||{},s[u],a[u]),v;m?g?N.some(x=>x.status!=="match")||B.hasDiff?v="diff":v="match":v="only-a":v="only-b",l.push({libID:u,status:v,inA:m,inB:g,libDiff:B,fnDiffs:N})}return l}function ki(t){return Array.isArray(t)?t.map(ki):t&&typeof t=="object"?Object.keys(t).sort().reduce((e,n)=>(e[n]=ki(t[n]),e),{}):t}function Wc(t){if(!t||!t.trim())return t||"";try{return JSON.stringify(ki(JSON.parse(t)),null,2)}catch{return t}}async function Vc(t,e,n,r,o=()=>{}){o("Fetching library lists\u2026");let[i,s]=await Promise.all([t.getLibraryList(),e.getLibraryList()]),a=[...new Set([...i.map(k=>k.LibraryID),...s.map(k=>k.LibraryID)])];o(`Fetching ${a.length} libraries from both environments\u2026`);let[c,l]=await Promise.all([t.request(t.getDesignerUrl("GetLibraries"),{libraryIds:a}),e.request(e.getDesignerUrl("GetLibraries"),{libraryIds:a})]);o("Computing diff\u2026");for(let[k,L]of[[c,n],[l,r]])if(!k||typeof k!="object")throw new Error(`Unexpected GetLibraries response from ${L} \u2014 expected JSON, got ${typeof k}.`);let u=c.returnObj||c,m=l.returnObj||l,{fnMap:g,refMap:E,libDetail:C}=Hc(u),{fnMap:A,refMap:N,libDetail:B}=Hc(m),v=Pm(i,s,g,A,E,N,C,B),x={match:0,diff:0,"only-a":0,"only-b":0};for(let k of v)x[k.status]=(x[k.status]||0)+1;return{meta:{env_a_name:n,env_b_name:r,counts:x,total:v.length},libraries:v}}async function Kc(t,e,n,r,o=()=>{}){let i=new Uc(t),s=new Uc(e),a=[],c=async(E,C)=>{let A=await E.getBpmServices(),N=6,B=new Array(A.length),v=0,x=async()=>{for(;v<A.length;){let d=v++,{SystemCode:b,ServiceKind:S,ServiceName:T}=A[d];B[d]=await E.getBpmMethodsByService(b,S,T)}};await Promise.all(Array.from({length:Math.min(N,A.length)},x));let k=[],L=[];for(let d of B){for(let b of d.methods)k.push({...b,Source:b.Source||"BO"});for(let b of d.directives)L.push({...b,Source:b.Source||"BO"})}for(let[d,b]of[["DB","data"],["DQ","UBAQ"]])try{let S=await E.getBpmRowsBySource(d);for(let T of S.methods)k.push({...T,Source:d});for(let T of S.directives)L.push({...T,Source:d})}catch(S){a.push(`${C}: ${b} directives not loaded \u2014 ${S.message}`)}let h=new Set;return{methods:k,directives:L.filter(d=>{let b=d.DirectiveID||Ze.directiveKey(d);return h.has(b)?!1:(h.add(b),!0)})}};o("Fetching BPM directives from both environments\u2026");let[l,u]=await Promise.all([c(i,n),c(s,r)]),m=Ze.mixedFormatPairs(l.directives,u.directives);if(m.length){o(`Normalizing ${m.length} directive(s) stored in different formats\u2026`);let E=0,C=0,A=async()=>{for(;E<m.length;){let{a:N,b:B}=m[E++];try{let[v,x]=await Promise.all([i.getKineticDirective(N.DirectiveID),s.getKineticDirective(B.DirectiveID)]),k=v&&Ze.jsonToCanonical(v),L=x&&Ze.jsonToCanonical(x);if(!k||!L){C++;continue}N._origFormat=Ze.bodyFormat(N.Body),B._origFormat=Ze.bodyFormat(B.Body),N._canon={format:"json",...k},B._canon={format:"json",...L},N._normalized=B._normalized=!0}catch{C++}}};await Promise.all(Array.from({length:Math.min(6,m.length)},A)),C&&a.push(`${C} directive pair(s) stored as XAML vs JSON could not be normalized \u2014 they compare as raw text and will show as different.`)}o("Computing BPM diff\u2026");let g=Ze.buildBpmCompare(l.methods,l.directives,u.methods,u.directives);return g.warnings=a,{bpmData:g,rawA:new Map(l.directives.map(E=>[Ze.directiveKey(E),E.Body||""])),rawB:new Map(u.directives.map(E=>[Ze.directiveKey(E),E.Body||""]))}}var mr=class t{constructor(e,n){this.panel=e,this.context=n,this.disposed=!1,e.webview.onDidReceiveMessage(async r=>{try{switch(r.command){case"ready":this._postProfiles();break;case"runCompare":await this._runFunctionsCompare(r);break;case"runBpmCompare":await this._runBpmCompare(r);break;case"runLayersCompare":await this._runLayersCompare(r);break;case"fetchLayerList":await this._fetchLayerList(r);break;case"fetchLayerContent":await this._fetchLayerContent(r);break;case"openNativeDiff":await this._openNativeDiff(r);break;case"openBpmRaw":await this._openBpmRaw(r);break;case"applyFunction":await this._applyFunction(r);break}}catch(o){this._post({command:"error",message:o.message})}}),e.onDidDispose(()=>{this.disposed=!0,t.panels.delete(t.KEY)}),e.webview.html=this.getHtml()}static show(e){let n=t.panels.get(t.KEY);if(n&&!n.disposed){n.panel.reveal();return}let r=Je.window.createWebviewPanel("efxCompare","Compare",Je.ViewColumn.Two,{enableScripts:!0,retainContextWhenHidden:!0});t.panels.set(t.KEY,new t(r,e))}_post(e){this.disposed||this.panel.webview.postMessage(e)}_postProfiles(){let e=Je.workspace.getConfiguration().get("efx.profiles")||[],n=Je.workspace.getConfiguration().get("efx.activeProfile")||"",r=Je.workspace.getConfiguration().get("efx.activeCompany")||"";this._post({command:"profiles",data:e.map(o=>({name:o.name,companies:o.companies||[]})),activeProfile:n,activeCompany:r})}async _config(e,n){let o=(Je.workspace.getConfiguration().get("efx.profiles")||[]).find(s=>s.name===e);if(!o)throw new Error(`Profile "${e}" not found`);let i=await jc.preflight(o);if(i)throw new Error(i);return jc.clientConfig(o,n)}async _efxClient(e,n){return new Si(await this._config(e,n))}async _metafxClient(e,n){return new Bm(await this._config(e,n))}async _runFunctionsCompare({profileA:e,companyA:n,profileB:r,companyB:o}){this._post({command:"status",text:"Building clients\u2026"}),this._post({command:"compareStarted"});try{let[i,s]=await Promise.all([this._efxClient(e,n),this._efxClient(r,o)]),a=await Vc(i,s,e,r,c=>this._post({command:"status",text:c}));this._post({command:"functionsReady",data:a})}catch(i){this._post({command:"error",tab:"functions",message:i.message})}}async _runBpmCompare({profileA:e,companyA:n,profileB:r,companyB:o}){this._post({command:"status",text:"Fetching BPM services\u2026"});try{let[i,s]=await Promise.all([this._efxClient(e,n),this._efxClient(r,o)]),{bpmData:a,rawA:c,rawB:l}=await Kc(i,s,e,r,u=>this._post({command:"status",text:u}));this._bpmRawA=c,this._bpmRawB=l,this._post({command:"bpmReady",data:a})}catch(i){this._post({command:"error",tab:"bpm",message:i.message})}}async _runLayersCompare({profileA:e,companyA:n,profileB:r,companyB:o}){this._post({command:"status",text:"Fetching app list\u2026"});try{let[i,s]=await Promise.all([this._metafxClient(e,n),this._metafxClient(r,o)]),[a,c]=await Promise.all([i.listApps(),s.listApps()]),l=mo.buildLayerApps(a,c,n===o);this._post({command:"layersReady",data:l})}catch(i){this._post({command:"error",tab:"layers",message:i.message})}}async _fetchLayerList({appId:e,profileA:n,companyA:r,profileB:o,companyB:i}){this._post({command:"layerListLoading",appId:e});try{let[s,a]=await Promise.all([this._metafxClient(n,r),this._metafxClient(o,i)]),[c,l]=await Promise.all([s.getLayers(e).then(u=>({layers:u})).catch(u=>(console.error("[layers A]",u.message),{layers:[],error:u.message})),a.getLayers(e).then(u=>({layers:u})).catch(u=>(console.error("[layers B]",u.message),{layers:[],error:u.message}))]);this._post({command:"status",text:`Layers for ${e}: ${n}=${c.error?"ERROR":c.layers.length}, ${o}=${l.error?"ERROR":l.layers.length}`}),this._post({command:"layerListReady",appId:e,layersA:c.layers,layersB:l.layers,errorA:c.error||null,errorB:l.error||null})}catch(s){this._post({command:"layerListError",appId:e,message:s.message})}}async _fetchLayerContent({appId:e,layerKey:n,layerA:r,layerB:o,profileA:i,companyA:s,profileB:a,companyB:c}){this._post({command:"layerContentLoading",appId:e,layerKey:n});try{let[l,u]=await Promise.all([this._metafxClient(i,s),this._metafxClient(a,c)]),m=(v,x,k)=>{let L=x&&(x.LayerName||x.LayerDescription);return L?v.getAppForLayer(e,L,x.DeviceType).then(h=>({raw:h})).catch(h=>(console.error(`[comparePanel] getAppForLayer ${k} failed:`,h.message),{raw:null,error:h.message})):Promise.resolve({raw:null})},[g,E]=await Promise.all([m(l,r,"A"),m(u,o,"B")]);if(g.error&&E.error)throw new Error(`Could not load layer content from either environment \u2014 ${g.error} / ${E.error}`);if(g.error||E.error){this._post({command:"layerContentError",appId:e,layerKey:n,message:`${g.error?i:a} failed: ${g.error||E.error}`});return}let C=v=>v?JSON.stringify(v,null,2):"",A=Wc(C(g.raw)),N=Wc(C(E.raw)),B=mo.diffAppSections(g.raw,E.raw);(!g.raw||!E.raw)&&(B=B.map(v=>({...v,items:[]}))),this._post({command:"layerSectionsReady",appId:e,layerKey:n,sections:B,wireA:mo.buildWireframe(g.raw),wireB:mo.buildWireframe(E.raw)}),this._post({command:"layerContentReady",appId:e,layerKey:n,normA:A,normB:N,same:A===N})}catch(l){console.error("[comparePanel] _fetchLayerContent error:",l.message),this._post({command:"layerContentError",appId:e,layerKey:n,message:l.message})}}async _applyFunction({libraryId:e,functionId:n,direction:r,profileA:o,companyA:i,profileB:s,companyB:a}){let c=r==="aToB"?o:s,l=r==="aToB"?i:a,u=r==="aToB"?s:o,m=r==="aToB"?a:i,g=`${e}.${n}`;if(await Je.window.showWarningMessage(`Apply ${g} from ${c} -> ${u}?`,{modal:!0},"Apply")!=="Apply"){this._post({command:"applyFnCancelled",libraryId:e,functionId:n});return}this._post({command:"applyFnStarted",libraryId:e,functionId:n});let C=!1,A=null;try{let[N,B]=await Promise.all([this._efxClient(c,l),this._efxClient(u,m)]);A=B,this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Reading ${g} from ${c}\u2026`});let v=await N.getLibrary(e),x=v?.EfxFunction?.find(_=>_.FunctionID===n);if(!x)throw new Error(`${g} not found on ${c}`);if(zc(x.Body).kind==="flow")throw new Error(`${g} is a widget-based function \u2014 apply only supports code-based functions.`);let{code:k,usings:L}=Si.extractCode(x.Body);this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Checking ${u}\u2026`});let h=await A.getLibrary(e),d=h?.EfxLibrary?.[0];if(!d)throw new Error(`Library ${e} does not exist on ${u} \u2014 create it there first.`);if(!h.EfxFunction?.some(_=>_.FunctionID===n))throw new Error(`${g} does not exist on ${u} \u2014 this applies changes to existing functions, it cannot create new ones.`);if(d.Frozen===!0){if(!d.Published)throw new Error(`${e} is locked/frozen on ${u}. Unfreeze it in Epicor first.`);if(await Je.window.showWarningMessage(`${e} is promoted to production on ${u}. Demote it, apply ${n}, then re-promote?`,{modal:!0},"Demote, Apply, Re-promote")!=="Demote, Apply, Re-promote"){this._post({command:"applyFnCancelled",libraryId:e,functionId:n});return}this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Demoting ${e} on ${u}\u2026`}),await A.demoteFromProduction(e),C=!0}this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Applying to ${u}\u2026`});let b=await A.validateFunctionViaWrapper(e,n,k,L,"Utilities","ApplyChangesWithDiagnostics");if(!b.saved){let _=(b.diagnostics||b.errors||[]).map(U=>typeof U=="object"&&U!==null?[U.Code,U.Message].filter(Boolean).join(": "):String(U));throw new Error(_[0]||b.outMsg||b.outResult||"Apply rejected by Epicor")}this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Verifying on ${u}\u2026`});let S=await A.getLibrary(e),T=S?.EfxFunction?.find(_=>_.FunctionID===n);if(!T)throw new Error(`Verification failed: ${g} not found on ${u} after apply.`);let I=Si.extractCode(T.Body).code,P=_=>String(_||"").replace(/\r\n/g,`
`).trimEnd();if(P(I)!==P(k))throw new Error(`Apply reported success, but ${u} code does not match ${c}.`);let R=_=>JSON.stringify((_?.EfxFunctionSignature||[]).filter(U=>U.FunctionID===n).map(U=>[U.ArgumentName,U.DataType,!!U.Response,!!U.Optional]).sort()),$=R(v)!==R(S);this._post({command:"applyFnDone",libraryId:e,functionId:n}),$?Je.window.showWarningMessage(`Applied ${g} to ${u} \u2014 but signatures still differ. Code only; edit parameters via Execute -> Edit Signatures.`):Je.window.showInformationMessage(`Verified ${g} on ${u} \u2014 code matches ${c}`)}catch(N){this._post({command:"applyFnError",libraryId:e,functionId:n,message:N.message})}finally{if(C&&A)try{this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Re-promoting ${e}\u2026`}),await A.promoteToProduction(e),this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:""})}catch(N){Je.window.showErrorMessage(`${e} on ${u} could NOT be re-promoted and is still demoted \u2014 promote it manually. (${N.message})`)}}}async _openBpmRaw({keyA:e,keyB:n,name:r,labelA:o,labelB:i}){let s=e&&this._bpmRawA&&this._bpmRawA.get(e)||"",a=n&&this._bpmRawB&&this._bpmRawB.get(n)||"",c=Ze.bodyFormat(s),l=Ze.bodyFormat(a),u=g=>g==="json"?"json":g==="xaml"?"xml":null,m=u(c)&&(u(c)===u(l)||l==="empty")?u(c):c==="empty"&&u(l)?u(l):"txt";await this._openNativeDiff({diffId:"raw::"+(e||n),fileName:String(r||"directive").replace(/[^a-zA-Z0-9._-]/g,"_")+"."+m,labelA:o,labelB:i,contentA:Ze.prettyBody(s),contentB:Ze.prettyBody(a)})}async _openNativeDiff({diffId:e,fileName:n,labelA:r,labelB:o,contentA:i,contentB:s}){let a=require("os"),c=require("path"),l=require("fs"),u=require("crypto"),m=i||"",g=s||"",E=(n||"diff").replace(/[^a-zA-Z0-9._-]/g,"_"),C=u.createHash("sha1").update(`${e||""}::${n||""}`).digest("hex").slice(0,12),A=(x,k)=>{let L=String(x||"").replace(/[^a-zA-Z0-9._-]/g,"_")||k,h=c.join(a.tmpdir(),"efx-compare",C,L);return l.mkdirSync(h,{recursive:!0}),h},N=c.join(A(r,"A"),E),B=c.join(A(o,"B"),E);l.writeFileSync(N,m,"utf8"),l.writeFileSync(B,g,"utf8");let v=`${n}: ${r||"A"} vs ${o||"B"}`;await Je.commands.executeCommand("vscode.diff",Je.Uri.file(N),Je.Uri.file(B),v)}getHtml(){return`<!DOCTYPE html>
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
.chevron::before{content:'';display:inline-block;border-left:5px solid currentColor;border-top:4px solid transparent;border-bottom:4px solid transparent}
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

/* \u2500\u2500 Compare v1 additions \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.filter-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fb-chk{font-size:11px;display:inline-flex;gap:4px;align-items:center;color:var(--vscode-descriptionForeground);cursor:pointer;user-select:none}
.tag{font-size:9px;padding:1px 5px;border-radius:2px;margin-left:5px;font-weight:600;
  background:var(--vscode-badge-background);color:var(--vscode-badge-foreground);font-family:var(--vscode-font-family);vertical-align:1px}
.tag.warn{background:var(--c-diff-bg);color:var(--c-diff)}
.pre-block{font-family:var(--vscode-editor-font-family);font-size:calc(var(--vscode-editor-font-size,13px) - 1px);
  padding:10px 14px;max-height:420px;overflow:auto;white-space:pre-wrap;word-break:break-all}
.pre-block.dim{color:var(--vscode-descriptionForeground)}
.wf-bar{display:flex;align-items:center;gap:10px;padding:8px 12px;font-size:11px;border-bottom:1px solid var(--vscode-panel-border)}
.wf-legend{display:inline-flex;gap:6px;align-items:center;color:var(--vscode-descriptionForeground)}
.wf-legend i.wf-struct{border:1px dashed var(--c-diff)!important;background:none}
.wf-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;border:1px solid var(--vscode-panel-border)}
.wf-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px}
.wf-page{padding:6px;max-height:640px;overflow:auto;border:1px solid var(--vscode-panel-border);border-top:none}
.wf-node{border:1px solid var(--vscode-panel-border);border-radius:3px;margin:2px;font-size:10px}
.wf-box{display:flex;flex-wrap:wrap;align-content:flex-start;padding:3px;gap:2px}
.wf-box>.wf-lbl{width:100%;font-weight:700;font-size:9px;color:var(--vscode-descriptionForeground);padding:1px 3px}
.wf-leaf{padding:3px 6px;min-width:110px;flex:1 1 130px;border-style:dashed}
.wf-type{opacity:.5;font-size:9px;font-family:var(--vscode-editor-font-family)}
.wf-bind{display:block;opacity:.6;font-size:9px;font-family:var(--vscode-editor-font-family);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wf-changed{background:var(--c-diff-bg)!important;border-color:var(--c-diff)!important}
.wf-only-a{background:var(--c-only-a-bg)!important;border-color:var(--c-only-a)!important}
.wf-only-b{background:var(--c-only-b-bg)!important;border-color:var(--c-only-b)!important}
.bf-wrap{overflow:auto;max-height:560px;border:1px solid var(--vscode-panel-border);border-top:none;padding:4px}
.bf-svg{display:block}
.bf-node rect{fill:var(--vscode-editor-background);stroke:var(--vscode-descriptionForeground);stroke-width:1}
.bf-condition rect{stroke-dasharray:4 2}
.bf-changed rect{stroke:#e0ac00;stroke-width:2}
.bf-del rect{stroke:#e0ac00;stroke-width:2;stroke-dasharray:5 3}
.bf-only-a rect{fill:var(--c-only-a-bg);stroke:var(--c-only-a);stroke-width:2}
.bf-only-b rect{fill:var(--c-only-b-bg);stroke:var(--c-only-b);stroke-width:2}
.bf-t1{font-size:11px;font-weight:700;fill:var(--vscode-foreground);font-family:var(--vscode-font-family)}
.bf-t2{font-size:10px;fill:var(--vscode-descriptionForeground);font-family:var(--vscode-font-family)}
.bf-edge{fill:none;stroke:var(--vscode-descriptionForeground);stroke-width:1.2}
.bf-arrow{fill:var(--vscode-descriptionForeground)}
.bf-elbl{font-size:9px;fill:var(--vscode-descriptionForeground);font-family:var(--vscode-font-family)}
.bf-node{cursor:help}
/* \u2500\u2500 Kinetic-style preview \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   Values follow Kinetic's own component rules (main.js component styles) and
   palette variables; --interactive is the CPI override sampled from a live page. */
.kin-single{padding:8px}
.kin-col-wrap{min-width:0}
.kin-canvas{--base:#f0f3f5;--interactive:#316b9c;--interactive-44:#3f86c0;--interactive-24:#244f73;--neutral:#fff;--neutral-20:#333;
  --neutral-38:#616161;--neutral-80:#ccc;--neutral-95:#f2f2f2;--nothing:#000;--primary-2485:#d2dee1;--primary-3468:#9bbdc8;
  --primary-2491:#e4ebed;--primary-3495:#eff5f6;--success-4566:#6db7ab;--warning:#ffe199;--error-91:#ffd6d1;
  background:var(--base);color:var(--nothing);font-family:"Source Sans Pro","Source Sans 3","Segoe UI",-apple-system,Helvetica,Arial,sans-serif;
  font-size:12px;padding:14px 16px;max-height:760px;overflow:auto;border:1px solid var(--vscode-panel-border);border-top:none}
.kin-canvas *{box-sizing:border-box}
/* ep-panel-card */
.kin-card{background:var(--primary-2485);border:1px solid var(--primary-3468);border-radius:3px;margin:0 0 10px}
.kin-card-hdr{display:flex;align-items:center;justify-content:space-between;position:relative;padding:4px 15px 4px 50px;min-height:50px;border-bottom:1px solid var(--primary-3468)}
.kin-card.kin-collapsed-card .kin-card-hdr{border-bottom:none}
.kin-chev{position:absolute;left:20px;top:50%;transform:translateY(-50%);color:var(--interactive);display:flex;width:18px}
.kin-chev.kin-collapsed{transform:translateY(-50%) rotate(180deg)}
.kin-card-title{font-size:18px;font-weight:600;line-height:24px;white-space:nowrap;color:var(--nothing)}
.kin-card-hdr-items{display:flex;gap:10px;align-items:center;flex-wrap:wrap;flex:1;justify-content:flex-end;margin-left:16px}
.kin-card-body{padding:20px 20px 0}
.kin-card-grid{padding:0}
.kin-fullscreen{display:flex;justify-content:center}
.kin-fullscreen span{background:var(--primary-3468);color:var(--neutral-20);font-size:14px;padding:2px 18px;display:inline-flex;gap:8px;align-items:center}
.kin-ic{width:16px;height:16px;display:block}
/* metafx-div / metafx-col: rows never wrap, 15px gutters, 30px under a row */
.kin-div{min-width:0}
.kin-row{display:flex;flex-wrap:nowrap;justify-content:flex-start;align-items:stretch;margin:0 -15px 30px}
.kin-col .kin-row:last-child, .kin-card-body>.kin-div:last-child>.kin-row{margin-bottom:10px}
.kin-col{flex:0 1 auto;min-width:0;padding:0 15px}
.kin-group-lbl{display:block;font-size:14px;color:var(--neutral-20);padding-top:5px;margin-bottom:10px;font-weight:400}
.kin-flex{display:flex;flex-wrap:wrap;gap:0 20px;align-items:flex-start}
.kin-flex>*{flex:1 1 180px;min-width:150px}
/* ep-text-box family (kendo floating label) */
.kin-field{margin:0 0 10px}
.kin-multi{display:flex;gap:10px}
.kin-multi>.kin-input{flex:1}
.kin-multi>.kin-narrow{flex:0 0 90px}
.kin-input{position:relative;background:var(--neutral);height:40px;padding:3px 40px 0 10px;box-shadow:0 1px 0 0 var(--interactive)}
.kin-input.kin-ro{background:var(--neutral-95);box-shadow:0 1px 0 0 var(--neutral-80)}
.kin-input.kin-area{height:auto;min-height:132px;background:var(--neutral-95);box-shadow:none;border:1px solid #dfdfdf}
.kin-flabel{font-size:12px;color:var(--neutral-38);line-height:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kin-req{margin-left:3px}
.kin-val{font-size:14px;line-height:19px;min-height:19px;display:flex;justify-content:space-between;gap:6px;overflow:hidden}
.kin-bind{color:#8a96a3;font-size:12px;font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kin-num{margin-left:auto}
.kin-icon{position:absolute;right:10px;top:50%;transform:translateY(-50%);color:var(--interactive);display:flex;align-items:center;gap:4px}
.kin-ro .kin-icon{color:var(--neutral-38)}
.kin-navtxt{font-size:12px;white-space:nowrap;color:var(--neutral-38)}
.kin-rownav .kin-input{padding-right:100px}
/* ep-check-box */
.kin-check{position:relative;display:flex;align-items:center;min-height:24px;margin:5px 16px 5px 0}
.kin-cb{width:18px;height:18px;border:2px solid var(--interactive);border-radius:2px;background:var(--neutral);flex-shrink:0}
.kin-cb.kin-ro{border-color:var(--neutral-38)}
.kin-cb-lbl{font-size:14px;margin-left:7px;color:var(--neutral-20)}
.kin-cb.kin-ro + .kin-cb-lbl{color:var(--neutral-38)}
.kin-radios{display:flex;gap:16px;flex-wrap:wrap}
.kin-radio{display:inline-flex;align-items:center;gap:7px;font-size:14px;color:var(--neutral-20)}
.kin-rb{width:18px;height:18px;border:2px solid var(--interactive);border-radius:50%;display:inline-block;background:var(--neutral)}
.kin-rb-on{box-shadow:inset 0 0 0 3px var(--neutral);background:var(--interactive)}
/* ep-button (primary) */
.kin-btn{display:inline-flex;align-items:center;justify-content:center;background:var(--interactive);color:var(--neutral);font-size:14px;padding:6px 18px;white-space:nowrap;margin:5px 10px 5px 5px}
.kin-card-hdr .kin-btn{margin:0}
/* erp-shape / erp-tag */
.kin-shape{display:inline-flex;align-items:center;gap:8px;border:2px solid var(--interactive);border-radius:5px;background:var(--success-4566);min-height:20px;padding:2px 10px 2px 6px;margin:5px 0}
.kin-shape-lbl{font-size:14px;font-weight:600;color:var(--nothing);white-space:nowrap}
.kin-shape::before{content:'';width:16px;height:16px;background:var(--neutral);border:2px solid var(--interactive);border-radius:2px;flex-shrink:0}
.kin-shape-warn{background:var(--warning)}
.kin-shape-err{background:var(--error-91)}
.kin-card-hdr .kin-shape{margin:0}
.kin-label{font-size:14px;padding:4px 0 8px;color:var(--neutral-20)}
/* ep-grid */
.kin-grid-tools{display:flex;align-items:center;gap:14px;padding:6px 20px;color:var(--interactive)}
.kin-gsearch{display:flex;align-items:center;gap:6px;background:var(--neutral);box-shadow:0 1px 0 0 var(--interactive);padding:4px 8px;min-width:170px;font-size:13px;color:var(--neutral-38)}
.kin-grid-scroll{overflow:auto}
.kin-grid{border-collapse:collapse;width:100%;font-size:14px}
.kin-grid th{background:var(--primary-2491);font-weight:600;text-align:left;padding:10px 8px;border-top:1px solid var(--primary-3468);border-bottom:1px solid var(--neutral-80);border-right:1px solid var(--neutral-80);white-space:nowrap}
.kin-grid td{height:24px;background:var(--neutral);border-bottom:1px solid var(--neutral-80);border-right:1px solid var(--neutral-80)}
.kin-grid tr:nth-child(even) td{background:var(--primary-3495)}
.kin-grid .kin-gsel{width:20px;padding:0}
.kin-grid-foot{font-size:11px;color:#8a96a3;font-style:italic;padding:4px 20px}
/* metafx-tabstrip (page tabs as rendered on the live page) */
.kin-tabstrip{margin:0 0 10px}
.kin-tabs{display:flex;gap:8px;margin:0 0 14px;align-items:center}
.kin-tab{padding:8px 16px;font-size:14px;color:var(--interactive);cursor:pointer;border:1px solid transparent;border-radius:3px}
.kin-tab:hover{color:var(--interactive-44)}
.kin-tab-on{color:var(--nothing);background:var(--neutral);border-color:#858585}
.kin-stack>.kin-card{margin-bottom:10px}
.kin-unknown{border:1px dashed #9aa8b0;padding:6px 8px;margin:0 0 10px;background:rgba(255,255,255,.45)}
.kin-unknown-lbl{font-size:13px;color:var(--neutral-38)}
.kin-unknown-lbl span{font-size:11px;opacity:.7;font-family:var(--vscode-editor-font-family)}
.kin-empty{color:var(--neutral-38);font-style:italic;padding:16px;font-size:13px}
.kin-hidden{opacity:.45;outline:1px dashed #8a96a3;outline-offset:1px}
/* diff overlay: yellow border on the changed control only (B side); dashed on A for deleted. No tints. */
.kin-ch{outline:2px solid #e0ac00!important;outline-offset:1px}
.kin-del{outline:2px dashed #e0ac00!important;outline-offset:1px}
.kin-side{background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.04));color:var(--vscode-foreground)}
.wf-legend i.kin-lg-ch{border:2px solid #e0ac00!important;background:none}
.wf-legend i.kin-lg-del{border:2px dashed #e0ac00!important;background:none}
.kin-viewsw{display:inline-flex;border:1px solid var(--vscode-panel-border);border-radius:3px;overflow:hidden}
.kin-vs{padding:2px 10px;cursor:pointer;font-size:11px;color:var(--vscode-descriptionForeground)}
.kin-vs.on{background:var(--vscode-button-background);color:var(--vscode-button-foreground)}

.bf-start rect{fill:var(--vscode-badge-background);stroke:var(--vscode-descriptionForeground)}
.fn-row.open > .fn-row-hdr .chevron{transform:rotate(90deg)}

/* \u2500\u2500 One colour for all text/badges. The only colour in the panel is the yellow
   border on changed controls/nodes in Preview and Flow (plus line-diff backgrounds). \u2500\u2500 */
.fn-badge,.list-badge,.tag,.tag.warn,.tab-badge,.type-tab.active .tab-badge,.chip-count{background:var(--vscode-badge-background)!important;color:var(--vscode-badge-foreground)!important}
.list-dot{background:var(--vscode-descriptionForeground)!important;opacity:.6}
.chip.active{border-bottom-color:var(--vscode-button-background)!important}
.env-label.a,.env-label.b{color:var(--vscode-descriptionForeground)!important}
.diff-col-hdr.a,.diff-col-hdr.b{background:var(--vscode-sideBarSectionHeader-background,rgba(255,255,255,.04))!important;color:var(--vscode-foreground)!important}
.section-lbl,.detail-meta span,.fn-changed,.only-info,.list-delta{color:var(--vscode-descriptionForeground)!important}
.meta-tbl tr.changed td{background:none!important}
.meta-tbl tr.changed td:first-child{font-weight:700}
.va,.vb,.vs{color:inherit!important}
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
    <button class="run-btn" id="runBtn" onclick="runCompare()">Run Compare</button>
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
    <span>Method + data directives, widgets and code, from both environments</span>
  </div>
  <div style="display:none;flex-direction:column;flex:1;overflow:hidden" id="bpmMain">
    <div class="summary" id="bpmSummary"></div>
    <div class="filter-bar">
      <input class="search" id="bpmSearch" placeholder="Search services / methods / directives\u2026" oninput="bpmApply()">
      <select id="bpmSource" onchange="bpmApply()"><option value="">All sources</option><option value="BO">Method directives</option><option value="DB">Data directives</option><option value="DQ">UBAQ directives</option></select>
      <label class="fb-chk"><input type="checkbox" id="bpmHideDisabled" onchange="bpmApply()"> Hide disabled</label>
      <label class="fb-chk"><input type="checkbox" id="bpmCodeOnly" onchange="bpmApply()"> Code changes only</label>
    </div>
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
    <span>Custom layers only (system/base excluded) \u2014 content loads per layer on click</span>
  </div>
  <div style="display:none;flex-direction:column;flex:1;overflow:hidden" id="layersMain">
    <div class="summary" id="layersSummary"></div>
    <div class="filter-bar"><input class="search" id="layersSearch" placeholder="Search apps / layers\u2026" oninput="layersApply()"></div>
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
    setStatus('Select both profiles and companies before running');
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
  if (!LAST_RUN) { setStatus('Run a compare first'); return; }
  if (BPM_LOADED || BPM_LOADING) return;
  BPM_LOADING = true;
  document.getElementById('bpmPrompt').style.display = 'none';
  document.getElementById('bpmMain').style.display   = 'flex';
  document.getElementById('bpmDetail').innerHTML     = '<div class="empty-state"><span>Loading BPM data\u2026</span></div>';
  setStatus('Fetching BPMs\u2026');
  vscode.postMessage({ command: 'runBpmCompare', ...LAST_RUN });
}

function loadLayers() {
  if (!LAST_RUN) { setStatus('Run a compare first'); return; }
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
      setStatus(\`Applied \${msg.functionId} \u2014 re-run compare to refresh this view\`);
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
          \${delta ? \`<span class="list-delta">\${delta} diff</span>\` : ''}
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
  const sl = { match:'Match', diff:'~ Different', 'only-a':\`Only in \${ea}\`, 'only-b':\`+ Only in \${eb}\` };
  let html = \`<div class="detail-hdr">
    <div class="detail-title">\${esc(lib.libID)}</div>
    <div class="detail-meta">
      <span style="color:\${sc[lib.status]}">\${sl[lib.status]}</span>
      <span>| \${lib.fnDiffs.length} function\${lib.fnDiffs.length!==1?'s':''}</span>
      <span style="color:\${lib.inA?'var(--c-only-a)':'var(--vscode-descriptionForeground)'}">\${ea}</span>
      <span style="color:\${lib.inB?'var(--c-only-b)':'var(--vscode-descriptionForeground)'}">\${eb}</span>
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
        Library Info\${hasDiff ? ' *' : ''}
        \${hasDiff ? \`<span style="color:var(--c-diff);font-size:9px">has differences</span>\` : \`<span style="color:var(--vscode-descriptionForeground);font-size:9px">click to expand</span>\`}
      </span>
      <span class="chevron \${hasDiff?'open':''}" id="\${lid}_chev"></span>
    </div>
    <div id="\${lid}" style="display:\${hasDiff?'block':'none'};border-top:1px solid var(--vscode-panel-border)">
      <div class="tabs">
        <button class="tab active" onclick="switchLibTab(this,'\${lid}','refs')">References\${refsDiff?' *':''}</button>
        <button class="tab"        onclick="switchLibTab(this,'\${lid}','settings')">Settings\${metaDiff?' *':''}</button>
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
        <span style="font-size:9px;color:var(--c-match)">match (\${items.length})</span>
        <span class="chevron" id="\${sid}_chev"></span></div>
        <div id="\${sid}" style="display:none"><table class="meta-tbl"><tbody>\${items.map(i=>\`<tr><td colspan="2" class="vs">\${esc(i)}</td></tr>\`).join('')}</tbody></table></div></div>\`;
    } else {
      html += \`<div class="ref-group"><div class="ref-group-hdr"><span class="ref-group-lbl">\${k}</span><span style="font-size:9px;color:var(--c-diff)"> * different</span></div>\${inlineListDiff(v.a,v.b,ea,eb)}</div>\`;
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
    ? \`<button class="open-diff-btn" title="Copy this function's code to \${esc(eb)}" onclick="event.stopPropagation();applyFn('\${jsAttr(libID)}','\${jsAttr(fn.fnID)}','aToB')">-> \${esc(eb)}</button>\`
      + \`<button class="open-diff-btn" title="Copy this function's code to \${esc(ea)}" onclick="event.stopPropagation();applyFn('\${jsAttr(libID)}','\${jsAttr(fn.fnID)}','bToA')">-> \${esc(ea)}</button>\`
    : '';
  return \`<div class="fn-row" id="\${id}">
    <div class="fn-row-hdr" onclick="toggleFn('\${id}')">
      <span class="fn-badge" style="background:\${sc[fn.status]}22;color:\${sc[fn.status]}">\${sb[fn.status]}</span>
      <span class="fn-name">\${esc(fn.fnID)}</span>
      \${changed.length?\`<span class="fn-changed">\${changed.join(', ')}</span>\`:''}
      <button class="open-diff-btn" title="Open in VS Code diff editor" onclick="event.stopPropagation();openFnDiff('\${jsAttr(libID)}','\${jsAttr(fn.fnID)}')">Diff</button>
      \${applyBtns}
      <span class="chevron"></span>
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
    <button class="tab active" onclick="switchFnTab(this,'\${fid}','code')">Code\${codeDiff?' *':''}</button>
    <button class="tab"        onclick="switchFnTab(this,'\${fid}','sig')">Signature\${sigDiff?' *':''}</button>
    <button class="tab"        onclick="switchFnTab(this,'\${fid}','meta')">Metadata\${metaDiff?' *':''}</button>
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
  return \`<div class="diff-wrap"><div class="diff-col-hdrs"><div class="diff-col-hdr a">\${labelA}</div><div class="diff-col-hdr b">\${labelB}</div></div><div class="diff-scroll"><div class="diff-grid">\${cells}</div></div></div>\`;
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
    // native Diff button handles these properly.
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
  return \`<div class="diff-wrap"><div class="diff-col-hdrs"><div class="diff-col-hdr a">\${labelA}</div><div class="diff-col-hdr b">\${labelB}</div></div><div class="diff-scroll"><div class="diff-grid">\${cells}</div></div></div>\`;
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
<script>
${Tm}
</script>
</body>
</html>`}};mr.KEY="efxCompare";mr.panels=new Map;go.ComparePanel=mr;go.compareFunctionsData=Vc;go.compareBpmData=Kc});var Bi=de((Og,Qc)=>{"use strict";var Be=require("vscode"),{bodyCodeText:Mm}=Vt(),Bn=null,Gc=300,Yc=200;function Rm(){Bn=null}function Ti(t){return`${t.config.serverUrl}|${t.config.company}`}function Um(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}async function qm(t){let e=await t.getLibraryList(),n=[...new Set(e.map(s=>s.LibraryID))].sort();if(!n.length)return{key:Ti(t),loadedAt:Date.now(),fns:[],libCount:0};let r=await t.request(t.getDesignerUrl("GetLibraries"),{libraryIds:n});if(!r||typeof r!="object")throw new Error(`Unexpected GetLibraries response \u2014 expected JSON, got ${typeof r}.`);let o=r.returnObj||r,i=[];for(let s of o.EfxFunction||[]){let a=Mm(s.Body);a&&i.push({libraryId:s.LibraryID,functionId:s.FunctionID,description:s.Description||"",lines:String(a||"").replace(/\r\n/g,`
`).replace(/\r/g,`
`).split(`
`)})}return i.sort((s,a)=>s.libraryId.localeCompare(a.libraryId)||s.functionId.localeCompare(a.functionId)),{key:Ti(t),loadedAt:Date.now(),fns:i,libCount:n.length}}async function Ni(t,e){let n=Ti(t);return!e&&Bn&&Bn.key===n||(Bn=await Be.window.withProgress({location:Be.ProgressLocation.Notification,title:"EFx: Indexing function library\u2026"},()=>qm(t))),Bn}function jm(t,e){let n=e.regex?t:Um(t);return e.word&&(n=`\\b${n}\\b`),new RegExp(n,e.caseSensitive?"g":"gi")}function Jc(t,e){t.lastIndex=0;let n=t.exec(e);return n&&n[0].length>0?n:null}function Hm(t,e,n){let r=t.length-t.replace(/^\s+/,"").length,o=t.slice(r),i=e-r;if(o.length>Yc){let s=Math.max(0,i-30);o=(s>0?"\u2026":"")+o.slice(s,s+Yc),i=i-s+(s>0?1:0)}return{text:o,start:i,end:i+n}}function Xc(t,e,n,r){let o=jm(e,n),i=[],s=0;for(let a of t.fns)if(!(r&&a.libraryId!==r)){Jc(o,a.functionId)&&(s++,i.length<Gc&&i.push({fn:a,line:0,col:0,len:0,kind:"name"}));for(let c=0;c<a.lines.length;c++){let l=Jc(o,a.lines[c]);l&&(s++,i.length<Gc&&i.push({fn:a,line:c+1,col:l.index,len:l[0].length,kind:"code"}))}}return{hits:i,total:s}}function Wm(t,e){let n=t.hits.map(r=>r.kind==="name"?{label:`$(symbol-function) ${r.fn.functionId}`,description:`${r.fn.libraryId} \u2014 function name`,detail:r.fn.description||void 0,alwaysShow:!0,hit:r}:{label:Hm(r.fn.lines[r.line-1],r.col,r.len).text||"(blank line)",description:`${r.fn.libraryId}.${r.fn.functionId}:${r.line}`,alwaysShow:!0,hit:r});return t.total>t.hits.length&&n.push({label:`$(ellipsis) ${t.total-t.hits.length} more matches not shown`,description:`narrow the search \u2014 showing the first ${t.hits.length} of ${t.total}`,alwaysShow:!0}),n.length||n.push({label:"$(search-stop) No matches",description:`searched ${e.fns.length} functions`,alwaysShow:!0}),n}function zm(t){let e=Math.min(t.lineCount,12);for(let n=0;n<e;n++){let r=t.lineAt(n).text;if(/^\/\/\s*(-{10,}|─{10,})/.test(r))return n+2;if(!r.startsWith("//")&&r.trim()!=="")break}return 0}function Vm(t,e){if(e.kind!=="code")return 0;let n=e.fn.lines[e.line-1],r=zm(t)+e.line-1;if(r<t.lineCount&&t.lineAt(r).text===n)return r;for(let o=0;o<t.lineCount;o++)if(t.lineAt(o).text===n)return o;return Math.min(Math.max(r,0),Math.max(t.lineCount-1,0))}async function Km(t){let{libraryId:e,functionId:n}=t.fn;await Be.commands.executeCommand("efx.pullFunction",{libraryId:e,func:{FunctionID:n},signatures:[]});let r=Be.window.activeTextEditor;if(!r||!r.document.fileName.endsWith(`${n}.cs`))return;let o=Vm(r.document,t),i=r.document.lineAt(o).text.length,s=t.kind==="code"?Math.min(t.col,i):0,a=t.kind==="code"?Math.min(t.col+t.len,i):0,c=new Be.Range(o,s,o,a);r.selection=new Be.Selection(c.start,c.end),r.revealRange(c,Be.TextEditorRevealType.InCenter)}var _t={case:{iconPath:new Be.ThemeIcon("case-sensitive"),tooltip:"Toggle Match Case"},word:{iconPath:new Be.ThemeIcon("whole-word"),tooltip:"Toggle Match Whole Word"},regex:{iconPath:new Be.ThemeIcon("regex"),tooltip:"Toggle Use Regular Expression"},reload:{iconPath:new Be.ThemeIcon("refresh"),tooltip:"Re-index the function library"}};function Gm(t){let e=Math.round((Date.now()-t)/1e3);if(e<60)return"just now";let n=Math.round(e/60);return n<60?`${n}m ago`:`${Math.round(n/60)}h ago`}async function Ym(t,e={}){if(!t){Be.window.showWarningMessage("EFx: Configure connection first (gear icon)");return}let n;try{n=await Ni(t,!1)}catch(g){Be.window.showErrorMessage(`EFx Find: could not index the library: ${g.message}`);return}let r=e.libraryId||null,o={caseSensitive:!1,word:!1,regex:!1},i=Be.window.createQuickPick();i.buttons=[_t.case,_t.word,_t.regex,_t.reload],i.matchOnDescription=!1,i.matchOnDetail=!1,i.ignoreFocusOut=!1;let s=g=>o[g]?"on":"off",a=g=>{let E=r?`in ${r}`:"in all libraries";i.title=`Find in Functions \u2014 ${E}  \xB7  Aa ${s("case")}  \xB7  ab ${s("word")}  \xB7  .* ${s("regex")}${g?`  \xB7  ${g}`:""}`},c=()=>{let g=r?n.fns.filter(E=>E.libraryId===r).length:n.fns.length;i.placeholder=`Search ${g} function${g===1?"":"s"} \xB7 ${t.config.company} \xB7 indexed ${Gm(n.loadedAt)}`},l=()=>{let g=i.value;if(!g){i.items=[],a();return}try{let E=Xc(n,g,o,r);i.items=Wm(E,n),a(`${E.total} match${E.total===1?"":"es"}`)}catch(E){i.items=[{label:"$(error) Invalid regular expression",description:E.message,alwaysShow:!0}],a()}};i.onDidChangeValue(l),i.onDidTriggerButton(async g=>{if(g===_t.reload){i.busy=!0;try{n=await Ni(t,!0)}catch(E){Be.window.showErrorMessage(`EFx Find: re-index failed: ${E.message}`)}i.busy=!1,c()}else g===_t.case?o.caseSensitive=!o.caseSensitive:g===_t.word?o.word=!o.word:g===_t.regex&&(o.regex=!o.regex);l()}),i.onDidAccept(async()=>{let g=i.selectedItems[0];if(!(!g||!g.hit)){i.hide();try{await Km(g.hit)}catch(E){Be.window.showErrorMessage(`EFx Find: could not open ${g.hit.fn.functionId}: ${E.message}`)}}}),i.onDidHide(()=>i.dispose());let u=Be.window.activeTextEditor?.selection,m=u&&!u.isEmpty&&u.isSingleLine?Be.window.activeTextEditor.document.getText(u).trim():"";m&&(i.value=m),c(),l(),i.show()}Qc.exports={openFunctionSearch:Ym,clearSearchCache:Rm,getCorpus:Ni,search:Xc}});var Fi=de((_g,rl)=>{"use strict";var xt=require("vscode"),rt=require("fs"),Dt=require("path"),Jm=require("os"),Zc=/^[A-Za-z0-9-]{8,64}$/,$i=/^([A-Za-z0-9-]{8,64})\.json$/,yo=["off","read","write","risky"],Xm=600*1e3,Qm=20*1e3,Zm=35*1e3,el=Dt.join(Jm.homedir(),".efx-manager"),tl=Dt.join(el,"bridge.json"),nl="_claude",eh="cpi.epicor-efx-manager",th=jn(),nh=vi();function bo(t){let e=t&&t.claudeAccess;return yo.includes(e)?e:"off"}function Oi(t,e){return yo.indexOf(t)>=yo.indexOf(e)}function Li(t,e){let n=`${t}.${process.pid}.tmp`;rt.writeFileSync(n,JSON.stringify(e,null,2),"utf-8"),rt.renameSync(n,t)}function rh(t,e,n){let r;return Promise.race([t.finally(()=>clearTimeout(r)),new Promise((o,i)=>{r=setTimeout(()=>i(new Error(n)),e)})])}var _i=class{constructor(e,n,r){this.context=e,this.api=n,this.ops=r,this.queue=Promise.resolve(),this.inFlight=new Set,this.watcher=null,this.watchedDir=null,this.sweepTimer=null,this.held=new Map}start(){let e=this.context;e.subscriptions.push(xt.window.registerUriHandler({handleUri:n=>this.handleUri(n)})),e.subscriptions.push(xt.workspace.onDidChangeConfiguration(n=>{n.affectsConfiguration("efx")&&this.refresh()})),e.subscriptions.push({dispose:()=>this.stopWatching()}),this.refresh()}refresh(){try{this.writeBridgeFile()}catch(e){console.error("EFx Claude bridge: bridge.json write failed",e)}this.watchActiveDir()}requestDir(e){let n=this.api.profileRootNoPrompt(e);return n?Dt.join(n,nl):null}writeBridgeFile(){let e=this.api.getActiveProfileName(),n=this.api.getProfiles().map(r=>({name:r.name,serverUrl:r.serverUrl||"",companies:r.companies||[],claudeAccess:bo(r),authType:r.authType==="entra"?"entra":"basic",root:this.api.profileRootNoPrompt(r.name)}));rt.mkdirSync(el,{recursive:!0}),Li(tl,{version:1,pid:process.pid,appName:xt.env.appName,uriScheme:xt.env.uriScheme,extensionId:this.context.extension&&this.context.extension.id||eh,activeProfile:e||null,activeCompany:this.api.getActiveCompany()||null,requestDir:e?this.requestDir(e):null,storageLocationSet:!!this.api.profileRootNoPrompt(e||"Default"),profiles:n,updatedAt:new Date().toISOString()})}stopWatching(){if(this.watcher)try{this.watcher.close()}catch{}this.sweepTimer&&clearInterval(this.sweepTimer),this.watcher=null,this.sweepTimer=null,this.watchedDir=null}watchActiveDir(){let e=this.api.getActiveProfileName(),n=e?this.requestDir(e):null;if(n!==this.watchedDir&&(this.stopWatching(),!!n)){try{rt.mkdirSync(n,{recursive:!0})}catch{return}this.watchedDir=n,this.holdLeftovers(n);try{this.watcher=rt.watch(n,(r,o)=>{let i=o&&String(o).match($i);i&&this.enqueue(i[1])}),this.watcher.on("error",()=>{})}catch{}this.sweepTimer=setInterval(()=>this.sweep(),2e3),this.sweep()}}sweep(){let e=this.watchedDir;if(!e)return;let n=[];try{n=rt.readdirSync(e)}catch{return}for(let r of n){let o=r.match($i);o&&this.enqueue(o[1])}}holdLeftovers(e){let n=[];try{n=rt.readdirSync(e)}catch{return}let r=n.map(o=>(o.match($i)||[])[1]).filter(Boolean);if(r.length){for(let o of r)this.held.set(o,e);setTimeout(()=>this.discardHeld(e),Zm)}}discardHeld(e){let n=0;for(let[r,o]of this.held){if(o!==e)continue;this.held.delete(r);let i=Dt.join(e,`${r}.json`),s=Dt.join(e,`${r}.discarded-${process.pid}`);try{rt.renameSync(i,s)}catch{continue}try{rt.unlinkSync(s),n++}catch{}}n&&(console.log(`EFx Claude bridge: discarded ${n} leftover request(s) in ${e}`),xt.window.setStatusBarMessage(`EFx: discarded ${n} stale Claude request${n===1?"":"s"} from before VS Code started`,8e3))}handleUri(e){if(e.path==="/auth")return th.handleRedirect(e);if(e.path!=="/request")return;let n=new URLSearchParams(e.query).get("id")||"";if(!Zc.test(n)){xt.window.showWarningMessage("EFx: Ignored a Claude request link with an invalid id.");return}this.watchActiveDir(),this.held.delete(n),this.enqueue(n)}enqueue(e){this.inFlight.has(e)||this.held.has(e)||(this.inFlight.add(e),this.queue=this.queue.then(()=>this.process(e)).catch(n=>console.error("EFx Claude bridge:",n)).finally(()=>this.inFlight.delete(e)))}async process(e){let n=this.watchedDir;if(!n)return;let r=Dt.join(n,`${e}.json`),o=Dt.join(n,`${e}.claimed-${process.pid}`);try{rt.renameSync(r,o)}catch{return}let i=null,s=null;try{i=JSON.parse(rt.readFileSync(o,"utf-8"))}catch(u){s=u.message}try{rt.unlinkSync(o)}catch{}try{Li(Dt.join(n,`${e}.ack.json`),{id:e,pid:process.pid,at:new Date().toISOString()})}catch{}let a;try{a=s?{ok:!1,error:`Request file is not valid JSON: ${s}`}:await this.run(e,i)}catch(u){a={ok:!1,error:u.message||String(u),...u.needsDemote?{needsDemote:u.needsDemote}:{}}}let c=null;try{c=nh.mcpOutdated(this.context,i&&i.mcpVersion)}catch{}let l={id:e,profile:i&&i.profile,op:i&&i.op,finishedAt:new Date().toISOString(),...a,...c?{mcpUpdate:c}:{}};try{Li(Dt.join(n,`${e}.result.json`),l)}catch(u){console.error("EFx Claude bridge: result write failed",u)}this.notify(l)}async run(e,n){if(!n||typeof n!="object")return{ok:!1,error:"Empty request"};if(n.id!==e)return{ok:!1,error:"Request id does not match its file name"};let r=Date.now()-Date.parse(n.createdAt||"");if(!(r>=-6e4&&r<=Xm))return{ok:!1,error:"Request is missing createdAt or is older than 10 minutes"};let o=this.ops[n.op];if(!o)return{ok:!1,error:`Unknown op "${n.op}"`};try{await rh(this.api.clientReady(),Qm,"timeout")}catch{}let i=this.api.getActiveProfileName();if(!i)return{ok:!1,error:"No active EFx profile in VS Code"};if(n.profile!==i)return{ok:!1,error:`Request is for profile "${n.profile}" but the active profile is "${i}". Claude never switches profiles implicitly \u2014 use switch_profile.`};let s=this.api.getActiveProfile(),a=bo(s);if(!Oi(a,o.level)||a==="off")return{ok:!1,error:`Claude access for profile "${i}" is "${a}"; ${n.op} needs "${o.level}". Change it in VS Code: EFx: Manage Profiles \u2192 Edit Profile.`};if(o.needsClient!==!1&&!this.api.getClient())return{ok:!1,error:`Profile "${i}" is not connected (no stored password?). Open EFx: Manage Profiles in VS Code.`};let c=await o.run(n.args||{},{profile:s,level:a,id:e,levelOf:bo,atLeast:Oi});return{ok:c&&typeof c.ok=="boolean"?c.ok:!0,result:c}}notify(e){let n=this.ops[e.op],r=e.result&&e.result.summary,o=`Claude: ${e.op||"request"} on ${e.profile||"?"} \u2014 ${e.ok?r||"done":r||e.error||"failed"}`;n&&n.level!=="read"?(e.ok?xt.window.showInformationMessage:xt.window.showWarningMessage)(o):xt.window.setStatusBarMessage(o,6e3)}};rl.exports={ClaudeBridge:_i,LEVELS:yo,levelOf:bo,atLeast:Oi,BRIDGE_FILE:tl,REQUEST_DIR:nl,ID_RE:Zc}});var al=de((Fg,sl)=>{"use strict";var $n=require("vscode"),oh=require("path"),ih=require("crypto"),{BRIDGE_FILE:sh,REQUEST_DIR:ah}=Fi(),ch=/^[A-Za-z0-9_\-. ]+$/,ol=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,lh=/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/,dh=["clientId","tenantId","scope","redirectUri"],Pi=["password","apiKey"],Ln=null,Mi=class t{static open(e,n,r){if(Ln){Ln.load(r||null),Ln.panel.reveal();return}Ln=new t(e,n),Ln.load(r||null)}constructor(e,n){this.context=e,this.deps=n,this.originalName=null,this.pending={},this.ready=!1,this.panel=$n.window.createWebviewPanel("efxProfile","EFx Profile",$n.ViewColumn.Active,{enableScripts:!0,retainContextWhenHidden:!0}),this.panel.webview.html=ph(ih.randomBytes(16).toString("base64"),this.panel.webview.cspSource),this.panel.onDidDispose(()=>{Ln=null,this.pending={}}),this.panel.webview.onDidReceiveMessage(r=>{this.onMessage(r).catch(o=>this.post({type:"error",message:o.message||String(o),field:o.field}))})}post(e){this.panel.webview.postMessage(e)}load(e){this.originalName=e,this.pending={},this.panel.title=e?`EFx Profile: ${e}`:"New EFx Profile",this.ready&&this.sendState().catch(n=>this.post({type:"error",message:n.message}))}secretKey(e,n){return this.deps.profileSecretKey(e,n)}async storedSecret(e){return this.originalName&&await this.context.secrets.get(this.secretKey(this.originalName,e))||""}async effectiveSecret(e){return e in this.pending?this.pending[e]||"":this.storedSecret(e)}async sendState(){let e=this.deps,n=this.originalName,r=n?e.getProfiles().find(c=>c.name===n):null;if(n&&!r)throw new Error(`Profile "${n}" no longer exists.`);let o=r?JSON.parse(JSON.stringify(r)):{name:"",serverUrl:"",username:"",companies:[],autoPush:!1,autoClean:!1,claudeAccess:"off"};o.authType=e.authTypeOf(o);let i={};for(let c of Pi)i[c]=!!await this.storedSecret(c);let s=r?e.profileRootNoPrompt(r.name):null,a=e.getActiveProfileName();this.post({type:"state",profiles:e.getProfiles().map(c=>({name:c.name,active:c.name===a})),isNew:!r,isActive:!!r&&e.getActiveProfileName()===r.name,activeCompany:e.getActiveCompany(),draft:o,secrets:i,pending:this.pendingView(),accessLevels:e.CLAUDE_ACCESS_LEVELS,authState:r?await e.auth.getAuthState(r):{state:"n/a"},bridge:{file:sh,requestDir:s?oh.join(s,ah):null}})}pendingView(){let e={};for(let n of Object.keys(this.pending))e[n]=this.pending[n]===null?"clear":"set";return e}async onMessage(e){if(!(!e||typeof e!="object"))switch(e.type){case"ready":return this.ready=!0,this.sendState();case"setSecret":{if(!Pi.includes(e.kind))return;let n=typeof e.value=="string"?e.value:"";if(!n)throw Object.assign(new Error("Nothing typed."),{field:e.kind});return this.pending[e.kind]=n,this.post({type:"pending",pending:this.pendingView()})}case"clearSecret":return e.kind!=="apiKey"?void 0:(this.pending.apiKey=null,this.post({type:"pending",pending:this.pendingView()}));case"undoSecret":return delete this.pending[e.kind],this.post({type:"pending",pending:this.pendingView()});case"fetchCompanies":return this.fetchCompanies(e.draft||{},String(e.seed||"").trim());case"save":return this.save(e.draft||{},e.activeCompany?String(e.activeCompany):"");case"switch":return(e.dirty||Object.keys(this.pending).length)&&await $n.window.showWarningMessage(`Discard unsaved changes to "${this.originalName||"new profile"}"?`,{modal:!0},"Discard")!=="Discard"?this.post({type:"switchCancelled"}):this.load(typeof e.name=="string"&&e.name?e.name:null);case"signIn":{let n=this.originalName&&this.deps.getProfiles().find(r=>r.name===this.originalName);if(!n)throw new Error("Save the profile first.");return await $n.commands.executeCommand("efx.signIn",n.name),this.post({type:"authState",authState:await this.deps.auth.getAuthState(n)})}case"applyAccessAll":return this.applyAccessAll(e.level);case"revert":return this.pending={},this.sendState();case"close":return this.panel.dispose()}}async applyAccessAll(e){let n=this.deps;if(!(n.CLAUDE_ACCESS_LEVELS||[]).find(s=>s.value===e))return;let o=n.getProfiles();if(!o.length)throw new Error("No saved profiles yet.");if(await $n.window.showWarningMessage(`Set Claude access to "${e}" on all ${o.length} profiles?`,{modal:!0,detail:`${o.map(s=>`${s.name}: ${s.claudeAccess||"off"} \u2192 ${e}`).join(`
`)}`},"Apply to all")==="Apply to all"){for(let s of o)s.claudeAccess=e;await n.setProfiles(o),this.post({type:"accessApplied",level:e,count:o.length})}}async fetchCompanies(e,n){let r=il(e,{});if(!r.serverUrl||!r.username)throw new Error("Server URL and username first.");if(!n)throw Object.assign(new Error("Enter a company to authenticate the lookup against."),{field:"seed"});let o;if(r.authType==="entra"){let s=this.originalName&&this.deps.getProfiles().find(a=>a.name===this.originalName);if(!s||this.deps.authTypeOf(s)!=="entra")throw new Error("Save the Entra profile and sign in first, then fetch.");o=new this.deps.EpicorClient(this.deps.auth.clientConfig(s,n))}else{let s=await this.effectiveSecret("password");if(!s)throw Object.assign(new Error("Set a password first (Authentication tab)."),{field:"password"});let a=await this.effectiveSecret("apiKey");o=new this.deps.EpicorClient(this.deps.auth.draftBasicConfig({serverUrl:r.serverUrl,company:n,username:r.username,password:s,apiKey:a}))}this.post({type:"busy",text:`Fetching companies for ${r.username}\u2026`});let i=await o.getUserCompanies();this.post({type:"companies",companies:Array.from(new Set([n,...i]))})}async save(e,n){let r=this.deps,o=this.context.secrets,i=this.originalName,s=r.getProfiles(),a=i?s.findIndex(m=>m.name===i):-1;if(i&&a<0)throw new Error(`Profile "${i}" was deleted elsewhere \u2014 close this panel.`);let c=il(e,a>=0?s[a]:{}),l=uh(c);if(l)throw Object.assign(new Error(l.message),{field:l.field});if(s.some((m,g)=>g!==a&&m.name===c.name))throw Object.assign(new Error(`Profile "${c.name}" already exists.`),{field:"name"});if(c.authType==="basic"&&!await this.effectiveSecret("password"))throw Object.assign(new Error("Basic auth needs a password."),{field:"password"});if(i&&c.name!==i)for(let m of Pi){let g=await o.get(this.secretKey(i,m));g&&await o.store(this.secretKey(c.name,m),g),await o.delete(this.secretKey(i,m))}for(let[m,g]of Object.entries(this.pending))g===null?await o.delete(this.secretKey(c.name,m)):await o.store(this.secretKey(c.name,m),g);c.authType==="entra"&&await o.delete(this.secretKey(c.name,"password")),a>=0?s[a]=c:s.push(c),await r.setProfiles(s),this.pending={},this.originalName=c.name,this.panel.title=`EFx Profile: ${c.name}`,!!i&&r.getActiveProfileName()===i?(c.name!==i&&await r.setActiveProfileName(c.name),n&&c.companies.includes(n)&&await r.setActiveCompany(n),await r.activateProfile(c.name)):!i&&s.length===1?await r.activateProfile(c.name):i||$n.window.showInformationMessage(`EFx: Profile "${c.name}" saved.`,"Activate").then(m=>{m==="Activate"&&r.activateProfile(c.name)}),await this.sendState(),this.post({type:"saved"})}};function il(t,e){let n=o=>typeof o=="string"?o.trim():"",r={...e};r.name=n(t.name),r.serverUrl=n(t.serverUrl).replace(/\/+$/,""),r.username=n(t.username),r.companies=Array.isArray(t.companies)?Array.from(new Set(t.companies.map(o=>String(o).trim()).filter(Boolean))):[],r.autoPush=!!t.autoPush,r.autoClean=!!t.autoClean,r.claudeAccess=["off","read","write","risky"].includes(t.claudeAccess)?t.claudeAccess:"off",r.authType=t.authType==="entra"?"entra":"basic";for(let o of dh)r.authType==="entra"?r[o]=n(t[o]):delete r[o];return r}function uh(t){if(!t.name)return{field:"name",message:"Name is required."};if(!ch.test(t.name))return{field:"name",message:"Name: letters, numbers, space, dash, dot, underscore."};if(!/^https?:\/\/\S+$/.test(t.serverUrl))return{field:"serverUrl",message:"Server URL must start with http:// or https://."};if(!t.username)return{field:"username",message:t.authType==="entra"?"Epicor user ID is required.":"Username is required."};if(!t.companies.length)return{field:"companies",message:"At least one company."};if(t.authType==="entra"){if(!ol.test(t.clientId))return{field:"clientId",message:"Client ID must be a GUID."};if(!ol.test(t.tenantId)&&!lh.test(t.tenantId))return{field:"tenantId",message:"Tenant must be a GUID or a domain."};if(!t.scope||/\s/.test(t.scope))return{field:"scope",message:"One scope, no spaces."};if(t.redirectUri&&!/^https:\/\/\S+$/.test(t.redirectUri))return{field:"redirectUri",message:"Redirect must be an https address, or empty for the vscode:// link."}}return null}function ph(t,e){return`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${e} 'nonce-${t}'; script-src 'nonce-${t}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style nonce="${t}">
body{font-family:var(--vscode-font-family);font-size:var(--vscode-font-size);color:var(--vscode-foreground);background:var(--vscode-editor-background);margin:0;padding:0}
.wrap{max-width:720px;padding:16px 24px 80px}
h1{font-size:16px;font-weight:600;margin:4px 0 12px}
.tag{font-size:11px;padding:1px 6px;border-radius:8px;margin-left:8px;background:var(--vscode-badge-background);color:var(--vscode-badge-foreground);vertical-align:middle}
.tabs{display:flex;border-bottom:1px solid var(--vscode-panel-border);margin-bottom:16px}
.tab{background:none;border:none;border-bottom:2px solid transparent;color:var(--vscode-descriptionForeground);padding:6px 14px;cursor:pointer;font:inherit}
.tab.on{color:var(--vscode-foreground);border-bottom-color:var(--vscode-focusBorder)}
.tab .dot{color:var(--vscode-errorForeground);margin-left:4px}
section{display:none}section.on{display:block}
.row{margin-bottom:14px}
label.l{display:block;font-weight:600;margin-bottom:4px}
.hint{color:var(--vscode-descriptionForeground);font-size:12px;margin-top:3px}
input[type=text],input[type=password],select{box-sizing:border-box;width:100%;padding:4px 6px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border,transparent);font:inherit}
input:focus,select:focus{outline:1px solid var(--vscode-focusBorder)}
.bad{outline:1px solid var(--vscode-inputValidation-errorBorder,#f14c4c)!important}
.inline{display:flex;gap:6px;align-items:center}
.inline input{flex:1}
.mt{margin-top:6px}
.mb{margin-bottom:14px}
button.b{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground);border:none;padding:4px 10px;cursor:pointer;font:inherit;white-space:nowrap}
button.b:hover{background:var(--vscode-button-secondaryHoverBackground)}
button.p{background:var(--vscode-button-background);color:var(--vscode-button-foreground)}
button.p:hover{background:var(--vscode-button-hoverBackground)}
button:disabled{opacity:.5;cursor:default}
.head{display:flex;align-items:center;gap:8px;margin:4px 0 12px}
.head select{width:auto;min-width:220px;font-size:13px}
/* Checkbox / radio drawn with VS Code's checkbox theme colors */
input[type=checkbox],input[type=radio]{-webkit-appearance:none;appearance:none;box-sizing:border-box;width:16px;height:16px;margin:1px 8px 0 0;flex-shrink:0;position:relative;cursor:pointer;
  border:1px solid var(--vscode-checkbox-border,var(--vscode-input-border,#6b6b6b));background:var(--vscode-checkbox-background,var(--vscode-input-background));border-radius:3px}
input[type=radio]{border-radius:50%}
input[type=checkbox]:checked::after{content:"";position:absolute;left:4px;top:1px;width:4px;height:8px;border:solid var(--vscode-checkbox-foreground,var(--vscode-foreground));border-width:0 2px 2px 0;transform:rotate(45deg)}
input[type=radio]:checked::after{content:"";position:absolute;inset:3px;border-radius:50%;background:var(--vscode-checkbox-foreground,var(--vscode-foreground))}
input[type=checkbox]:focus-visible,input[type=radio]:focus-visible{outline:1px solid var(--vscode-focusBorder);outline-offset:1px}
label.opt{display:flex;align-items:flex-start;padding:3px 0;cursor:pointer;line-height:18px}
.radio{display:flex;gap:22px;margin-top:2px}
.opt .d{color:var(--vscode-descriptionForeground)}
.access{margin:4px 0 10px}
.access.bad{outline-offset:4px}
.box{border:1px solid var(--vscode-panel-border);padding:10px 12px;margin-bottom:14px}
.box h3{margin:0 0 8px;font-size:13px}
.status{font-size:12px;margin-left:6px}
.ok{color:var(--vscode-testing-iconPassed,#3fb950)}
.warn{color:var(--vscode-list-warningForeground,#cca700)}
.muted{color:var(--vscode-descriptionForeground)}
.cos{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:0 14px;margin:4px 0 8px}
code{font-family:var(--vscode-editor-font-family);font-size:12px;word-break:break-all}
.foot{position:fixed;left:0;right:0;bottom:0;display:flex;gap:8px;align-items:center;padding:10px 24px;background:var(--vscode-sideBar-background,var(--vscode-editor-background));border-top:1px solid var(--vscode-panel-border)}
.msg{flex:1;font-size:12px}
.msg.err{color:var(--vscode-errorForeground)}
</style></head><body>
<div class="wrap">
<div class="head"><select id="profileSel" aria-label="Profile"></select><span id="activeTag" class="tag" hidden>active</span></div>
<div class="tabs">
  <button class="tab on" data-tab="general">General<span class="dot" hidden>\u25CF</span></button>
  <button class="tab" data-tab="auth">Authentication<span class="dot" hidden>\u25CF</span></button>
  <button class="tab" data-tab="integrations">Integrations<span class="dot" hidden>\u25CF</span></button>
</div>

<section id="general" class="on">
  <div class="row"><label class="l" for="name">Name</label><input type="text" id="name" placeholder="Dev, Pilot, Prod\u2026"></div>
  <div class="row"><label class="l" for="serverUrl">Server URL</label><input type="text" id="serverUrl" placeholder="https://server/instance"></div>
  <div class="row">
    <label class="l">Companies</label>
    <div id="cos" class="cos"></div>
    <div class="inline"><input type="text" id="addCo" placeholder="Add company code"><button class="b" id="addCoBtn">Add</button></div>
    <div class="inline mt"><input type="text" id="seed" placeholder="Company to authenticate the lookup"><button class="b" id="fetchBtn">Fetch from server</button></div>
  </div>
  <div class="row" id="activeCoRow" hidden><label class="l" for="activeCo">Active company</label><select id="activeCo"></select></div>
  <div class="row">
    <label class="opt"><input type="checkbox" id="autoPush"><span>Auto-push to Epicor when a .cs file is saved</span></label>
    <label class="opt"><input type="checkbox" id="autoClean"><span>Delete the local .cs file when its tab is closed (only if fully saved)</span></label>
  </div>
</section>

<section id="auth">
  <div class="row">
    <label class="l">Sign-in method</label>
    <div class="radio">
      <label class="opt"><input type="radio" name="authType" value="basic"><span>Basic \u2014 username + password</span></label>
      <label class="opt"><input type="radio" name="authType" value="entra"><span>Entra SSO \u2014 Microsoft sign-in</span></label>
    </div>
    <div class="hint" id="entraSwitchHint" hidden>Saving as Entra deletes this profile's stored password.</div>
  </div>
  <div class="row"><label class="l" for="username" id="usernameLabel">Username</label><input type="text" id="username">
    <div class="hint" id="usernameHint" hidden>Still needed for company lookup and the layer preview. Sign-in itself goes through Entra.</div></div>

  <div class="box" id="basicBox">
    <h3>Password <span class="status" id="st-password"></span></h3>
    <div class="inline"><input type="password" id="in-password" placeholder="Type to set or change" autocomplete="off"><button class="b" data-set="password">Set</button><button class="b" data-undo="password" hidden>Undo</button></div>
  </div>

  <div class="box" id="entraBox">
    <h3>Entra app</h3>
    <div class="row"><label class="l" for="authUrl">Paste sign-in URL</label>
      <div class="inline"><input type="text" id="authUrl" placeholder="https://login.microsoftonline.com/\u2026/authorize?client_id=\u2026&amp;scope=\u2026"><button class="b" id="fillFromUrl">Fill</button></div></div>
    <div class="row"><label class="l" for="clientId">Client ID</label><input type="text" id="clientId" placeholder="Kinetic native app registration (GUID)"></div>
    <div class="row"><label class="l" for="tenantId">Tenant ID</label><input type="text" id="tenantId" placeholder="GUID or domain"></div>
    <div class="row"><label class="l" for="scope">Scope</label><input type="text" id="scope" placeholder="api://&lt;webAppId&gt;/&lt;scopeName&gt;"></div>
    <div class="row"><label class="l" for="redirectUri">Redirect URI</label><input type="text" id="redirectUri" placeholder="Empty = vscode:// link (needs admin)"></div>
    <div class="inline"><button class="b" id="signInBtn">Sign In</button><span class="status" id="signInStatus"></span></div>
  </div>

  <div class="box">
    <h3>API key <span class="status" id="st-apiKey"></span></h3>
    <div class="inline"><input type="password" id="in-apiKey" placeholder="Type to set or change" autocomplete="off"><button class="b" data-set="apiKey">Set</button><button class="b" id="clearKey">Clear</button><button class="b" data-undo="apiKey" hidden>Undo</button></div>
  </div>
</section>

<section id="integrations">
  <div class="box">
    <h3>Claude (EFx MCP server)</h3>
    <label class="l">Access while this profile is active</label>
    <div class="access" id="accessList"></div>
    <div class="inline mb"><button class="b" id="applyAllBtn">Apply to all profiles</button><span class="status muted" id="applyAllNote"></span></div>
    <div class="hint">Bridge file: <code id="bridgeFile"></code></div>
    <div class="hint">Request folder: <code id="reqDir"></code></div>
  </div>
</section>
</div>

<div class="foot">
  <button class="b p" id="saveBtn">Save</button>
  <button class="b" id="revertBtn">Revert</button>
  <button class="b" id="closeBtn">Close</button>
  <span class="msg" id="msg"></span>
</div>

<script nonce="${t}">
const vscode = acquireVsCodeApi();
const $ = id => document.getElementById(id);
const FIELD_TAB = { name:"general", serverUrl:"general", companies:"general", seed:"general",
  username:"auth", authUrl:"auth", password:"auth", apiKey:"auth", clientId:"auth", tenantId:"auth", scope:"auth", redirectUri:"auth", claudeAccess:"integrations" };
let S = null;            // last state from the extension
let known = [];          // companies shown as checkboxes
let checked = new Set();
let dirty = false;

function showTab(t){
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("on", b.dataset.tab === t));
  document.querySelectorAll("section").forEach(s => s.classList.toggle("on", s.id === t));
}
document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));

function msg(text, err){ const m = $("msg"); m.textContent = text || ""; m.classList.toggle("err", !!err); }
function clearBad(){
  document.querySelectorAll(".bad").forEach(e => e.classList.remove("bad"));
  document.querySelectorAll(".tab .dot").forEach(d => d.hidden = true);
}
function markBad(field){
  if (!field) return;
  const el = $(field === "password" || field === "apiKey" ? "in-" + field
    : field === "companies" ? "addCo" : field === "claudeAccess" ? "accessList" : field);
  if (el) el.classList.add("bad");
  const tab = FIELD_TAB[field];
  if (tab){ const b = document.querySelector('.tab[data-tab="' + tab + '"]'); b.querySelector(".dot").hidden = false; showTab(tab); }
}
function setDirty(v){ dirty = v; $("saveBtn").textContent = v ? "Save \u25CF" : "Save"; }

function authType(){ const r = document.querySelector('input[name=authType]:checked'); return r ? r.value : "basic"; }
function renderAuth(){
  const entra = authType() === "entra";
  $("basicBox").hidden = entra;
  $("entraBox").hidden = !entra;
  $("usernameLabel").textContent = entra ? "Epicor user ID" : "Username";
  $("usernameHint").hidden = !entra;
  $("entraSwitchHint").hidden = !(entra && S && S.secrets.password);
}
document.querySelectorAll('input[name=authType]').forEach(r => r.addEventListener("change", () => { renderAuth(); setDirty(true); }));

function secretStatus(kind){
  const p = S.pending[kind], el = $("st-" + kind);
  if (p === "set"){ el.textContent = "changes on save"; el.className = "status warn"; }
  else if (p === "clear"){ el.textContent = "cleared on save"; el.className = "status warn"; }
  else if (S.secrets[kind]){ el.textContent = "set"; el.className = "status ok"; }
  else { el.textContent = "not set"; el.className = "status muted"; }
  const undo = document.querySelector('[data-undo="' + kind + '"]');
  if (undo) undo.hidden = !p;
}

function renderCompanies(){
  const box = $("cos"); box.textContent = "";
  for (const c of known){
    const lab = document.createElement("label"); lab.className = "opt";
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = checked.has(c);
    cb.addEventListener("change", () => { cb.checked ? checked.add(c) : checked.delete(c); renderActiveCo(); setDirty(true); });
    const t = document.createElement("span"); t.textContent = c;
    lab.appendChild(cb); lab.appendChild(t);
    box.appendChild(lab);
  }
  if (!known.length){ const s = document.createElement("span"); s.className = "muted"; s.textContent = "None yet."; box.appendChild(s); }
  renderActiveCo();
}
function renderActiveCo(){
  $("activeCoRow").hidden = !(S && S.isActive);
  const sel = $("activeCo"), was = sel.value || (S && S.activeCompany);
  sel.textContent = "";
  for (const c of known.filter(c => checked.has(c))){
    const o = document.createElement("option"); o.value = c; o.textContent = c; sel.appendChild(o);
  }
  if ([...sel.options].some(o => o.value === was)) sel.value = was;
}
function addCompanies(list, check){
  for (const c of list){ if (!known.includes(c)) known.push(c); if (check) checked.add(c); }
  renderCompanies();
}
$("addCoBtn").addEventListener("click", () => {
  const v = $("addCo").value.trim().split(",").map(s => s.trim()).filter(Boolean);
  if (!v.length) return;
  addCompanies(v, true); $("addCo").value = ""; setDirty(true);
});
$("addCo").addEventListener("keydown", e => { if (e.key === "Enter") $("addCoBtn").click(); });

function collect(){
  return {
    name: $("name").value, serverUrl: $("serverUrl").value, username: $("username").value,
    companies: known.filter(c => checked.has(c)),
    autoPush: $("autoPush").checked, autoClean: $("autoClean").checked,
    claudeAccess: accessLevel(), authType: authType(),
    clientId: $("clientId").value, tenantId: $("tenantId").value, scope: $("scope").value, redirectUri: $("redirectUri").value,
  };
}

$("fetchBtn").addEventListener("click", () => { clearBad(); vscode.postMessage({ type:"fetchCompanies", draft: collect(), seed: $("seed").value }); });
document.querySelectorAll("[data-set]").forEach(b => b.addEventListener("click", () => {
  const kind = b.dataset.set, input = $("in-" + kind);
  clearBad();
  vscode.postMessage({ type:"setSecret", kind, value: input.value });
  input.value = "";
}));
document.querySelectorAll("[data-undo]").forEach(b => b.addEventListener("click", () => vscode.postMessage({ type:"undoSecret", kind: b.dataset.undo })));
$("clearKey").addEventListener("click", () => vscode.postMessage({ type:"clearSecret", kind:"apiKey" }));
$("saveBtn").addEventListener("click", () => { clearBad(); msg("Saving\u2026"); vscode.postMessage({ type:"save", draft: collect(), activeCompany: $("activeCo").value }); });
$("revertBtn").addEventListener("click", () => { clearBad(); vscode.postMessage({ type:"revert" }); });
$("closeBtn").addEventListener("click", () => vscode.postMessage({ type:"close" }));
document.querySelectorAll("input[type=text],input[type=checkbox],select").forEach(el =>
  el.addEventListener(el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input", () => {
    if (!["addCo", "seed", "profileSel", "authUrl"].includes(el.id)) setDirty(true);
  }));

// Profile picker: switching asks the extension first so unsaved edits get a confirm.
$("profileSel").addEventListener("change", () => {
  const v = $("profileSel").value;
  vscode.postMessage({ type:"switch", name: v === "__new__" ? null : v, dirty });
});
function renderProfileSel(){
  const sel = $("profileSel"); sel.textContent = "";
  for (const p of S.profiles){
    const o = document.createElement("option"); o.value = p.name;
    o.textContent = p.name; sel.appendChild(o);
  }
  const n = document.createElement("option"); n.value = "__new__"; n.textContent = "\uFF0B New profile\u2026"; sel.appendChild(n);
  sel.value = S.isNew ? "__new__" : S.draft.name;
}

function accessLevel(){ const r = document.querySelector('input[name=access]:checked'); return r ? r.value : "off"; }
function renderAccess(level){
  const box = $("accessList"); box.textContent = "";
  for (const l of S.accessLevels){
    const lab = document.createElement("label"); lab.className = "opt";
    const r = document.createElement("input"); r.type = "radio"; r.name = "access"; r.value = l.value; r.checked = l.value === level;
    r.addEventListener("change", () => { setDirty(true); $("applyAllNote").textContent = ""; });
    const dash = l.label.indexOf(" \u2014 ");
    const b = document.createElement("b"); b.textContent = dash > 0 ? l.label.slice(0, dash) : l.label;
    const d = document.createElement("span"); d.className = "d"; d.textContent = dash > 0 ? " \u2014 " + l.label.slice(dash + 3) : "";
    const t = document.createElement("span"); t.appendChild(b); t.appendChild(d);
    lab.appendChild(r); lab.appendChild(t); box.appendChild(lab);
  }
}
// Pull client_id / tenant / scope out of the Microsoft authorize URL Kinetic
// redirects to. Decodes a few times so a URL nested inside another one works.
function parseAuthUrl(raw){
  let t = String(raw || "").trim();
  for (let i = 0; i < 3; i++){
    let d; try { d = decodeURIComponent(t.replace(/\\+/g, " ")); } catch { break; }
    if (d === t) break; t = d;
  }
  const tenant = (t.match(/login\\.(?:microsoftonline\\.com|microsoft\\.com|windows\\.net)\\/([^\\/?#\\s]+)/i) || [])[1] || "";
  const clientId = (t.match(/[?&]client_id=([^&#\\s]+)/i) || [])[1] || "";
  const scopeRaw = (t.match(/[?&]scope=([^&#]+)/i) || [])[1] || "";
  const scope = scopeRaw.split(/\\s+/).find(x => x && !["openid", "profile", "offline_access", "email"].includes(x.toLowerCase())) || "";
  const redirect = (t.match(/[?&]redirect_uri=([^&#\\s]+)/i) || [])[1] || "";
  return { tenant: ["common", "organizations", "consumers"].includes(tenant.toLowerCase()) ? "" : tenant, clientId, scope, redirect: /^https:\\/\\//i.test(redirect) ? redirect : "" };
}
$("fillFromUrl").addEventListener("click", () => {
  clearBad();
  const r = parseAuthUrl($("authUrl").value), got = [];
  if (r.clientId){ $("clientId").value = r.clientId; got.push("Client ID"); }
  if (r.tenant){ $("tenantId").value = r.tenant; got.push("Tenant"); }
  if (r.scope){ $("scope").value = r.scope; got.push("Scope"); }
  if (r.redirect){ $("redirectUri").value = r.redirect; got.push("Redirect"); }
  if (!got.length){ msg("No client_id, tenant or scope found in that URL.", true); markBad("authUrl"); return; }
  const missing = ["Client ID", "Tenant", "Scope"].filter(x => !got.includes(x));
  $("authUrl").value = "";
  setDirty(true);
  msg("Filled " + got.join(", ") + (missing.length ? " \u2014 still need " + missing.join(", ") : "") + ". Save to keep.", !!missing.length);
});
function renderSignIn(){
  const a = S.authState || {}, st = $("signInStatus"), btn = $("signInBtn");
  const usable = !S.isNew && S.draft.authType === "entra";
  btn.disabled = !usable;
  if (!usable){ st.textContent = "Save as Entra first."; st.className = "status muted"; }
  else if (a.state === "ok"){ st.textContent = "Signed in as " + a.account; st.className = "status ok"; }
  else { st.textContent = "Not signed in"; st.className = "status warn"; }
}
$("signInBtn").addEventListener("click", () => {
  if (dirty){ msg("Save first \u2014 sign-in uses the saved Client ID, Tenant and Scope.", true); return; }
  clearBad(); msg("Waiting for Microsoft sign-in\u2026");
  vscode.postMessage({ type:"signIn" });
});
$("applyAllBtn").addEventListener("click", () => vscode.postMessage({ type:"applyAccessAll", level: accessLevel() }));

function render(){
  const d = S.draft;
  renderProfileSel();
  $("activeTag").hidden = !S.isActive;
  $("name").value = d.name || ""; $("serverUrl").value = d.serverUrl || ""; $("username").value = d.username || "";
  $("autoPush").checked = !!d.autoPush; $("autoClean").checked = !!d.autoClean;
  document.querySelectorAll('input[name=authType]').forEach(r => r.checked = r.value === d.authType);
  $("clientId").value = d.clientId || ""; $("tenantId").value = d.tenantId || ""; $("scope").value = d.scope || "";
  $("redirectUri").value = d.redirectUri || "";
  renderAccess(d.claudeAccess || "off"); $("applyAllNote").textContent = "";
  $("bridgeFile").textContent = S.bridge.file;
  $("reqDir").textContent = S.bridge.requestDir || "(set after the first save, once a storage location exists)";
  known = (d.companies || []).slice(); checked = new Set(known);
  $("seed").value = known[0] || "";
  renderCompanies(); renderAuth(); renderSignIn(); secretStatus("password"); secretStatus("apiKey");
  setDirty(false);
}

window.addEventListener("message", e => {
  const m = e.data;
  if (m.type === "state"){ S = m; render(); msg(""); }
  else if (m.type === "pending"){ S.pending = m.pending; secretStatus("password"); secretStatus("apiKey"); setDirty(true); msg(""); }
  else if (m.type === "companies"){ addCompanies(m.companies, checked.size === 0); setDirty(true); msg("Fetched " + m.companies.length + " companies \u2014 check the ones to keep."); }
  else if (m.type === "busy"){ msg(m.text); }
  else if (m.type === "saved"){ msg("Saved."); }
  else if (m.type === "switchCancelled"){ renderProfileSel(); }
  else if (m.type === "authState"){ S.authState = m.authState; renderSignIn(); msg(""); }
  else if (m.type === "accessApplied"){
    $("applyAllNote").textContent = 'Applied "' + m.level + '" to ' + m.count + ' profiles.';
    S.draft.claudeAccess = m.level; msg("");
  }
  else if (m.type === "error"){ msg(m.message, true); markBad(m.field); }
});
vscode.postMessage({ type:"ready" });
</script></body></html>`}sl.exports={ProfilePanel:Mi}});var pl=de((Pg,ul)=>{"use strict";var cl=[["Layout","layout"],["Events","events"],["DataViews","dataviews"],["Pages","pages"],["Rules","rules"],["ToolBar","tools"],["Orphans","orphans"]],ll=t=>/^dashboard$/i.test(t||""),fh={layout:["layout","pages"],events:["events"],rules:["rules"]};function dl(t,e){for(let n of e||[]){if(!n||!n.Id||!n.Property||!n.Name)continue;let r=String(n.Property).split("."),o=i=>{if(Array.isArray(i)){i.forEach(o);return}if(!(!i||typeof i!="object")){if(i.guid===n.Id||i.id===n.Id){let s=i;for(let c of r.slice(0,-1))s=s&&s[c];let a=r[r.length-1];s&&typeof s=="object"&&s[a]===n.Value&&(s[a]=n.Name)}for(let s of Object.values(i))s&&typeof s=="object"&&o(s)}};for(let i of fh[String(n.Type||"").toLowerCase()]||[])o(t[i])}return t}function mh(t,{app:e,layer:n,subType:r,serverChangedOn:o}){if(!t||!t.Layout)throw new Error(`GetApp returned no Layout for ${e} / ${n}`);let i=r||t.Layout.viewType||"",s={};for(let[a,c]of cl)s[c]=t[a]??(c==="layout"?{}:[]);return ll(i)||(s.events=s.events.filter(a=>a&&a.mode)),dl(s,t.PatchInfo),{app:e,layer:n,subType:i,pulledAt:new Date().toISOString(),serverChangedOn:o||null,content:s}}function hh(t,e){let n=t&&t.content;if(!n||!n.layout)throw new Error("Layer file has no content.layout");if(!e)throw new Error(`Layer ${t.layer} not found on the server`);let r=t.subType||n.layout.viewType||"Dashboard",o=JSON.parse(JSON.stringify(n.layout));if(ll(r))for(let i of o.components||[])i&&typeof i=="object"&&!i.layoutData&&(i.layoutData={flexLayout:!0,hostId:o.name});return{id:t.app,viewType:r,layout:o,pages:n.pages||[],orphans:n.orphans||[],tools:n.tools||[],commentText:"",deviceType:"Desktop",rules:n.rules||[],events:n.events||[],dataviews:n.dataviews||[],serializedEvents:null,applicationType:"view",subApplicationType:r,uxAppVersion:0,layerInfo:{...e,WIP:!0,HasDraftContent:!0,Content:null}}}function gh(t,e){return(t||[]).find(n=>n&&(n.LayerName===e||n.LayerDescription===e))||null}ul.exports={FIELD_MAP:cl,toLayerFile:mh,toSaveRequest:hh,findLayerRow:gh,restorePatchTokens:dl}});var gl=de((Mg,hl)=>{"use strict";var Ft=require("vscode"),De=require("fs"),$e=require("path"),{EpicorClient:wo}=Dr(),On=Gt(),ft=Vt(),{directiveToCanonicalText:bh}=zt(),{compareFunctionsData:yh,compareBpmData:wh}=Ii(),{getCorpus:vh,search:Eh}=Bi(),{KineticMetaFXClient:xh}=so(),Ri=pl(),_n=Po(),ot=jn(),vo=500,fl=/^[A-Za-z0-9_\-. ]+$/,Ui=/^[^\s"\\]+$/;function Ue(t,e,{optional:n=!1}={}){let r=t[e];if(r==null||r===""){if(n)return;throw new Error(`Missing argument "${e}"`)}if(typeof r!="string")throw new Error(`Argument "${e}" must be a string`);return r.trim()}function Ae(t,e){let n=Ue(t,e);if(!Ui.test(n))throw new Error(`"${e}" cannot contain spaces, quotes or backslashes`);return n}function Dh(){return new Date().toISOString().replace(/[:.]/g,"-")}function ml(t,e=["Thumbnail","SysRevID","SysRowID","BitFlag","RowMod"]){let n={};for(let[r,o]of Object.entries(t||{}))e.includes(r)||(n[r]=o);return n}function Ch(t){let e=()=>t.getClient(),n=()=>t.getBpmClient();function r(){let f=t.profileRootNoPrompt(t.getActiveProfileName());if(!f)throw new Error("EFx storage location is not set in VS Code (EFx: Change Storage Location).");return f}let o=()=>$e.join(r(),"Libraries"),i=new Map;function s(f,...y){i.has(f.id)||i.set(f.id,$e.join(r(),"_backup",Dh()));let w=$e.join(i.get(f.id),...y);return De.mkdirSync($e.dirname(w),{recursive:!0}),w}function a(f){let y=t.normalizeFsPath(f);return Ft.workspace.textDocuments.find(w=>w.uri&&t.normalizeFsPath(w.uri.fsPath)===y)}function c(f){let y=a(f);if(!y||!y.isDirty)return!1;let w="";try{w=De.readFileSync(f,"utf-8")}catch{return!0}let D=F=>ft.normalizeCode(t.stripGeneratedHeaderInfo(F).content);return D(y.getText())!==D(w)}let l="Open in VS Code with unsaved changes that differ from the file on disk \u2014 save or revert it first (pushing would overwrite one of the two).";async function u(f){let y=await e().getLibrary(f),w=y&&y.EfxLibrary&&y.EfxLibrary[0];if(!w)throw new Error(`Library ${f} not found on server`);return{ts:y,row:w}}function m(f,y){let w=new Error(`${f.join(", ")} ${f.length>1?"are":"is"} promoted to production. `+(y.level==="risky"?"Ask the user whether to demote for this change. If yes, call again with allowDemote: true \u2014 it's demoted, changed, and re-promoted right after (callers of the library fail for those few seconds).":`Changing it means demoting, which needs Claude access "risky" on profile "${y.profile.name}" (it is "${y.level}").`));return w.needsDemote=f,w}async function g(f,y,w,D){let{ts:F,row:O}=await u(f);if(!O.Published){if(O.Frozen)throw new Error(`${f} is locked/frozen in Epicor (not promoted). Unfreeze it first.`);return{value:await D(F),demoted:!1}}if(!w||y.level!=="risky")throw m([f],y);await e().demoteFromProduction(f);let q={demoted:!0,repromoted:!1},M=null;try{let j=await u(f);q.value=await D(j.ts)}catch(j){M=j}try{await e().promoteToProduction(f),q.repromoted=!0}catch(j){q.repromoteError=`FAILED to re-promote ${f}: ${j.message} \u2014 it is still demoted, promote it manually.`}if(t.treeProvider().invalidateCache(f),M)throw M.message+=q.repromoted?` (${f} was re-promoted)`:` (${q.repromoteError})`,M;return q}function E(f,y,w){return y.demoted?{...f,ok:f.ok!==!1&&y.repromoted,demoted:[w],repromoted:y.repromoted?[w]:[],...y.repromoteError?{warning:y.repromoteError}:{},summary:`${f.summary} (demoted + ${y.repromoted?"re-promoted":"NOT re-promoted"} ${w})`}:f}function C(f,y){let w=(f.EfxFunctionSignature||[]).filter(D=>D.FunctionID===y).sort((D,F)=>(D.Order||0)-(F.Order||0)).map(D=>({name:D.ArgumentName,type:D.DataType,optional:!!D.Optional,default:D.DefaultValue||"",direction:D.Response?"out":"in"}));return{inputs:w.filter(D=>D.direction==="in"),outputs:w.filter(D=>D.direction==="out")}}function A(f){let y=ft.describeBody(f.Body);return y.unparsedFlow?{kind:"unreadable widget body"}:y.kind==="flow"?y.flow.onlyCustomCode?{kind:"widget flow (single custom-code widget)",code:y.flow.codeNodes[0].code,usings:y.usings}:{kind:ft.bodyKindLabel(y),flow:bh(y.xaml)||y.xaml}:{kind:"code",code:y.code,usings:y.usings}}function N(f,y){return typeof f=="object"&&f!==null?{line:f.Line!=null?f.Line+y:null,column:f.Column??null,severity:f.Severity??2,message:[f.Code,f.Message].filter(Boolean).join(": ")||String(f)}:{line:null,column:null,severity:2,message:String(f)}}function B(f,y){t.efxDiagnostics.set(Ft.Uri.file(f),y.map(w=>{let D=Math.max(0,(w.line??1)-1),F=Math.max(0,(w.column??1)-1);return new Ft.Diagnostic(new Ft.Range(D,F,D,F+1),w.message,w.severity===1?Ft.DiagnosticSeverity.Warning:Ft.DiagnosticSeverity.Error)}))}function v(f,y){return{directiveId:f.DirectiveID,source:y,method:f.BpMethodCode,type:On.directiveTypeLabel(y,f.DirectiveType),name:f.Name,enabled:!!f.IsEnabled,group:f.DirectiveGroup||"",order:f.Order,hasCode:On.extractBpmCode(f.Body).hasCustomCode}}function x(f){let y=String(f.source||"BO").toUpperCase();if(!On.BPM_SOURCES.includes(y))throw new Error(`source must be one of ${On.BPM_SOURCES.join(", ")}`);return y}function k(f,y){let w=r(),D=$e.resolve(w,f);if(!y.some(O=>D.startsWith($e.join(w,O)+$e.sep)))throw new Error(`Path must be inside ${y.join(" or ")} under the profile folder`);return D}async function L(f,y){let w=t.getProfiles().find(O=>O.name===f);if(!w)throw new Error(`Profile "${f}" not found`);let D=await ot.preflight(w);if(D)throw new Error(D);let F=y||(w.companies||[])[0];if(!(w.companies||[]).includes(F))throw new Error(`Company "${F}" is not in profile "${f}"`);return new wo(ot.clientConfig(w,F))}async function h(f){return Ft.window.showInputBox({prompt:f,password:!0,ignoreFocusOut:!0})}let d={};d.status={level:"read",needsClient:!1,async run(f,y){let w=y.profile,D=await ot.getAuthState(w);return{activeProfile:w.name,activeCompany:t.getActiveCompany(),companies:w.companies||[],serverUrl:w.serverUrl,connected:!!e(),authType:ot.authTypeOf(w),authState:D.state,...D.account?{signedInAs:D.account}:{},...D.state==="login-required"?{hint:"Ask the user to run EFx: Sign In in VS Code. Claude can't sign in."}:{},claudeAccess:y.level,profileFolder:t.profileRootNoPrompt(w.name)}}},d.list_libraries={level:"read",async run(){let f=await e().getLibraryList();return{count:f.length,libraries:f.map(y=>ml(y))}}},d.get_library={level:"read",async run(f){let y=Ae(f,"library"),{ts:w,row:D}=await u(y),F=(w.EfxFunction||[]).map(O=>{let q={function:O.FunctionID,description:O.Description||"",implementation:ft.bodyKindLabel(ft.describeBody(O.Body)),private:!!O.Private,disabled:!!O.Disabled,invalid:!!O.Invalid,requireTransaction:!!O.RequireTransaction,singleRowMode:!!O.SingleRowMode,...C(w,O.FunctionID)};return f.includeCode&&Object.assign(q,A(O)),q});return{library:ml(D),functions:F,references:{tables:(w.EfxRefTable||[]).map(O=>({table:O.TableID,updatable:!!O.Updatable})),services:(w.EfxRefService||[]).map(O=>O.ServiceID),assemblies:(w.EfxRefAssembly||[]).map(O=>O.Assembly),libraries:(w.EfxRefLibrary||[]).map(O=>({library:O.LibraryRef,mode:O.Mode}))}}}},d.get_function={level:"read",async run(f){let y=Ae(f,"library"),w=Ae(f,"function"),{ts:D}=await u(y),F=(D.EfxFunction||[]).find(O=>O.FunctionID===w);if(!F)throw new Error(`Function ${w} not found in ${y}`);return{library:y,function:w,description:F.Description||"",...C(D,w),...A(F),localFile:$e.join(o(),y,`${w}.cs`)}}},d.search_functions={level:"read",async run(f){let y=Ue(f,"query"),w=await vh(e(),!!f.refresh),D=Eh(w,y,{regex:!!f.regex,caseSensitive:!!f.caseSensitive,word:!!f.word},f.library||null);return{total:D.total,shown:D.hits.length,indexedAt:new Date(w.loadedAt).toISOString(),hits:D.hits.map(F=>({library:F.fn.libraryId,function:F.fn.functionId,kind:F.kind,line:F.line,text:F.line>0?String(F.fn.lines[F.line-1]).trim().slice(0,240):F.fn.functionId}))}}},d.pull={level:"read",async run(f){let y=o(),w=f.overwrite?"overwrite":"keep",D,F,O;if(f.all){let M=await t.collectAllLibraryFiles();({files:D,skipped:F}=M),O=`all ${M.libCount} libraries`}else{let M=Ae(f,"library");t.treeProvider().invalidateCache(M);let j=await e().getLibrary(M);if(!j||!j.EfxLibrary||!j.EfxLibrary[0])throw new Error(`Library ${M} not found on server`);t.pulledTablesets.set(M,j);let W=t.buildLibraryFiles(M,j,new Date().toISOString());if(D=W.files,F=W.skipped,Array.isArray(f.functions)&&f.functions.length){let G=new Set(f.functions),oe=new Set(D.map(te=>te.functionId));D=D.filter(te=>G.has(te.functionId));for(let te of G)oe.has(te)||F.push(`${M}.${te} (not found on server)`)}O=M}let q=await t.writePulledFiles(y,D,F,w);return{folder:y,written:q.written.map(M=>({library:M.libraryId,function:M.functionId,file:$e.join(y,M.libraryId,M.file),pushable:M.pushable})),skipped:q.skipped,summary:`pulled ${q.written.length} function(s) from ${O}${q.skipped.length?`, skipped ${q.skipped.length}`:""}`}}},d.list_bpm={level:"read",async run(f){let y=x(f),w=String(f.filter||"").toLowerCase(),D=n(),F=[];if(y==="BO"){let q=await D.getBpmServices(),M=W=>`${W.SystemCode}.${W.ServiceKind}.${W.ServiceName}`,j;if(f.service){if(j=q.filter(W=>M(W).toLowerCase()===String(f.service).toLowerCase()),!j.length)throw new Error(`Service "${f.service}" has no method directives (format: Erp.BO.SalesOrder)`)}else if(w)j=q.filter(W=>M(W).toLowerCase().includes(w)).slice(0,10);else return{source:y,services:q.map(M).sort(),note:"Pass service (e.g. Erp.BO.SalesOrder) or filter to list directives."};for(let W of j){let G=await D.getBpmMethodsByService(W.SystemCode,W.ServiceKind,W.ServiceName,"BO");F.push(...G.directives)}!f.service&&w||w&&(F=F.filter(W=>`${W.BpMethodCode} ${W.Name}`.toLowerCase().includes(w)))}else F=(await D.getBpmRowsBySource(y)).directives.filter(M=>!w||`${M.BpMethodCode} ${M.Name}`.toLowerCase().includes(w));let O=F.map(q=>v(q,y)).sort((q,M)=>q.method.localeCompare(M.method)||String(q.type).localeCompare(String(M.type))||(q.order||0)-(M.order||0));return{source:y,total:O.length,directives:O.slice(0,vo),truncated:O.length>vo}}},d.pull_directive={level:"read",async run(f){let y=x(f),w=Ue(f,"method"),D=Ue(f,"directiveId"),F=await n().getBpmMethod(y,w),O=(F&&F.BpDirective||[]).find(te=>te.DirectiveID===D);if(!O)throw new Error(`Directive ${D} not found on ${y} ${w}`);O.Source=y;let{code:q,hasCustomCode:M}=On.extractBpmCode(O.Body);if(!M)throw new Error(`"${O.Name}" has no custom C# code \u2014 it uses widget actions only`);let j=r(),W=On.directiveTypeLabel(y,O.DirectiveType),G=$e.join(j,"BPM",t.bpmMethodDirName(w),`${W}_${O.Name.replace(/[^a-zA-Z0-9_\-. ]/g,"_")}.cs`);if(c(G))throw new Error(l);if(De.existsSync(G)&&!f.overwrite&&ft.normalizeCode(t.stripGeneratedHeaderInfo(De.readFileSync(G,"utf-8")).content)!==ft.normalizeCode(q))return{ok:!1,file:G,summary:"local file differs from Epicor (unpushed edits?) \u2014 pass overwrite: true to replace it"};let{filePath:oe}=await t.writeDirectiveFile(O,q,j);return{file:oe,relative:$e.relative(j,oe),directive:v(O,y),summary:`pulled ${W} "${O.Name}"`}}},d.compare={level:"read",async run(f,y){let w=Ue(f,"profileA"),D=Ue(f,"profileB");for(let W of[w,D]){let G=t.getProfiles().find(oe=>oe.name===W);if(!G)throw new Error(`Profile "${W}" not found`);if(!y.atLeast(y.levelOf(G),"read")||y.levelOf(G)==="off")throw new Error(`Claude access for profile "${W}" is off \u2014 compare needs at least read on both profiles.`)}let[F,O]=await Promise.all([L(w,f.companyA),L(D,f.companyB)]),q=f.kind||"functions";if(q==="bpm"){let{bpmData:W}=await wh(F,O,w,D),G=[];for(let oe of W.services)for(let te of oe.methods)for(let Oe of te.dirs){if(Oe.status==="match")continue;let Z=Oe.a||Oe.b;G.push({source:oe.source,service:`${oe.systemCode}.${oe.businessObject}`,method:te.methodCode,name:Z.Name,type:Oe.typeLabel,status:Oe.status,changed:Oe.fields?Object.keys(Oe.fields).filter(Se=>Oe.fields[Se]&&Oe.fields[Se].same===!1):[]})}return{kind:q,counts:W.counts,total:W.total,warnings:W.warnings||[],differences:G.slice(0,vo),truncated:G.length>vo}}let M=await yh(F,O,w,D),j=M.libraries.filter(W=>W.status!=="match"&&(!f.library||W.libID===f.library)).map(W=>({library:W.libID,status:W.status,libraryChanges:Object.keys(W.libDiff||{}).filter(G=>G!=="hasDiff"&&W.libDiff[G]&&W.libDiff[G].same===!1&&!W.libDiff[G].infoOnly),functions:W.fnDiffs.filter(G=>G.status!=="match").map(G=>{let oe={function:G.fnID,status:G.status,changed:G.fields?Object.keys(G.fields).filter(te=>te!=="hasDiff"&&G.fields[te].same===!1):[]};return f.library&&f.includeCode&&(oe.codeA=G.fa?G.fa._code:null,oe.codeB=G.fb?G.fb._code:null),oe})}));return{kind:"functions",profileA:w,profileB:D,counts:M.meta.counts,total:M.meta.total,differences:j}}},d.push_functions={level:"write",async run(f,y){let w=Array.isArray(f.functions)?f.functions:[];if(!w.length)throw new Error('"functions" must be a non-empty array of { library, function }');let D=[],F=[],O=new Map;for(let Z of w){let Se=String(Z.library||""),_e=String(Z.function||"");if(!Ui.test(Se)||!Ui.test(_e)){D.push({ok:!1,libraryId:Se,functionId:_e,message:"Invalid library/function name",errors:["Invalid library/function name"],diagnostics:[]});continue}O.has(Se)||O.set(Se,[]),O.get(Se).includes(_e)||O.get(Se).push(_e)}let q=(Z,Se,_e,et={})=>D.push({ok:!1,libraryId:Z,functionId:Se,message:_e,errors:[_e],diagnostics:[],...et}),M=(Z,Se)=>({libraryId:Z,func:{FunctionID:Se}}),j=[];for(let Z of O.keys())try{(await u(Z)).row.Published&&j.push(Z)}catch{}if(j.length&&(!f.allowDemote||y.level!=="risky"))throw m(j,y);let W=[],G=[],oe=async(Z,Se,_e)=>{let et=[],Un=[];for(let be of Se){let gt=$e.join(o(),Z,`${be}.cs`);if(!De.existsSync(gt)){q(Z,be,`Local file not found: ${gt} \u2014 pull it first`);continue}if(c(gt)){q(Z,be,l);continue}let he=(_e.EfxFunction||[]).find(it=>it.FunctionID===be);if(!he){q(Z,be,`Function ${be} not found on server`);continue}let xe=ft.describeBody(he.Body);if(xe.unparsedFlow){q(Z,be,"Widget body this extension can't read \u2014 refusing to overwrite it");continue}xe.kind==="flow"?De.writeFileSync(s(y,Z,`${be}.body`),String(he.Body||""),"utf-8"):De.writeFileSync(s(y,Z,`${be}.cs`),wo.extractCode(he.Body).code||"","utf-8"),(xe.kind==="flow"?Un:et).push({functionId:be,filePath:gt,fnRow:he})}let Io=async be=>D.push(await t.pushFunctionCommand(M(Z,be.functionId)));if(et.length===1)await Io(et[0]);else if(et.length>1){let be=et.map(he=>{let xe=t.stripGeneratedHeaderInfo(De.readFileSync(he.filePath,"utf-8"));return{...he,code:xe.content,headerOffset:xe.lineOffset,usings:wo.extractCode(he.fnRow.Body).usings}}),gt;try{gt=await e().applyFunctionsViaWrapper(Z,be.map(he=>({functionId:he.functionId,code:he.code,usings:he.usings})),_e)}catch(he){for(let xe of be)q(Z,xe.functionId,`Batch save failed: ${he.message}`);return}if(gt.oldWrapper){F.push(`${Z}: server has the old single-function Utilities wrapper \u2014 pushed one at a time.`);for(let he of be)await Io(he)}else if(gt.saved){let he=await e().getLibrary(Z);for(let xe of be){let it=(he.EfxFunction||[]).find(xr=>xr.FunctionID===xe.functionId),Er=it?wo.extractCode(it.Body).code:null;if(Er===null||ft.normalizeCode(Er)!==ft.normalizeCode(xe.code))q(Z,xe.functionId,"Verification failed: wrapper reported success but server code does not match the file");else{t.efxDiagnostics.set(Ft.Uri.file(xe.filePath),[]);let xr=t.pulledTablesets.get(Z),Qi=xr&&(xr.EfxFunction||[]).find(Ml=>Ml.FunctionID===xe.functionId);Qi&&it&&(Qi.Body=it.Body),D.push({ok:!0,libraryId:Z,functionId:xe.functionId,message:`Verified save of ${Z}.${xe.functionId} (batch of ${be.length})`,errors:[],diagnostics:[]})}}t.treeProvider().invalidateCache(Z),t.clearSearchCache()}else for(let he of be){let xe=gt.perFunction[he.functionId]||{errors:[],diagnostics:[]},it=(xe.diagnostics||[]).map(Er=>N(Er,he.headerOffset));it.length&&B(he.filePath,it),D.push({ok:!1,libraryId:Z,functionId:he.functionId,message:xe.errors&&xe.errors.length?`Compile failed \u2014 nothing in this batch of ${be.length} was saved`:`Batch of ${be.length} failed because another function in it has errors \u2014 nothing was saved`,errors:xe.errors||[],diagnostics:it})}}for(let be of Un)await Io(be)};for(let[Z,Se]of O)try{let _e=await g(Z,y,!!f.allowDemote,et=>oe(Z,Se,et));_e.demoted&&W.push(Z),_e.repromoted&&G.push(Z),_e.repromoteError&&F.push(_e.repromoteError)}catch(_e){for(let et of Se)D.some(Un=>Un.libraryId===Z&&Un.functionId===et)||q(Z,et,_e.message)}let te=D.filter(Z=>Z.ok).length,Oe=W.filter(Z=>!G.includes(Z));return{ok:te===D.length&&Oe.length===0,results:D,demoted:W,repromoted:G,notes:F,backupFolder:i.get(y.id)||null,summary:`pushed ${te} of ${D.length} function(s)${te<D.length?` (${D.length-te} failed)`:""}`+(W.length?`; demoted + ${Oe.length?`re-promoted ${G.join(", ")||"none"}, NOT re-promoted ${Oe.join(", ")}`:`re-promoted ${W.join(", ")}`}`:"")}}},d.push_directives={level:"write",async run(f,y){let w=Array.isArray(f.files)?f.files:[];if(!w.length)throw new Error('"files" must be a non-empty array of paths relative to the profile folder (as returned by pull_directive)');let D=[];for(let O of w){let q={file:O,ok:!1};try{let M=k(String(O),["BPM",$e.join("Widgets","BPM")]);if(!De.existsSync(M))throw new Error("File not found \u2014 pull the directive first");if(c(M))throw new Error(l);let j=await t.resolveMapping(M);if(!j||!j.isBpm)throw new Error("Not a pulled BPM directive file");let W=j.source||"BO",G=await n().getBpmMethod(W,j.bpmMethodCode),oe=(G&&G.BpDirective||[]).find(te=>te.DirectiveID===j.directiveId);if(!oe)throw new Error(`Directive ${j.directiveId} not found on ${j.bpmMethodCode}`);if(De.writeFileSync(s(y,"BPM",t.bpmMethodDirName(j.bpmMethodCode),`${j.directiveId}.body.xml`),String(oe.Body||""),"utf-8"),j.isWidgetCode){let te=await t.pushWidgetCodeFile(M,j);if(!te||!te.ok)throw new Error(te&&te.message||"Widget push failed")}else await t.corePushDirective(M,j);if(W==="BO"){let te=j.bpmMethodCode.split(".");te.length>=3&&t.bpmTreeProvider().invalidateService(te[0].toUpperCase(),te[1],te[2])}else t.bpmTreeProvider().invalidateSource(W);q.ok=!0,q.message=`Pushed ${oe.Name} (${W} ${j.bpmMethodCode})`}catch(M){q.message=M.message}D.push(q)}let F=D.filter(O=>O.ok).length;return{ok:F===D.length,results:D,backupFolder:i.get(y.id)||null,summary:`pushed ${F} of ${D.length} directive(s)`}}},d.new_function={level:"write",async run(f,y){let w=Ae(f,"library"),D=Ae(f,"function"),F=b(f.signatures),O=await g(w,y,!!f.allowDemote,async M=>{if((M.EfxFunction||[]).some(j=>j.FunctionID===D))throw new Error(`${w}.${D} already exists`);return t.coreCreateFunction(w,D,f.description||"",F)}),q=O.value;return E({ok:q.signaturesSaved,diagnostics:q.diagnostics,signaturesSaved:q.signaturesSaved,signatureError:q.signatureError,summary:`created ${w}.${D}${q.signaturesSaved?"":" (signatures failed)"}`},O,w)}};function b(f){if(f===void 0)return[];if(!Array.isArray(f))throw new Error('"signatures" must be an array');let y=0,w=0;return f.map(D=>{if(!D||!D.name||!D.type)throw new Error("Each signature needs name and type");let F=D.direction==="out";return{ArgumentName:String(D.name),DataType:String(D.type),Response:F,Order:F?w++:y++,...D.optional!==void 0?{Optional:!!D.optional}:{},...D.default!==void 0?{DefaultValue:String(D.default)}:{}}})}d.delete_function={level:"write",async run(f,y){let w=Ae(f,"library"),D=Ae(f,"function"),F=await g(w,y,!!f.allowDemote,async O=>{let q=(O.EfxFunction||[]).find(M=>M.FunctionID===D);if(!q)throw new Error(`${w}.${D} not found`);De.writeFileSync(s(y,w,`${D}.body`),String(q.Body||""),"utf-8"),De.writeFileSync(s(y,w,`${D}.signatures.json`),JSON.stringify(C(O,D),null,2),"utf-8"),await t.coreDeleteFunction(w,D)});return E({backupFolder:i.get(y.id),summary:`deleted ${w}.${D}`},F,w)}},d.new_library={level:"write",async run(f){let y=Ae(f,"library");if((await e().getLibraryList()).some(F=>F.LibraryID===y))throw new Error(`Library ${y} already exists`);return{diagnostics:await t.coreCreateLibrary(y,f.description||""),summary:`created library ${y}`}}},d.add_reference={level:"write",async run(f,y){let w=Ae(f,"library"),D=Ue(f,"kind"),F=Ae(f,"value"),O=await g(w,y,!!f.allowDemote,()=>t.coreAddReference(w,D,F,{updatable:!!f.updatable,mode:f.mode}));return E({diagnostics:O.value,summary:`added ${D} reference ${F} to ${w}`},O,w)}},d.set_table_updatable={level:"write",async run(f,y){let w=Ae(f,"library"),D=Ae(f,"table");if(typeof f.updatable!="boolean")throw new Error('"updatable" must be true or false');let F=await g(w,y,!!f.allowDemote,()=>t.coreSetTableUpdatable(w,D,f.updatable));return E({summary:`${D} in ${w} set to ${f.updatable?"updatable":"read-only"}`},F,w)}},d.save_signatures={level:"write",async run(f,y){let w=Ae(f,"library"),D=Ae(f,"function"),F=b(f.signatures||[]),O=await g(w,y,!!f.allowDemote,async M=>{if(!(M.EfxFunction||[]).some(j=>j.FunctionID===D))throw new Error(`${w}.${D} not found`);De.writeFileSync(s(y,w,`${D}.signatures.json`),JSON.stringify(C(M,D),null,2),"utf-8"),await e().saveSignatures(w,D,F)});t.treeProvider().invalidateCache(w);let q=await e().getLibrary(w);return E({signatures:C(q,D),backupFolder:i.get(y.id),summary:`saved signatures for ${w}.${D}`},O,w)}},d.regenerate_library={level:"write",async run(f){let y=Ae(f,"library"),D=(await e().regenerateLibrary(y)).errors||[];return{ok:D.length===0,errors:D.length?t.formatBOUpdErrors(D).split(`

`):[],summary:D.length?`${y} has ${D.length} validation error(s)`:`${y} validated with no errors`}}},d.execute_function={level:"write",async run(f,y){let w=Ae(f,"library"),D=Ae(f,"function"),F=f.company||t.getActiveCompany();if(!(y.profile.companies||[]).includes(F))throw new Error(`Company "${F}" is not in profile "${y.profile.name}"`);let q=(await e().getLibraryList()).find(oe=>oe.LibraryID===w);if(!q)throw new Error(`Library ${w} not found`);let M=!q.Published,j=await e().executeFunction(w,D,f.params||{},F,M),W=j,G=JSON.stringify(j);return G&&G.length>2e5&&(W={truncated:!0,preview:G.slice(0,2e5)}),{company:F,staging:M,response:W,summary:`executed ${w}.${D} in ${F}`}}},d.switch_profile={level:"write",needsClient:!1,async run(f,y){let w=Ue(f,"profile"),D=t.getProfiles().find(F=>F.name===w);if(!D)throw new Error(`Profile "${w}" not found`);if(y.levelOf(D)==="off")throw new Error(`Claude access for "${w}" is off \u2014 enable it in VS Code (EFx: Manage Profiles \u2192 Edit) first.`);if(await t.activateProfile(w),t.getActiveProfileName()!==w||!e())throw new Error(`Could not activate "${w}" (no stored password?)`);return f.company&&await t.applyActiveCompany(String(f.company)),{activeProfile:w,activeCompany:t.getActiveCompany(),claudeAccess:y.levelOf(D),summary:`switched to ${w} / ${t.getActiveCompany()}`}}},d.switch_company={level:"write",async run(f,y){let w=Ue(f,"company");if(!(y.profile.companies||[]).includes(w))throw new Error(`Company "${w}" is not in profile "${y.profile.name}"`);if(await t.applyActiveCompany(w),t.getActiveCompany()!==w)throw new Error(`Could not switch to ${w}`);return{activeCompany:w,summary:`switched company to ${w}`}}};function S(f,y){if("claudeAccess"in f)throw new Error("claudeAccess can only be changed in VS Code (EFx: Manage Profiles \u2192 Edit Profile).");let w={...y};if(f.serverUrl!==void 0){if(!/^https?:\/\/\S+$/.test(String(f.serverUrl)))throw new Error("serverUrl must start with http:// or https://");w.serverUrl=String(f.serverUrl).replace(/\/+$/,"")}if(f.username!==void 0&&(w.username=String(f.username)),f.companies!==void 0){if(!Array.isArray(f.companies)||!f.companies.length)throw new Error("companies must be a non-empty array");w.companies=f.companies.map(String)}if(f.autoPush!==void 0&&(w.autoPush=!!f.autoPush),f.autoClean!==void 0&&(w.autoClean=!!f.autoClean),f.authType!==void 0){if(!["basic","entra"].includes(f.authType))throw new Error('authType must be "basic" or "entra"');w.authType=f.authType}for(let D of["clientId","tenantId","scope"])f[D]!==void 0&&(w[D]=String(f[D]).trim());if(ot.authTypeOf(w)==="entra"){let D=ot.entraFieldProblem(w);if(D)throw new Error(`Entra profile: ${D}`)}else delete w.clientId,delete w.tenantId,delete w.scope;return w}d.create_profile={level:"write",needsClient:!1,async run(f){let y=Ue(f,"name");if(!fl.test(y))throw new Error("Profile name: letters, numbers, space, dash, dot, underscore");let w=t.getProfiles();if(w.some(M=>M.name===y))throw new Error(`Profile "${y}" already exists`);let D=S(f,{name:y,serverUrl:"",username:"",companies:[],autoPush:!1,autoClean:!1,claudeAccess:"off"});if(!D.serverUrl||!D.username||!D.companies.length)throw new Error("serverUrl, username and companies are required");let F=ot.authTypeOf(D)==="entra",O=null;if(!F&&(O=await h(`Claude is creating EFx profile "${y}" (${D.serverUrl}, user ${D.username}). Enter the Epicor password \u2014 it goes to VS Code SecretStorage, never to Claude.`),!O))return{ok:!1,summary:"cancelled \u2014 no password entered, profile not created"};let q=await h(`API key for EFx profile "${y}" (leave blank for none) \u2014 it goes to VS Code SecretStorage, never to Claude.`);return O&&await t.context.secrets.store(t.profileSecretKey(y,"password"),O),await t.context.secrets.store(t.profileSecretKey(y,"apiKey"),q||""),w.push(D),await t.setProfiles(w),{profile:{...D},summary:F?`created Entra profile ${y} \u2014 the user signs in with EFx: Sign In (Claude access off until enabled in VS Code)`:`created profile ${y} (Claude access off until you enable it in VS Code)`}}},d.update_profile={level:"write",needsClient:!1,async run(f){let y=Ue(f,"name"),w=t.getProfiles(),D=w.findIndex(oe=>oe.name===y);if(D<0)throw new Error(`Profile "${y}" not found`);let F=S(f,w[D]),O=f.newName!==void 0?String(f.newName).trim():y;if(O!==y){if(!fl.test(O))throw new Error("newName: letters, numbers, space, dash, dot, underscore");if(w.some(oe=>oe.name===O))throw new Error(`Profile "${O}" already exists`);for(let oe of["password","apiKey"]){let te=await t.context.secrets.get(t.profileSecretKey(y,oe));te&&await t.context.secrets.store(t.profileSecretKey(O,oe),te),await t.context.secrets.delete(t.profileSecretKey(y,oe))}F.name=O}let q=t.profileSecretKey(F.name,"password");ot.authTypeOf(F)==="entra"&&await t.context.secrets.delete(q);let M=ot.authTypeOf(F)==="basic"&&!await t.context.secrets.get(q),j=t.getActiveProfileName()===y;w[D]=F,await t.setProfiles(w),j&&(O!==y&&await t.setActiveProfileName(O),await t.activateProfile(O));let{claudeAccess:W,...G}=F;return{profile:G,summary:`updated profile ${O}`+(M?" \u2014 Basic auth has no password stored yet; use set_profile_secret":"")}}},d.delete_profile={level:"write",needsClient:!1,async run(f){let y=Ue(f,"name");if(t.getActiveProfileName()===y)throw new Error("Can't delete the active profile \u2014 switch_profile to another one first.");let w=t.getProfiles();if(!w.some(D=>D.name===y))throw new Error(`Profile "${y}" not found`);return await t.setProfiles(w.filter(D=>D.name!==y)),await t.context.secrets.delete(t.profileSecretKey(y,"password")),await t.context.secrets.delete(t.profileSecretKey(y,"apiKey")),{summary:`deleted profile ${y}`}}},d.set_profile_secret={level:"write",needsClient:!1,async run(f){let y=Ue(f,"name"),w=f.kind==="apiKey"?"apiKey":"password",D=t.getProfiles().find(O=>O.name===y);if(!D)throw new Error(`Profile "${y}" not found`);if(w==="password"&&ot.authTypeOf(D)==="entra")throw new Error(`"${y}" uses Entra sign-in and has no password. Only kind "apiKey" can be set; the user signs in with EFx: Sign In.`);let F=await h(`Claude asked to set the ${w==="apiKey"?"API key":"password"} for EFx profile "${y}". Type it here \u2014 it never goes to Claude.`);return F===void 0||w==="password"&&!F?{ok:!1,summary:"cancelled \u2014 nothing changed"}:(await t.context.secrets.store(t.profileSecretKey(y,w),F),t.getActiveProfileName()===y&&await t.activateProfile(y),{summary:`${w} updated for ${y}`})}};let T=/^(?!\.{1,2}$)[A-Za-z0-9_.\-]+$/;function I(f,y){let w=Ue(f,y);if(!T.test(w))throw new Error(`"${y}" may only contain letters, digits, _ . -`);return w}function P(f,y,w,D,F){if(f[y]===void 0||f[y]===null)return F;let O=Number(f[y]);if(!Number.isInteger(O)||O<w||O>D)throw new Error(`"${y}" must be an integer from ${w} to ${D}`);return O}let R=(f,y)=>$e.join(r(),"KineticLayers",f,`${y}.json`),$=f=>$e.relative(r(),f);async function _(){let f=t.getActiveProfileName(),y=t.getProfiles().find(D=>D.name===f);if(!y)throw new Error(`Profile "${f}" not found`);let w=await ot.preflight(y);if(w)throw new Error(w);return ot.clientConfig(y,t.getActiveCompany())}let U=async()=>new xh(await _()),H=async(f,y,w)=>Ri.findLayerRow(await f.getLayers(y),w);d.list_layers={level:"read",async run(f){let y=I(f,"app"),w=await(await U()).getLayers(y);return{app:y,count:w.length,layers:w.map(D=>({layer:D.LayerName||D.LayerDescription,typeCode:D.TypeCode,company:D.Company,wip:!!D.WIP,hasDraft:!!D.HasDraftContent,changedOn:D.ChangedOn,lastUpdatedBy:D.LastUpdatedBy}))}}},d.get_layer={level:"read",async run(f){let y=I(f,"app"),w=I(f,"layer"),D=await U(),F=await H(D,y,w);if(!F)throw new Error(`Layer ${w} not found on ${y} \u2014 list_layers shows what exists`);let O=await D.getApplicationInfo(y).catch(()=>null),q=Ri.toLayerFile(await D.getAppForLayer(y,w),{app:y,layer:w,subType:O&&O.SubType,serverChangedOn:F.ChangedOn}),M=R(y,w),j=q.content,W={components:(j.layout.components||[]).length,events:j.events.length,dataviews:j.dataviews.length,pages:j.pages.length};if(De.existsSync(M)&&!f.overwrite){let G=JSON.parse(De.readFileSync(M,"utf-8"));if(JSON.stringify(G.content)!==JSON.stringify(j))return{summary:`kept local ${$(M)} \u2014 it differs from the server; pass overwrite to replace it`,file:$(M),kept:!0,...W}}return De.mkdirSync($e.dirname(M),{recursive:!0}),De.writeFileSync(M,JSON.stringify(q,null,2),"utf-8"),{summary:`pulled ${y} / ${w}`,file:$(M),subType:q.subType,changedOn:F.ChangedOn,...W}}},d.save_layer={level:"write",async run(f,y){let w=I(f,"app"),D=I(f,"layer"),F=R(w,D);if(!De.existsSync(F))throw new Error(`No local ${$(F)} \u2014 get_layer first`);let O=JSON.parse(De.readFileSync(F,"utf-8"));if(O.app!==w||O.layer!==D)throw new Error(`${$(F)} is for ${O.app} / ${O.layer}, not ${w} / ${D}`);let q=await U(),M=await H(q,w,D);if(!M)throw new Error(`Layer ${D} not found on ${w}`);if(!f.force&&O.serverChangedOn&&M.ChangedOn&&O.serverChangedOn!==M.ChangedOn)throw new Error(`${D} changed on the server since it was pulled (${O.serverChangedOn} \u2192 ${M.ChangedOn}). get_layer again, or pass force.`);let j=Ri.toSaveRequest(O,M),W=await q.getAppForLayer(w,D);De.writeFileSync(s(y,"KineticLayers",w,`${D}.json`),JSON.stringify(W,null,2),"utf-8"),await q.saveAppRequest(j);let G=await H(q,w,D);return O.serverChangedOn=G&&G.ChangedOn||O.serverChangedOn,De.writeFileSync(F,JSON.stringify(O,null,2),"utf-8"),{summary:`saved ${w} / ${D} as a draft`,changedOn:O.serverChangedOn}}};let J=!1;function ne(){J||(t.context.subscriptions.push({dispose:()=>{_n.closeBrowser()}}),J=!0);let f=String(t.getActiveProfileName()).replace(/[^A-Za-z0-9_.-]/g,"_");return $e.join(t.context.globalStorageUri.fsPath,"kinetic-preview",f)}d.preview_layer={level:"read",needsClient:!1,async run(f){let y=I(f,"app"),w=I(f,"layer"),D=f.site?I(f,"site"):void 0,F=P(f,"width",600,2560,1440),O=P(f,"height",400,1600,900),q=await _(),M=await _n.capturePreview({cfg:q,app:y,layer:w,company:q.company,site:D,userDataDir:ne(),outFile:$e.join(r(),"_claude","previews",`${y}__${w}.png`),width:F,height:O});return{summary:`preview of ${y} / ${w}${M.settled?"":" (page hadn't settled)"}`,...M}}};let re=/^[0-9a-f-]{36}$/i,K=new Set(["click","dblclick","type","key","scroll","reload","wait"]);return d.live_open={level:"read",needsClient:!1,async run(f){let y=I(f,"app"),w=I(f,"layer"),D=f.site?I(f,"site"):void 0,F=P(f,"width",600,2560,1280),O=P(f,"height",400,1600,760),q=await _(),M=await _n.liveOpen({cfg:q,app:y,layer:w,company:q.company,site:D,userDataDir:ne(),width:F,height:O});return{summary:`live preview of ${y} / ${w}`,app:y,layer:w,...M}}},d.live_input={level:"read",needsClient:!1,async run(f){let y=Ue(f,"viewId");if(!re.test(y))throw new Error("Bad viewId");let w=f.actions===void 0?[]:f.actions;if(!Array.isArray(w)||w.length>50||w.some(D=>!D||!K.has(D.type)))throw new Error(`actions must be an array (max 50) of ${[...K].join("/")}`);return _n.liveInput(y,w)}},d.live_close={level:"read",needsClient:!1,async run(f){let y=Ue(f,"viewId");return{closed:_n.liveClose(y)}}},d.open_preview={level:"read",needsClient:!1,async run(f){let y=I(f,"app"),w=I(f,"layer"),D=f.site?I(f,"site"):void 0,F=await _(),O=await _n.openPreviewWindow({cfg:F,app:y,layer:w,company:F.company,site:D,userDataDir:ne()});return{summary:`opened ${y} / ${w} in a preview window \u2014 reload it (Cmd+R) after save_layer`,...O}}},d.promote_library={level:"risky",async run(f){let y=Ae(f,"library");return await e().promoteToProduction(y),await t.treeProvider().refresh(),{summary:`promoted ${y}`}}},d.demote_library={level:"risky",async run(f){let y=Ae(f,"library");return await e().demoteFromProduction(y),await t.treeProvider().refresh(),{summary:`demoted ${y}`}}},d}hl.exports={buildOps:Ch}});var Ah=exports&&exports.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),Sh=exports&&exports.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),Gi=exports&&exports.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&Ah(n,e,r[o]);return Sh(n,e),n}})();Object.defineProperty(exports,"__esModule",{value:!0});exports.activate=Wh;exports.deactivate=og;var p=Gi(require("vscode")),me=Gi(require("path")),Ce=Gi(require("fs")),At=Dr(),We=jn(),kh=Ya(),Ih=Ja(),Le=Gt(),qi=oc(),{openBpmWidgetPanel:Th,createBpmHost:Nh,typeLabelOf:Bh}=dc(),{openEfxWidgetPanel:bl,createEfxHost:kl}=mc(),{pushNodeCode:Il}=oo(),Ct=Vt(),yl=vi(),$h=so(),{ComparePanel:Lh}=Ii(),{openFunctionSearch:wl,clearSearchCache:gr}=Bi(),{ClaudeBridge:Oh}=Fi(),{ProfilePanel:_h}=al(),Fh=gl(),Pn=new Map,Me=new Map,zi=new Set,V=null,pe=null,Tl=null,se,mt,Ao=null,So=null,ji=null;function ge(t){return String(t||"").toLowerCase()}function Vi(t){return JSON.stringify(String(t))}function tn(t,e,n,r){let o=0,i=!1,s=!1;for(let a=e;a<t.length;a++){let c=t[a];if(i){s?s=!1:c==="\\"?s=!0:c==='"'&&(i=!1);continue}if(c==='"'){i=!0;continue}if(c===n)o++;else if(c===r&&(o--,o===0))return a}return-1}function Ph(t,e,n){let o=t.indexOf('"EfxFunction"');if(o<0)throw new Error("EfxFunction array not found in raw tableset");let i=t.indexOf("[",o);if(i<0)throw new Error("EfxFunction array start not found in raw tableset");let s=tn(t,i,"[","]");if(s<0)throw new Error("EfxFunction array end not found in raw tableset");let a='"LibraryID":'+Vi(e),c='"FunctionID":'+Vi(n),l=i+1;for(;l<s;){let u=t.indexOf("{",l);if(u<0||u>s)break;let m=tn(t,u,"{","}");if(m<0||m>s)throw new Error("Malformed EfxFunction row object in raw tableset");let g=t.slice(u,m+1);if(g.includes(a)&&g.includes(c))return{start:u,end:m+1,row:g};l=m+1}throw new Error(`EfxFunction row not found in raw tableset for ${e}.${n}`)}function Yi(t,e,n){let r='"'+e+'":',o=t.indexOf(r);if(o<0)throw new Error(`${e} property not found in target EfxFunction row`);let i=o+r.length;for(;/\s/.test(t[i]||"");)i++;if(t[i]!=='"')throw new Error(`${e} is not a JSON string in target EfxFunction row`);let s=i+1,a=!1;for(;s<t.length;s++){let c=t[s];if(a){a=!1;continue}if(c==="\\"){a=!0;continue}if(c==='"')break}if(s>=t.length)throw new Error(`${e} string did not terminate in target EfxFunction row`);return t.slice(0,i)+n+t.slice(s+1)}function Mh(t,e,n){let r=Ph(t,e,n),o=Yi(r.row,"RowMod",JSON.stringify("D"));if(o===r.row)throw new Error(`Target EfxFunction row did not change for ${e}.${n}`);let i=t.slice(0,r.start)+o+t.slice(r.end);return JSON.parse(i),i}function Nl(t,e,n){let r=`"${e}":[`,o=t.indexOf(r);if(o===-1)throw new Error(`Array "${e}" not found in raw tableset`);let i=t.indexOf("[",o),s=tn(t,i,"[","]");if(s<0)throw new Error(`Could not find end of "${e}" array`);let c=t.substring(i+1,s).trim().length>0?",":"";return t.substring(0,s)+c+n+t.substring(s)}function Rh(t,e){let r=t.indexOf('"EfxRefTable"');if(r<0)throw new Error("EfxRefTable array not found in raw tableset");let o=t.indexOf("[",r);if(o<0)throw new Error("EfxRefTable array start not found in raw tableset");let i=tn(t,o,"[","]");if(i<0)throw new Error("EfxRefTable array end not found in raw tableset");let s='"TableID":'+Vi(e),a=o+1;for(;a<i;){let c=t.indexOf("{",a);if(c<0||c>i)break;let l=tn(t,c,"{","}");if(l<0||l>i)throw new Error("Malformed EfxRefTable row object in raw tableset");let u=t.slice(c,l+1);if(u.includes(s))return{start:c,end:l+1,row:u};a=l+1}throw new Error(`EfxRefTable row not found in raw tableset for ${e}`)}function Uh(t,e){let n=t.indexOf('"EfxLibrary":[');if(n<0)throw new Error("EfxLibrary array not found in raw tableset");let r=t.indexOf("[",n),o=t.indexOf("{",r);if(o<0)throw new Error("No EfxLibrary row found in raw tableset");let i=tn(t,o,"{","}"),s=t.slice(o,i+1),a=Yi(s,"RowMod",JSON.stringify(e));return t.slice(0,o)+a+t.slice(i+1)}function qh(t,e,n){let r='"'+e+'":',o=t.indexOf(r);if(o<0)throw new Error(`${e} not found in object`);let i=o+r.length;for(;/\s/.test(t[i]||"");)i++;let s=t.startsWith("true",i),a=t.startsWith("false",i);if(!s&&!a)throw new Error(`${e} is not a boolean in object`);let c=i+(s?4:5);return t.slice(0,i)+String(n)+t.slice(c)}function jh(t,e,n){let r=Rh(t,e),o=qh(r.row,"Updatable",n);o=Yi(o,"RowMod",JSON.stringify("U"));let i=t.slice(0,r.start)+o+t.slice(r.end);return i=Uh(i,"U"),JSON.parse(i),i}function Bl(t){return(t||[]).some(e=>typeof e=="object"?(e.Severity??2)>=2:/\berror\b/i.test(String(e)))}function br(t){return(t||[]).map(e=>typeof e=="object"?e.ErrorText||e.Message||JSON.stringify(e):String(e))}async function vl(t,e,n,r=[]){let o=await V.getLibraryRaw(t),i=JSON.stringify({Code:`// New function\r
`,Usings:""}),s=JSON.stringify({LibraryID:t,FunctionID:e,Description:n||null,Kind:2,RequireTransaction:!1,SingleRowMode:!1,Private:!1,Disabled:!1,Invalid:!1,Thumbnail:null,Body:i,Notes:null,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",BitFlag:0,RowMod:"A"});o=Nl(o,"EfxFunction",s);let a=await V.applyChangesRaw(o),c=br(a.diagnostics),l=r.length===0,u=null;if(r.length>0)for(let m=0;m<4&&!l;m++){m>0&&await new Promise(g=>setTimeout(g,800*m));try{await V.saveSignatures(t,e,r),l=!0}catch(g){u=g.message}}return se.invalidateCache(t),await se.refresh(),{diagnostics:c,signaturesSaved:l,signatureError:u}}async function El(t,e){let n=await V.getLibrary(t),r=n&&n.EfxLibrary&&n.EfxLibrary[0];if(!r)throw new Error(`Library ${t} not found on server`);if(r.Frozen===!0)throw new Error(r.Published?`${t} is promoted to production \u2014 demote it first (right-click the library \u2192 Demote from Production).`:`${t} is locked/frozen in Epicor. Unfreeze it before deleting functions.`);let o=await V.getLibraryRaw(t),i=Mh(o,t,e),s=await V.applyChangesRaw(i);if(Bl(s.diagnostics))throw new Error(`Server rejected delete:
${br(s.diagnostics).join(`
`)}`);Pn.delete(t);for(let[a,c]of Me.entries())c&&c.libraryId===t&&c.functionId===e&&Me.delete(a);se.invalidateCache(t),await se.refresh()}async function xl(t,e){if(!/^[^\s"\\]+$/.test(String(t||"")))throw new Error("Library ID cannot be empty or contain spaces, quotes or backslashes");let n=await V.getDefaultsRaw();n=n.replace(/"LibraryID":"@library"/g,`"LibraryID":"${t}"`),n=n.replace(/"OriginalID":"@library"/,`"OriginalID":"${t}"`),n=n.replace(/"FunctionID":"@function"/,'"FunctionID":"__placeholder__"'),e&&(n=n.replace(/"Description":null/,()=>`"Description":${JSON.stringify(String(e))}`)),n=n.replace(/("OriginalID":"[^"]*"[^}]*"RowMod":")(")/,"$1A$2"),n=n.replace('"AllowCustomCodeFunctions":false','"AllowCustomCodeFunctions":true'),n=n.replace('"DirectDBAccess":0','"DirectDBAccess":2');let r=n.indexOf('"EfxFunction":[');if(r!==-1){let i=n.indexOf("[",r),s=tn(n,i,"[","]");s>i&&(n=n.substring(0,i)+"[]"+n.substring(s+1))}let o=await V.applyChangesRaw(n);return await se.refresh(),br(o.diagnostics)}async function hr(t,e,n,r={}){let o={LibraryID:t},i,s;if(e==="table"){if(!String(n).includes("."))throw new Error("Table ID format must be NAMESPACE.TableName (e.g. ERP.Part)");i="EfxRefTable",s={...o,TableID:n,Updatable:!!r.updatable}}else if(e==="service"){if(String(n).split(":").length<3)throw new Error("Service ID format must be NAMESPACE:TYPE:Name (e.g. ERP:BO:Part)");i="EfxRefService",s={...o,ServiceID:n}}else if(e==="assembly"){if(!String(n).toLowerCase().endsWith(".dll"))throw new Error("Assembly must end in .dll");i="EfxRefAssembly",s={...o,Assembly:n}}else if(e==="library")i="EfxRefLibrary",s={...o,LibraryRef:n,Mode:Number.isInteger(r.mode)?r.mode:0};else throw new Error(`Unknown reference kind "${e}"`);let a=await V.getLibraryRaw(t),c=JSON.stringify({...s,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",RowMod:"A"});a=Nl(a,i,c);let l=await V.applyChangesRaw(a);return se.invalidateCache(t),se._onDidChangeTreeData.fire(void 0),br(l.diagnostics)}async function Dl(t,e,n){let r=await V.getLibraryRaw(t),o=jh(r,e,n),i=await V.applyChangesRaw(o);if(Bl(i.diagnostics))throw new Error(`Server rejected update:
${br(i.diagnostics).join(`
`)}`);se.invalidateCache(t),se._onDidChangeTreeData.fire(void 0)}async function Cl(t){let e=ge(t),n=p.workspace.textDocuments.find(r=>r.uri&&ge(r.uri.fsPath)===e);if(n&&n.isDirty){zi.add(e);try{if(!await n.save())throw new Error(`Could not save ${t}`)}finally{zi.delete(e)}}}function Al(t){return t===1?p.DiagnosticSeverity.Warning:t===0?p.DiagnosticSeverity.Hint:p.DiagnosticSeverity.Error}function Hh(t){return Mn(t).content}function Mn(t){let e=t.split(/\r?\n/);if(!/^\/\/ (EFx Function|BPM Directive):/.test(e[0]||""))return{content:t,lineOffset:0};let n=u=>u.startsWith("// \u2500\u2500\u2500\u2500\u2500")||u.startsWith("// -----"),r=-1;for(let u=0;u<e.length;u++){if(n(e[u])){r=u;break}if(!e[u].startsWith("//")&&e[u].trim()!=="")break}if(r<0)return{content:t,lineOffset:0};let o=e[r],i=o.indexOf("// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),s=o.indexOf("// --------------------------------------------------"),a="";i>=0?a=o.slice(i+40).trimStart():s>=0&&(a=o.slice(s+53).trimStart());let c=e.slice(r+1);if(a)return{content:[a,...c].join(`
`),lineOffset:r};let l=0;for(;l<c.length&&c[l].trim()==="";)l++;return c=c.slice(l),{content:c.join(`
`),lineOffset:r+1+l}}function Fn(t){return Ct.normalizeCode(t)}function Sl(t){return!t||t.length===0?"":t.map((e,n)=>{let r=e.ErrorLevel!==void 0?`Level ${e.ErrorLevel}`:"Error",o=e.ErrorType?` (${e.ErrorType})`:"",i=e.TableName?`
Table: ${e.TableName}`:"",s=e.ErrorText||e.Message||JSON.stringify(e);return`${n+1}. ${r}${o}${i}
${s}`}).join(`

`)}var Hi="micah-bragg.epicor-efx-manager";function Wh(t){if(p.extensions.getExtension(Hi)){p.window.showWarningMessage("EFx Manager has a new publisher. Uninstall the old copy to finish updating \u2014 profiles carry over; passwords and API keys need re-entering once.",{modal:!1},"Uninstall old copy").then(async h=>{if(h!=="Uninstall old copy")return;try{await p.commands.executeCommand("workbench.extensions.uninstallExtension",Hi)}catch(b){p.window.showErrorMessage(`EFx: Couldn't uninstall the old copy (${b.message}). Remove "${Hi}" from the Extensions view.`);return}await p.window.showInformationMessage("EFx: Old copy removed. Reload to finish.","Reload")==="Reload"&&p.commands.executeCommand("workbench.action.reloadWindow")});return}We.init(t),Tl=t,se=new kh.EfxTreeProvider(null),Ao=p.window.createTreeView("efxLibraries",{treeDataProvider:se}),t.subscriptions.push(Ao),mt=new qi.BpmTreeProvider(null),So=p.window.createTreeView("bpmMethods",{treeDataProvider:mt}),t.subscriptions.push(So),ji=new Ih.ExecuteViewProvider,t.subscriptions.push(p.window.registerWebviewViewProvider("efxExecuteView",ji,{webviewOptions:{retainContextWhenHidden:!0}}));let e=rg(t).catch(h=>console.error("EFx: initClient failed",h));e.then(()=>ko()),yl.registerUpdateCommand(t),yl.checkForUpdatesOnStartup(t);let n=async()=>{await $l(t)};t.subscriptions.push(p.commands.registerCommand("efx.manageProfiles",n)),t.subscriptions.push(p.commands.registerCommand("efx.signIn",async h=>{let d=typeof h=="string"&&h?h:qe(),b=Xe().find(S=>S.name===d);if(!b)return p.window.showWarningMessage("EFx: No active profile to sign in to."),!1;try{let S=await We.signIn(b);return p.window.showInformationMessage(`EFx: Signed in to "${d}" as ${S}.`),d===qe()&&await nn(t,d),!0}catch(S){return p.window.showErrorMessage(`EFx: Sign-in for "${d}" failed \u2014 ${S.message}`),!1}})),t.subscriptions.push(p.commands.registerCommand("efx.signOut",async h=>{let d=typeof h=="string"&&h?h:qe(),b=Xe().find(S=>S.name===d);if(!b||We.authTypeOf(b)!=="entra"){p.window.showInformationMessage(`EFx: "${d||"(none)"}" isn't an Entra profile \u2014 nothing to sign out of.`);return}try{await We.signOut(b),p.window.showInformationMessage(`EFx: Signed out of "${d}".`)}catch(S){p.window.showErrorMessage(`EFx: Sign-out failed \u2014 ${S.message}`)}})),t.subscriptions.push(p.commands.registerCommand("efx.profileSettings",()=>{Ki(t,qe()||null)})),t.subscriptions.push(p.commands.registerCommand("efx.configureConnection",n)),t.subscriptions.push(p.commands.registerCommand("efx.switchProfile",async()=>{await Zh(t)})),t.subscriptions.push(p.commands.registerCommand("efx.switchCompany",async()=>{await eg(t)})),t.subscriptions.push(p.commands.registerCommand("efx.changeStorageLocation",async()=>{await p.workspace.getConfiguration("efx").update("storageLocation","",p.ConfigurationTarget.Global);let h=await Fl();h&&p.window.showInformationMessage(`EFx: Storage location changed to ${h}`)})),t.subscriptions.push(p.commands.registerCommand("efx.refreshLibraries",async()=>{if(!V){p.window.showWarningMessage("EFx: Configure connection first");return}gr(),await se.refresh()})),t.subscriptions.push(p.commands.registerCommand("efx.pullFunction",async h=>{if(!V||!h)return;let d=h.libraryId,b=h.func.FunctionID;await p.window.withProgress({location:p.ProgressLocation.Notification,title:`Pulling ${b}...`},async()=>{try{se.invalidateCache(d);let S=await se.getLibraryTableset(d);if(!S)return;Pn.set(d,S);let T=S.EfxFunction.find(re=>re.FunctionID===b);if(!T){p.window.showErrorMessage(`Function ${b} not found`);return}let I=Ct.describeBody(T.Body);if(I.unparsedFlow){p.window.showErrorMessage(`EFx: ${b} has a widget body this extension can't read. Run "EFx: DEV: Dump Function Bodies" for ${d} and share the output \u2014 pulling it as C# would corrupt the function.`);return}if(I.kind==="flow"&&!I.flow.onlyCustomCode){await bl(t,V,d,b,T.Body);return}let P=I.kind==="flow"?I.flow.codeNodes[0].id:null,R=P?I.flow.codeNodes[0].code:I.code,$=I.usings,_=await Eo();if(!_){p.window.showWarningMessage("EFx: Storage location not set \u2014 pull cancelled.");return}let U=me.join(_,d);Ce.mkdirSync(U,{recursive:!0});let H=me.join(U,`${b}.cs`),J=[`// EFx Function: ${d}.${b}`,`// Pulled: ${new Date().toISOString()}`,$?`// Usings: ${$}`:"",P?`// Widget: ${P}`:"","// --------------------------------------------------",""].filter(re=>re!=="").join(`
`);Ce.writeFileSync(H,J.replace(/\s*$/,"")+`

`+R,"utf-8"),Me.set(ge(H),{libraryId:d,functionId:b,widgetNodeId:P});let ne=await p.workspace.openTextDocument(H);await p.window.showTextDocument(ne,p.ViewColumn.One),p.window.showInformationMessage(`EFx: Pulled ${d}.${b}`)}catch(S){p.window.showErrorMessage(`EFx Pull failed: ${S.message}`)}})}));let r="// --------------------------------------------------";function o(h,d,b){let{directiveToCanonicalText:S}=zt(),T=[],I=[];for(let P of d&&d.EfxFunction||[]){if(P.LibraryID&&P.LibraryID!==h)continue;let R=P.FunctionID,$=Ct.describeBody(P.Body);if($.unparsedFlow){I.push(`${h}.${R} (widget body this extension can't read)`);continue}if($.kind==="flow"&&!$.flow.onlyCustomCode){let ne=[`// EFx Function: ${h}.${R}`,`// Pulled: ${b}`,"// Widget flow \u2014 read-only view; edit in the widget panel",r,""].join(`
`);T.push({libraryId:h,functionId:R,file:`${R}.widgets.txt`,pushable:!1,content:ne+`
`+(S($.xaml)||$.xaml)});continue}let _=$.kind==="flow"?$.flow.codeNodes[0].id:null,U=_?$.flow.codeNodes[0].code:$.code,H=$.usings,J=[`// EFx Function: ${h}.${R}`,`// Pulled: ${b}`,H?`// Usings: ${H}`:"",_?`// Widget: ${_}`:"",r,""].filter(ne=>ne!=="").join(`
`);T.push({libraryId:h,functionId:R,file:`${R}.cs`,pushable:!0,widgetNodeId:_,content:J.replace(/\s*$/,"")+`

`+U})}return{files:T,skipped:I}}async function i(h,d,b,S="ask"){let T=_=>{let U=String(_).replace(/\r\n/g,`
`),H=U.indexOf(r);return(H>=0?U.slice(U.indexOf(`
`,H)+1):U).trim()},I=_=>me.join(h,_.libraryId,_.file),P=new Set(p.workspace.textDocuments.filter(_=>_.isDirty).map(_=>ge(_.uri.fsPath))),R=d.filter(_=>P.has(ge(I(_))));for(let _ of R)b.push(`${_.libraryId}.${_.functionId} (open with unsaved changes)`);d=d.filter(_=>!R.includes(_));let $=d.filter(_=>{let U=I(_);if(!Ce.existsSync(U))return!1;try{return T(Ce.readFileSync(U,"utf-8"))!==T(_.content)}catch{return!1}});if($.length){let _=$.map(J=>`${J.libraryId}.${J.functionId}`),U=_.slice(0,15).join(", ")+(_.length>15?`, +${_.length-15} more`:""),H=S==="overwrite"?"Overwrite":S==="keep"?"Keep Local Copies":await p.window.showWarningMessage(`${$.length} local file(s) differ from Epicor (unpushed edits?): ${U}`,{modal:!0},"Overwrite","Keep Local Copies");if(!H)return null;if(H==="Keep Local Copies"){d=d.filter(J=>!$.includes(J));for(let J of $)b.push(`${J.libraryId}.${J.functionId} (kept local copy)`)}}for(let _ of d){let U=I(_);Ce.mkdirSync(me.dirname(U),{recursive:!0}),Ce.writeFileSync(U,_.content,"utf-8"),_.pushable&&Me.set(ge(U),{libraryId:_.libraryId,functionId:_.functionId,widgetNodeId:_.widgetNodeId})}return{written:d,skipped:b}}async function s(h,d,b){let{written:S,skipped:T}=d,I=new Set(S.map($=>$.libraryId)).size,P=`EFx: Pulled ${S.length} function(s) from ${h}${I>1?` (${I} libraries)`:""}`+(T.length?` \u2014 skipped ${T.length}: ${T.slice(0,10).join("; ")}${T.length>10?"; ...":""}`:""),R=await(T.length?p.window.showWarningMessage:p.window.showInformationMessage)(P,"Reveal in Finder","Copy Path");R==="Reveal in Finder"?await p.commands.executeCommand("revealFileInOS",p.Uri.file(b)):R==="Copy Path"&&await p.env.clipboard.writeText(b)}async function a(h=()=>{},d=()=>!1){let b=[],S=[],T=se.libraries&&se.libraries.length?se.libraries:await V.getLibraryList(),I=[...new Set(T.map($=>$.LibraryID))].sort(),P=new Date().toISOString(),R=20;for(let $=0;$<I.length;$+=R){if(d())return{files:b,skipped:S,libCount:I.length,cancelled:!0};let _=I.slice($,$+R);h(`${Math.min($+R,I.length)} / ${I.length} libraries`,_.length/I.length*100);let U=null;try{let H=await V.request(V.getDesignerUrl("GetLibraries"),{libraryIds:_}),J=H&&typeof H=="object"?H.returnObj||H:null;if(J&&Array.isArray(J.EfxFunction)){U=new Map(_.map(ne=>[ne,{EfxFunction:[]}]));for(let ne of J.EfxFunction)U.has(ne.LibraryID)&&U.get(ne.LibraryID).EfxFunction.push(ne)}}catch{}for(let H of _){let J=U?U.get(H):null;if(!J)try{J=await V.getLibrary(H)}catch(re){S.push(`${H} (could not load: ${re.message})`);continue}let ne=o(H,J,P);b.push(...ne.files),S.push(...ne.skipped)}}return{files:b,skipped:S,libCount:I.length,cancelled:!1}}t.subscriptions.push(p.commands.registerCommand("efx.pullLibrary",async h=>{if(!V||!h?.library)return;let d=h.library.LibraryID,b=await Eo();if(!b){p.window.showWarningMessage("EFx: Storage location not set \u2014 pull cancelled.");return}let S;try{S=await p.window.withProgress({location:p.ProgressLocation.Notification,title:`Pulling ${d}...`},async()=>{se.invalidateCache(d);let I=await se.getLibraryTableset(d);if(!I)throw new Error(`Library ${d} not found`);return Pn.set(d,I),o(d,I,new Date().toISOString())})}catch(I){p.window.showErrorMessage(`EFx Pull failed: ${I.message}`);return}let T=await i(b,S.files,S.skipped);T&&await s(d,T,me.join(b,d))})),t.subscriptions.push(p.commands.registerCommand("efx.pullAllLibraries",async()=>{if(!V){p.window.showWarningMessage("EFx: Configure connection first");return}let h=await Eo();if(!h){p.window.showWarningMessage("EFx: Storage location not set \u2014 pull cancelled.");return}let d=[],b=[],S=0;try{if(!await p.window.withProgress({location:p.ProgressLocation.Notification,title:"Pulling all libraries",cancellable:!0},async(P,R)=>{let $=await a((_,U)=>P.report({message:_,increment:U}),()=>R.isCancellationRequested);return{files:d,skipped:b,libCount:S}=$,!$.cancelled})){p.window.showInformationMessage("EFx: Pull all cancelled \u2014 nothing written.");return}}catch(I){p.window.showErrorMessage(`EFx Pull failed: ${I.message}`);return}let T=await i(h,d,b);T&&await s(`all ${S} libraries`,T,h)})),t.subscriptions.push(p.commands.registerCommand("efx.pushFunction",async(h,d=!1)=>{let b=h?.libraryId,S=h?.func?.FunctionID,T,I=[],P=[],R=($,_)=>({ok:$,libraryId:b,functionId:S,message:_,errors:$?[]:I.length?I:[_],diagnostics:P});if(!V)return R(!1,"EFx: Not connected");if(h){let $=await Eo();if(!$)return p.window.showWarningMessage("EFx: Storage location not set \u2014 push cancelled."),R(!1,"EFx: Storage location not set \u2014 push cancelled.");T=me.join($,b,`${S}.cs`)}else{let $=p.window.activeTextEditor;if(!$)return p.window.showWarningMessage("EFx: No active file to push"),R(!1,"EFx: No active file to push");T=$.document.uri.fsPath;let _=await en(T);if(!_)return p.window.showWarningMessage("EFx: This file is not a pulled EFx function"),R(!1,"EFx: This file is not a pulled EFx function");if(_.isWidgetCode){b=_.libraryId,S=_.functionId;let U=await xo(T,_);return R(!!U?.ok,U?.message||"Widget push finished")}b=_.libraryId,S=_.functionId}return!T||!Ce.existsSync(T)?(p.window.showErrorMessage("EFx: File not found. Pull the function first."),R(!1,"EFx: File not found. Pull the function first.")):!d&&await p.window.showWarningMessage(`Push ${S} to ${b}?`,{modal:!0},"Push")!=="Push"?R(!1,"Push cancelled"):await p.window.withProgress({location:p.ProgressLocation.Notification,title:`Pushing ${S}...`},async()=>{try{await Cl(T);let $=se.libraryCache.get(b)||await V.getLibrary(b),_=$.EfxLibrary&&$.EfxLibrary[0];if(!_)throw new Error(`Library ${b} not found on server`);if(_.Frozen===!0){let M=_.Published?`${b} is promoted to production \u2014 demote it first (right-click the library \u2192 Demote from Production).`:`${b} is locked/frozen in Epicor. Unfreeze it before editing.`;throw new Error(M)}let U=Mn(Ce.readFileSync(T,"utf-8")),H=U.content,J=U.lineOffset,ne=$.EfxFunction.find(M=>M.FunctionID===S);if(!ne)throw new Error(`Function ${S} not found on server`);let re=Ct.describeBody(ne.Body);if(re.unparsedFlow)throw new Error(`${S} has a widget body this extension can't read \u2014 refusing to overwrite it with C#.`);if(re.kind==="flow"){let j=(await en(T))?.widgetNodeId||(re.flow.codeNodes.length===1?re.flow.codeNodes[0].id:null);if(!j)throw new Error(`${S} has ${re.flow.codeNodes.length} custom-code widgets \u2014 edit them from the widget graph.`);let W=kl(V,b,S,ne.Body);await Il(W,j,H);let oe=(await V.getLibrary(b)).EfxFunction.find(Oe=>Oe.FunctionID===S),te=Ct.describeBody(oe?.Body).flow?.codeNodes.find(Oe=>Oe.id===j);if(!te||Fn(te.code)!==Fn(H))throw new Error("EFx Push verification failed: server widget code does not match editor text.");return l.set(p.Uri.file(T),[]),p.window.showInformationMessage(`EFx: Verified save of ${b}.${S} (widget ${j})`),se.invalidateCache(b),gr(),R(!0,`Verified save of ${b}.${S} (widget ${j})`)}let K=At.EpicorClient.extractCode(ne.Body),f=await V.validateFunctionViaWrapper(b,S,H,K.usings,"Utilities","ApplyChangesWithDiagnostics"),y=p.Uri.file(T);if(!f.saved){let M=f.diagnostics||f.errors||[];if(I=(f.errors||[]).map(String),P=M.map(j=>typeof j=="object"&&j!==null?{line:j.Line!=null?j.Line+J:null,column:j.Column??null,severity:j.Severity??2,message:[j.Code,j.Message].filter(Boolean).join(": ")||String(j)}:{line:null,column:null,severity:2,message:String(j)}),M.length>0){let j=M.map(W=>{if(typeof W=="object"&&W!==null){let G=Math.max(0,(W.Line??1)-1)+J,oe=Math.max(0,(W.Column??1)-1),te=[W.Code,W.Message].filter(Boolean).join(": ")||String(W);return new p.Diagnostic(new p.Range(G,oe,G,oe+1),te,p.DiagnosticSeverity.Error)}return new p.Diagnostic(new p.Range(0,0,0,1),String(W),p.DiagnosticSeverity.Error)});l.set(y,j)}throw new Error(f.errors?.[0]||f.outMsg||f.outResult||"Wrapper save failed")}let D=(await V.getLibrary(b)).EfxFunction.find(M=>M.FunctionID===S);if(!D)throw new Error(`Verification failed: ${b}.${S} not found after save`);let F=At.EpicorClient.extractCode(D.Body).code;if(Fn(F)!==Fn(H))throw new Error("EFx Push verification failed: wrapper returned success, but server Body does not match editor text.");l.set(y,[]),p.window.showInformationMessage(`EFx: Verified save of ${b}.${S}`);let q=Pn.get(b)?.EfxFunction?.find(M=>M.FunctionID===S);return q&&f.newBody&&(q.Body=f.newBody),se.invalidateCache(b),gr(),R(!0,`Verified save of ${b}.${S}`)}catch($){return console.error("EFx Push failed:",$),p.window.showErrorMessage(`EFx Push failed: ${$.message}`),R(!1,$.message)}})})),t.subscriptions.push(p.commands.registerCommand("efx.regenerateLibrary",async h=>{if(!V){p.window.showWarningMessage("EFx: Configure connection first");return}let d;if(h?.library?.LibraryID)d=h.library.LibraryID;else if(h?.libraryId)d=h.libraryId;else{let b=p.window.activeTextEditor;if(b){let S=Me.get(ge(b.document.uri.fsPath));S&&!S.isBpm&&(d=S.libraryId)}}d||(d=await p.window.showInputBox({prompt:"Library ID to regenerate / validate",placeHolder:"e.g. PimberlyFuncts"})),d&&await p.window.withProgress({location:p.ProgressLocation.Notification,title:`Validating ${d}...`},async()=>{try{let S=(await V.regenerateLibrary(d)).errors||[];if(S.length===0){p.window.showInformationMessage(`EFx: ${d} validated with no reported errors`);return}let T=Sl(S),I=await p.workspace.openTextDocument({language:"markdown",content:`# EFx Validation Errors: ${d}

\`\`\`text
${T}
\`\`\`
`});await p.window.showTextDocument(I,p.ViewColumn.Two),p.window.showWarningMessage(`EFx: ${d} has ${S.length} validation error(s)`)}catch(b){p.window.showErrorMessage(`EFx Validate failed: ${b.message}`)}})})),t.subscriptions.push(p.commands.registerCommand("efx.executeFunction",async h=>{if(!V||!h)return;let d=Rn(),b=d?d.companies||[]:[],S=St()||b[0]||"",T=(se.libraries||[]).find(P=>P.LibraryID===h.libraryId),I=T?!T.Published:!1;await ji.load(V,h.libraryId,h.func.FunctionID,h.signatures,b,S,se,I)})),t.subscriptions.push(p.commands.registerCommand("efx.demoteLibrary",async h=>{if(!(!V||!h||await p.window.showWarningMessage(`Demote ${h.library.LibraryID} from production?`,{modal:!0},"Demote")!=="Demote"))try{await V.demoteFromProduction(h.library.LibraryID),p.window.showInformationMessage(`EFx: Demoted ${h.library.LibraryID}`),await se.refresh()}catch(b){p.window.showErrorMessage(`EFx Demote failed: ${b.message}`)}})),t.subscriptions.push(p.commands.registerCommand("efx.promoteLibrary",async h=>{if(!(!V||!h||await p.window.showWarningMessage(`Promote ${h.library.LibraryID} to production?`,{modal:!0},"Promote")!=="Promote"))try{await V.promoteToProduction(h.library.LibraryID),p.window.showInformationMessage(`EFx: Promoted ${h.library.LibraryID}`),await se.refresh()}catch(b){p.window.showErrorMessage(`EFx Promote failed: ${b.message}`)}})),t.subscriptions.push(p.commands.registerCommand("efx.newFunction",async h=>{if(!V){p.window.showWarningMessage("EFx: Configure connection first");return}let d;if(h&&h.library?d=h.library.LibraryID:h&&h.libraryId?d=h.libraryId:d=await p.window.showInputBox({prompt:"Library ID to add the function to",placeHolder:"e.g. PaintLineFuncts"}),!d)return;let b=await p.window.showInputBox({prompt:"New Function ID",placeHolder:"e.g. MyNewFunction",validateInput:H=>!H||H.trim().length===0?"Function ID is required":/\s/.test(H)?"Function ID cannot contain spaces":null});if(!b)return;let S=await p.window.showInputBox({prompt:"Description (optional)",placeHolder:"Short description of the function"}),T=["string","int","decimal","bool","DateTime","System.Data.DataSet","System.Data.DataTable","Custom\u2026"];async function I(H){let J=[];for(;;){let ne=await p.window.showInputBox({prompt:`${H} param name (leave blank to finish)`,placeHolder:"e.g. partNum",ignoreFocusOut:!0});if(!ne)break;let re=await p.window.showQuickPick(T.map(f=>({label:f})),{placeHolder:`Data type for "${ne}"`,ignoreFocusOut:!0});if(!re)break;let K=re.label;if(K==="Custom\u2026"){let f=await p.window.showInputBox({prompt:"Enter full .NET type name",placeHolder:"e.g. Erp.Tablesets.SalesOrderTableset",ignoreFocusOut:!0});if(!f)break;K=f}J.push({ArgumentName:ne,DataType:K})}return J}let R=(await p.window.showQuickPick([{label:"Skip \u2014 add later",value:!1},{label:"Add request params now",value:!0}],{placeHolder:"Add request parameters?",ignoreFocusOut:!0}))?.value?await I("Request"):[],_=(await p.window.showQuickPick([{label:"Skip \u2014 add later",value:!1},{label:"Add response params now",value:!0}],{placeHolder:"Add response parameters?",ignoreFocusOut:!0}))?.value?await I("Response"):[],U=[...R.map((H,J)=>({...H,Response:!1,Order:J})),..._.map((H,J)=>({...H,Response:!0,Order:J}))];await p.window.withProgress({location:p.ProgressLocation.Notification,title:`Creating ${b}...`},async()=>{try{let H=await vl(d,b,S,U);H.diagnostics.length>0?p.window.showWarningMessage(`EFx: ${b} created with diagnostics:
${H.diagnostics.join(`
`)}`):p.window.showInformationMessage(`EFx: Created ${d}.${b} \u2713`),U.length>0&&(H.signaturesSaved?p.window.showInformationMessage(`EFx: Saved ${U.length} parameter(s) for ${b} \u2713`):p.window.showWarningMessage(`EFx: Function created but signatures failed: ${H.signatureError}. Add them via \u2699 Edit Signatures in the Execute panel.`))}catch(H){p.window.showErrorMessage(`EFx: Create function failed: ${H.message}`)}})})),t.subscriptions.push(p.commands.registerCommand("efx.deleteFunction",async h=>{if(!V){p.window.showWarningMessage("EFx: Configure connection first");return}if(!h){p.window.showWarningMessage("EFx: Delete must be invoked from a function in the tree.");return}let d=h.libraryId,b=h.func&&h.func.FunctionID;if(!d||!b){p.window.showErrorMessage("EFx: Could not determine library/function from selection.");return}await p.window.showWarningMessage(`Delete function "${b}" from library "${d}"? This cannot be undone.`,{modal:!0},"Delete")==="Delete"&&await p.window.withProgress({location:p.ProgressLocation.Notification,title:`Deleting ${b}...`},async()=>{try{await El(d,b),p.window.showInformationMessage(`EFx: Deleted ${d}.${b} \u2713 (local .cs file, if any, was left in place)`)}catch(T){p.window.showErrorMessage(`EFx: Delete function failed: ${T.message}`)}})})),t.subscriptions.push(p.commands.registerCommand("efx.newLibrary",async()=>{if(!V){p.window.showWarningMessage("EFx: Configure connection first");return}let h=await p.window.showInputBox({prompt:"New Library ID",placeHolder:"e.g. MyNewLibrary",validateInput:b=>!b||b.trim().length===0?"Library ID is required":/\s/.test(b)?"Library ID cannot contain spaces":null});if(!h)return;let d=await p.window.showInputBox({prompt:"Description (optional)",placeHolder:"Short description of the library"});await p.window.withProgress({location:p.ProgressLocation.Notification,title:`Creating library ${h}...`},async()=>{try{let b=await xl(h,d);b.length>0?p.window.showWarningMessage(`EFx: Library ${h} created with diagnostics:
${b.join(`
`)}`):p.window.showInformationMessage(`EFx: Created library ${h} \u2713`)}catch(b){p.window.showErrorMessage(`EFx: Create library failed: ${b.message}`)}})})),t.subscriptions.push(p.commands.registerCommand("efx.addTable",async h=>{if(!V||!h)return;let d=h.libraryId,b=["ERP.Part","ERP.PartBin","ERP.PartCost","ERP.PartPlant","ERP.PartUOM","ERP.PartWhse","ERP.PartCOO","ERP.PartPC","ERP.PartRev","ERP.Customer","ERP.CustCnt","ERP.ShipTo","ERP.OrderHed","ERP.OrderDtl","ERP.OrderRel","ERP.QuoteHed","ERP.QuoteDtl","ERP.JobHead","ERP.JobAsmbl","ERP.JobMtl","ERP.JobOper","ERP.ShipHead","ERP.ShipDtl","ERP.PurchaseOrder","ERP.PODetail","ERP.PORel","ERP.Vendor","ERP.VendPart","ERP.PriceLst","ERP.PriceLstParts","ERP.LaborDtl","ERP.LaborHed","ERP.PlantWhse","ERP.PartTran","ERP.Country","ERP.Currency","ERP.UD01","ERP.UD02","ERP.UD03","ERP.UD04","ERP.UD05","ERP.UD06","ERP.UD07","ERP.UD08","ERP.UD09","ERP.UD10","ICE.UD11","ICE.UD12","ICE.UD13","ICE.UD14","ICE.UD15","ICE.UD16","ICE.UD17","ICE.UD18","ICE.UD19","ICE.UD20"].sort(),S=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...b.map(R=>({label:R,manual:!1}))],T=await p.window.showQuickPick(S,{placeHolder:"Select a table or enter manually (format: ERP.Part)",matchOnDescription:!0});if(!T)return;let I;if(T.manual?I=await p.window.showInputBox({prompt:"Table ID",placeHolder:"e.g. ERP.PartBin or ICE.UD11",validateInput:R=>!R||!R.includes(".")?"Format must be NAMESPACE.TableName":null}):I=T.label,!I)return;let P=await p.window.showQuickPick([{label:"Read-only",value:!1},{label:"Updatable",value:!0}],{placeHolder:"Read-only or Updatable?"});P&&await p.window.withProgress({location:p.ProgressLocation.Notification,title:`Adding table ${I}...`},async()=>{try{let R=await hr(d,"table",I,{updatable:P.value});R.length>0?p.window.showWarningMessage(`EFx: Table added with diagnostics: ${R.join(", ")}`):p.window.showInformationMessage(`EFx: Added table ${I} to ${d} \u2713`)}catch(R){p.window.showErrorMessage(`EFx: Add table failed: ${R.message}`)}})})),t.subscriptions.push(p.commands.registerCommand("efx.setTableUpdatable",async h=>{if(!V){p.window.showWarningMessage("EFx: Configure connection first");return}if(!h||!h.row){p.window.showWarningMessage("EFx: Must be invoked from a table in the tree.");return}let d=h.row.LibraryID,b=h.row.TableID,S=h.row.Updatable;if(!d||!b){p.window.showErrorMessage("EFx: Could not determine library/table from selection.");return}let T=await p.window.showQuickPick([{label:"$(lock) Read-only",value:!1,description:S===!1?"current":""},{label:"$(edit) Updatable",value:!0,description:S===!0?"current":""}],{placeHolder:`${b} \u2014 choose access mode`});!T||T.value===S||await p.window.withProgress({location:p.ProgressLocation.Notification,title:`Updating ${b}...`},async()=>{try{await Dl(d,b,T.value),p.window.showInformationMessage(`EFx: ${b} set to ${T.value?"Updatable":"Read-only"} \u2713`)}catch(I){p.window.showErrorMessage(`EFx: Set updatable failed: ${I.message}`)}})})),t.subscriptions.push(p.commands.registerCommand("efx.addService",async h=>{if(!V||!h)return;let d=h.libraryId,b=["ERP:BO:Part","ERP:BO:PartBin","ERP:BO:PartWhse","ERP:BO:PartCost","ERP:BO:PartTran","ERP:BO:Customer","ERP:BO:ShipTo","ERP:BO:SalesOrder","ERP:BO:QuoteMgr","ERP:BO:JobEntry","ERP:BO:JobStatus","ERP:BO:CustShip","ERP:BO:SubShipD","ERP:BO:PurchaseOrder","ERP:BO:Receipt","ERP:BO:Vendor","ERP:BO:LaborDtl","ERP:BO:PriceLst","ERP:BO:Currency","ERP:BO:Country","ERP:BO:Inventory","ICE:BO:UD11","ICE:BO:UD12","ICE:BO:UD13","ICE:BO:UD14","ICE:BO:UD15","ICE:BO:UD16","ICE:BO:UD17","ICE:BO:UD18","ICE:BO:UD19","ICE:BO:UD20","ICE:LIB:EfxLibraryDesigner"].sort(),S=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...b.map(P=>({label:P,manual:!1}))],T=await p.window.showQuickPick(S,{placeHolder:"Select a service or enter manually (format: ERP:BO:Part)"});if(!T)return;let I;T.manual?I=await p.window.showInputBox({prompt:"Service ID",placeHolder:"e.g. ERP:BO:Part or ICE:BO:UD11",validateInput:P=>!P||P.split(":").length<3?"Format must be NAMESPACE:TYPE:Name":null}):I=T.label,I&&await p.window.withProgress({location:p.ProgressLocation.Notification,title:`Adding service ${I}...`},async()=>{try{let P=await hr(d,"service",I,{});P.length>0?p.window.showWarningMessage(`EFx: Service added with diagnostics: ${P.join(", ")}`):p.window.showInformationMessage(`EFx: Added service ${I} to ${d} \u2713`)}catch(P){p.window.showErrorMessage(`EFx: Add service failed: ${P.message}`)}})})),t.subscriptions.push(p.commands.registerCommand("efx.addAssembly",async h=>{if(!V||!h)return;let d=h.libraryId,b=["Newtonsoft.Json.dll","Ice.Contracts.BO.DynamicQuery.dll","Ice.Contracts.BO.BAQDesigner.dll","Erp.Contracts.BO.Part.dll","Erp.Contracts.BO.JobEntry.dll","Erp.Contracts.BO.SalesOrder.dll","Erp.Contracts.BO.QuoteMgr.dll","Erp.Contracts.BO.CustShip.dll","Erp.Contracts.BO.PurchaseOrder.dll","Erp.Contracts.BO.LaborDtl.dll","Erp.Contracts.BO.Inventory.dll","Erp.Contracts.BO.Customer.dll","Erp.Contracts.BO.Vendor.dll","Ice.Contracts.BO.UD11.dll","Ice.Contracts.BO.UD15.dll","System.Net.Http.dll","System.Xml.dll","System.Linq.dll"].sort(),S=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...b.map(P=>({label:P,manual:!1}))],T=await p.window.showQuickPick(S,{placeHolder:"Select an assembly or enter manually (include .dll)"});if(!T)return;let I;T.manual?I=await p.window.showInputBox({prompt:"Assembly filename",placeHolder:"e.g. Newtonsoft.Json.dll",validateInput:P=>!P||!P.toLowerCase().endsWith(".dll")?"Must end in .dll":null}):I=T.label,I&&await p.window.withProgress({location:p.ProgressLocation.Notification,title:`Adding assembly ${I}...`},async()=>{try{let P=await hr(d,"assembly",I,{});P.length>0?p.window.showWarningMessage(`EFx: Assembly added with diagnostics: ${P.join(", ")}`):p.window.showInformationMessage(`EFx: Added assembly ${I} to ${d} \u2713`)}catch(P){p.window.showErrorMessage(`EFx: Add assembly failed: ${P.message}`)}})})),t.subscriptions.push(p.commands.registerCommand("efx.addLibraryRef",async h=>{if(!V||!h)return;let d=h.libraryId,S=(se.libraries||[]).map($=>$.LibraryID).filter($=>$!==d).sort(),T=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...S.map($=>({label:$,manual:!1}))],I=await p.window.showQuickPick(T,{placeHolder:S.length>0?"Select a library to reference":"Enter library ID (refresh tree first to get suggestions)"});if(!I)return;let P;if(I.manual?P=await p.window.showInputBox({prompt:"Library ID to reference",placeHolder:"e.g. LogFuncts",validateInput:$=>!$||$.trim().length===0?"Library ID is required":null}):P=I.label,!P)return;let R=await p.window.showQuickPick([{label:"Normal (0)",value:0,description:"Standard reference"},{label:"Read-only (1)",value:1,description:"Cannot call mutating functions"},{label:"Hidden (2)",value:2,description:"Not visible in designer"}],{placeHolder:"Reference mode"});R&&await p.window.withProgress({location:p.ProgressLocation.Notification,title:`Adding library ref ${P}...`},async()=>{try{let $=await hr(d,"library",P,{mode:R.value});$.length>0?p.window.showWarningMessage(`EFx: Library ref added with diagnostics: ${$.join(", ")}`):p.window.showInformationMessage(`EFx: Added library ref ${P} to ${d} \u2713`)}catch($){p.window.showErrorMessage(`EFx: Add library ref failed: ${$.message}`)}})}));let c=p.languages.createDiagnosticCollection("epicor-bpm");t.subscriptions.push(c);let l=p.languages.createDiagnosticCollection("epicor-efx");t.subscriptions.push(l);let u=new Map;function m(h){return u.has(h)||u.set(h,{status:"idle",timer:null}),u.get(h)}function g(h,d){let b=m(h);if(b.status==="running"||b.status==="dirty"){b.timer&&(clearTimeout(b.timer),b.timer=null),b.status="dirty";return}b.timer&&clearTimeout(b.timer),b.timer=setTimeout(()=>{b.timer=null,b.status="running",E(h,d)},500)}async function E(h,d){if(u.get(h))try{if(!pe||!d.isBpm||!d.functionDefinition)return;let S=p.workspace.textDocuments.find(_=>ge(_.uri.fsPath)===ge(h)),T=Mn(S?S.getText():Ce.readFileSync(h,"utf-8")),I=T.content,P=T.lineOffset,R=await pe.validateCustomCode(I,d.functionDefinition),$=p.Uri.file(h);if(!R||R.length===0)c.set($,[]);else{let _=R.map(U=>{let H=Math.max(0,(U.Span?.start?.line??1)-1),J=Math.max(H,(U.Span?.end?.line??H+1)-1),ne=H+P,re=J+P,K=Math.max(0,U.Span?.start?.column??0),f=Math.max(0,U.Span?.end?.column??K+1),y=new p.Range(ne,K,re,f),w=Al(U.Severity),D=`${U.Code}: ${U.Message}`;return new p.Diagnostic(y,D,w)});c.set($,_)}}catch{}finally{let S=u.get(h);if(!S)return;let T=S.status==="dirty";S.status="idle",T&&(S.status="running",E(h,d))}}t.subscriptions.push(p.workspace.onDidOpenTextDocument(async h=>{let d=h.uri.fsPath;if(!d.endsWith(".cs")||Me.has(ge(d)))return;let b=p.workspace.getConfiguration("efx").get("storageLocation");!b||!d.startsWith(String(b))||await en(d)})),t.subscriptions.push(p.workspace.onDidChangeTextDocument(h=>{let d=h.document.uri.fsPath,b=Me.get(ge(d));b&&b.isBpm&&b.functionDefinition&&g(d,b),b&&!b.isBpm&&!b.widgetNodeId&&!b.isWidgetCode&&V&&N(d,b)})),t.subscriptions.push(p.workspace.onDidSaveTextDocument(async h=>{let d=ge(h.uri.fsPath);if(zi.has(d))return;let b=await en(h.uri.fsPath);if(b?.isWidgetCode){await xo(h.uri.fsPath,b);return}!b||b.isBpm||!V||!Rn()?.autoPush||await p.commands.executeCommand("efx.pushFunction",null,!0)})),t.subscriptions.push(p.workspace.onDidCloseTextDocument(h=>{let d=h.uri.fsPath,b=Me.get(ge(d));if(b&&b.isBpm){c.delete(h.uri);let S=u.get(d);S?.timer&&clearTimeout(S.timer),u.delete(d)}if(b&&!b.isBpm){l.delete(h.uri);let S=C.get(d);S?.timer&&clearTimeout(S.timer),C.delete(d)}if(b&&!h.isDirty&&Rn()?.autoClean)try{Ce.unlinkSync(d),Me.delete(ge(d))}catch{}}));let C=new Map;function A(h){return C.has(h)||C.set(h,{status:"idle",timer:null}),C.get(h)}function N(h,d){let b=A(h);if(b.status==="running"||b.status==="dirty"){b.timer&&(clearTimeout(b.timer),b.timer=null),b.status="dirty";return}b.timer&&clearTimeout(b.timer),b.timer=setTimeout(()=>{b.timer=null,b.status="running",B(h,d)},1500)}async function B(h,d){if(C.get(h))try{if(!V||!d.libraryId||!d.functionId||d.widgetNodeId||d.isWidgetCode)return;let S=p.workspace.textDocuments.find(re=>ge(re.uri.fsPath)===ge(h)),T=Mn(S?S.getText():Ce.readFileSync(h,"utf-8")),I=T.content,P=T.lineOffset,R=Pn.get(d.libraryId),$=R?.EfxFunction?.find(re=>re.FunctionID===d.functionId);if($){let re=At.EpicorClient.extractCode($.Body).code;if(Fn(re)===Fn(I)){l.set(p.Uri.file(h),[]);return}}let _=$?At.EpicorClient.extractCode($.Body).usings:"",{diagnostics:U,saved:H,newBody:J}=await V.validateFunctionViaWrapper(d.libraryId,d.functionId,I,_,"Utilities","ApplyChangesWithDiagnostics",R);H&&R&&$&&($.Body=J);let ne=p.Uri.file(h);if(!U||U.length===0)l.set(ne,[]);else{let re=U.map(K=>{if(typeof K=="object"&&K!==null){let y=Number.isInteger(K.Line)?K.Line:void 0,w=Number.isInteger(K.Column)?K.Column-1:void 0,D=Math.max(0,(K.Span?.start?.line??y??1)-1),F=Math.max(D,(K.Span?.end?.line??y??D+1)-1),O=D+P,q=F+P,M=Math.max(0,K.Span?.start?.column??w??0),j=Math.max(0,K.Span?.end?.column??M+1),W=Al(K.Severity),G=[K.Code,K.Message].filter(Boolean).join(": ");return new p.Diagnostic(new p.Range(O,M,q,j),G||String(K),W)}let f=String(K).match(/\((\d+),(\d+)\).*?(error|warning|info)\s+(CS\w+)?:?\s*(.*)/i);if(f){let y=Math.max(0,parseInt(f[1])-1)+P,w=Math.max(0,parseInt(f[2])-1),D=f[3].toLowerCase();return new p.Diagnostic(new p.Range(y,w,y,w+1),`${f[4]?f[4]+": ":""}${f[5]}`,D==="warning"?p.DiagnosticSeverity.Warning:D==="info"?p.DiagnosticSeverity.Information:p.DiagnosticSeverity.Error)}return new p.Diagnostic(new p.Range(0,0,0,1),String(K),p.DiagnosticSeverity.Error)});l.set(ne,re)}}catch{}finally{let S=C.get(h);if(!S)return;let T=S.status==="dirty";S.status="idle",T&&(S.status="running",B(h,d))}}t.subscriptions.push(p.commands.registerCommand("efx.bpm.refresh",async()=>{if(!pe){p.window.showWarningMessage("BPM: Configure connection first");return}await mt.refresh()})),t.subscriptions.push(p.commands.registerCommand("efx.bpm.openWidgetPanel",async h=>{if(!pe){p.window.showWarningMessage("BPM: Configure connection first");return}let d;if((h?.directive||h instanceof qi.BpmDirectiveNode)&&(d=h.directive),!d){p.window.showWarningMessage("BPM: Select a directive");return}Th(t,pe,d)})),t.subscriptions.push(p.commands.registerCommand("efx.openFunctionWidgets",async h=>{if(!V){p.window.showWarningMessage("EFx: Configure connection first");return}let d=h?.libraryId,b=h?.func?.FunctionID||h?.functionId;if(!d||!b){p.window.showWarningMessage("EFx: Select a function");return}try{await bl(t,V,d,b,h?.func?.Body)}catch(S){p.window.showErrorMessage(`EFx: Could not open widget graph \u2014 ${S.message}`)}})),t.subscriptions.push(p.commands.registerCommand("efx.widget.openCode",async h=>{let d=h?.meta;if(!d||!h.nodeId)return;let b=await Co();if(!b){p.window.showWarningMessage("EFx: Storage location not set \u2014 cannot open widget code.");return}let S=H=>String(H||"").replace(/[^a-zA-Z0-9_\-. ]/g,"_"),T=d.kind==="bpm",I=T?me.join(b,"Widgets","BPM",S(d.bpMethodCode),S(d.name)):me.join(b,"Widgets",S(d.libraryId),S(d.functionId));Ce.mkdirSync(I,{recursive:!0});let P=me.join(I,`${S(h.nodeId)}.cs`),R=null;if(T&&pe&&(d.source||"BO")==="BO")try{let H=await pe.getBpmMethod("BO",d.bpMethodCode),J=H?.BpMethod?.[0];J&&(R=Le.buildFunctionDefinition(J,H?.BpArgument||[]))}catch{}let $=(T?[`// BPM Directive: ${d.name}`,`// Source: ${d.source||"BO"}`,`// Method: ${d.bpMethodCode}`,`// Type: ${Bh(d.directiveType,d.source||"BO")}`,`// DirectiveID: ${d.directiveId}`]:[`// EFx Function: ${d.libraryId}.${d.functionId}`]).concat([`// Widget Code: ${h.nodeId} (${h.label})`,`// Pulled: ${new Date().toISOString()}`,"// Saving this file pushes the code back into this widget.","// --------------------------------------------------",""]);p.workspace.textDocuments.find(H=>ge(H.uri.fsPath)===ge(P)&&H.isDirty)||Ce.writeFileSync(P,$.join(`
`)+`
`+(h.code||""),"utf-8"),Me.set(ge(P),{isWidgetCode:!0,nodeId:h.nodeId,widgetMeta:d,isBpm:T,libraryId:T?"__BPM__":d.libraryId,functionId:T?d.directiveId:d.functionId,bpmMethodCode:d.bpMethodCode,source:d.source||"BO",directiveId:d.directiveId,directiveType:d.directiveType,functionDefinition:R});let U=await p.workspace.openTextDocument(P);await p.window.showTextDocument(U,p.ViewColumn.One),p.window.showInformationMessage(`Widget "${h.label}" opened \u2014 save to push it back to Epicor.`),R&&g(P,Me.get(ge(P)))}));async function v(h,d,b){let S=Le.bpmSourceOf(h),T=Le.directiveTypeLabel(S,h.DirectiveType),I=me.join(b,"BPM",Wi(h.BpMethodCode));Ce.mkdirSync(I,{recursive:!0});let P=h.Name.replace(/[^a-zA-Z0-9_\-. ]/g,"_"),R=me.join(I,`${T}_${P}.cs`),$=[`// BPM Directive: ${h.Name}`,`// Source: ${S}`,`// Method: ${h.BpMethodCode}`,`// Type: ${T}`,`// Enabled: ${h.IsEnabled}`,`// Group: ${h.DirectiveGroup||"(none)"}`,`// DirectiveID: ${h.DirectiveID}`,`// Pulled: ${new Date().toISOString()}`,"// --------------------------------------------------",""].join(`
`);Ce.writeFileSync(R,$+d,"utf-8");let _=null;if(S==="BO"){let U=await pe.getBpmMethod("BO",h.BpMethodCode),H=U?.BpMethod?.[0],J=U?.BpArgument||[];_=H?Le.buildFunctionDefinition(H,J):null}return Me.set(ge(R),{libraryId:"__BPM__",functionId:h.DirectiveID,bpmMethodCode:h.BpMethodCode,source:S,directiveId:h.DirectiveID,directiveType:h.DirectiveType,isBpm:!0,functionDefinition:_}),{filePath:R,typeLabel:T,functionDefinition:_}}t.subscriptions.push(p.commands.registerCommand("efx.bpm.pullDirective",async h=>{if(!pe){p.window.showWarningMessage("BPM: Configure connection first");return}let d;if(h&&h.directive)d=h.directive;else if(h instanceof qi.BpmDirectiveNode)d=h.directive;else{p.window.showWarningMessage("BPM: Select a directive to pull");return}let{code:b,hasCustomCode:S}=Le.extractBpmCode(d.Body);if(!S){p.window.showWarningMessage(`BPM: "${d.Name}" has no custom C# code \u2014 it uses widget actions only`);return}await p.window.withProgress({location:p.ProgressLocation.Notification,title:`Pulling BPM: ${d.Name}...`},async()=>{try{let T=await Co();if(!T){p.window.showWarningMessage("BPM: Storage location not set \u2014 pull cancelled.");return}let{filePath:I,typeLabel:P,functionDefinition:R}=await v(d,b,T),$=await p.workspace.openTextDocument(I);if(await p.window.showTextDocument($,p.ViewColumn.One),p.window.showInformationMessage(`BPM: Pulled ${P} directive "${d.Name}"`),R){let _=Me.get(ge(I));g(I,_)}}catch(T){p.window.showErrorMessage(`BPM Pull failed: ${T.message}`)}})}));async function x(h,d){let b=Hh(Ce.readFileSync(h,"utf-8")),S=d.source||"BO",T=await pe.getBpmMethodRaw(S,d.bpmMethodCode),I=Le.updateRawBpmDirective(T,d.directiveId,b);JSON.parse(`{"ds":${I}}`);let R=((await pe.updateBpmRaw(I))?.returnObj?.BpMessageSvc||[]).filter(H=>H.Severity>1);if(R.length)throw new Error(R.map(H=>H.Message).join("; "));let _=((await pe.getBpmMethod(S,d.bpmMethodCode))?.BpDirective||[]).find(H=>H.DirectiveID===d.directiveId),U=_?Le.extractBpmCode(_.Body).code:null;if(U===null||Ct.normalizeCode(U)!==Ct.normalizeCode(b))throw new Error("BPM push verification failed: server directive code does not match the file.")}t.subscriptions.push(p.commands.registerCommand("efx.bpm.pushDirective",async h=>{if(!pe){p.window.showWarningMessage("BPM: Configure connection first");return}let d,b;if(h&&h.directive){let T=h.directive,I=Le.directiveTypeLabel(Le.bpmSourceOf(T),T.DirectiveType),P=T.Name.replace(/[^a-zA-Z0-9_\-. ]/g,"_"),R=await Co();if(!R){p.window.showWarningMessage("BPM: Storage location not set \u2014 push cancelled.");return}d=me.join(R,"BPM",Wi(T.BpMethodCode),`${I}_${P}.cs`),b=await en(d)}else{let T=p.window.activeTextEditor;if(!T){p.window.showWarningMessage("BPM: No active file to push");return}d=T.document.uri.fsPath,b=await en(d)}if(b?.isWidgetCode){await xo(d,b);return}if(!b||!b.isBpm){p.window.showWarningMessage("BPM: This file is not a pulled BPM directive. Pull it first.");return}if(!d||!Ce.existsSync(d)){p.window.showErrorMessage("BPM: File not found. Pull the directive first.");return}await p.window.showWarningMessage(`Push BPM directive to ${b.bpmMethodCode}?`,{modal:!0},"Push")==="Push"&&await p.window.withProgress({location:p.ProgressLocation.Notification,title:"Pushing BPM directive..."},async()=>{try{await Cl(d),await x(d,b),p.window.showInformationMessage(`BPM: Pushed directive to ${b.bpmMethodCode} \u2713`),b.functionDefinition&&g(d,b);let T=b.bpmMethodCode.split(".");(b.source||"BO")!=="BO"?mt.invalidateSource(b.source):T.length>=3&&mt.invalidateService(T[0].toUpperCase(),T[1],T[2])}catch(T){p.window.showErrorMessage(`BPM Push failed: ${T.message}`)}})}));async function k(h){let d=Xe();if(d.length<1)return p.window.showWarningMessage("EFx: No profiles configured. Add profiles via Manage Profiles first."),null;let b=await p.window.showQuickPick(d.map(I=>({label:I.name,description:I.serverUrl,profile:I})),{placeHolder:h,ignoreFocusOut:!0});if(!b)return null;let S;if(b.profile.companies.length===1?S=b.profile.companies[0]:S=await p.window.showQuickPick(b.profile.companies,{placeHolder:`Company on ${b.profile.name}`,ignoreFocusOut:!0}),!S)return null;let T=await We.preflight(b.profile);return T?(p.window.showErrorMessage(`EFx: ${T}`),null):new $h.KineticMetaFXClient(We.clientConfig(b.profile,S))}t.subscriptions.push(p.commands.registerCommand("efx.dev.dumpFunctionBody",async()=>{if(!V){p.window.showErrorMessage("EFx: Not connected \u2014 configure a profile first.");return}let h=await p.window.showInputBox({prompt:"Library ID to dump",ignoreFocusOut:!0});if(!h)return;let d=p.window.createOutputChannel("EFx Function Body Dump");d.show(!0),d.appendLine(`Fetching ${h}...`);try{let S=(await V.getLibrary(h.trim()))?.EfxFunction||[];d.appendLine(`Got ${S.length} function(s)
`);for(let T of S){let I=Ct.describeBody(T.Body);if(d.appendLine("=".repeat(70)),d.appendLine(`${T.FunctionID}  Kind=${T.Kind}  \u2192 ${Ct.bodyKindLabel(I)}`),I.kind==="flow"){d.appendLine(`  envelope property: ${I.xamlProp||"(raw XAML)"}`);for(let P of I.flow.codeNodes)d.appendLine(`  code widget ${P.id} (${P.label}), ${P.code.split(`
`).length} lines`)}d.appendLine("  --- raw Body ---"),d.appendLine(T.Body||"(empty)"),d.appendLine("")}}catch(b){d.appendLine(`ERROR: ${b.message}`)}})),t.subscriptions.push(p.commands.registerCommand("efx.dev.dumpBpmXaml",async()=>{if(!pe){p.window.showErrorMessage("EFx: Not connected \u2014 configure a profile first.");return}let h=await p.window.showInputBox({prompt:"BPM method code",value:"Erp.BO.Labor.Update",ignoreFocusOut:!0});if(!h)return;let d=p.window.createOutputChannel("EFx Widget XAML Dump");d.show(!0),d.appendLine(`Fetching ${h}...`);try{let b=Le.inferBpmSource(h.trim()),T=(await pe.getBpmMethod(b,h.trim()))?.BpDirective||[];d.appendLine(`Got ${T.length} directive(s)
`);for(let I of T){let P=Le.directiveTypeLabel(b,I.DirectiveType);if(d.appendLine("=".repeat(70)),d.appendLine(`[${P}] "${I.Name}"  enabled=${I.IsEnabled}  group=${I.DirectiveGroup||"(none)"}`),!I.Body){d.appendLine("  (no body)");continue}let R=[...new Set([...I.Body.matchAll(/<(\w+Action)\b/g)].map(U=>U[1]))];d.appendLine(`  Action elements: ${R.join(", ")||"(none found)"}`);let $=0,_=0;for(;;){let U=I.Body.indexOf("CustomCodeAction",$);if(U<0)break;let H='Code="',J=I.Body.indexOf(H,U);if(J<0){$=U+1;continue}let ne=J+H.length,re=ne;for(;re<I.Body.length&&I.Body[re]!=='"';){if(I.Body[re]==="&"){let y=I.Body.indexOf(";",re);if(y<0)break;re=y+1;continue}re++}let K=I.Body.slice(ne,re),f=Le.xmlDecode(K);d.appendLine(`
  --- CustomCodeAction[${_++}] ---`),d.appendLine(f),$=re+1}_===0&&(d.appendLine(`
  No CustomCodeAction found \u2014 full XAML body:`),d.appendLine(I.Body))}}catch(b){d.appendLine(`ERROR: ${b.message}`)}})),t.subscriptions.push(p.commands.registerCommand("efx.compareLibraries",()=>{Lh.show(t)})),t.subscriptions.push(p.commands.registerCommand("efx.searchFunctions",async()=>{await wl(V,{})})),t.subscriptions.push(p.commands.registerCommand("efx.searchInLibrary",async h=>{await wl(V,{libraryId:h?.library?.LibraryID||h?.libraryId})}));let L={context:t,getClient:()=>V,getBpmClient:()=>pe,treeProvider:()=>se,bpmTreeProvider:()=>mt,clientReady:()=>e,getProfiles:Xe,setProfiles:yr,getActiveProfileName:qe,setActiveProfileName:wr,getActiveProfile:Rn,getActiveCompany:St,profileRootNoPrompt:Pl,profileSecretKey:ze,activateProfile:h=>nn(t,h),applyActiveCompany:h=>Xi(t,h),normalizeFsPath:ge,stripGeneratedHeaderInfo:Mn,formatBOUpdErrors:Sl,bpmMethodDirName:Wi,resolveMapping:en,pushWidgetCodeFile:xo,pushFunctionCommand:h=>p.commands.executeCommand("efx.pushFunction",h,!0),buildLibraryFiles:o,writePulledFiles:i,collectAllLibraryFiles:a,writeDirectiveFile:v,corePushDirective:x,coreCreateFunction:vl,coreDeleteFunction:El,coreCreateLibrary:xl,coreAddReference:hr,coreSetTableUpdatable:Dl,efxDiagnostics:l,pulledTablesets:Pn,clearSearchCache:gr};new Oh(t,L,Fh.buildOps(L)).start()}var ht={ignoreFocusOut:!0};function Xe(){let e=p.workspace.getConfiguration("efx").get("profiles");return Array.isArray(e)?e:[]}async function yr(t){await p.workspace.getConfiguration("efx").update("profiles",t,p.ConfigurationTarget.Global)}function qe(){return p.workspace.getConfiguration("efx").get("activeProfile")||""}async function wr(t){await p.workspace.getConfiguration("efx").update("activeProfile",t,p.ConfigurationTarget.Global)}function St(){return p.workspace.getConfiguration("efx").get("activeCompany")||""}async function vr(t){await p.workspace.getConfiguration("efx").update("activeCompany",t,p.ConfigurationTarget.Global)}function Rn(){let t=qe();return t&&Xe().find(e=>e.name===t)||null}function ze(t,e){return`efx.profile.${t}.${e}`}var Ji=We.authTypeOf;function Ki(t,e){_h.open(t,{getProfiles:Xe,setProfiles:yr,getActiveProfileName:qe,setActiveProfileName:wr,getActiveCompany:St,setActiveCompany:vr,activateProfile:n=>nn(t,n),profileSecretKey:ze,profileRootNoPrompt:Pl,authTypeOf:Ji,CLAUDE_ACCESS_LEVELS:Ol,EpicorClient:At.EpicorClient,auth:We},e)}function ko(){let t=qe(),e=St(),n=t&&e?`${t} / ${e}`:t||"";Ao&&(Ao.description=n),So&&(So.description=n)}async function $l(t){let e=Xe(),n=qe(),r=[];r.push({label:"$(add) New Profile\u2026",description:"Create a new Epicor environment profile",action:"new"});for(let i of e){let s=i.name===n;r.push({label:`${s?"$(check) ":"$(blank) "}${i.name}`,description:i.serverUrl||"",detail:`${i.username||"(no user)"} \u2022 ${(i.companies||[]).join(", ")||"no companies"}`,action:"use",profileName:i.name})}e.length>0&&(r.push({label:"$(settings-gear) Profile Settings\u2026",description:"Edit any profile in the settings panel",action:"edit"}),r.push({label:"$(trash) Delete Profile\u2026",action:"delete"})),r.push({label:"$(history) Classic wizard\u2026",description:"Old step-by-step editor (fallback)",action:"classic"});let o=await p.window.showQuickPick(r,{placeHolder:e.length===0?"No profiles yet \u2014 create your first one":`Select a profile to activate, or manage profiles (${e.length} configured)`,ignoreFocusOut:!0});if(o){if(o.action==="new")Ki(t,null);else if(o.action==="use")await nn(t,o.profileName);else if(o.action==="edit")Ki(t,n||e[0].name);else if(o.action==="delete"){let i=await zh("Select profile to delete");i&&await Yh(t,i)}else if(o.action==="classic"){let i=await p.window.showQuickPick([{label:"$(add) New profile",name:null},...e.map(s=>({label:s.name,name:s.name}))],{placeHolder:"Classic wizard \u2014 new or edit",ignoreFocusOut:!0});if(!i)return;i.name?await Gh(t,i.name):await Vh(t)}}}async function zh(t){let e=Xe();if(e.length===0)return p.window.showInformationMessage("EFx: No profiles configured."),null;let n=await p.window.showQuickPick(e.map(r=>({label:r.name,description:r.serverUrl||"",detail:r.username||"",profileName:r.name})),{placeHolder:t,ignoreFocusOut:!0});return n?n.profileName:null}async function Vh(t){let e={name:"",serverUrl:"",username:"",companies:[]};if(!await Ll(t,e,!0))return;let r=Xe();if(r.some(o=>o.name===e.name)){p.window.showErrorMessage(`EFx: Profile "${e.name}" already exists.`);return}r.push(e),await yr(r),r.length===1||await Kh(e.name)?await nn(t,e.name):p.window.showInformationMessage(`EFx: Profile "${e.name}" saved.`)}async function Kh(t){let e=await p.window.showQuickPick([{label:"Activate now",value:!0},{label:"Save only",value:!1}],{placeHolder:`Activate profile "${t}"?`,ignoreFocusOut:!0});return e?e.value:!1}async function Gh(t,e){let n=Xe(),r=n.findIndex(a=>a.name===e);if(r<0)return;let o=JSON.parse(JSON.stringify(n[r])),i=o.name;if(await Ll(t,o,!1)){if(o.name!==i){let a=await t.secrets.get(ze(i,"password")),c=await t.secrets.get(ze(i,"apiKey"));a&&await t.secrets.store(ze(o.name,"password"),a),c&&await t.secrets.store(ze(o.name,"apiKey"),c),await t.secrets.delete(ze(i,"password")),await t.secrets.delete(ze(i,"apiKey")),qe()===i&&await wr(o.name)}n[r]=o,await yr(n),qe()===o.name?await nn(t,o.name):p.window.showInformationMessage(`EFx: Profile "${o.name}" updated.`)}}async function Yh(t,e){if(await p.window.showWarningMessage(`Delete profile "${e}"? This will remove its stored credentials.`,{modal:!0},"Delete")!=="Delete")return;let r=Xe().filter(o=>o.name!==e);await yr(r),await t.secrets.delete(ze(e,"password")),await t.secrets.delete(ze(e,"apiKey")),qe()===e&&(await wr(""),await vr(""),V=null,pe=null,se.setClient(null),mt.setClient(null),ko()),p.window.showInformationMessage(`EFx: Profile "${e}" deleted.`)}async function Ll(t,e,n){let r=await p.window.showInputBox({...ht,prompt:n?"Profile name (e.g. Dev, Prod, Pilot)":"Profile name",value:e.name,validateInput:A=>!A||!A.trim()?"Name is required":/^[A-Za-z0-9_\-. ]+$/.test(A)?null:"Use letters, numbers, space, dash, dot, underscore"});if(r===void 0)return!1;e.name=r.trim();let o=await p.window.showInputBox({...ht,prompt:"Epicor Server URL",value:e.serverUrl,placeHolder:"https://your-epicor-server/your-app",validateInput:A=>!A||!A.trim()?"Server URL is required":null});if(o===void 0||(e.serverUrl=o.trim(),!await Jh(e)))return!1;let i=Ji(e)==="basic",s=await p.window.showInputBox({...ht,prompt:i?"Username":"Epicor user ID (sign-in itself goes through Entra)",value:e.username,validateInput:A=>!A||!A.trim()?"Username is required":null});if(s===void 0)return!1;e.username=s.trim();let a=n||!i?null:await t.secrets.get(ze(e.name,"password")),c=n&&i;if(!n&&i){let A=await p.window.showQuickPick([{label:"Keep existing password",value:!1},{label:"Change password",value:!0}],{placeHolder:"Password",ignoreFocusOut:!0});if(!A)return!1;c=A.value}if(c){let A=await p.window.showInputBox({...ht,prompt:`Password for ${e.username}`,password:!0,validateInput:N=>N?null:"Password is required"});if(A===void 0)return!1;await t.secrets.store(ze(e.name,"password"),A),a=A}let l=n?"":await t.secrets.get(ze(e.name,"apiKey"))||"",u=n;if(!n){let A=await p.window.showQuickPick([{label:"Keep existing API key",value:!1},{label:"Change API key",value:!0},{label:"Clear API key",value:"clear"}],{placeHolder:"API Key",ignoreFocusOut:!0});if(!A)return!1;A.value==="clear"?(await t.secrets.delete(ze(e.name,"apiKey")),l="",u=!1):u=A.value===!0}if(u){let A=await p.window.showInputBox({...ht,prompt:"API Key (leave blank if not required)",password:!0,value:""});if(A===void 0)return!1;await t.secrets.store(ze(e.name,"apiKey"),A||""),l=A||""}let m=await Xh(t,e,a,l);if(m===void 0)return!1;e.companies=m;let g=await p.window.showQuickPick([{label:"No \u2014 push manually",value:!1},{label:"Yes \u2014 auto-push on file save",value:!0}],{placeHolder:"Auto-push changes to Epicor when you save a .cs file?",ignoreFocusOut:!0});if(g===void 0)return!1;e.autoPush=g.value;let E=await p.window.showQuickPick([{label:"No \u2014 keep the local file after closing",value:!1},{label:"Yes \u2014 delete the local file when its tab is closed (only if fully saved)",value:!0}],{placeHolder:"Delete the local .cs file automatically when you close it?",ignoreFocusOut:!0});if(E===void 0)return!1;e.autoClean=E.value;let C=await p.window.showQuickPick(Ol.map(A=>({...A,description:(e.claudeAccess||"off")===A.value?"current":""})),{placeHolder:"Claude access for this profile (EFx MCP server)",ignoreFocusOut:!0});return C===void 0?!1:(e.claudeAccess=C.value,!0)}async function Jh(t){let e=Ji(t),n=await p.window.showQuickPick([{label:"Basic \u2014 username + password",description:e==="basic"?"current":"",value:"basic"},{label:"Entra SSO \u2014 Microsoft sign-in (cloud)",description:e==="entra"?"current":"",value:"entra"}],{placeHolder:"Authentication",ignoreFocusOut:!0});if(!n)return!1;if(t.authType=n.value,n.value==="basic")return delete t.clientId,delete t.tenantId,delete t.scope,!0;let r=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,o=/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/,i=await p.window.showInputBox({...ht,prompt:"Entra client ID \u2014 the Kinetic native app registration",value:t.clientId||"",validateInput:c=>r.test((c||"").trim())?null:"Client ID must be a GUID"});if(i===void 0)return!1;let s=await p.window.showInputBox({...ht,prompt:"Entra tenant ID (GUID) or domain",value:t.tenantId||"",validateInput:c=>{let l=(c||"").trim();return r.test(l)||o.test(l)?null:"Tenant must be a GUID or a domain"}});if(s===void 0)return!1;let a=await p.window.showInputBox({...ht,prompt:"API scope",placeHolder:"api://<webAppId>/<scopeName>",value:t.scope||"",validateInput:c=>{let l=(c||"").trim();return l?/\s/.test(l)?"One scope, no spaces":null:"Scope is required"}});return a===void 0?!1:(t.clientId=i.trim(),t.tenantId=s.trim(),t.scope=a.trim(),!0)}var Ol=[{label:"Off \u2014 Claude can't use this profile",value:"off"},{label:"Read \u2014 list, search, pull, compare",value:"read"},{label:"Read + write \u2014 push, create/delete, references, signatures, execute, profiles",value:"write"},{label:"Read + write + risky \u2014 also promote/demote libraries",value:"risky"}];async function Xh(t,e,n,r){let o=!e.companies||e.companies.length===0,i;if(o)i="fetch";else{let s=[],a=qe()===e.name,c=St();a&&e.companies.length>1&&s.push({label:"$(arrow-right) Switch active company",description:`currently ${c||"(none)"}`,value:"switch"}),s.push({label:"$(check) Keep current selection",description:(e.companies||[]).join(", "),value:"keep"}),s.push({label:"$(refresh) Re-fetch from server",description:"Discover companies again via UserFile",value:"fetch"}),s.push({label:"$(list-selection) Pick from current list",description:"Multi-select among already saved companies",value:"pick"}),s.push({label:"$(edit) Enter manually",description:"Comma-separated list",value:"manual"});let l=await p.window.showQuickPick(s,{placeHolder:"Companies",ignoreFocusOut:!0});if(!l)return;if(i=l.value,i==="keep")return e.companies;if(i==="switch"){let u=await p.window.showQuickPick(e.companies.map(m=>({label:`${m===c?"$(check) ":"$(blank) "}${m}`,company:m})),{placeHolder:`Active company (profile: ${e.name})`,ignoreFocusOut:!0});return u?(u.company!==c&&await Xi(t,u.company),e.companies):void 0}}if(i==="fetch"){let s=await Qh(e,n,r);return s===void 0?void 0:s}return i==="pick"?await _l(e.companies,e.companies):await Do(e.companies)}async function Qh(t,e,n){if(!e)return p.window.showWarningMessage("EFx: Cannot fetch companies \u2014 no password available. Falling back to manual entry."),await Do(t.companies);let r=t.companies&&t.companies[0]||"",o=await p.window.showInputBox({...ht,prompt:"Default company (used to authenticate the discovery call)",placeHolder:"your default company code",value:r,validateInput:l=>!l||!l.trim()?"Default company is required":null});if(o===void 0)return;let i=o.trim(),s;try{s=await p.window.withProgress({location:p.ProgressLocation.Notification,title:`Fetching companies for ${t.username}...`},async()=>await new At.EpicorClient(We.draftBasicConfig({serverUrl:t.serverUrl,company:i,username:t.username,password:e,apiKey:n})).getUserCompanies())}catch(l){return await p.window.showErrorMessage(`EFx: Could not fetch companies \u2014 ${l.message}`,{modal:!1},"Enter Manually","Cancel")!=="Enter Manually"?void 0:await Do([i])}if(!s||s.length===0)return await p.window.showWarningMessage(`EFx: Server returned no companies for user "${t.username}". Enter manually?`,"Enter Manually","Cancel")!=="Enter Manually"?void 0:await Do([i]);let a=Array.from(new Set([i,...s]));return await _l(a,a)}async function _l(t,e){let n=new Set(e||[]),r=t.map(i=>({label:i,picked:n.has(i)})),o=await p.window.showQuickPick(r,{canPickMany:!0,placeHolder:"Select companies to include in this profile",ignoreFocusOut:!0});if(o){if(o.length===0){p.window.showWarningMessage("EFx: At least one company is required.");return}return o.map(i=>i.label)}}async function Do(t){let e=await p.window.showInputBox({...ht,prompt:"Companies (comma-separated)",value:(t||[]).join(", "),validateInput:n=>!n||!n.trim()||n.split(",").map(o=>o.trim()).filter(Boolean).length===0?"At least one company is required":null});if(e!==void 0)return e.split(",").map(n=>n.trim()).filter(Boolean)}async function nn(t,e){let n=Xe().find(i=>i.name===e);if(!n){p.window.showErrorMessage(`EFx: Profile "${e}" not found.`);return}let r=await We.preflight(n);if(r){p.window.showErrorMessage(`EFx: ${r}`);return}let o=St();n.companies.includes(o)||(o=n.companies[0]),await wr(e),await vr(o),V=new At.EpicorClient(We.clientConfig(n,o)),se.setClient(V),pe=new Le.BpmClient(V),mt.setClient(pe),await se.refresh(),ko(),p.window.showInformationMessage(`EFx: Active profile "${e}" (company ${o})`)}async function Zh(t){let e=Xe();if(e.length===0){await p.window.showInformationMessage("EFx: No profiles configured. Create one?","Create Profile")==="Create Profile"&&await $l(t);return}let n=qe(),r=await p.window.showQuickPick(e.map(o=>({label:`${o.name===n?"$(check) ":"$(blank) "}${o.name}`,description:o.serverUrl||"",profileName:o.name})),{placeHolder:"Switch to profile",ignoreFocusOut:!0});r&&await nn(t,r.profileName)}async function eg(t){let e=Rn();if(!e){p.window.showWarningMessage("EFx: No active profile. Manage Profiles first.");return}if(!e.companies||e.companies.length===0){p.window.showWarningMessage(`EFx: Profile "${e.name}" has no companies configured. Edit the profile to add some.`);return}if(e.companies.length===1){p.window.showInformationMessage(`EFx: Only one company in profile "${e.name}" (${e.companies[0]}).`);return}let n=St(),r=await p.window.showQuickPick(e.companies.map(o=>({label:`${o===n?"$(check) ":"$(blank) "}${o}`,company:o})),{placeHolder:`Active company (profile: ${e.name})`,ignoreFocusOut:!0});r&&r.company!==n&&await Xi(t,r.company)}async function Xi(t,e){let n=Rn();if(!n)return;if(!n.companies.includes(e)){p.window.showErrorMessage(`EFx: "${e}" is not in profile "${n.name}".`);return}let r=await We.preflight(n);if(r){p.window.showErrorMessage(`EFx: ${r}`);return}await vr(e),V=new At.EpicorClient(We.clientConfig(n,e)),se.setClient(V),pe=new Le.BpmClient(V),mt.setClient(pe),await se.refresh(),ko(),p.window.showInformationMessage(`EFx: Active company \u2192 ${e}`)}async function Fl(){let t=p.workspace.getConfiguration("efx"),e=t.get("storageLocation");if(e&&String(e).trim())return String(e).trim();let n=await p.window.showQuickPick([{label:"Use default location (VS Code internal storage)",value:"default"},{label:"Choose a folder...",value:"custom"}],{placeHolder:"EFx: Where should pulled functions and BPM directives be stored?",ignoreFocusOut:!0});if(!n)return null;let r;if(n.value==="default")r=me.join(Tl.globalStorageUri.fsPath,"EpicorExtension");else{let o=await p.window.showOpenDialog({canSelectFolders:!0,canSelectFiles:!1,canSelectMany:!1,openLabel:"Select EFx Storage Folder"});if(!o||o.length===0)return null;r=me.join(o[0].fsPath,"EpicorExtension")}return Ce.mkdirSync(r,{recursive:!0}),await t.update("storageLocation",r,p.ConfigurationTarget.Global),p.window.showInformationMessage(`EFx: Storage location set to ${r}`),r}async function Co(){let t=await Fl();if(!t)return null;let n=(qe()||"Default").replace(/[^a-zA-Z0-9_\-. ]/g,"_");return me.join(t,n)}function Pl(t){let e=p.workspace.getConfiguration("efx").get("storageLocation"),n=e&&String(e).trim();return!n||!t?null:me.join(n,String(t).replace(/[^a-zA-Z0-9_\-. ]/g,"_"))}async function Eo(){let t=await Co();return t?me.join(t,"Libraries"):null}function Wi(t){return String(t||"").replace(/[^a-zA-Z0-9_\-. ]/g,"_")}function tg(t){let e;try{e=Ce.readFileSync(t,"utf-8")}catch{return{}}let n={};for(let r of e.split(/\r?\n/).slice(0,12)){let o=r.match(/^\/\/\s*([A-Za-z ]+):\s*(.*)$/);o&&(n[o[1].trim()]=o[2].trim())}return n}function ng(t){return t?t.kind==="bpm"?pe?Nh(pe,{DirectiveID:t.directiveId,Source:t.source||"BO",BpMethodCode:t.bpMethodCode,Name:t.name,DirectiveType:t.directiveType}):null:V?kl(V,t.libraryId,t.functionId):null:null}async function xo(t,e){let n=ng(e.widgetMeta);if(!n)return p.window.showWarningMessage("EFx: Configure connection first"),{ok:!1,message:"EFx: Configure connection first"};let{content:r}=Mn(Ce.readFileSync(t,"utf-8"));return await p.window.withProgress({location:p.ProgressLocation.Notification,title:`Pushing widget ${e.nodeId}...`},async()=>{try{return await Il(n,e.nodeId,r),p.window.showInformationMessage(`${n.heading}: widget "${e.nodeId}" saved.`),e.widgetMeta.kind==="efx"&&(se.invalidateCache(e.widgetMeta.libraryId),gr()),{ok:!0,message:`${n.heading}: widget "${e.nodeId}" saved.`}}catch(o){return p.window.showErrorMessage(`Widget push failed: ${o.message}`),{ok:!1,message:`Widget push failed: ${o.message}`}}})}async function en(t){let e=ge(t),n=Me.get(e);if(n)return n;if(!t.endsWith(".cs")||!Ce.existsSync(t))return null;let r=tg(t),o=r["Widget Code"]?String(r["Widget Code"]).split(" (")[0].trim():null;if(r["BPM Directive"]&&r.Method&&r.DirectiveID){if(!pe)return null;let i=r.Method,s=r.DirectiveID,a=Le.bpmSourceOf({Source:r.Source}),c=Le.directiveTypeFromLabel(a,r.Type);try{let l=null;if(a==="BO"){let m=await pe.getBpmMethod("BO",i),g=m?.BpMethod?.[0],E=m?.BpArgument||[];l=g?Le.buildFunctionDefinition(g,E):null}let u={libraryId:"__BPM__",functionId:s,bpmMethodCode:i,source:a,directiveId:s,directiveType:c,isBpm:!0,functionDefinition:l};return o&&(u.isWidgetCode=!0,u.nodeId=o,u.widgetMeta={kind:"bpm",source:a,bpMethodCode:i,directiveId:s,directiveType:c,name:r["BPM Directive"]}),Me.set(e,u),u}catch{return null}}if(r["EFx Function"]){if(o){let l=String(r["EFx Function"]).indexOf("."),u=l>0?String(r["EFx Function"]).slice(0,l):me.basename(me.dirname(me.dirname(t))),m=l>0?String(r["EFx Function"]).slice(l+1):me.basename(me.dirname(t)),g={libraryId:u,functionId:m,isWidgetCode:!0,nodeId:o,widgetMeta:{kind:"efx",libraryId:u,functionId:m}};return Me.set(e,g),g}let i=me.basename(t,".cs"),s=me.basename(me.dirname(t)),a=r.Widget?String(r.Widget).split(" (")[0].trim():null,c={libraryId:s,functionId:i,widgetNodeId:a};return Me.set(e,c),c}return null}async function rg(t){let e=qe();if(!e)return;let n=Xe().find(o=>o.name===e);if(!n||await We.preflight(n))return;let r=St();n.companies.includes(r)||(r=n.companies[0]||""),r&&(r!==St()&&await vr(r),V=new At.EpicorClient(We.clientConfig(n,r)),se.setClient(V),pe=new Le.BpmClient(V),mt.setClient(pe))}function og(){}
