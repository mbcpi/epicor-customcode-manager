"use strict";var re=(t,e)=>()=>{try{return e||t((e={exports:{}}).exports,e),e.exports}catch(n){throw e=0,n}};var Kn=re(Ge=>{"use strict";var Ms=Ge&&Ge.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),Ps=Ge&&Ge.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),Ho=Ge&&Ge.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&Ms(n,e,r[o]);return Ps(n,e),n}})();Object.defineProperty(Ge,"__esModule",{value:!0});Ge.EpicorClient=void 0;var qo=Ho(require("https")),jo=Ho(require("http")),jr=class t{constructor(e){this.config=e}getHeaders(){let n={"Content-Type":"application/json",Authorization:`Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64")}`};return this.config.apiKey&&(n["x-api-key"]=this.config.apiKey),n}getDesignerUrl(e){return`${this.config.serverUrl.replace(/\/$/,"")}/api/v2/odata/${this.config.company}/Ice.LIB.EfxLibraryDesignerSvc/${e}`}getEfxUrl(e,n,r,o=!1){let i=this.config.serverUrl.replace(/\/$/,""),a=r||this.config.company;return o?`${i}/api/v2/efx/staging/${a}/${e}/${n}`:`${i}/api/v2/efx/${a}/${e}/${n}`}async request(e,n){let r=await this.requestRaw(e,typeof n=="string"?n:JSON.stringify(n));try{return r?JSON.parse(r):{}}catch{return r}}async requestGet(e){return new Promise((n,r)=>{let o=new URL(e),i=o.protocol==="https:",a=i?qo:jo,s={hostname:o.hostname,port:o.port||(i?443:80),path:o.pathname+o.search,method:"GET",headers:this.getHeaders(),rejectUnauthorized:!1},l=a.request(s,c=>{let p="";c.on("data",w=>{p+=w}),c.on("end",()=>{if(c.statusCode&&c.statusCode>=200&&c.statusCode<300)try{n(p?JSON.parse(p):{})}catch{n(p)}else{let w=`HTTP ${c.statusCode}`;try{let b=JSON.parse(p);w=b.ErrorMessage||b.error?.message||JSON.stringify(b,null,2)}catch{w=p||w}r(new Error(w))}})});l.on("error",r),l.end()})}async getUserCompanies(){let e=this.config.serverUrl.replace(/\/$/,""),n=encodeURIComponent(this.config.username),r=`${e}/api/v2/odata/${this.config.company}/Ice.BO.UserFileSvc/UserFiles('${n}')/UserComps?$select=Company,Name`,o=await this.requestGet(r);return(Array.isArray(o?.value)?o.value:[]).map(a=>a.Company).filter(Boolean)}async requestRaw(e,n){return new Promise((r,o)=>{let i=new URL(e),a=i.protocol==="https:",s=a?qo:jo,l={hostname:i.hostname,port:i.port||(a?443:80),path:i.pathname+i.search,method:"POST",headers:{...this.getHeaders(),"Content-Length":Buffer.byteLength(n)},rejectUnauthorized:!1},c=s.request(l,p=>{let w="";p.on("data",b=>{w+=b}),p.on("end",()=>{if(p.statusCode&&p.statusCode>=200&&p.statusCode<300)r(w);else{let b=`HTTP ${p.statusCode}`;try{let S=JSON.parse(w);b=S.ErrorMessage||S.error?.message||JSON.stringify(S,null,2)}catch{b=w||b}console.error("EFx HTTP failure status:",p.statusCode),console.error("EFx HTTP failure body:",w),o(new Error(b))}})});c.on("error",o),c.write(n),c.end()})}async getLibraryList(){return(await this.request(this.getDesignerUrl("GetLibraryList"),{options:{kind:0,startsWith:"",rollOutMode:2,status:0}})).returnObj?.EfxLibraryList||[]}async getLibrary(e){return(await this.request(this.getDesignerUrl("GetLibrary"),{libraryId:e})).returnObj}async getDefaults(){return(await this.request(this.getDesignerUrl("GetDefaults"),{})).returnObj}async getDefaultsRaw(){let e=await this.requestRaw(this.getDesignerUrl("GetDefaults"),"{}"),n=e.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);return n?n[1]:e}async getLibraryRaw(e){let n=await this.requestRaw(this.getDesignerUrl("GetLibrary"),JSON.stringify({libraryId:e})),r=n.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);return r?r[1]:n}async applyChangesRaw(e){let n=`{"libraryTableset":${e}}`,r=await this.requestRaw(this.getDesignerUrl("ApplyChangesWithDiagnostics"),n);try{let o=JSON.parse(r);return{diagnostics:o.returnObj?.diagnostics||o.parameters?.diagnostics||[]}}catch{return{diagnostics:[]}}}async applyChanges(e){let n=await this.request(this.getDesignerUrl("ApplyChangesWithDiagnostics"),{libraryTableset:e});return{tableset:n.returnObj?.libraryTableset||n.parameters?.libraryTableset||e,diagnostics:n.returnObj?.diagnostics||n.parameters?.diagnostics||[]}}async saveFunctionBody(e,n,r){let o=await this.getLibraryRaw(e),i=this._patchFunctionBody(o,n,r,"U"),{diagnostics:a}=await this.applyChangesRaw(i),s=(a||[]).filter(l=>typeof l=="object"?(l.Severity??2)>=2:/\berror\b/i.test(String(l)));if(s.length)throw new Error(s.map(l=>typeof l=="object"?l.Message||JSON.stringify(l):String(l)).join("; "));return{diagnostics:a||[]}}async promoteToProduction(e){await this.request(this.getDesignerUrl("PromoteToProduction"),{libraryID:e})}async regenerateLibrary(e){let n=await this.request(this.getDesignerUrl("RegenerateLibrary"),{libraryID:e});return console.log("EFx Regenerate raw result:",JSON.stringify(n,null,2)),{errors:n.returnObj?.BOUpdError||n.returnObj?.BOUpdErrorList||n.returnObj?.BOUpdErrorTableset?.BOUpdError||n.parameters?.result?.BOUpdError||n.parameters?.result?.BOUpdErrorList||n.parameters?.result?.BOUpdErrorTableset?.BOUpdError||n.parameters?.errors||n.errors||[],raw:n}}async demoteFromProduction(e){await this.request(this.getDesignerUrl("DemoteFromProduction"),{libraryID:e})}async lockLibrary(e){await this.request(this.getDesignerUrl("LockLibrary"),{libraryID:e})}async releaseLibrary(e){await this.request(this.getDesignerUrl("ReleaseLibrary"),{libraryID:e})}async validateFunctionRaw(e,n,r,o){let i=await this.getLibraryRaw(e),a=t.packCode(r,o||""),l=`{"libraryTableset":${this._patchFunctionBody(i,n,a,"U")}}`,c=await this.requestRaw(this.getDesignerUrl("ApplyChangesWithDiagnostics"),l);try{let p=JSON.parse(c),w=p.returnObj?.diagnostics||p.parameters?.diagnostics||[],b=w.some(S=>typeof S=="object"?(S.Severity??2)>=2:/\berror\b/i.test(String(S)));return{diagnostics:w,saved:!b,newBody:a}}catch{return{diagnostics:[],saved:!1,newBody:a}}}async validateFunctionViaWrapper(e,n,r,o,i="Utilities",a="ApplyChangesWithDiagnostics",s=null){let l=s;if((!l?.EfxLibrary?.[0]||!l.EfxFunction?.some(D=>D.FunctionID===n))&&(l=await this.getLibrary(e)),!l?.EfxLibrary?.[0]){let D=`Library '${e}' not found`;return{saved:!1,diagnostics:[{Severity:2,Message:D}],errors:[D],outResult:"",outMsg:"",raw:null,newBody:null}}let c=l.EfxFunction?.find(D=>D.FunctionID===n);if(!c){let D=`Function '${n}' not found in library '${e}'`;return{saved:!1,diagnostics:[{Severity:2,Message:D}],errors:[D],outResult:"",outMsg:"",raw:null,newBody:null}}let p={...l.EfxLibrary[0],RowMod:"U"},w={...c,Code:r,Usings:o||"",Body:"",RowMod:"U"},b={EfxLibrary:[p],EfxFunction:[w]},S;try{S=await this.request(this.getEfxUrl(i,a),{inFunctionID:n,inDS:b})}catch(D){if(/HTTP 404/.test(D.message))try{let B=await this.validateFunctionRaw(e,n,r,o);return{saved:B.saved,diagnostics:B.diagnostics||[],errors:B.saved?[]:B.diagnostics?.map(O=>O.Message||String(O))||["Save failed"],outResult:B.saved?"Success":"",outMsg:B.saved?"Saved Successfully":"Save failed",raw:null,newBody:B.saved?B.newBody:null}}catch(B){let O=B.message||String(B);return{saved:!1,diagnostics:[{Severity:2,Message:O}],errors:[O],outResult:"",outMsg:O,raw:null,newBody:null}}throw D}return this._parseWrapperOutput(S,r,o)}_parseWrapperOutput(e,n,r){let o=e?.outMsg??e?.parameters?.outMsg??"",i=e?.outResult??e?.parameters?.outResult??"",a=e?.outSuccess??e?.parameters?.outSuccess??!1,s=[],l=new Set,c=E=>{let C=E.trim();C&&!l.has(C)&&(l.add(C),s.push(C))};for(let E of String(o).split(/\r?\n/)){let C=E.match(/^Error:\s*(.+)$/i);if(C){c(C[1]);continue}/\(\d+,\d+\):\s*(?:error|warning)\s+CS/i.test(E)&&c(E)}let p=s.filter(E=>!/\(\d+,\d+\):\s*warning\s+CS/i.test(E)),w=a===!0||p.length===0&&/Saved Successfully/i.test(o),b=s.map(E=>{let C=E.match(/\((\d+),(\d+)\):\s*(?:error|warning)/i)||E.match(/\((\d+),(\d+)\)/)||E.match(/\bline\s+(\d+)/i);return{Severity:/\(\d+,\d+\):\s*warning\s+CS/i.test(E)?1:2,Message:E,Line:C?parseInt(C[1],10):void 0,Column:C&&C[2]!==void 0?parseInt(C[2],10):void 0}}),S=String(n).split(/\r?\n/),D=new Map;for(let E of b){if(!E.Line||!E.Column)continue;let C=E.Message.match(/'([^']+)'/);if(!(!C||!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(C[1]))){for(let T=0;T<S.length;T++)if(S[T].slice(E.Column-1).startsWith(C[1])){let L=E.Line-(T+1);L>=0&&D.set(L,(D.get(L)||0)+1)}}}let B=0,O=0,$=!1;for(let[E,C]of D)C>O?(O=C,B=E,$=!1):C===O&&E!==B&&($=!0);if(O>0&&!$&&B>0)for(let E of b)E.Line&&(E.Line=Math.max(1,E.Line-B));return{saved:w,diagnostics:b,errors:s,outResult:i,outMsg:o,raw:e,newBody:t.packCode(n,r||"")}}async applyFunctionsViaWrapper(e,n,r,o="Utilities",i="ApplyChangesWithDiagnostics"){let a={...r.EfxLibrary[0],RowMod:"U"},s=n.map($=>{let E=r.EfxFunction.find(C=>C.FunctionID===$.functionId);if(!E)throw new Error(`Function '${$.functionId}' not found in library '${e}'`);return{...E,Code:$.code,Usings:$.usings||"",Body:"",RowMod:"U"}}),l=await this.request(this.getEfxUrl(o,i),{inFunctionID:"",inDS:{EfxLibrary:[a],EfxFunction:s}}),c=l?.outMsg??l?.parameters?.outMsg??"",p=l?.outResult??l?.parameters?.outResult??"";if(/FunctionID '' not found in inDS\.EfxFunction/.test(c))return{saved:!1,perFunction:{},outMsg:c,outResult:p,oldWrapper:!0};let w=String(c).split(/\r?\n/),b=n.map($=>$.functionId),S=$=>{let E=$.match(/(?:^|[\s:\\/])([A-Za-z_][A-Za-z0-9_]*)\.cs\(\d+,\d+\)/);return E&&b.includes(E[1])?E[1]:null},D=w.filter($=>/^(Error|Unexpected|Message|Inner):/i.test($)&&!S($)),B={};for(let $ of n){let C=[...w.filter(L=>S(L)===$.functionId),...D,.../Saved Successfully/i.test(c)?["Saved Successfully"]:[]].join(`
`),T=l?.outSuccess??l?.parameters?.outSuccess??!1;B[$.functionId]=this._parseWrapperOutput({outMsg:C,outResult:p,outSuccess:T},$.code,$.usings)}return{saved:(l?.outSuccess??l?.parameters?.outSuccess)===!0||/Saved Successfully/i.test(c)&&!w.some($=>/^Error:/i.test($)),perFunction:B,outMsg:c,outResult:p,oldWrapper:!1}}_patchFunctionBody(e,n,r,o){let i=`"FunctionID":${JSON.stringify(n)}`,a=JSON.stringify(r),s=this._setParentLibraryRowMod(e,o),l=s.indexOf('"EfxFunction":[');if(l<0)throw new Error("EfxFunction array not found");let p=s.indexOf("[",l)+1;for(;p<s.length;){let w=s.indexOf("{",p);if(w<0)break;let b=this._findJsonObjectEnd(s,w,"EfxFunction row"),S=s.slice(w,b+1);if(!S.includes(i)){p=b+1;continue}let D=this._replaceJsonStringValue(S,"Body",a);return D=this._replaceJsonStringValue(D,"RowMod",JSON.stringify(o)),s.slice(0,w)+D+s.slice(b+1)}throw new Error(`Function ${n} not found in raw tableset`)}_setParentLibraryRowMod(e,n){let r=e.indexOf('"EfxLibrary":[');if(r<0)throw new Error("EfxLibrary array not found");let o=e.indexOf("[",r),i=e.indexOf("{",o);if(i<0)throw new Error("No EfxLibrary row found");let a=this._findJsonObjectEnd(e,i,"EfxLibrary row"),s=e.slice(i,a+1),l=this._replaceJsonStringValue(s,"RowMod",JSON.stringify(n));return e.slice(0,i)+l+e.slice(a+1)}_findJsonObjectEnd(e,n,r){let o=0,i=!1,a=!1;for(let s=n;s<e.length;s++){let l=e[s];if(i){if(a){a=!1;continue}if(l==="\\"){a=!0;continue}l==='"'&&(i=!1);continue}if(l==='"'){i=!0;continue}if(l==="{")o++;else if(l==="}"&&(o--,o===0))return s}throw new Error(`Malformed ${r}`)}_replaceJsonStringValue(e,n,r){let o=`"${n}":`,i=e.lastIndexOf(o);if(i<0)throw new Error(`${n} not found in object`);let a=i+o.length;for(;/\s/.test(e[a]||"");)a++;if(e[a]!=='"')throw new Error(`${n} value is not a JSON string`);let s=a+1,l=!1;for(;s<e.length;s++){let c=e[s];if(l){l=!1;continue}if(c==="\\"){l=!0;continue}if(c==='"')break}return e.slice(0,a)+r+e.slice(s+1)}async executeFunction(e,n,r,o,i=!1){let a=this.getEfxUrl(e,n,o,i);return this.request(a,r)}async saveSignatures(e,n,r){let o=await this.getLibraryRaw(e),i=JSON.parse(o);if(!i?.EfxLibrary?.[0])throw new Error(`Library '${e}' not found`);if(!i.EfxFunction?.find(C=>C.FunctionID===n))throw new Error(`Function '${n}' not found in library '${e}'`);let a=(i.EfxFunctionSignature||[]).filter(C=>C.FunctionID===n),s=(i.EfxFunctionSignature||[]).reduce((C,T)=>Math.max(C,T.ParameterID||0),0)+1,c=o.indexOf('"EfxFunctionSignature":[');if(c<0)throw new Error("EfxFunctionSignature array not found");let p=o.indexOf("[",c),w=this._rawFindClose(o,p,"[","]"),b=[],S=p+1;for(;S<w;){let C=o.indexOf("{",S);if(C<0||C>=w)break;let T=this._rawFindClose(o,C,"{","}");if(T<0||T>=w)break;let L=o.slice(C,T+1),h=null;try{h=JSON.parse(L)}catch{}b.push({objStr:L,sigData:h}),S=T+1}let D=[];for(let{objStr:C,sigData:T}of b)(!T||T.FunctionID!==n)&&D.push(C);for(let C of r){let T=a.find(L=>L.ArgumentName===C.ArgumentName&&!!L.Response==!!C.Response);if(T){let{objStr:L}=b.find(d=>d.sigData?.ArgumentName===T.ArgumentName&&!!d.sigData?.Response==!!T.Response)||{};if(!L)continue;if(!(T.DataType!==(C.DataType??T.DataType)||T.DataTypeInfo!==(C.DataTypeInfo??T.DataTypeInfo)||!!T.Optional!=!!(C.Optional??T.Optional)||T.DefaultValue!==(C.DefaultValue??T.DefaultValue)||T.Order!==(C.Order??T.Order)))D.push(L);else{let d=L;d=this._rawSetStringProp(d,"DataType",C.DataType??T.DataType),d=this._rawSetStringProp(d,"DataTypeInfo",C.DataTypeInfo??T.DataTypeInfo??""),d=this._rawSetBoolProp(d,"Optional",C.Optional??T.Optional??!1),d=this._rawSetStringProp(d,"DefaultValue",C.DefaultValue??T.DefaultValue??""),d=this._rawSetIntProp(d,"Order",C.Order??T.Order),d=this._rawSetStringProp(d,"RowMod","U"),D.push(L),D.push(d)}}else{let L={LibraryID:e,FunctionID:n,Response:!!C.Response,ParameterID:s++,ArgumentName:C.ArgumentName,Order:C.Order??D.length,DataType:C.DataType||"System.String",DataTypeInfo:C.DataTypeInfo||"",Optional:C.Optional??!1,DefaultValue:C.DefaultValue??"",SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",BitFlag:0,RowMod:"A"};D.push(JSON.stringify(L))}}for(let C of a)if(!r.some(L=>L.ArgumentName===C.ArgumentName&&!!L.Response==!!C.Response)){let{objStr:L}=b.find(d=>d.sigData?.ArgumentName===C.ArgumentName&&!!d.sigData?.Response==!!C.Response)||{};if(!L)continue;let h=this._rawSetStringProp(L,"RowMod","D");D.push(L),D.push(h)}let B=o.slice(0,p+1)+D.join(",")+o.slice(w);B=this._setParentLibraryRowMod(B,"U"),B=this._setEfxFunctionRowMod(B,n,"U"),JSON.parse(B);let O=await this.applyChangesRaw(B),$=(O.diagnostics||[]).some(C=>typeof C=="object"?(C.Severity??2)>=2:/\berror\b/i.test(String(C))),E=r.map((C,T)=>{let L=a.find(h=>h.ArgumentName===C.ArgumentName&&!!h.Response==!!C.Response);return L?{...L,DataType:C.DataType??L.DataType,DataTypeInfo:C.DataTypeInfo??L.DataTypeInfo??"",Optional:C.Optional??L.Optional??!1,DefaultValue:C.DefaultValue??L.DefaultValue??"",Order:C.Order??T}:{LibraryID:e,FunctionID:n,Response:!!C.Response,ArgumentName:C.ArgumentName,DataType:C.DataType||"System.String",DataTypeInfo:C.DataTypeInfo||"",Optional:C.Optional??!1,DefaultValue:C.DefaultValue??"",Order:C.Order??T}});return{saved:!$,diagnostics:O.diagnostics||[],updatedSigs:E}}_rawFindClose(e,n,r,o){let i=0,a=!1,s=!1;for(let l=n;l<e.length;l++){let c=e[l];if(a){if(s){s=!1;continue}if(c==="\\"){s=!0;continue}c==='"'&&(a=!1);continue}if(c==='"'){a=!0;continue}if(c===r)i++;else if(c===o&&(i--,i===0))return l}return-1}_rawSetStringProp(e,n,r){let o=`"${n}":`,i=e.indexOf(o);if(i<0)throw new Error(`Property "${n}" not found`);let a=i+o.length;for(;e[a]===" ";)a++;let s;if(e[a]==='"'){s=a+1;let l=!1;for(;s<e.length;s++){let c=e[s];if(l){l=!1;continue}if(c==="\\"){l=!0;continue}if(c==='"'){s++;break}}}else for(s=a;s<e.length&&e[s]!==","&&e[s]!=="}"&&e[s]!==" "&&e[s]!==`
`&&e[s]!=="\r";)s++;return e.slice(0,a)+JSON.stringify(r)+e.slice(s)}_rawSetBoolProp(e,n,r){let o=`"${n}":`,i=e.indexOf(o);if(i<0)throw new Error(`Property "${n}" not found`);let a=i+o.length;for(;e[a]===" ";)a++;let s=a;for(;s<e.length&&e[s]!==","&&e[s]!=="}"&&e[s]!==" ";)s++;return e.slice(0,a)+(r?"true":"false")+e.slice(s)}_rawSetIntProp(e,n,r){let o=`"${n}":`,i=e.indexOf(o);if(i<0)throw new Error(`Property "${n}" not found`);let a=i+o.length;for(;e[a]===" ";)a++;let s=a;for(;s<e.length&&e[s]!==","&&e[s]!=="}"&&e[s]!==" ";)s++;return e.slice(0,a)+String(Math.floor(r))+e.slice(s)}_setEfxFunctionRowMod(e,n,r){let o=`"FunctionID":${JSON.stringify(n)}`,i=e.indexOf('"EfxFunction":[');if(i<0)throw new Error("EfxFunction array not found");let s=e.indexOf("[",i)+1;for(;s<e.length;){let l=e.indexOf("{",s);if(l<0)break;let c=this._findJsonObjectEnd(e,l,"EfxFunction row"),p=e.slice(l,c+1);if(p.includes(o)){let w=this._replaceJsonStringValue(p,"RowMod",JSON.stringify(r));return e.slice(0,l)+w+e.slice(c+1)}s=c+1}throw new Error(`EfxFunction row for '${n}' not found`)}static extractCode(e){try{let n=JSON.parse(e);return{code:n.Code||"",usings:n.Usings||""}}catch{return{code:e,usings:""}}}static packCode(e,n=""){return JSON.stringify({Code:e,Usings:n})}};Ge.EpicorClient=jr});var Dt=re(Ce=>{"use strict";function Rs(t,e,n){if(n===void 0&&(n=Array.prototype),t&&typeof n.find=="function")return n.find.call(t,e);for(var r=0;r<t.length;r++)if(Et(t,r)){var o=t[r];if(e.call(void 0,o,r,t))return o}}function Pt(t,e){return e===void 0&&(e=Object),e&&typeof e.getOwnPropertyDescriptors=="function"&&(t=e.create(null,e.getOwnPropertyDescriptors(t))),e&&typeof e.freeze=="function"?e.freeze(t):t}function Et(t,e){return Object.prototype.hasOwnProperty.call(t,e)}function Us(t,e){if(t===null||typeof t!="object")throw new TypeError("target is not an object");for(var n in e)Et(e,n)&&(t[n]=e[n]);return t}var Wo=Pt({allowfullscreen:!0,async:!0,autofocus:!0,autoplay:!0,checked:!0,controls:!0,default:!0,defer:!0,disabled:!0,formnovalidate:!0,hidden:!0,ismap:!0,itemscope:!0,loop:!0,multiple:!0,muted:!0,nomodule:!0,novalidate:!0,open:!0,playsinline:!0,readonly:!0,required:!0,reversed:!0,selected:!0});function qs(t){return Et(Wo,t.toLowerCase())}var Vo=Pt({area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function js(t){return Et(Vo,t.toLowerCase())}var gn=Pt({script:!1,style:!1,textarea:!0,title:!0});function Hs(t){var e=t.toLowerCase();return Et(gn,e)&&!gn[e]}function Ws(t){var e=t.toLowerCase();return Et(gn,e)&&gn[e]}function zo(t){return t===bn.HTML}function Vs(t){return zo(t)||t===bn.XML_XHTML_APPLICATION}var bn=Pt({HTML:"text/html",XML_APPLICATION:"application/xml",XML_TEXT:"text/xml",XML_XHTML_APPLICATION:"application/xhtml+xml",XML_SVG_IMAGE:"image/svg+xml"}),zs=Object.keys(bn).map(function(t){return bn[t]});function Ks(t){return zs.indexOf(t)>-1}var Gs=Pt({HTML:"http://www.w3.org/1999/xhtml",SVG:"http://www.w3.org/2000/svg",XML:"http://www.w3.org/XML/1998/namespace",XMLNS:"http://www.w3.org/2000/xmlns/"});Ce.assign=Us;Ce.find=Rs;Ce.freeze=Pt;Ce.HTML_BOOLEAN_ATTRIBUTES=Wo;Ce.HTML_RAW_TEXT_ELEMENTS=gn;Ce.HTML_VOID_ELEMENTS=Vo;Ce.hasDefaultHTMLNamespace=Vs;Ce.hasOwn=Et;Ce.isHTMLBooleanAttribute=qs;Ce.isHTMLRawTextElement=Hs;Ce.isHTMLEscapableRawTextElement=Ws;Ce.isHTMLMimeType=zo;Ce.isHTMLVoidElement=js;Ce.isValidMimeType=Ks;Ce.MIME_TYPE=bn;Ce.NAMESPACE=Gs});var Dn=re(En=>{"use strict";var Ys=Dt();function Go(t,e){t.prototype=Object.create(Error.prototype,{constructor:{value:t},name:{value:t.name,enumerable:!0,writable:e}})}var vn=Ys.freeze({Error:"Error",IndexSizeError:"IndexSizeError",DomstringSizeError:"DomstringSizeError",HierarchyRequestError:"HierarchyRequestError",WrongDocumentError:"WrongDocumentError",InvalidCharacterError:"InvalidCharacterError",NoDataAllowedError:"NoDataAllowedError",NoModificationAllowedError:"NoModificationAllowedError",NotFoundError:"NotFoundError",NotSupportedError:"NotSupportedError",InUseAttributeError:"InUseAttributeError",InvalidStateError:"InvalidStateError",SyntaxError:"SyntaxError",InvalidModificationError:"InvalidModificationError",NamespaceError:"NamespaceError",InvalidAccessError:"InvalidAccessError",ValidationError:"ValidationError",TypeMismatchError:"TypeMismatchError",SecurityError:"SecurityError",NetworkError:"NetworkError",AbortError:"AbortError",URLMismatchError:"URLMismatchError",QuotaExceededError:"QuotaExceededError",TimeoutError:"TimeoutError",InvalidNodeTypeError:"InvalidNodeTypeError",DataCloneError:"DataCloneError",EncodingError:"EncodingError",NotReadableError:"NotReadableError",UnknownError:"UnknownError",ConstraintError:"ConstraintError",DataError:"DataError",TransactionInactiveError:"TransactionInactiveError",ReadOnlyError:"ReadOnlyError",VersionError:"VersionError",OperationError:"OperationError",NotAllowedError:"NotAllowedError",OptOutError:"OptOutError"}),Yo=Object.keys(vn);function Jo(t){return typeof t=="number"&&t>=1&&t<=25}function Js(t){return typeof t=="string"&&t.substring(t.length-vn.Error.length)===vn.Error}function wn(t,e){Jo(t)?(this.name=Yo[t],this.message=e||""):(this.message=t,this.name=Js(e)?e:vn.Error),Error.captureStackTrace&&Error.captureStackTrace(this,wn)}Go(wn,!0);Object.defineProperties(wn.prototype,{code:{enumerable:!0,get:function(){var t=Yo.indexOf(this.name);return Jo(t)?t:0}}});var Xo={INDEX_SIZE_ERR:1,DOMSTRING_SIZE_ERR:2,HIERARCHY_REQUEST_ERR:3,WRONG_DOCUMENT_ERR:4,INVALID_CHARACTER_ERR:5,NO_DATA_ALLOWED_ERR:6,NO_MODIFICATION_ALLOWED_ERR:7,NOT_FOUND_ERR:8,NOT_SUPPORTED_ERR:9,INUSE_ATTRIBUTE_ERR:10,INVALID_STATE_ERR:11,SYNTAX_ERR:12,INVALID_MODIFICATION_ERR:13,NAMESPACE_ERR:14,INVALID_ACCESS_ERR:15,VALIDATION_ERR:16,TYPE_MISMATCH_ERR:17,SECURITY_ERR:18,NETWORK_ERR:19,ABORT_ERR:20,URL_MISMATCH_ERR:21,QUOTA_EXCEEDED_ERR:22,TIMEOUT_ERR:23,INVALID_NODE_TYPE_ERR:24,DATA_CLONE_ERR:25},Hr=Object.entries(Xo);for(yn=0;yn<Hr.length;yn++)Ko=Hr[yn][0],wn[Ko]=Hr[yn][1];var Ko,yn;function Wr(t,e,n){this.message=t,this.locator=e,this.cause=n,Error.captureStackTrace&&Error.captureStackTrace(this,Wr)}Go(Wr);En.DOMException=wn;En.DOMExceptionName=vn;En.ExceptionCode=Xo;En.ParseError=Wr});var Xr=re(W=>{"use strict";function ri(t){try{typeof t!="function"&&(t=RegExp);var e=new t("\u{1D306}","u").exec("\u{1D306}");return!!e&&e[0].length===2}catch{}return!1}var qt=ri();function lt(t){if(t.source[0]!=="[")throw new Error(t+" can not be used with chars");return t.source.slice(1,t.source.lastIndexOf("]"))}function Rt(t,e){if(t.source[0]!=="[")throw new Error("/"+t.source+"/ can not be used with chars_without");if(!e||typeof e!="string")throw new Error(JSON.stringify(e)+" is not a valid search");if(t.source.indexOf(e)===-1)throw new Error('"'+e+'" is not is /'+t.source+"/");if(e==="-"&&t.source.indexOf(e)!==1)throw new Error('"'+e+'" is not at the first postion of /'+t.source+"/");return new RegExp(t.source.replace(e,""),qt?"u":"")}function K(t){var e=this;return new RegExp(Array.prototype.slice.call(arguments).map(function(n){var r=typeof n=="string";if(r&&e===void 0&&n==="|")throw new Error("use regg instead of reg to wrap expressions with `|`!");return r?n:n.source}).join(""),qt?"u":"")}function H(t){if(arguments.length===0)throw new Error("no parameters provided");return K.apply(H,["(?:"].concat(Array.prototype.slice.call(arguments),[")"]))}var Xs="\uFFFD",ut=/[-\x09\x0A\x0D\x20-\x2C\x2E-\uD7FF\uE000-\uFFFD]/;qt&&(ut=K("[",lt(ut),"\\u{10000}-\\u{10FFFF}","]"));var Qs=new RegExp("[^"+lt(ut)+"]",qt?"u":""),Gn=/[\x20\x09\x0D\x0A]/,Zs=lt(Gn),ne=K(Gn,"+"),le=K(Gn,"*"),xn=/[:_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;qt&&(xn=K("[",lt(xn),"\\u{10000}-\\u{10FFFF}","]"));var ec=lt(xn),Kr=K("[",ec,lt(/[-.0-9\xB7]/),lt(/[\u0300-\u036F\u203F-\u2040]/),"]"),Me=K(xn,Kr,"*"),tc=K("^",Me,"$"),Qo=K(Kr,"+"),nc=K("&",Me,";"),rc=H(/&#[0-9]+;|&#x[0-9a-fA-F]+;/),Cn=H(nc,"|",rc),An=K("%",Me,";"),Gr=H(K('"',H(/[^%&"]/,"|",An,"|",Cn),"*",'"'),"|",K("'",H(/[^%&']/,"|",An,"|",Cn),"*","'")),oc=H('"',H(/[^<&"]/,"|",Cn),"*",'"',"|","'",H(/[^<&']/,"|",Cn),"*","'"),ic=Rt(xn,":"),ac=Rt(Kr,":"),Vr=K(ic,ac,"*"),sc=K("^",Vr,"$"),Sn=K(Vr,H(":",Vr),"?"),cc=K("^",Sn,"$"),lc=K("(",Sn,")"),Ut=H(/"[^"]*"|'[^']*'/),uc=K(/^<\?/,"(",Me,")",H(ne,"(?!",Gn,")(",ut,"*?)"),"?",/\?>/),Zo=/[\x20\x0D\x0Aa-zA-Z0-9-'()+,./:=?;!*#@$_%]/,kn=H('"',Zo,'*"',"|","'",Rt(Zo,"'"),"*'"),oi="<!--",ii="-->",dc=K(oi,H(Rt(ut,"-"),"|",K("-",Rt(ut,"-"))),"*",ii),ei="#PCDATA",pc=H(K(/\(/,le,ei,H(le,/\|/,le,Sn),"*",le,/\)\*/),"|",K(/\(/,le,ei,le,/\)/)),fc=/[?*+]?/,mc=K(/\([^>]+\)/,fc),hc=H("EMPTY","|","ANY","|",pc,"|",mc),gc="<!ELEMENT",bc=K(gc,ne,H(Sn,"|",An),ne,H(hc,"|",An),le,">"),yc=K("NOTATION",ne,/\(/,le,Me,H(le,/\|/,le,Me),"*",le,/\)/),vc=K(/\(/,le,Qo,H(le,/\|/,le,Qo),"*",le,/\)/),wc=H(yc,"|",vc),Ec=H(/CDATA|ID|IDREF|IDREFS|ENTITY|ENTITIES|NMTOKEN|NMTOKENS/,"|",wc),Dc=H(/#REQUIRED|#IMPLIED/,"|",H(H("#FIXED",ne),"?",oc)),xc=H(ne,Me,ne,Ec,ne,Dc),Cc="<!ATTLIST",Ac=K(Cc,ne,Me,xc,"*",le,">"),zr="about:legacy-compat",Sc=H('"'+zr+'"',"|","'"+zr+"'"),Yr="SYSTEM",Yn="PUBLIC",Jn=H(H(Yr,ne,Ut),"|",H(Yn,ne,kn,ne,Ut)),kc=K("^",H(H(Yr,ne,"(?<SystemLiteralOnly>",Ut,")"),"|",H(Yn,ne,"(?<PubidLiteral>",kn,")",ne,"(?<SystemLiteral>",Ut,")"))),Ic=K("^",kn,"$"),Tc=K("^",Ut,"$"),Bc=H(ne,"NDATA",ne,Me),Nc=H(Gr,"|",H(Jn,Bc,"?")),ai="<!ENTITY",$c=K(ai,ne,Me,ne,Nc,le,">"),Lc=H(Gr,"|",Jn),Oc=K(ai,ne,"%",ne,Me,ne,Lc,le,">"),Fc=H($c,"|",Oc),_c=K(Yn,ne,kn),Mc=K("<!NOTATION",ne,Me,ne,H(Jn,"|",_c),le,">"),Jr=K(le,"=",le),ti=/1[.]\d+/,Pc=K(ne,"version",Jr,H("'",ti,"'","|",'"',ti,'"')),ni=/[A-Za-z][-A-Za-z0-9._]*/,Rc=H(ne,"encoding",Jr,H('"',ni,'"',"|","'",ni,"'")),Uc=H(ne,"standalone",Jr,H("'",H("yes","|","no"),"'","|",'"',H("yes","|","no"),'"')),qc=K(/^<\?xml/,Pc,Rc,"?",Uc,"?",le,/\?>/),jc="<!DOCTYPE",Hc="<![CDATA[",Wc="]]>",Vc=/<!\[CDATA\[/,zc=/\]\]>/,Kc=K(ut,"*?",zc),Gc=K(Vc,Kc);W.chars=lt;W.chars_without=Rt;W.detectUnicodeSupport=ri;W.reg=K;W.regg=H;W.ABOUT_LEGACY_COMPAT=zr;W.ABOUT_LEGACY_COMPAT_SystemLiteral=Sc;W.AttlistDecl=Ac;W.CDATA_START=Hc;W.CDATA_END=Wc;W.CDSect=Gc;W.Char=ut;W.Comment=dc;W.COMMENT_START=oi;W.COMMENT_END=ii;W.DOCTYPE_DECL_START=jc;W.elementdecl=bc;W.EntityDecl=Fc;W.EntityValue=Gr;W.ExternalID=Jn;W.ExternalID_match=kc;W.Name=Me;W.Name_exact=tc;W.NCName_exact=sc;W.NotationDecl=Mc;W.Reference=Cn;W.PEReference=An;W.PI=uc;W.PUBLIC=Yn;W.PubidLiteral=kn;W.PubidLiteral_match=Ic;W.QName=Sn;W.QName_exact=cc;W.QName_group=lc;W.S=ne;W.SChar_s=Zs;W.S_OPT=le;W.SYSTEM=Yr;W.SystemLiteral=Ut;W.SystemLiteral_match=Tc;W.InvalidChar=Qs;W.UNICODE_REPLACEMENT_CHARACTER=Xs;W.UNICODE_SUPPORT=qt;W.XMLDecl=qc});var so=re(fe=>{"use strict";var He=Dt(),Je=He.find,Yc=He.hasDefaultHTMLNamespace,Ht=He.hasOwn,Jc=He.isHTMLMimeType,Xc=He.isHTMLRawTextElement,Qc=He.isHTMLVoidElement,In=He.MIME_TYPE,Xe=He.NAMESPACE,Be=Symbol(),fi=Dn(),U=fi.DOMException,ke=fi.DOMExceptionName,pe=Xr();function Le(t){if(t!==Be)throw new TypeError("Illegal constructor")}function Zc(t){return t!==""}function el(t){return t?t.split(/[\t\n\f\r ]+/).filter(Zc):[]}function tl(t,e){return Ht(t,e)||(t[e]=!0),t}function si(t){if(!t)return[];var e=el(t);return Object.keys(e.reduce(tl,{}))}function nl(t){return function(e){return t&&t.indexOf(e)!==-1}}function mi(t){if(!pe.QName_exact.test(t))throw new U(U.INVALID_CHARACTER_ERR,'invalid character in qualified name "'+t+'"')}function Zr(t,e){mi(e),t=t||null;var n=null,r=e;if(e.indexOf(":")>=0){var o=e.split(":");n=o[0],r=o[1]}if(n!==null&&t===null)throw new U(U.NAMESPACE_ERR,"prefix is non-null and namespace is null");if(n==="xml"&&t!==He.NAMESPACE.XML)throw new U(U.NAMESPACE_ERR,'prefix is "xml" and namespace is not the XML namespace');if((n==="xmlns"||e==="xmlns")&&t!==He.NAMESPACE.XMLNS)throw new U(U.NAMESPACE_ERR,'either qualifiedName or prefix is "xmlns" and namespace is not the XMLNS namespace');if(t===He.NAMESPACE.XMLNS&&n!=="xmlns"&&e!=="xmlns")throw new U(U.NAMESPACE_ERR,'namespace is the XMLNS namespace and neither qualifiedName nor prefix is "xmlns"');return[t,n,r]}function zt(t,e){for(var n in t)Ht(t,n)&&(e[n]=t[n])}function Oe(t,e){var n=t.prototype;if(!(n instanceof e)){let r=function(){};r.prototype=e.prototype,r=new r,zt(n,r),t.prototype=n=r}n.constructor!=t&&(typeof t!="function"&&console.error("unknown Class:"+t),n.constructor=t)}var Fe={},je=Fe.ELEMENT_NODE=1,Wt=Fe.ATTRIBUTE_NODE=2,Tn=Fe.TEXT_NODE=3,hi=Fe.CDATA_SECTION_NODE=4,gi=Fe.ENTITY_REFERENCE_NODE=5,rl=Fe.ENTITY_NODE=6,eo=Fe.PROCESSING_INSTRUCTION_NODE=7,to=Fe.COMMENT_NODE=8,jt=Fe.DOCUMENT_NODE=9,bi=Fe.DOCUMENT_TYPE_NODE=10,dt=Fe.DOCUMENT_FRAGMENT_NODE=11,ol=Fe.NOTATION_NODE=12,de=He.freeze({DOCUMENT_POSITION_DISCONNECTED:1,DOCUMENT_POSITION_PRECEDING:2,DOCUMENT_POSITION_FOLLOWING:4,DOCUMENT_POSITION_CONTAINS:8,DOCUMENT_POSITION_CONTAINED_BY:16,DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:32});function yi(t,e){if(e.length<t.length)return yi(e,t);var n=null;for(var r in t){if(t[r]!==e[r])return n;n=t[r]}return n}function ci(t){return t.guid||(t.guid=Math.random()),t.guid}function ve(){}ve.prototype={length:0,item:function(t){return t>=0&&t<this.length?this[t]:null},toString:function(t){var e;typeof t=="function"?e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:t}:t?e={requireWellFormed:!!t.requireWellFormed,splitCDATASections:t.splitCDATASections!==!1,nodeFilter:t.nodeFilter||null}:e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:null};for(var n=[],r=0;r<this.length;r++)ao(this[r],n,null,e);return n.join("")},filter:function(t){return Array.prototype.filter.call(this,t)},indexOf:function(t){return Array.prototype.indexOf.call(this,t)}};ve.prototype[Symbol.iterator]=function(){var t=this,e=0;return{next:function(){return e<t.length?{value:t[e++],done:!1}:{done:!0}},return:function(){return{done:!0}}}};function Ye(t,e){this._node=t,this._refresh=e,er(this)}function er(t){var e=t._node._inc||t._node.ownerDocument._inc;if(t._inc!==e){var n=t._refresh(t._node);if(Ti(t,"length",n.length),!t.$$length||n.length<t.$$length)for(var r=n.length;r in t;r++)Ht(t,r)&&delete t[r];zt(n,t),t._inc=e}}Ye.prototype.item=function(t){return er(this),this[t]||null};Oe(Ye,ve);function Vt(){this._nsIndex=Object.create(null),this._noNsIndex=Object.create(null)}function vi(t,e){for(var n=0;n<t.length;){if(t[n]===e)return n;n++}}function no(t,e,n){if(!e)return t._noNsIndex;var r=t._nsIndex[e];return!r&&n&&(r=t._nsIndex[e]=Object.create(null)),r}function il(t,e,n){var r=no(t,e,!1),o=r&&r[n];return o||null}function al(t,e){no(t,e.namespaceURI,!0)[e.localName]=e}function sl(t,e){var n=no(t,e.namespaceURI,!1);n&&delete n[e.localName]}function cl(t,e,n,r){if(r?e[vi(e,r)]=n:(e[e.length]=n,e.length++),al(e,n),t){n.ownerElement=t;var o=t.ownerDocument;o&&(r&&Di(o,t,r),ll(o,t,n))}}function li(t,e,n){var r=vi(e,n);if(r>=0){for(var o=e.length-1;r<=o;)e[r]=e[++r];if(e.length=o,sl(e,n),t){var i=t.ownerDocument;i&&Di(i,t,n),n.ownerElement=null}}}Vt.prototype={length:0,item:ve.prototype.item,getNamedItem:function(t){this._ownerElement&&this._ownerElement._isInHTMLDocumentAndNamespace()&&(t=t.toLowerCase());for(var e=0;e<this.length;){var n=this[e];if(n.nodeName===t)return n;e++}return null},setNamedItem:function(t){var e=t.ownerElement;if(e&&e!==this._ownerElement)throw new U(U.INUSE_ATTRIBUTE_ERR);var n=il(this,t.namespaceURI,t.localName);return n===t?t:(cl(this._ownerElement,this,t,n),n)},setNamedItemNS:function(t){return this.setNamedItem(t)},removeNamedItem:function(t){var e=this.getNamedItem(t);if(!e)throw new U(U.NOT_FOUND_ERR,t);return li(this._ownerElement,this,e),e},removeNamedItemNS:function(t,e){var n=this.getNamedItemNS(t,e);if(!n)throw new U(U.NOT_FOUND_ERR,t?t+" : "+e:e);return li(this._ownerElement,this,n),n},getNamedItemNS:function(t,e){t||(t=null);for(var n=0;n<this.length;){var r=this[n];if(r.localName===e&&r.namespaceURI===t)return r;n++}return null}};Vt.prototype[Symbol.iterator]=function(){var t=this,e=0;return{next:function(){return e<t.length?{value:t[e++],done:!1}:{done:!0}},return:function(){return{done:!0}}}};function wi(){}wi.prototype={hasFeature:function(t,e){return!0},createDocument:function(t,e,n){var r=In.XML_APPLICATION;t===Xe.HTML?r=In.XML_XHTML_APPLICATION:t===Xe.SVG&&(r=In.XML_SVG_IMAGE);var o=new rt(Be,{contentType:r});if(o.implementation=this,o.childNodes=new ve,o.doctype=n||null,n&&o.appendChild(n),e){var i=o.createElementNS(t,e);o.appendChild(i)}return o},createDocumentType:function(t,e,n,r){mi(t);var o=new rr(Be);return o.name=t,o.nodeName=t,o.publicId=e||"",o.systemId=n||"",o.internalSubset=r||"",o.childNodes=new ve,o},createHTMLDocument:function(t){var e=new rt(Be,{contentType:In.HTML});if(e.implementation=this,e.childNodes=new ve,t!==!1){e.doctype=this.createDocumentType("html"),e.doctype.ownerDocument=e,e.appendChild(e.doctype);var n=e.createElement("html");e.appendChild(n);var r=e.createElement("head");if(n.appendChild(r),typeof t=="string"){var o=e.createElement("title");o.appendChild(e.createTextNode(t)),r.appendChild(o)}n.appendChild(e.createElement("body"))}return e}};function J(t){Le(t)}J.prototype={firstChild:null,lastChild:null,previousSibling:null,nextSibling:null,parentNode:null,get parentElement(){return this.parentNode&&this.parentNode.nodeType===this.ELEMENT_NODE?this.parentNode:null},childNodes:null,ownerDocument:null,nodeValue:null,namespaceURI:null,prefix:null,localName:null,baseURI:"about:blank",get isConnected(){var t=this.getRootNode();return t&&t.nodeType===t.DOCUMENT_NODE},contains:function(t){if(!t)return!1;var e=t;do{if(this===e)return!0;e=e.parentNode}while(e);return!1},getRootNode:function(t){var e=this;do{if(!e.parentNode)return e;e=e.parentNode}while(e)},isEqualNode:function(t){if(!t)return!1;for(var e=[{node:this,other:t}];e.length>0;){var n=e.pop(),r=n.node,o=n.other;if(r.nodeType!==o.nodeType)return!1;switch(r.nodeType){case r.DOCUMENT_TYPE_NODE:if(r.name!==o.name||r.publicId!==o.publicId||r.systemId!==o.systemId)return!1;break;case r.ELEMENT_NODE:if(r.namespaceURI!==o.namespaceURI||r.prefix!==o.prefix||r.localName!==o.localName||r.attributes.length!==o.attributes.length)return!1;for(var i=0;i<r.attributes.length;i++){var a=r.attributes.item(i),s=o.getAttributeNodeNS(a.namespaceURI,a.localName);if(!s)return!1;e.push({node:a,other:s})}break;case r.ATTRIBUTE_NODE:if(r.namespaceURI!==o.namespaceURI||r.localName!==o.localName||r.value!==o.value)return!1;break;case r.PROCESSING_INSTRUCTION_NODE:if(r.target!==o.target||r.data!==o.data)return!1;break;case r.TEXT_NODE:case r.CDATA_SECTION_NODE:case r.COMMENT_NODE:if(r.data!==o.data)return!1;break}if(r.childNodes.length!==o.childNodes.length)return!1;for(var i=r.childNodes.length-1;i>=0;i--)e.push({node:r.childNodes[i],other:o.childNodes[i]})}return!0},isSameNode:function(t){return this===t},insertBefore:function(t,e){return Zn(this,t,e)},replaceChild:function(t,e){Zn(this,t,e,Ai),e&&this.removeChild(e)},removeChild:function(t){return xi(this,t)},appendChild:function(t){return this.insertBefore(t,null)},hasChildNodes:function(){return this.firstChild!=null},cloneNode:function(t){return Ii(this.ownerDocument||this,this,t)},normalize:function(){Ae(this,null,{enter:function(t){for(var e=t.firstChild;e;){var n=e.nextSibling;if(n!==null&&n.nodeType===Tn&&e.nodeType===Tn){for(var r=[],o=n;o!==null&&o.nodeType===Tn;)r.push(o.data),o=o.nextSibling;for(var i=e.nextSibling;i!==o;){var a=i.nextSibling;i.parentNode=null,i.previousSibling=null,i.nextSibling=null,i=a}e.nextSibling=o,o!==null?o.previousSibling=e:t.lastChild=e,e.appendData(r.join("")),ro(t.ownerDocument,t),e=o}else e=n}return!0}})},isSupported:function(t,e){return this.ownerDocument.implementation.hasFeature(t,e)},lookupPrefix:function(t){for(var e=this;e;){var n=e._nsMap;if(n){for(var r in n)if(Ht(n,r)&&n[r]===t)return r}e=e.nodeType==Wt?e.ownerDocument:e.parentNode}return null},lookupNamespaceURI:function(t){for(var e=this;e;){var n=e._nsMap;if(n&&Ht(n,t))return n[t];e=e.nodeType==Wt?e.ownerDocument:e.parentNode}return null},isDefaultNamespace:function(t){var e=this.lookupPrefix(t);return e==null},compareDocumentPosition:function(t){if(this===t)return 0;var e=t,n=this,r=null,o=null;if(e instanceof xt&&(r=e,e=r.ownerElement),n instanceof xt&&(o=n,n=o.ownerElement,r&&e&&n===e))for(var i=0,a;a=n.attributes[i];i++){if(a===r)return de.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC+de.DOCUMENT_POSITION_PRECEDING;if(a===o)return de.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC+de.DOCUMENT_POSITION_FOLLOWING}if(!e||!n||n.ownerDocument!==e.ownerDocument)return de.DOCUMENT_POSITION_DISCONNECTED+de.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC+(ci(n.ownerDocument)>ci(e.ownerDocument)?de.DOCUMENT_POSITION_FOLLOWING:de.DOCUMENT_POSITION_PRECEDING);if(o&&e===n)return de.DOCUMENT_POSITION_CONTAINS+de.DOCUMENT_POSITION_PRECEDING;if(r&&e===n)return de.DOCUMENT_POSITION_CONTAINED_BY+de.DOCUMENT_POSITION_FOLLOWING;for(var s=[],l=e.parentNode;l;){if(!o&&l===n)return de.DOCUMENT_POSITION_CONTAINED_BY+de.DOCUMENT_POSITION_FOLLOWING;s.push(l),l=l.parentNode}s.reverse();for(var c=[],p=n.parentNode;p;){if(!r&&p===e)return de.DOCUMENT_POSITION_CONTAINS+de.DOCUMENT_POSITION_PRECEDING;c.push(p),p=p.parentNode}c.reverse();var w=yi(s,c);for(var b in w.childNodes){var S=w.childNodes[b];if(S===n)return de.DOCUMENT_POSITION_FOLLOWING;if(S===e)return de.DOCUMENT_POSITION_PRECEDING;if(c.indexOf(S)>=0)return de.DOCUMENT_POSITION_FOLLOWING;if(s.indexOf(S)>=0)return de.DOCUMENT_POSITION_PRECEDING}return 0}};function Ei(t){return t=="<"&&"&lt;"||t==">"&&"&gt;"||t=="&"&&"&amp;"||t=='"'&&"&quot;"||"&#"+t.charCodeAt()+";"}zt(Fe,J);zt(Fe,J.prototype);zt(de,J);zt(de,J.prototype);function Qn(t,e){Ae(t,null,{enter:function(n){return e(n)?Ae.STOP:!0}})}function Ae(t,e,n){for(var r=[{node:t,context:e,phase:Ae.ENTER}];r.length>0;){var o=r.pop();if(o.phase===Ae.ENTER){var i=n.enter(o.node,o.context);if(i===Ae.STOP)return Ae.STOP;if(r.push({node:o.node,context:i,phase:Ae.EXIT}),i==null)continue;for(var a=o.node.lastChild;a;)r.push({node:a,context:i,phase:Ae.ENTER}),a=a.previousSibling}else n.exit&&n.exit(o.node,o.context)}}Ae.STOP=Symbol("walkDOM.STOP");Ae.ENTER=0;Ae.EXIT=1;function rt(t,e){Le(t);var n=e||{};this.ownerDocument=this,this.contentType=n.contentType||In.XML_APPLICATION,this.type=Jc(this.contentType)?"html":"xml"}function ll(t,e,n){t&&t._inc++;var r=n.namespaceURI;r===Xe.XMLNS&&(e._nsMap[n.prefix?n.localName:""]=n.value)}function Di(t,e,n,r){t&&t._inc++;var o=n.namespaceURI;o===Xe.XMLNS&&delete e._nsMap[n.prefix?n.localName:""]}function ro(t,e,n){if(t&&t._inc){t._inc++;var r=e.childNodes;if(n&&!n.nextSibling)r[r.length++]=n;else{for(var o=e.firstChild,i=0;o;)r[i++]=o,o=o.nextSibling;r.length=i,delete r[r.length]}}}function xi(t,e){if(t!==e.parentNode)throw new U(U.NOT_FOUND_ERR,"child's parent is not parent");var n=e.previousSibling,r=e.nextSibling;return n?n.nextSibling=r:t.firstChild=r,r?r.previousSibling=n:t.lastChild=n,ro(t.ownerDocument,t),e.parentNode=null,e.previousSibling=null,e.nextSibling=null,e}function ul(t){return t&&(t.nodeType===J.DOCUMENT_NODE||t.nodeType===J.DOCUMENT_FRAGMENT_NODE||t.nodeType===J.ELEMENT_NODE)}function dl(t){return t&&(t.nodeType===J.CDATA_SECTION_NODE||t.nodeType===J.COMMENT_NODE||t.nodeType===J.DOCUMENT_FRAGMENT_NODE||t.nodeType===J.DOCUMENT_TYPE_NODE||t.nodeType===J.ELEMENT_NODE||t.nodeType===J.PROCESSING_INSTRUCTION_NODE||t.nodeType===J.TEXT_NODE)}function pt(t){return t&&t.nodeType===J.DOCUMENT_TYPE_NODE}function nt(t){return t&&t.nodeType===J.ELEMENT_NODE}function Ci(t){return t&&t.nodeType===J.TEXT_NODE}function ui(t,e){var n=t.childNodes||[];if(Je(n,nt)||pt(e))return!1;var r=Je(n,pt);return!(e&&r&&n.indexOf(r)>n.indexOf(e))}function di(t,e){var n=t.childNodes||[];function r(i){return nt(i)&&i!==e}if(Je(n,r))return!1;var o=Je(n,pt);return!(e&&o&&n.indexOf(o)>n.indexOf(e))}function pl(t,e,n){if(!ul(t))throw new U(U.HIERARCHY_REQUEST_ERR,"Unexpected parent node type "+t.nodeType);if(n&&n.parentNode!==t)throw new U(U.NOT_FOUND_ERR,"child not in parent");if(!dl(e)||pt(e)&&t.nodeType!==J.DOCUMENT_NODE)throw new U(U.HIERARCHY_REQUEST_ERR,"Unexpected node type "+e.nodeType+" for parent node type "+t.nodeType)}function fl(t,e,n){var r=t.childNodes||[],o=e.childNodes||[];if(e.nodeType===J.DOCUMENT_FRAGMENT_NODE){var i=o.filter(nt);if(i.length>1||Je(o,Ci))throw new U(U.HIERARCHY_REQUEST_ERR,"More than one element or text in fragment");if(i.length===1&&!ui(t,n))throw new U(U.HIERARCHY_REQUEST_ERR,"Element in fragment can not be inserted before doctype")}if(nt(e)&&!ui(t,n))throw new U(U.HIERARCHY_REQUEST_ERR,"Only one element can be added and only after doctype");if(pt(e)){if(Je(r,pt))throw new U(U.HIERARCHY_REQUEST_ERR,"Only one doctype is allowed");var a=Je(r,nt);if(n&&r.indexOf(a)<r.indexOf(n))throw new U(U.HIERARCHY_REQUEST_ERR,"Doctype can only be inserted before an element");if(!n&&a)throw new U(U.HIERARCHY_REQUEST_ERR,"Doctype can not be appended since element is present")}}function Ai(t,e,n){var r=t.childNodes||[],o=e.childNodes||[];if(e.nodeType===J.DOCUMENT_FRAGMENT_NODE){var i=o.filter(nt);if(i.length>1||Je(o,Ci))throw new U(U.HIERARCHY_REQUEST_ERR,"More than one element or text in fragment");if(i.length===1&&!di(t,n))throw new U(U.HIERARCHY_REQUEST_ERR,"Element in fragment can not be inserted before doctype")}if(nt(e)&&!di(t,n))throw new U(U.HIERARCHY_REQUEST_ERR,"Only one element can be added and only after doctype");if(pt(e)){if(Je(r,function(l){return pt(l)&&l!==n}))throw new U(U.HIERARCHY_REQUEST_ERR,"Only one doctype is allowed");var a=Je(r,nt);if(n&&r.indexOf(a)<r.indexOf(n))throw new U(U.HIERARCHY_REQUEST_ERR,"Doctype can only be inserted before an element")}}function Zn(t,e,n,r){pl(t,e,n),t.nodeType===J.DOCUMENT_NODE&&(r||fl)(t,e,n);var o=e.parentNode;if(o&&o.removeChild(e),e.nodeType===dt){var i=e.firstChild;if(i==null)return e;var a=e.lastChild}else i=a=e;var s=n?n.previousSibling:t.lastChild;i.previousSibling=s,a.nextSibling=n,s?s.nextSibling=i:t.firstChild=i,n==null?t.lastChild=a:n.previousSibling=a;do i.parentNode=t;while(i!==a&&(i=i.nextSibling));return ro(t.ownerDocument||t,t,e),e.nodeType==dt&&(e.firstChild=e.lastChild=null),e}rt.prototype={implementation:null,nodeName:"#document",nodeType:jt,doctype:null,documentElement:null,_inc:1,insertBefore:function(t,e){if(t.nodeType===dt){for(var n=t.firstChild;n;){var r=n.nextSibling;this.insertBefore(n,e),n=r}return t}return Zn(this,t,e),t.ownerDocument=this,this.documentElement===null&&t.nodeType===je&&(this.documentElement=t),t},removeChild:function(t){var e=xi(this,t);return e===this.documentElement&&(this.documentElement=null),e},replaceChild:function(t,e){Zn(this,t,e,Ai),t.ownerDocument=this,e&&this.removeChild(e),nt(t)&&(this.documentElement=t)},importNode:function(t,e){return ml(this,t,e)},getElementById:function(t){var e=null;return Qn(this.documentElement,function(n){if(n.nodeType==je&&n.getAttribute("id")==t)return e=n,!0}),e},createElement:function(t){var e=new ot(Be);e.ownerDocument=this,this.type==="html"&&(t=t.toLowerCase()),Yc(this.contentType)&&(e.namespaceURI=Xe.HTML),e.nodeName=t,e.tagName=t,e.localName=t,e.childNodes=new ve;var n=e.attributes=new Vt;return n._ownerElement=e,e},createDocumentFragment:function(){var t=new Kt(Be);return t.ownerDocument=this,t.childNodes=new ve,t},createTextNode:function(t){var e=new Bn(Be);return e.ownerDocument=this,e.childNodes=new ve,e.appendData(t),e},createComment:function(t){var e=new tr(Be);return e.ownerDocument=this,e.childNodes=new ve,e.appendData(t),e},createCDATASection:function(t){if(t.indexOf("]]>")!==-1)throw new U(U.INVALID_CHARACTER_ERR,'data contains "]]>"');var e=new nr(Be);return e.ownerDocument=this,e.childNodes=new ve,e.appendData(t),e},createProcessingInstruction:function(t,e){var n=new ir(Be);return n.ownerDocument=this,n.childNodes=new ve,n.nodeName=n.target=t,n.nodeValue=n.data=e,n},createAttribute:function(t){if(!pe.QName_exact.test(t))throw new U(U.INVALID_CHARACTER_ERR,'invalid character in name "'+t+'"');return this.type==="html"&&(t=t.toLowerCase()),this._createAttribute(t)},_createAttribute:function(t){var e=new xt(Be);return e.ownerDocument=this,e.childNodes=new ve,e.name=t,e.nodeName=t,e.localName=t,e.specified=!0,e},createEntityReference:function(t){if(!pe.Name_exact.test(t))throw new U(U.INVALID_CHARACTER_ERR,'not a valid xml name "'+t+'"');if(this.type==="html")throw new U("document is an html document",ke.NotSupportedError);var e=new or(Be);return e.ownerDocument=this,e.childNodes=new ve,e.nodeName=t,e},createElementNS:function(t,e){var n=Zr(t,e),r=new ot(Be),o=r.attributes=new Vt;return r.childNodes=new ve,r.ownerDocument=this,r.nodeName=e,r.tagName=e,r.namespaceURI=n[0],r.prefix=n[1],r.localName=n[2],o._ownerElement=r,r},createAttributeNS:function(t,e){var n=Zr(t,e),r=new xt(Be);return r.ownerDocument=this,r.childNodes=new ve,r.nodeName=e,r.name=e,r.specified=!0,r.namespaceURI=n[0],r.prefix=n[1],r.localName=n[2],r}};Oe(rt,J);function ot(t){Le(t),this._nsMap=Object.create(null)}ot.prototype={nodeType:je,attributes:null,getQualifiedName:function(){return this.prefix?this.prefix+":"+this.localName:this.localName},_isInHTMLDocumentAndNamespace:function(){return this.ownerDocument.type==="html"&&this.namespaceURI===Xe.HTML},hasAttributes:function(){return!!(this.attributes&&this.attributes.length)},hasAttribute:function(t){return!!this.getAttributeNode(t)},getAttribute:function(t){var e=this.getAttributeNode(t);return e?e.value:null},getAttributeNode:function(t){return this._isInHTMLDocumentAndNamespace()&&(t=t.toLowerCase()),this.attributes.getNamedItem(t)},setAttribute:function(t,e){this._isInHTMLDocumentAndNamespace()&&(t=t.toLowerCase());var n=this.getAttributeNode(t);n?n.value=n.nodeValue=""+e:(n=this.ownerDocument._createAttribute(t),n.value=n.nodeValue=""+e,this.setAttributeNode(n))},removeAttribute:function(t){var e=this.getAttributeNode(t);e&&this.removeAttributeNode(e)},setAttributeNode:function(t){return this.attributes.setNamedItem(t)},setAttributeNodeNS:function(t){return this.attributes.setNamedItemNS(t)},removeAttributeNode:function(t){return this.attributes.removeNamedItem(t.nodeName)},removeAttributeNS:function(t,e){var n=this.getAttributeNodeNS(t,e);n&&this.removeAttributeNode(n)},hasAttributeNS:function(t,e){return this.getAttributeNodeNS(t,e)!=null},getAttributeNS:function(t,e){var n=this.getAttributeNodeNS(t,e);return n?n.value:null},setAttributeNS:function(t,e,n){var r=Zr(t,e),o=r[2],i=this.getAttributeNodeNS(t,o);i?i.value=i.nodeValue=""+n:(i=this.ownerDocument.createAttributeNS(t,e),i.value=i.nodeValue=""+n,this.setAttributeNode(i))},getAttributeNodeNS:function(t,e){return this.attributes.getNamedItemNS(t,e)},getElementsByClassName:function(t){var e=si(t);return new Ye(this,function(n){var r=[];return e.length>0&&Qn(n,function(o){if(o!==n&&o.nodeType===je){var i=o.getAttribute("class");if(i){var a=t===i;if(!a){var s=si(i);a=e.every(nl(s))}a&&r.push(o)}}}),r})},getElementsByTagName:function(t){var e=(this.nodeType===jt?this:this.ownerDocument).type==="html",n=t.toLowerCase();return new Ye(this,function(r){var o=[];return Qn(r,function(i){if(!(i===r||i.nodeType!==je))if(t==="*")o.push(i);else{var a=i.getQualifiedName(),s=e&&i.namespaceURI===Xe.HTML?n:t;a===s&&o.push(i)}}),o})},getElementsByTagNameNS:function(t,e){return new Ye(this,function(n){var r=[];return Qn(n,function(o){o!==n&&o.nodeType===je&&(t==="*"||o.namespaceURI===t)&&(e==="*"||o.localName==e)&&r.push(o)}),r})}};rt.prototype.getElementsByClassName=ot.prototype.getElementsByClassName;rt.prototype.getElementsByTagName=ot.prototype.getElementsByTagName;rt.prototype.getElementsByTagNameNS=ot.prototype.getElementsByTagNameNS;Oe(ot,J);function xt(t){Le(t),this.namespaceURI=null,this.prefix=null,this.ownerElement=null}xt.prototype.nodeType=Wt;Oe(xt,J);function ft(t){Le(t)}ft.prototype={data:"",substringData:function(t,e){return this.data.substring(t,t+e)},appendData:function(t){t=this.data+t,this.nodeValue=this.data=t,this.length=t.length},insertData:function(t,e){this.replaceData(t,0,e)},deleteData:function(t,e){this.replaceData(t,e,"")},replaceData:function(t,e,n){var r=this.data.substring(0,t),o=this.data.substring(t+e);n=r+n+o,this.nodeValue=this.data=n,this.length=n.length}};Oe(ft,J);function Bn(t){Le(t)}Bn.prototype={nodeName:"#text",nodeType:Tn,splitText:function(t){var e=this.data,n=e.substring(t);e=e.substring(0,t),this.data=this.nodeValue=e,this.length=e.length;var r=this.ownerDocument.createTextNode(n);return this.parentNode&&this.parentNode.insertBefore(r,this.nextSibling),r}};Oe(Bn,ft);function tr(t){Le(t)}tr.prototype={nodeName:"#comment",nodeType:to};Oe(tr,ft);function nr(t){Le(t)}nr.prototype={nodeName:"#cdata-section",nodeType:hi};Oe(nr,Bn);function rr(t){Le(t)}rr.prototype.nodeType=bi;Oe(rr,J);function oo(t){Le(t)}oo.prototype.nodeType=ol;Oe(oo,J);function io(t){Le(t)}io.prototype.nodeType=rl;Oe(io,J);function or(t){Le(t)}or.prototype.nodeType=gi;Oe(or,J);function Kt(t){Le(t)}Kt.prototype.nodeName="#document-fragment";Kt.prototype.nodeType=dt;Oe(Kt,J);function ir(t){Le(t)}ir.prototype.nodeType=eo;Oe(ir,ft);function Si(){}Si.prototype.serializeToString=function(t,e){return ki.call(t,e)};J.prototype.toString=ki;function ki(t){var e;typeof t=="function"?e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:t}:t!=null?e={requireWellFormed:!!t.requireWellFormed,splitCDATASections:t.splitCDATASections!==!1,nodeFilter:t.nodeFilter||null}:e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:null};var n=[],r=this.nodeType===jt&&this.documentElement||this,o=r.prefix,i=r.namespaceURI;if(i&&o==null){var o=r.lookupPrefix(i);if(o==null)var a=[{namespace:i,prefix:null}]}return ao(this,n,a,e),n.join("")}function pi(t,e,n){var r=t.prefix||"",o=t.namespaceURI;if(!o||r==="xml"&&o===Xe.XML||o===Xe.XMLNS)return!1;for(var i=n.length;i--;){var a=n[i];if(a.prefix===r)return a.namespace!==o}return!0}function Xn(t,e,n,r){if(r&&!pe.QName_exact.test(e))throw new U('The attribute name "'+e+'" is not a valid XML QName',ke.InvalidStateError);t.push(" ",e,'="',n.replace(/[<>&"\t\n\r]/g,Ei),'"')}function ao(t,e,n,r){n||(n=[]);var o=r.nodeFilter,i=r.requireWellFormed,a=r.splitCDATASections,s=t.nodeType===jt?t:t.ownerDocument,l=s.type==="html";Ae(t,{ns:n},{enter:function(c,p){var w=p.ns;if(o)if(c=o(c),c){if(typeof c=="string")return e.push(c),null}else return null;switch(c.nodeType){case je:var b=c.attributes,S=b.length,D=c.tagName,B=D;if(!l&&!c.prefix&&c.namespaceURI){for(var O,$=0;$<b.length;$++)if(b.item($).name==="xmlns"){O=b.item($).value;break}if(!O)for(var E=w.length-1;E>=0;E--){var C=w[E];if(C.prefix===""&&C.namespace===c.namespaceURI){O=C.namespace;break}}if(O!==c.namespaceURI)for(var E=w.length-1;E>=0;E--){var C=w[E];if(C.namespace===c.namespaceURI){C.prefix&&(B=C.prefix+":"+D);break}}}if(i&&!pe.QName_exact.test(B))throw new U('The element name "'+B+'" is not a valid XML QName',ke.InvalidStateError);e.push("<",B);for(var T=w.slice(),L=0;L<S;L++){var h=b.item(L);h.prefix=="xmlns"?T.push({prefix:h.localName,namespace:h.value}):h.nodeName=="xmlns"&&T.push({prefix:"",namespace:h.value})}for(var L=0;L<S;L++){var h=b.item(L);if(pi(h,l,T)){var d=h.prefix||"",y=h.namespaceURI;Xn(e,d?"xmlns:"+d:"xmlns",y,i),T.push({prefix:d,namespace:y})}var k=o?o(h):h;k&&(typeof k=="string"?e.push(k):Xn(e,k.name,k.value,i))}if(D===B&&pi(c,l,T)){var u=c.prefix||"",y=c.namespaceURI;Xn(e,u?"xmlns:"+u:"xmlns",y,i),T.push({prefix:u,namespace:y})}var m=!c.firstChild;if(m&&(l||c.namespaceURI===Xe.HTML)&&(m=Qc(D)),m)return e.push("/>"),null;if(e.push(">"),l&&Xc(D)){for(var g=c.firstChild;g;)g.data?e.push(g.data):ao(g,e,T.slice(),r),g=g.nextSibling;return e.push("</",B,">"),null}return{ns:T,tag:B};case jt:case dt:if(i&&c.nodeType===jt&&c.documentElement==null)throw new U("The Document has no documentElement",ke.InvalidStateError);return{ns:w};case Wt:return Xn(e,c.name,c.value,i),null;case Tn:if(i&&pe.InvalidChar.test(c.data))throw new U("The Text node data contains characters outside the XML Char production",ke.InvalidStateError);return e.push(c.data.replace(/[<&>]/g,Ei)),null;case hi:if(i&&c.data.indexOf("]]>")!==-1)throw new U('The CDATASection data contains "]]>"',ke.InvalidStateError);return a?e.push(pe.CDATA_START,c.data.replace(/]]>/g,"]]]]><![CDATA[>"),pe.CDATA_END):e.push(pe.CDATA_START,c.data,pe.CDATA_END),null;case to:if(i){if(pe.InvalidChar.test(c.data))throw new U("The comment node data contains characters outside the XML Char production",ke.InvalidStateError);if(c.data.indexOf("--")!==-1||c.data[c.data.length-1]==="-")throw new U('The comment node data contains "--" or ends with "-"',ke.InvalidStateError)}return e.push(pe.COMMENT_START,c.data,pe.COMMENT_END),null;case bi:var v=c.publicId,x=c.systemId;if(i){if(!pe.Name_exact.test(c.name))throw new U('The doctype name "'+c.name+'" is not a valid XML Name',ke.InvalidStateError);if(v&&!pe.PubidLiteral_match.test(v))throw new U("DocumentType publicId is not a valid PubidLiteral",ke.InvalidStateError);if(x&&x!=="."&&!pe.SystemLiteral_match.test(x))throw new U("DocumentType systemId is not a valid SystemLiteral",ke.InvalidStateError);if(c.internalSubset&&c.internalSubset.indexOf("]>")!==-1)throw new U('DocumentType internalSubset contains "]>"',ke.InvalidStateError)}return e.push(pe.DOCTYPE_DECL_START," ",c.name),v?(e.push(" ",pe.PUBLIC," ",v),x&&x!=="."&&e.push(" ",x)):x&&x!=="."&&e.push(" ",pe.SYSTEM," ",x),c.internalSubset&&e.push(" [",c.internalSubset,"]"),e.push(">"),null;case eo:if(i){if(!pe.NCName_exact.test(c.target)||c.target.toLowerCase()==="xml")throw new U('The processing instruction target "'+c.target+'" is not a valid XML NCName or is reserved',ke.InvalidStateError);if(pe.InvalidChar.test(c.data))throw new U("The ProcessingInstruction data contains characters outside the XML Char production",ke.InvalidStateError);if(c.data.indexOf("?>")!==-1)throw new U('The ProcessingInstruction data contains "?>"',ke.InvalidStateError)}return e.push("<?",c.target," ",c.data,"?>"),null;case gi:if(i&&!pe.Name_exact.test(c.nodeName))throw new U('The entity reference name "'+c.nodeName+'" is not a valid XML Name',ke.InvalidStateError);return e.push("&",c.nodeName,";"),null;default:return e.push("??",c.nodeName),null}},exit:function(c,p){p&&p.tag&&e.push("</",p.tag,">")}})}function ml(t,e,n){var r;return Ae(e,null,{enter:function(o,i){var a=o.cloneNode(!1);a.ownerDocument=t,a.parentNode=null,i===null?r=a:i.appendChild(a);var s=o.nodeType===Wt||n;return s?a:null}}),r}function Ii(t,e,n){var r;return Ae(e,null,{enter:function(o,i){var a=new o.constructor(Be);for(var s in o)if(Ht(o,s)){var l=o[s];typeof l!="object"&&l!=a[s]&&(a[s]=l)}o.childNodes&&(a.childNodes=new ve),a.ownerDocument=t;var c=n;switch(a.nodeType){case je:var p=o.attributes,w=a.attributes=new Vt,b=p.length;w._ownerElement=a;for(var S=0;S<b;S++)a.setAttributeNode(Ii(t,p.item(S),!0));break;case Wt:c=!0}return i!==null?i.appendChild(a):r=a,c?a:null}}),r}function Ti(t,e,n){t[e]=n}function Qr(t){for(var e=[],n=t.firstChild;n;)n.nodeType===je&&e.push(n),n=n.nextSibling;return e}try{Object.defineProperty&&(Object.defineProperty(Ye.prototype,"length",{get:function(){return er(this),this.$$length}}),Object.defineProperty(J.prototype,"textContent",{get:function(){if(this.nodeType===je||this.nodeType===dt){var t=[];return Ae(this,null,{enter:function(e){if(e.nodeType===je||e.nodeType===dt)return!0;if(e.nodeType===eo||e.nodeType===to)return null;t.push(e.nodeValue)}}),t.join("")}return this.nodeValue},set:function(t){switch(this.nodeType){case je:case dt:for(;this.firstChild;)this.removeChild(this.firstChild);(t||String(t))&&this.appendChild(this.ownerDocument.createTextNode(t));break;default:this.data=t,this.value=t,this.nodeValue=t}}}),Object.defineProperty(ft.prototype,"data",{get:function(){return this._data!=null?this._data:""},set:function(t){this._data=t,this.length=typeof t=="string"?t.length:0}}),Object.defineProperty(ft.prototype,"nodeValue",{get:function(){return this.data},set:function(t){this.data=t},enumerable:!0,configurable:!0}),Object.defineProperty(ot.prototype,"children",{get:function(){return new Ye(this,Qr)}}),Object.defineProperty(rt.prototype,"children",{get:function(){return new Ye(this,Qr)}}),Object.defineProperty(Kt.prototype,"children",{get:function(){return new Ye(this,Qr)}}),Ti=function(t,e,n){t["$$"+e]=n})}catch{}fe._updateLiveList=er;fe.Attr=xt;fe.CDATASection=nr;fe.CharacterData=ft;fe.Comment=tr;fe.Document=rt;fe.DocumentFragment=Kt;fe.DocumentType=rr;fe.DOMImplementation=wi;fe.Element=ot;fe.Entity=io;fe.EntityReference=or;fe.LiveNodeList=Ye;fe.NamedNodeMap=Vt;fe.Node=J;fe.NodeList=ve;fe.Notation=oo;fe.Text=Bn;fe.ProcessingInstruction=ir;fe.walkDOM=Ae;fe.XMLSerializer=Si});var Ni=re(Nn=>{"use strict";var Bi=Dt().freeze;Nn.XML_ENTITIES=Bi({amp:"&",apos:"'",gt:">",lt:"<",quot:'"'});Nn.HTML_ENTITIES=Bi({Aacute:"\xC1",aacute:"\xE1",Abreve:"\u0102",abreve:"\u0103",ac:"\u223E",acd:"\u223F",acE:"\u223E\u0333",Acirc:"\xC2",acirc:"\xE2",acute:"\xB4",Acy:"\u0410",acy:"\u0430",AElig:"\xC6",aelig:"\xE6",af:"\u2061",Afr:"\u{1D504}",afr:"\u{1D51E}",Agrave:"\xC0",agrave:"\xE0",alefsym:"\u2135",aleph:"\u2135",Alpha:"\u0391",alpha:"\u03B1",Amacr:"\u0100",amacr:"\u0101",amalg:"\u2A3F",AMP:"&",amp:"&",And:"\u2A53",and:"\u2227",andand:"\u2A55",andd:"\u2A5C",andslope:"\u2A58",andv:"\u2A5A",ang:"\u2220",ange:"\u29A4",angle:"\u2220",angmsd:"\u2221",angmsdaa:"\u29A8",angmsdab:"\u29A9",angmsdac:"\u29AA",angmsdad:"\u29AB",angmsdae:"\u29AC",angmsdaf:"\u29AD",angmsdag:"\u29AE",angmsdah:"\u29AF",angrt:"\u221F",angrtvb:"\u22BE",angrtvbd:"\u299D",angsph:"\u2222",angst:"\xC5",angzarr:"\u237C",Aogon:"\u0104",aogon:"\u0105",Aopf:"\u{1D538}",aopf:"\u{1D552}",ap:"\u2248",apacir:"\u2A6F",apE:"\u2A70",ape:"\u224A",apid:"\u224B",apos:"'",ApplyFunction:"\u2061",approx:"\u2248",approxeq:"\u224A",Aring:"\xC5",aring:"\xE5",Ascr:"\u{1D49C}",ascr:"\u{1D4B6}",Assign:"\u2254",ast:"*",asymp:"\u2248",asympeq:"\u224D",Atilde:"\xC3",atilde:"\xE3",Auml:"\xC4",auml:"\xE4",awconint:"\u2233",awint:"\u2A11",backcong:"\u224C",backepsilon:"\u03F6",backprime:"\u2035",backsim:"\u223D",backsimeq:"\u22CD",Backslash:"\u2216",Barv:"\u2AE7",barvee:"\u22BD",Barwed:"\u2306",barwed:"\u2305",barwedge:"\u2305",bbrk:"\u23B5",bbrktbrk:"\u23B6",bcong:"\u224C",Bcy:"\u0411",bcy:"\u0431",bdquo:"\u201E",becaus:"\u2235",Because:"\u2235",because:"\u2235",bemptyv:"\u29B0",bepsi:"\u03F6",bernou:"\u212C",Bernoullis:"\u212C",Beta:"\u0392",beta:"\u03B2",beth:"\u2136",between:"\u226C",Bfr:"\u{1D505}",bfr:"\u{1D51F}",bigcap:"\u22C2",bigcirc:"\u25EF",bigcup:"\u22C3",bigodot:"\u2A00",bigoplus:"\u2A01",bigotimes:"\u2A02",bigsqcup:"\u2A06",bigstar:"\u2605",bigtriangledown:"\u25BD",bigtriangleup:"\u25B3",biguplus:"\u2A04",bigvee:"\u22C1",bigwedge:"\u22C0",bkarow:"\u290D",blacklozenge:"\u29EB",blacksquare:"\u25AA",blacktriangle:"\u25B4",blacktriangledown:"\u25BE",blacktriangleleft:"\u25C2",blacktriangleright:"\u25B8",blank:"\u2423",blk12:"\u2592",blk14:"\u2591",blk34:"\u2593",block:"\u2588",bne:"=\u20E5",bnequiv:"\u2261\u20E5",bNot:"\u2AED",bnot:"\u2310",Bopf:"\u{1D539}",bopf:"\u{1D553}",bot:"\u22A5",bottom:"\u22A5",bowtie:"\u22C8",boxbox:"\u29C9",boxDL:"\u2557",boxDl:"\u2556",boxdL:"\u2555",boxdl:"\u2510",boxDR:"\u2554",boxDr:"\u2553",boxdR:"\u2552",boxdr:"\u250C",boxH:"\u2550",boxh:"\u2500",boxHD:"\u2566",boxHd:"\u2564",boxhD:"\u2565",boxhd:"\u252C",boxHU:"\u2569",boxHu:"\u2567",boxhU:"\u2568",boxhu:"\u2534",boxminus:"\u229F",boxplus:"\u229E",boxtimes:"\u22A0",boxUL:"\u255D",boxUl:"\u255C",boxuL:"\u255B",boxul:"\u2518",boxUR:"\u255A",boxUr:"\u2559",boxuR:"\u2558",boxur:"\u2514",boxV:"\u2551",boxv:"\u2502",boxVH:"\u256C",boxVh:"\u256B",boxvH:"\u256A",boxvh:"\u253C",boxVL:"\u2563",boxVl:"\u2562",boxvL:"\u2561",boxvl:"\u2524",boxVR:"\u2560",boxVr:"\u255F",boxvR:"\u255E",boxvr:"\u251C",bprime:"\u2035",Breve:"\u02D8",breve:"\u02D8",brvbar:"\xA6",Bscr:"\u212C",bscr:"\u{1D4B7}",bsemi:"\u204F",bsim:"\u223D",bsime:"\u22CD",bsol:"\\",bsolb:"\u29C5",bsolhsub:"\u27C8",bull:"\u2022",bullet:"\u2022",bump:"\u224E",bumpE:"\u2AAE",bumpe:"\u224F",Bumpeq:"\u224E",bumpeq:"\u224F",Cacute:"\u0106",cacute:"\u0107",Cap:"\u22D2",cap:"\u2229",capand:"\u2A44",capbrcup:"\u2A49",capcap:"\u2A4B",capcup:"\u2A47",capdot:"\u2A40",CapitalDifferentialD:"\u2145",caps:"\u2229\uFE00",caret:"\u2041",caron:"\u02C7",Cayleys:"\u212D",ccaps:"\u2A4D",Ccaron:"\u010C",ccaron:"\u010D",Ccedil:"\xC7",ccedil:"\xE7",Ccirc:"\u0108",ccirc:"\u0109",Cconint:"\u2230",ccups:"\u2A4C",ccupssm:"\u2A50",Cdot:"\u010A",cdot:"\u010B",cedil:"\xB8",Cedilla:"\xB8",cemptyv:"\u29B2",cent:"\xA2",CenterDot:"\xB7",centerdot:"\xB7",Cfr:"\u212D",cfr:"\u{1D520}",CHcy:"\u0427",chcy:"\u0447",check:"\u2713",checkmark:"\u2713",Chi:"\u03A7",chi:"\u03C7",cir:"\u25CB",circ:"\u02C6",circeq:"\u2257",circlearrowleft:"\u21BA",circlearrowright:"\u21BB",circledast:"\u229B",circledcirc:"\u229A",circleddash:"\u229D",CircleDot:"\u2299",circledR:"\xAE",circledS:"\u24C8",CircleMinus:"\u2296",CirclePlus:"\u2295",CircleTimes:"\u2297",cirE:"\u29C3",cire:"\u2257",cirfnint:"\u2A10",cirmid:"\u2AEF",cirscir:"\u29C2",ClockwiseContourIntegral:"\u2232",CloseCurlyDoubleQuote:"\u201D",CloseCurlyQuote:"\u2019",clubs:"\u2663",clubsuit:"\u2663",Colon:"\u2237",colon:":",Colone:"\u2A74",colone:"\u2254",coloneq:"\u2254",comma:",",commat:"@",comp:"\u2201",compfn:"\u2218",complement:"\u2201",complexes:"\u2102",cong:"\u2245",congdot:"\u2A6D",Congruent:"\u2261",Conint:"\u222F",conint:"\u222E",ContourIntegral:"\u222E",Copf:"\u2102",copf:"\u{1D554}",coprod:"\u2210",Coproduct:"\u2210",COPY:"\xA9",copy:"\xA9",copysr:"\u2117",CounterClockwiseContourIntegral:"\u2233",crarr:"\u21B5",Cross:"\u2A2F",cross:"\u2717",Cscr:"\u{1D49E}",cscr:"\u{1D4B8}",csub:"\u2ACF",csube:"\u2AD1",csup:"\u2AD0",csupe:"\u2AD2",ctdot:"\u22EF",cudarrl:"\u2938",cudarrr:"\u2935",cuepr:"\u22DE",cuesc:"\u22DF",cularr:"\u21B6",cularrp:"\u293D",Cup:"\u22D3",cup:"\u222A",cupbrcap:"\u2A48",CupCap:"\u224D",cupcap:"\u2A46",cupcup:"\u2A4A",cupdot:"\u228D",cupor:"\u2A45",cups:"\u222A\uFE00",curarr:"\u21B7",curarrm:"\u293C",curlyeqprec:"\u22DE",curlyeqsucc:"\u22DF",curlyvee:"\u22CE",curlywedge:"\u22CF",curren:"\xA4",curvearrowleft:"\u21B6",curvearrowright:"\u21B7",cuvee:"\u22CE",cuwed:"\u22CF",cwconint:"\u2232",cwint:"\u2231",cylcty:"\u232D",Dagger:"\u2021",dagger:"\u2020",daleth:"\u2138",Darr:"\u21A1",dArr:"\u21D3",darr:"\u2193",dash:"\u2010",Dashv:"\u2AE4",dashv:"\u22A3",dbkarow:"\u290F",dblac:"\u02DD",Dcaron:"\u010E",dcaron:"\u010F",Dcy:"\u0414",dcy:"\u0434",DD:"\u2145",dd:"\u2146",ddagger:"\u2021",ddarr:"\u21CA",DDotrahd:"\u2911",ddotseq:"\u2A77",deg:"\xB0",Del:"\u2207",Delta:"\u0394",delta:"\u03B4",demptyv:"\u29B1",dfisht:"\u297F",Dfr:"\u{1D507}",dfr:"\u{1D521}",dHar:"\u2965",dharl:"\u21C3",dharr:"\u21C2",DiacriticalAcute:"\xB4",DiacriticalDot:"\u02D9",DiacriticalDoubleAcute:"\u02DD",DiacriticalGrave:"`",DiacriticalTilde:"\u02DC",diam:"\u22C4",Diamond:"\u22C4",diamond:"\u22C4",diamondsuit:"\u2666",diams:"\u2666",die:"\xA8",DifferentialD:"\u2146",digamma:"\u03DD",disin:"\u22F2",div:"\xF7",divide:"\xF7",divideontimes:"\u22C7",divonx:"\u22C7",DJcy:"\u0402",djcy:"\u0452",dlcorn:"\u231E",dlcrop:"\u230D",dollar:"$",Dopf:"\u{1D53B}",dopf:"\u{1D555}",Dot:"\xA8",dot:"\u02D9",DotDot:"\u20DC",doteq:"\u2250",doteqdot:"\u2251",DotEqual:"\u2250",dotminus:"\u2238",dotplus:"\u2214",dotsquare:"\u22A1",doublebarwedge:"\u2306",DoubleContourIntegral:"\u222F",DoubleDot:"\xA8",DoubleDownArrow:"\u21D3",DoubleLeftArrow:"\u21D0",DoubleLeftRightArrow:"\u21D4",DoubleLeftTee:"\u2AE4",DoubleLongLeftArrow:"\u27F8",DoubleLongLeftRightArrow:"\u27FA",DoubleLongRightArrow:"\u27F9",DoubleRightArrow:"\u21D2",DoubleRightTee:"\u22A8",DoubleUpArrow:"\u21D1",DoubleUpDownArrow:"\u21D5",DoubleVerticalBar:"\u2225",DownArrow:"\u2193",Downarrow:"\u21D3",downarrow:"\u2193",DownArrowBar:"\u2913",DownArrowUpArrow:"\u21F5",DownBreve:"\u0311",downdownarrows:"\u21CA",downharpoonleft:"\u21C3",downharpoonright:"\u21C2",DownLeftRightVector:"\u2950",DownLeftTeeVector:"\u295E",DownLeftVector:"\u21BD",DownLeftVectorBar:"\u2956",DownRightTeeVector:"\u295F",DownRightVector:"\u21C1",DownRightVectorBar:"\u2957",DownTee:"\u22A4",DownTeeArrow:"\u21A7",drbkarow:"\u2910",drcorn:"\u231F",drcrop:"\u230C",Dscr:"\u{1D49F}",dscr:"\u{1D4B9}",DScy:"\u0405",dscy:"\u0455",dsol:"\u29F6",Dstrok:"\u0110",dstrok:"\u0111",dtdot:"\u22F1",dtri:"\u25BF",dtrif:"\u25BE",duarr:"\u21F5",duhar:"\u296F",dwangle:"\u29A6",DZcy:"\u040F",dzcy:"\u045F",dzigrarr:"\u27FF",Eacute:"\xC9",eacute:"\xE9",easter:"\u2A6E",Ecaron:"\u011A",ecaron:"\u011B",ecir:"\u2256",Ecirc:"\xCA",ecirc:"\xEA",ecolon:"\u2255",Ecy:"\u042D",ecy:"\u044D",eDDot:"\u2A77",Edot:"\u0116",eDot:"\u2251",edot:"\u0117",ee:"\u2147",efDot:"\u2252",Efr:"\u{1D508}",efr:"\u{1D522}",eg:"\u2A9A",Egrave:"\xC8",egrave:"\xE8",egs:"\u2A96",egsdot:"\u2A98",el:"\u2A99",Element:"\u2208",elinters:"\u23E7",ell:"\u2113",els:"\u2A95",elsdot:"\u2A97",Emacr:"\u0112",emacr:"\u0113",empty:"\u2205",emptyset:"\u2205",EmptySmallSquare:"\u25FB",emptyv:"\u2205",EmptyVerySmallSquare:"\u25AB",emsp:"\u2003",emsp13:"\u2004",emsp14:"\u2005",ENG:"\u014A",eng:"\u014B",ensp:"\u2002",Eogon:"\u0118",eogon:"\u0119",Eopf:"\u{1D53C}",eopf:"\u{1D556}",epar:"\u22D5",eparsl:"\u29E3",eplus:"\u2A71",epsi:"\u03B5",Epsilon:"\u0395",epsilon:"\u03B5",epsiv:"\u03F5",eqcirc:"\u2256",eqcolon:"\u2255",eqsim:"\u2242",eqslantgtr:"\u2A96",eqslantless:"\u2A95",Equal:"\u2A75",equals:"=",EqualTilde:"\u2242",equest:"\u225F",Equilibrium:"\u21CC",equiv:"\u2261",equivDD:"\u2A78",eqvparsl:"\u29E5",erarr:"\u2971",erDot:"\u2253",Escr:"\u2130",escr:"\u212F",esdot:"\u2250",Esim:"\u2A73",esim:"\u2242",Eta:"\u0397",eta:"\u03B7",ETH:"\xD0",eth:"\xF0",Euml:"\xCB",euml:"\xEB",euro:"\u20AC",excl:"!",exist:"\u2203",Exists:"\u2203",expectation:"\u2130",ExponentialE:"\u2147",exponentiale:"\u2147",fallingdotseq:"\u2252",Fcy:"\u0424",fcy:"\u0444",female:"\u2640",ffilig:"\uFB03",fflig:"\uFB00",ffllig:"\uFB04",Ffr:"\u{1D509}",ffr:"\u{1D523}",filig:"\uFB01",FilledSmallSquare:"\u25FC",FilledVerySmallSquare:"\u25AA",fjlig:"fj",flat:"\u266D",fllig:"\uFB02",fltns:"\u25B1",fnof:"\u0192",Fopf:"\u{1D53D}",fopf:"\u{1D557}",ForAll:"\u2200",forall:"\u2200",fork:"\u22D4",forkv:"\u2AD9",Fouriertrf:"\u2131",fpartint:"\u2A0D",frac12:"\xBD",frac13:"\u2153",frac14:"\xBC",frac15:"\u2155",frac16:"\u2159",frac18:"\u215B",frac23:"\u2154",frac25:"\u2156",frac34:"\xBE",frac35:"\u2157",frac38:"\u215C",frac45:"\u2158",frac56:"\u215A",frac58:"\u215D",frac78:"\u215E",frasl:"\u2044",frown:"\u2322",Fscr:"\u2131",fscr:"\u{1D4BB}",gacute:"\u01F5",Gamma:"\u0393",gamma:"\u03B3",Gammad:"\u03DC",gammad:"\u03DD",gap:"\u2A86",Gbreve:"\u011E",gbreve:"\u011F",Gcedil:"\u0122",Gcirc:"\u011C",gcirc:"\u011D",Gcy:"\u0413",gcy:"\u0433",Gdot:"\u0120",gdot:"\u0121",gE:"\u2267",ge:"\u2265",gEl:"\u2A8C",gel:"\u22DB",geq:"\u2265",geqq:"\u2267",geqslant:"\u2A7E",ges:"\u2A7E",gescc:"\u2AA9",gesdot:"\u2A80",gesdoto:"\u2A82",gesdotol:"\u2A84",gesl:"\u22DB\uFE00",gesles:"\u2A94",Gfr:"\u{1D50A}",gfr:"\u{1D524}",Gg:"\u22D9",gg:"\u226B",ggg:"\u22D9",gimel:"\u2137",GJcy:"\u0403",gjcy:"\u0453",gl:"\u2277",gla:"\u2AA5",glE:"\u2A92",glj:"\u2AA4",gnap:"\u2A8A",gnapprox:"\u2A8A",gnE:"\u2269",gne:"\u2A88",gneq:"\u2A88",gneqq:"\u2269",gnsim:"\u22E7",Gopf:"\u{1D53E}",gopf:"\u{1D558}",grave:"`",GreaterEqual:"\u2265",GreaterEqualLess:"\u22DB",GreaterFullEqual:"\u2267",GreaterGreater:"\u2AA2",GreaterLess:"\u2277",GreaterSlantEqual:"\u2A7E",GreaterTilde:"\u2273",Gscr:"\u{1D4A2}",gscr:"\u210A",gsim:"\u2273",gsime:"\u2A8E",gsiml:"\u2A90",Gt:"\u226B",GT:">",gt:">",gtcc:"\u2AA7",gtcir:"\u2A7A",gtdot:"\u22D7",gtlPar:"\u2995",gtquest:"\u2A7C",gtrapprox:"\u2A86",gtrarr:"\u2978",gtrdot:"\u22D7",gtreqless:"\u22DB",gtreqqless:"\u2A8C",gtrless:"\u2277",gtrsim:"\u2273",gvertneqq:"\u2269\uFE00",gvnE:"\u2269\uFE00",Hacek:"\u02C7",hairsp:"\u200A",half:"\xBD",hamilt:"\u210B",HARDcy:"\u042A",hardcy:"\u044A",hArr:"\u21D4",harr:"\u2194",harrcir:"\u2948",harrw:"\u21AD",Hat:"^",hbar:"\u210F",Hcirc:"\u0124",hcirc:"\u0125",hearts:"\u2665",heartsuit:"\u2665",hellip:"\u2026",hercon:"\u22B9",Hfr:"\u210C",hfr:"\u{1D525}",HilbertSpace:"\u210B",hksearow:"\u2925",hkswarow:"\u2926",hoarr:"\u21FF",homtht:"\u223B",hookleftarrow:"\u21A9",hookrightarrow:"\u21AA",Hopf:"\u210D",hopf:"\u{1D559}",horbar:"\u2015",HorizontalLine:"\u2500",Hscr:"\u210B",hscr:"\u{1D4BD}",hslash:"\u210F",Hstrok:"\u0126",hstrok:"\u0127",HumpDownHump:"\u224E",HumpEqual:"\u224F",hybull:"\u2043",hyphen:"\u2010",Iacute:"\xCD",iacute:"\xED",ic:"\u2063",Icirc:"\xCE",icirc:"\xEE",Icy:"\u0418",icy:"\u0438",Idot:"\u0130",IEcy:"\u0415",iecy:"\u0435",iexcl:"\xA1",iff:"\u21D4",Ifr:"\u2111",ifr:"\u{1D526}",Igrave:"\xCC",igrave:"\xEC",ii:"\u2148",iiiint:"\u2A0C",iiint:"\u222D",iinfin:"\u29DC",iiota:"\u2129",IJlig:"\u0132",ijlig:"\u0133",Im:"\u2111",Imacr:"\u012A",imacr:"\u012B",image:"\u2111",ImaginaryI:"\u2148",imagline:"\u2110",imagpart:"\u2111",imath:"\u0131",imof:"\u22B7",imped:"\u01B5",Implies:"\u21D2",in:"\u2208",incare:"\u2105",infin:"\u221E",infintie:"\u29DD",inodot:"\u0131",Int:"\u222C",int:"\u222B",intcal:"\u22BA",integers:"\u2124",Integral:"\u222B",intercal:"\u22BA",Intersection:"\u22C2",intlarhk:"\u2A17",intprod:"\u2A3C",InvisibleComma:"\u2063",InvisibleTimes:"\u2062",IOcy:"\u0401",iocy:"\u0451",Iogon:"\u012E",iogon:"\u012F",Iopf:"\u{1D540}",iopf:"\u{1D55A}",Iota:"\u0399",iota:"\u03B9",iprod:"\u2A3C",iquest:"\xBF",Iscr:"\u2110",iscr:"\u{1D4BE}",isin:"\u2208",isindot:"\u22F5",isinE:"\u22F9",isins:"\u22F4",isinsv:"\u22F3",isinv:"\u2208",it:"\u2062",Itilde:"\u0128",itilde:"\u0129",Iukcy:"\u0406",iukcy:"\u0456",Iuml:"\xCF",iuml:"\xEF",Jcirc:"\u0134",jcirc:"\u0135",Jcy:"\u0419",jcy:"\u0439",Jfr:"\u{1D50D}",jfr:"\u{1D527}",jmath:"\u0237",Jopf:"\u{1D541}",jopf:"\u{1D55B}",Jscr:"\u{1D4A5}",jscr:"\u{1D4BF}",Jsercy:"\u0408",jsercy:"\u0458",Jukcy:"\u0404",jukcy:"\u0454",Kappa:"\u039A",kappa:"\u03BA",kappav:"\u03F0",Kcedil:"\u0136",kcedil:"\u0137",Kcy:"\u041A",kcy:"\u043A",Kfr:"\u{1D50E}",kfr:"\u{1D528}",kgreen:"\u0138",KHcy:"\u0425",khcy:"\u0445",KJcy:"\u040C",kjcy:"\u045C",Kopf:"\u{1D542}",kopf:"\u{1D55C}",Kscr:"\u{1D4A6}",kscr:"\u{1D4C0}",lAarr:"\u21DA",Lacute:"\u0139",lacute:"\u013A",laemptyv:"\u29B4",lagran:"\u2112",Lambda:"\u039B",lambda:"\u03BB",Lang:"\u27EA",lang:"\u27E8",langd:"\u2991",langle:"\u27E8",lap:"\u2A85",Laplacetrf:"\u2112",laquo:"\xAB",Larr:"\u219E",lArr:"\u21D0",larr:"\u2190",larrb:"\u21E4",larrbfs:"\u291F",larrfs:"\u291D",larrhk:"\u21A9",larrlp:"\u21AB",larrpl:"\u2939",larrsim:"\u2973",larrtl:"\u21A2",lat:"\u2AAB",lAtail:"\u291B",latail:"\u2919",late:"\u2AAD",lates:"\u2AAD\uFE00",lBarr:"\u290E",lbarr:"\u290C",lbbrk:"\u2772",lbrace:"{",lbrack:"[",lbrke:"\u298B",lbrksld:"\u298F",lbrkslu:"\u298D",Lcaron:"\u013D",lcaron:"\u013E",Lcedil:"\u013B",lcedil:"\u013C",lceil:"\u2308",lcub:"{",Lcy:"\u041B",lcy:"\u043B",ldca:"\u2936",ldquo:"\u201C",ldquor:"\u201E",ldrdhar:"\u2967",ldrushar:"\u294B",ldsh:"\u21B2",lE:"\u2266",le:"\u2264",LeftAngleBracket:"\u27E8",LeftArrow:"\u2190",Leftarrow:"\u21D0",leftarrow:"\u2190",LeftArrowBar:"\u21E4",LeftArrowRightArrow:"\u21C6",leftarrowtail:"\u21A2",LeftCeiling:"\u2308",LeftDoubleBracket:"\u27E6",LeftDownTeeVector:"\u2961",LeftDownVector:"\u21C3",LeftDownVectorBar:"\u2959",LeftFloor:"\u230A",leftharpoondown:"\u21BD",leftharpoonup:"\u21BC",leftleftarrows:"\u21C7",LeftRightArrow:"\u2194",Leftrightarrow:"\u21D4",leftrightarrow:"\u2194",leftrightarrows:"\u21C6",leftrightharpoons:"\u21CB",leftrightsquigarrow:"\u21AD",LeftRightVector:"\u294E",LeftTee:"\u22A3",LeftTeeArrow:"\u21A4",LeftTeeVector:"\u295A",leftthreetimes:"\u22CB",LeftTriangle:"\u22B2",LeftTriangleBar:"\u29CF",LeftTriangleEqual:"\u22B4",LeftUpDownVector:"\u2951",LeftUpTeeVector:"\u2960",LeftUpVector:"\u21BF",LeftUpVectorBar:"\u2958",LeftVector:"\u21BC",LeftVectorBar:"\u2952",lEg:"\u2A8B",leg:"\u22DA",leq:"\u2264",leqq:"\u2266",leqslant:"\u2A7D",les:"\u2A7D",lescc:"\u2AA8",lesdot:"\u2A7F",lesdoto:"\u2A81",lesdotor:"\u2A83",lesg:"\u22DA\uFE00",lesges:"\u2A93",lessapprox:"\u2A85",lessdot:"\u22D6",lesseqgtr:"\u22DA",lesseqqgtr:"\u2A8B",LessEqualGreater:"\u22DA",LessFullEqual:"\u2266",LessGreater:"\u2276",lessgtr:"\u2276",LessLess:"\u2AA1",lesssim:"\u2272",LessSlantEqual:"\u2A7D",LessTilde:"\u2272",lfisht:"\u297C",lfloor:"\u230A",Lfr:"\u{1D50F}",lfr:"\u{1D529}",lg:"\u2276",lgE:"\u2A91",lHar:"\u2962",lhard:"\u21BD",lharu:"\u21BC",lharul:"\u296A",lhblk:"\u2584",LJcy:"\u0409",ljcy:"\u0459",Ll:"\u22D8",ll:"\u226A",llarr:"\u21C7",llcorner:"\u231E",Lleftarrow:"\u21DA",llhard:"\u296B",lltri:"\u25FA",Lmidot:"\u013F",lmidot:"\u0140",lmoust:"\u23B0",lmoustache:"\u23B0",lnap:"\u2A89",lnapprox:"\u2A89",lnE:"\u2268",lne:"\u2A87",lneq:"\u2A87",lneqq:"\u2268",lnsim:"\u22E6",loang:"\u27EC",loarr:"\u21FD",lobrk:"\u27E6",LongLeftArrow:"\u27F5",Longleftarrow:"\u27F8",longleftarrow:"\u27F5",LongLeftRightArrow:"\u27F7",Longleftrightarrow:"\u27FA",longleftrightarrow:"\u27F7",longmapsto:"\u27FC",LongRightArrow:"\u27F6",Longrightarrow:"\u27F9",longrightarrow:"\u27F6",looparrowleft:"\u21AB",looparrowright:"\u21AC",lopar:"\u2985",Lopf:"\u{1D543}",lopf:"\u{1D55D}",loplus:"\u2A2D",lotimes:"\u2A34",lowast:"\u2217",lowbar:"_",LowerLeftArrow:"\u2199",LowerRightArrow:"\u2198",loz:"\u25CA",lozenge:"\u25CA",lozf:"\u29EB",lpar:"(",lparlt:"\u2993",lrarr:"\u21C6",lrcorner:"\u231F",lrhar:"\u21CB",lrhard:"\u296D",lrm:"\u200E",lrtri:"\u22BF",lsaquo:"\u2039",Lscr:"\u2112",lscr:"\u{1D4C1}",Lsh:"\u21B0",lsh:"\u21B0",lsim:"\u2272",lsime:"\u2A8D",lsimg:"\u2A8F",lsqb:"[",lsquo:"\u2018",lsquor:"\u201A",Lstrok:"\u0141",lstrok:"\u0142",Lt:"\u226A",LT:"<",lt:"<",ltcc:"\u2AA6",ltcir:"\u2A79",ltdot:"\u22D6",lthree:"\u22CB",ltimes:"\u22C9",ltlarr:"\u2976",ltquest:"\u2A7B",ltri:"\u25C3",ltrie:"\u22B4",ltrif:"\u25C2",ltrPar:"\u2996",lurdshar:"\u294A",luruhar:"\u2966",lvertneqq:"\u2268\uFE00",lvnE:"\u2268\uFE00",macr:"\xAF",male:"\u2642",malt:"\u2720",maltese:"\u2720",Map:"\u2905",map:"\u21A6",mapsto:"\u21A6",mapstodown:"\u21A7",mapstoleft:"\u21A4",mapstoup:"\u21A5",marker:"\u25AE",mcomma:"\u2A29",Mcy:"\u041C",mcy:"\u043C",mdash:"\u2014",mDDot:"\u223A",measuredangle:"\u2221",MediumSpace:"\u205F",Mellintrf:"\u2133",Mfr:"\u{1D510}",mfr:"\u{1D52A}",mho:"\u2127",micro:"\xB5",mid:"\u2223",midast:"*",midcir:"\u2AF0",middot:"\xB7",minus:"\u2212",minusb:"\u229F",minusd:"\u2238",minusdu:"\u2A2A",MinusPlus:"\u2213",mlcp:"\u2ADB",mldr:"\u2026",mnplus:"\u2213",models:"\u22A7",Mopf:"\u{1D544}",mopf:"\u{1D55E}",mp:"\u2213",Mscr:"\u2133",mscr:"\u{1D4C2}",mstpos:"\u223E",Mu:"\u039C",mu:"\u03BC",multimap:"\u22B8",mumap:"\u22B8",nabla:"\u2207",Nacute:"\u0143",nacute:"\u0144",nang:"\u2220\u20D2",nap:"\u2249",napE:"\u2A70\u0338",napid:"\u224B\u0338",napos:"\u0149",napprox:"\u2249",natur:"\u266E",natural:"\u266E",naturals:"\u2115",nbsp:"\xA0",nbump:"\u224E\u0338",nbumpe:"\u224F\u0338",ncap:"\u2A43",Ncaron:"\u0147",ncaron:"\u0148",Ncedil:"\u0145",ncedil:"\u0146",ncong:"\u2247",ncongdot:"\u2A6D\u0338",ncup:"\u2A42",Ncy:"\u041D",ncy:"\u043D",ndash:"\u2013",ne:"\u2260",nearhk:"\u2924",neArr:"\u21D7",nearr:"\u2197",nearrow:"\u2197",nedot:"\u2250\u0338",NegativeMediumSpace:"\u200B",NegativeThickSpace:"\u200B",NegativeThinSpace:"\u200B",NegativeVeryThinSpace:"\u200B",nequiv:"\u2262",nesear:"\u2928",nesim:"\u2242\u0338",NestedGreaterGreater:"\u226B",NestedLessLess:"\u226A",NewLine:`
`,nexist:"\u2204",nexists:"\u2204",Nfr:"\u{1D511}",nfr:"\u{1D52B}",ngE:"\u2267\u0338",nge:"\u2271",ngeq:"\u2271",ngeqq:"\u2267\u0338",ngeqslant:"\u2A7E\u0338",nges:"\u2A7E\u0338",nGg:"\u22D9\u0338",ngsim:"\u2275",nGt:"\u226B\u20D2",ngt:"\u226F",ngtr:"\u226F",nGtv:"\u226B\u0338",nhArr:"\u21CE",nharr:"\u21AE",nhpar:"\u2AF2",ni:"\u220B",nis:"\u22FC",nisd:"\u22FA",niv:"\u220B",NJcy:"\u040A",njcy:"\u045A",nlArr:"\u21CD",nlarr:"\u219A",nldr:"\u2025",nlE:"\u2266\u0338",nle:"\u2270",nLeftarrow:"\u21CD",nleftarrow:"\u219A",nLeftrightarrow:"\u21CE",nleftrightarrow:"\u21AE",nleq:"\u2270",nleqq:"\u2266\u0338",nleqslant:"\u2A7D\u0338",nles:"\u2A7D\u0338",nless:"\u226E",nLl:"\u22D8\u0338",nlsim:"\u2274",nLt:"\u226A\u20D2",nlt:"\u226E",nltri:"\u22EA",nltrie:"\u22EC",nLtv:"\u226A\u0338",nmid:"\u2224",NoBreak:"\u2060",NonBreakingSpace:"\xA0",Nopf:"\u2115",nopf:"\u{1D55F}",Not:"\u2AEC",not:"\xAC",NotCongruent:"\u2262",NotCupCap:"\u226D",NotDoubleVerticalBar:"\u2226",NotElement:"\u2209",NotEqual:"\u2260",NotEqualTilde:"\u2242\u0338",NotExists:"\u2204",NotGreater:"\u226F",NotGreaterEqual:"\u2271",NotGreaterFullEqual:"\u2267\u0338",NotGreaterGreater:"\u226B\u0338",NotGreaterLess:"\u2279",NotGreaterSlantEqual:"\u2A7E\u0338",NotGreaterTilde:"\u2275",NotHumpDownHump:"\u224E\u0338",NotHumpEqual:"\u224F\u0338",notin:"\u2209",notindot:"\u22F5\u0338",notinE:"\u22F9\u0338",notinva:"\u2209",notinvb:"\u22F7",notinvc:"\u22F6",NotLeftTriangle:"\u22EA",NotLeftTriangleBar:"\u29CF\u0338",NotLeftTriangleEqual:"\u22EC",NotLess:"\u226E",NotLessEqual:"\u2270",NotLessGreater:"\u2278",NotLessLess:"\u226A\u0338",NotLessSlantEqual:"\u2A7D\u0338",NotLessTilde:"\u2274",NotNestedGreaterGreater:"\u2AA2\u0338",NotNestedLessLess:"\u2AA1\u0338",notni:"\u220C",notniva:"\u220C",notnivb:"\u22FE",notnivc:"\u22FD",NotPrecedes:"\u2280",NotPrecedesEqual:"\u2AAF\u0338",NotPrecedesSlantEqual:"\u22E0",NotReverseElement:"\u220C",NotRightTriangle:"\u22EB",NotRightTriangleBar:"\u29D0\u0338",NotRightTriangleEqual:"\u22ED",NotSquareSubset:"\u228F\u0338",NotSquareSubsetEqual:"\u22E2",NotSquareSuperset:"\u2290\u0338",NotSquareSupersetEqual:"\u22E3",NotSubset:"\u2282\u20D2",NotSubsetEqual:"\u2288",NotSucceeds:"\u2281",NotSucceedsEqual:"\u2AB0\u0338",NotSucceedsSlantEqual:"\u22E1",NotSucceedsTilde:"\u227F\u0338",NotSuperset:"\u2283\u20D2",NotSupersetEqual:"\u2289",NotTilde:"\u2241",NotTildeEqual:"\u2244",NotTildeFullEqual:"\u2247",NotTildeTilde:"\u2249",NotVerticalBar:"\u2224",npar:"\u2226",nparallel:"\u2226",nparsl:"\u2AFD\u20E5",npart:"\u2202\u0338",npolint:"\u2A14",npr:"\u2280",nprcue:"\u22E0",npre:"\u2AAF\u0338",nprec:"\u2280",npreceq:"\u2AAF\u0338",nrArr:"\u21CF",nrarr:"\u219B",nrarrc:"\u2933\u0338",nrarrw:"\u219D\u0338",nRightarrow:"\u21CF",nrightarrow:"\u219B",nrtri:"\u22EB",nrtrie:"\u22ED",nsc:"\u2281",nsccue:"\u22E1",nsce:"\u2AB0\u0338",Nscr:"\u{1D4A9}",nscr:"\u{1D4C3}",nshortmid:"\u2224",nshortparallel:"\u2226",nsim:"\u2241",nsime:"\u2244",nsimeq:"\u2244",nsmid:"\u2224",nspar:"\u2226",nsqsube:"\u22E2",nsqsupe:"\u22E3",nsub:"\u2284",nsubE:"\u2AC5\u0338",nsube:"\u2288",nsubset:"\u2282\u20D2",nsubseteq:"\u2288",nsubseteqq:"\u2AC5\u0338",nsucc:"\u2281",nsucceq:"\u2AB0\u0338",nsup:"\u2285",nsupE:"\u2AC6\u0338",nsupe:"\u2289",nsupset:"\u2283\u20D2",nsupseteq:"\u2289",nsupseteqq:"\u2AC6\u0338",ntgl:"\u2279",Ntilde:"\xD1",ntilde:"\xF1",ntlg:"\u2278",ntriangleleft:"\u22EA",ntrianglelefteq:"\u22EC",ntriangleright:"\u22EB",ntrianglerighteq:"\u22ED",Nu:"\u039D",nu:"\u03BD",num:"#",numero:"\u2116",numsp:"\u2007",nvap:"\u224D\u20D2",nVDash:"\u22AF",nVdash:"\u22AE",nvDash:"\u22AD",nvdash:"\u22AC",nvge:"\u2265\u20D2",nvgt:">\u20D2",nvHarr:"\u2904",nvinfin:"\u29DE",nvlArr:"\u2902",nvle:"\u2264\u20D2",nvlt:"<\u20D2",nvltrie:"\u22B4\u20D2",nvrArr:"\u2903",nvrtrie:"\u22B5\u20D2",nvsim:"\u223C\u20D2",nwarhk:"\u2923",nwArr:"\u21D6",nwarr:"\u2196",nwarrow:"\u2196",nwnear:"\u2927",Oacute:"\xD3",oacute:"\xF3",oast:"\u229B",ocir:"\u229A",Ocirc:"\xD4",ocirc:"\xF4",Ocy:"\u041E",ocy:"\u043E",odash:"\u229D",Odblac:"\u0150",odblac:"\u0151",odiv:"\u2A38",odot:"\u2299",odsold:"\u29BC",OElig:"\u0152",oelig:"\u0153",ofcir:"\u29BF",Ofr:"\u{1D512}",ofr:"\u{1D52C}",ogon:"\u02DB",Ograve:"\xD2",ograve:"\xF2",ogt:"\u29C1",ohbar:"\u29B5",ohm:"\u03A9",oint:"\u222E",olarr:"\u21BA",olcir:"\u29BE",olcross:"\u29BB",oline:"\u203E",olt:"\u29C0",Omacr:"\u014C",omacr:"\u014D",Omega:"\u03A9",omega:"\u03C9",Omicron:"\u039F",omicron:"\u03BF",omid:"\u29B6",ominus:"\u2296",Oopf:"\u{1D546}",oopf:"\u{1D560}",opar:"\u29B7",OpenCurlyDoubleQuote:"\u201C",OpenCurlyQuote:"\u2018",operp:"\u29B9",oplus:"\u2295",Or:"\u2A54",or:"\u2228",orarr:"\u21BB",ord:"\u2A5D",order:"\u2134",orderof:"\u2134",ordf:"\xAA",ordm:"\xBA",origof:"\u22B6",oror:"\u2A56",orslope:"\u2A57",orv:"\u2A5B",oS:"\u24C8",Oscr:"\u{1D4AA}",oscr:"\u2134",Oslash:"\xD8",oslash:"\xF8",osol:"\u2298",Otilde:"\xD5",otilde:"\xF5",Otimes:"\u2A37",otimes:"\u2297",otimesas:"\u2A36",Ouml:"\xD6",ouml:"\xF6",ovbar:"\u233D",OverBar:"\u203E",OverBrace:"\u23DE",OverBracket:"\u23B4",OverParenthesis:"\u23DC",par:"\u2225",para:"\xB6",parallel:"\u2225",parsim:"\u2AF3",parsl:"\u2AFD",part:"\u2202",PartialD:"\u2202",Pcy:"\u041F",pcy:"\u043F",percnt:"%",period:".",permil:"\u2030",perp:"\u22A5",pertenk:"\u2031",Pfr:"\u{1D513}",pfr:"\u{1D52D}",Phi:"\u03A6",phi:"\u03C6",phiv:"\u03D5",phmmat:"\u2133",phone:"\u260E",Pi:"\u03A0",pi:"\u03C0",pitchfork:"\u22D4",piv:"\u03D6",planck:"\u210F",planckh:"\u210E",plankv:"\u210F",plus:"+",plusacir:"\u2A23",plusb:"\u229E",pluscir:"\u2A22",plusdo:"\u2214",plusdu:"\u2A25",pluse:"\u2A72",PlusMinus:"\xB1",plusmn:"\xB1",plussim:"\u2A26",plustwo:"\u2A27",pm:"\xB1",Poincareplane:"\u210C",pointint:"\u2A15",Popf:"\u2119",popf:"\u{1D561}",pound:"\xA3",Pr:"\u2ABB",pr:"\u227A",prap:"\u2AB7",prcue:"\u227C",prE:"\u2AB3",pre:"\u2AAF",prec:"\u227A",precapprox:"\u2AB7",preccurlyeq:"\u227C",Precedes:"\u227A",PrecedesEqual:"\u2AAF",PrecedesSlantEqual:"\u227C",PrecedesTilde:"\u227E",preceq:"\u2AAF",precnapprox:"\u2AB9",precneqq:"\u2AB5",precnsim:"\u22E8",precsim:"\u227E",Prime:"\u2033",prime:"\u2032",primes:"\u2119",prnap:"\u2AB9",prnE:"\u2AB5",prnsim:"\u22E8",prod:"\u220F",Product:"\u220F",profalar:"\u232E",profline:"\u2312",profsurf:"\u2313",prop:"\u221D",Proportion:"\u2237",Proportional:"\u221D",propto:"\u221D",prsim:"\u227E",prurel:"\u22B0",Pscr:"\u{1D4AB}",pscr:"\u{1D4C5}",Psi:"\u03A8",psi:"\u03C8",puncsp:"\u2008",Qfr:"\u{1D514}",qfr:"\u{1D52E}",qint:"\u2A0C",Qopf:"\u211A",qopf:"\u{1D562}",qprime:"\u2057",Qscr:"\u{1D4AC}",qscr:"\u{1D4C6}",quaternions:"\u210D",quatint:"\u2A16",quest:"?",questeq:"\u225F",QUOT:'"',quot:'"',rAarr:"\u21DB",race:"\u223D\u0331",Racute:"\u0154",racute:"\u0155",radic:"\u221A",raemptyv:"\u29B3",Rang:"\u27EB",rang:"\u27E9",rangd:"\u2992",range:"\u29A5",rangle:"\u27E9",raquo:"\xBB",Rarr:"\u21A0",rArr:"\u21D2",rarr:"\u2192",rarrap:"\u2975",rarrb:"\u21E5",rarrbfs:"\u2920",rarrc:"\u2933",rarrfs:"\u291E",rarrhk:"\u21AA",rarrlp:"\u21AC",rarrpl:"\u2945",rarrsim:"\u2974",Rarrtl:"\u2916",rarrtl:"\u21A3",rarrw:"\u219D",rAtail:"\u291C",ratail:"\u291A",ratio:"\u2236",rationals:"\u211A",RBarr:"\u2910",rBarr:"\u290F",rbarr:"\u290D",rbbrk:"\u2773",rbrace:"}",rbrack:"]",rbrke:"\u298C",rbrksld:"\u298E",rbrkslu:"\u2990",Rcaron:"\u0158",rcaron:"\u0159",Rcedil:"\u0156",rcedil:"\u0157",rceil:"\u2309",rcub:"}",Rcy:"\u0420",rcy:"\u0440",rdca:"\u2937",rdldhar:"\u2969",rdquo:"\u201D",rdquor:"\u201D",rdsh:"\u21B3",Re:"\u211C",real:"\u211C",realine:"\u211B",realpart:"\u211C",reals:"\u211D",rect:"\u25AD",REG:"\xAE",reg:"\xAE",ReverseElement:"\u220B",ReverseEquilibrium:"\u21CB",ReverseUpEquilibrium:"\u296F",rfisht:"\u297D",rfloor:"\u230B",Rfr:"\u211C",rfr:"\u{1D52F}",rHar:"\u2964",rhard:"\u21C1",rharu:"\u21C0",rharul:"\u296C",Rho:"\u03A1",rho:"\u03C1",rhov:"\u03F1",RightAngleBracket:"\u27E9",RightArrow:"\u2192",Rightarrow:"\u21D2",rightarrow:"\u2192",RightArrowBar:"\u21E5",RightArrowLeftArrow:"\u21C4",rightarrowtail:"\u21A3",RightCeiling:"\u2309",RightDoubleBracket:"\u27E7",RightDownTeeVector:"\u295D",RightDownVector:"\u21C2",RightDownVectorBar:"\u2955",RightFloor:"\u230B",rightharpoondown:"\u21C1",rightharpoonup:"\u21C0",rightleftarrows:"\u21C4",rightleftharpoons:"\u21CC",rightrightarrows:"\u21C9",rightsquigarrow:"\u219D",RightTee:"\u22A2",RightTeeArrow:"\u21A6",RightTeeVector:"\u295B",rightthreetimes:"\u22CC",RightTriangle:"\u22B3",RightTriangleBar:"\u29D0",RightTriangleEqual:"\u22B5",RightUpDownVector:"\u294F",RightUpTeeVector:"\u295C",RightUpVector:"\u21BE",RightUpVectorBar:"\u2954",RightVector:"\u21C0",RightVectorBar:"\u2953",ring:"\u02DA",risingdotseq:"\u2253",rlarr:"\u21C4",rlhar:"\u21CC",rlm:"\u200F",rmoust:"\u23B1",rmoustache:"\u23B1",rnmid:"\u2AEE",roang:"\u27ED",roarr:"\u21FE",robrk:"\u27E7",ropar:"\u2986",Ropf:"\u211D",ropf:"\u{1D563}",roplus:"\u2A2E",rotimes:"\u2A35",RoundImplies:"\u2970",rpar:")",rpargt:"\u2994",rppolint:"\u2A12",rrarr:"\u21C9",Rrightarrow:"\u21DB",rsaquo:"\u203A",Rscr:"\u211B",rscr:"\u{1D4C7}",Rsh:"\u21B1",rsh:"\u21B1",rsqb:"]",rsquo:"\u2019",rsquor:"\u2019",rthree:"\u22CC",rtimes:"\u22CA",rtri:"\u25B9",rtrie:"\u22B5",rtrif:"\u25B8",rtriltri:"\u29CE",RuleDelayed:"\u29F4",ruluhar:"\u2968",rx:"\u211E",Sacute:"\u015A",sacute:"\u015B",sbquo:"\u201A",Sc:"\u2ABC",sc:"\u227B",scap:"\u2AB8",Scaron:"\u0160",scaron:"\u0161",sccue:"\u227D",scE:"\u2AB4",sce:"\u2AB0",Scedil:"\u015E",scedil:"\u015F",Scirc:"\u015C",scirc:"\u015D",scnap:"\u2ABA",scnE:"\u2AB6",scnsim:"\u22E9",scpolint:"\u2A13",scsim:"\u227F",Scy:"\u0421",scy:"\u0441",sdot:"\u22C5",sdotb:"\u22A1",sdote:"\u2A66",searhk:"\u2925",seArr:"\u21D8",searr:"\u2198",searrow:"\u2198",sect:"\xA7",semi:";",seswar:"\u2929",setminus:"\u2216",setmn:"\u2216",sext:"\u2736",Sfr:"\u{1D516}",sfr:"\u{1D530}",sfrown:"\u2322",sharp:"\u266F",SHCHcy:"\u0429",shchcy:"\u0449",SHcy:"\u0428",shcy:"\u0448",ShortDownArrow:"\u2193",ShortLeftArrow:"\u2190",shortmid:"\u2223",shortparallel:"\u2225",ShortRightArrow:"\u2192",ShortUpArrow:"\u2191",shy:"\xAD",Sigma:"\u03A3",sigma:"\u03C3",sigmaf:"\u03C2",sigmav:"\u03C2",sim:"\u223C",simdot:"\u2A6A",sime:"\u2243",simeq:"\u2243",simg:"\u2A9E",simgE:"\u2AA0",siml:"\u2A9D",simlE:"\u2A9F",simne:"\u2246",simplus:"\u2A24",simrarr:"\u2972",slarr:"\u2190",SmallCircle:"\u2218",smallsetminus:"\u2216",smashp:"\u2A33",smeparsl:"\u29E4",smid:"\u2223",smile:"\u2323",smt:"\u2AAA",smte:"\u2AAC",smtes:"\u2AAC\uFE00",SOFTcy:"\u042C",softcy:"\u044C",sol:"/",solb:"\u29C4",solbar:"\u233F",Sopf:"\u{1D54A}",sopf:"\u{1D564}",spades:"\u2660",spadesuit:"\u2660",spar:"\u2225",sqcap:"\u2293",sqcaps:"\u2293\uFE00",sqcup:"\u2294",sqcups:"\u2294\uFE00",Sqrt:"\u221A",sqsub:"\u228F",sqsube:"\u2291",sqsubset:"\u228F",sqsubseteq:"\u2291",sqsup:"\u2290",sqsupe:"\u2292",sqsupset:"\u2290",sqsupseteq:"\u2292",squ:"\u25A1",Square:"\u25A1",square:"\u25A1",SquareIntersection:"\u2293",SquareSubset:"\u228F",SquareSubsetEqual:"\u2291",SquareSuperset:"\u2290",SquareSupersetEqual:"\u2292",SquareUnion:"\u2294",squarf:"\u25AA",squf:"\u25AA",srarr:"\u2192",Sscr:"\u{1D4AE}",sscr:"\u{1D4C8}",ssetmn:"\u2216",ssmile:"\u2323",sstarf:"\u22C6",Star:"\u22C6",star:"\u2606",starf:"\u2605",straightepsilon:"\u03F5",straightphi:"\u03D5",strns:"\xAF",Sub:"\u22D0",sub:"\u2282",subdot:"\u2ABD",subE:"\u2AC5",sube:"\u2286",subedot:"\u2AC3",submult:"\u2AC1",subnE:"\u2ACB",subne:"\u228A",subplus:"\u2ABF",subrarr:"\u2979",Subset:"\u22D0",subset:"\u2282",subseteq:"\u2286",subseteqq:"\u2AC5",SubsetEqual:"\u2286",subsetneq:"\u228A",subsetneqq:"\u2ACB",subsim:"\u2AC7",subsub:"\u2AD5",subsup:"\u2AD3",succ:"\u227B",succapprox:"\u2AB8",succcurlyeq:"\u227D",Succeeds:"\u227B",SucceedsEqual:"\u2AB0",SucceedsSlantEqual:"\u227D",SucceedsTilde:"\u227F",succeq:"\u2AB0",succnapprox:"\u2ABA",succneqq:"\u2AB6",succnsim:"\u22E9",succsim:"\u227F",SuchThat:"\u220B",Sum:"\u2211",sum:"\u2211",sung:"\u266A",Sup:"\u22D1",sup:"\u2283",sup1:"\xB9",sup2:"\xB2",sup3:"\xB3",supdot:"\u2ABE",supdsub:"\u2AD8",supE:"\u2AC6",supe:"\u2287",supedot:"\u2AC4",Superset:"\u2283",SupersetEqual:"\u2287",suphsol:"\u27C9",suphsub:"\u2AD7",suplarr:"\u297B",supmult:"\u2AC2",supnE:"\u2ACC",supne:"\u228B",supplus:"\u2AC0",Supset:"\u22D1",supset:"\u2283",supseteq:"\u2287",supseteqq:"\u2AC6",supsetneq:"\u228B",supsetneqq:"\u2ACC",supsim:"\u2AC8",supsub:"\u2AD4",supsup:"\u2AD6",swarhk:"\u2926",swArr:"\u21D9",swarr:"\u2199",swarrow:"\u2199",swnwar:"\u292A",szlig:"\xDF",Tab:"	",target:"\u2316",Tau:"\u03A4",tau:"\u03C4",tbrk:"\u23B4",Tcaron:"\u0164",tcaron:"\u0165",Tcedil:"\u0162",tcedil:"\u0163",Tcy:"\u0422",tcy:"\u0442",tdot:"\u20DB",telrec:"\u2315",Tfr:"\u{1D517}",tfr:"\u{1D531}",there4:"\u2234",Therefore:"\u2234",therefore:"\u2234",Theta:"\u0398",theta:"\u03B8",thetasym:"\u03D1",thetav:"\u03D1",thickapprox:"\u2248",thicksim:"\u223C",ThickSpace:"\u205F\u200A",thinsp:"\u2009",ThinSpace:"\u2009",thkap:"\u2248",thksim:"\u223C",THORN:"\xDE",thorn:"\xFE",Tilde:"\u223C",tilde:"\u02DC",TildeEqual:"\u2243",TildeFullEqual:"\u2245",TildeTilde:"\u2248",times:"\xD7",timesb:"\u22A0",timesbar:"\u2A31",timesd:"\u2A30",tint:"\u222D",toea:"\u2928",top:"\u22A4",topbot:"\u2336",topcir:"\u2AF1",Topf:"\u{1D54B}",topf:"\u{1D565}",topfork:"\u2ADA",tosa:"\u2929",tprime:"\u2034",TRADE:"\u2122",trade:"\u2122",triangle:"\u25B5",triangledown:"\u25BF",triangleleft:"\u25C3",trianglelefteq:"\u22B4",triangleq:"\u225C",triangleright:"\u25B9",trianglerighteq:"\u22B5",tridot:"\u25EC",trie:"\u225C",triminus:"\u2A3A",TripleDot:"\u20DB",triplus:"\u2A39",trisb:"\u29CD",tritime:"\u2A3B",trpezium:"\u23E2",Tscr:"\u{1D4AF}",tscr:"\u{1D4C9}",TScy:"\u0426",tscy:"\u0446",TSHcy:"\u040B",tshcy:"\u045B",Tstrok:"\u0166",tstrok:"\u0167",twixt:"\u226C",twoheadleftarrow:"\u219E",twoheadrightarrow:"\u21A0",Uacute:"\xDA",uacute:"\xFA",Uarr:"\u219F",uArr:"\u21D1",uarr:"\u2191",Uarrocir:"\u2949",Ubrcy:"\u040E",ubrcy:"\u045E",Ubreve:"\u016C",ubreve:"\u016D",Ucirc:"\xDB",ucirc:"\xFB",Ucy:"\u0423",ucy:"\u0443",udarr:"\u21C5",Udblac:"\u0170",udblac:"\u0171",udhar:"\u296E",ufisht:"\u297E",Ufr:"\u{1D518}",ufr:"\u{1D532}",Ugrave:"\xD9",ugrave:"\xF9",uHar:"\u2963",uharl:"\u21BF",uharr:"\u21BE",uhblk:"\u2580",ulcorn:"\u231C",ulcorner:"\u231C",ulcrop:"\u230F",ultri:"\u25F8",Umacr:"\u016A",umacr:"\u016B",uml:"\xA8",UnderBar:"_",UnderBrace:"\u23DF",UnderBracket:"\u23B5",UnderParenthesis:"\u23DD",Union:"\u22C3",UnionPlus:"\u228E",Uogon:"\u0172",uogon:"\u0173",Uopf:"\u{1D54C}",uopf:"\u{1D566}",UpArrow:"\u2191",Uparrow:"\u21D1",uparrow:"\u2191",UpArrowBar:"\u2912",UpArrowDownArrow:"\u21C5",UpDownArrow:"\u2195",Updownarrow:"\u21D5",updownarrow:"\u2195",UpEquilibrium:"\u296E",upharpoonleft:"\u21BF",upharpoonright:"\u21BE",uplus:"\u228E",UpperLeftArrow:"\u2196",UpperRightArrow:"\u2197",Upsi:"\u03D2",upsi:"\u03C5",upsih:"\u03D2",Upsilon:"\u03A5",upsilon:"\u03C5",UpTee:"\u22A5",UpTeeArrow:"\u21A5",upuparrows:"\u21C8",urcorn:"\u231D",urcorner:"\u231D",urcrop:"\u230E",Uring:"\u016E",uring:"\u016F",urtri:"\u25F9",Uscr:"\u{1D4B0}",uscr:"\u{1D4CA}",utdot:"\u22F0",Utilde:"\u0168",utilde:"\u0169",utri:"\u25B5",utrif:"\u25B4",uuarr:"\u21C8",Uuml:"\xDC",uuml:"\xFC",uwangle:"\u29A7",vangrt:"\u299C",varepsilon:"\u03F5",varkappa:"\u03F0",varnothing:"\u2205",varphi:"\u03D5",varpi:"\u03D6",varpropto:"\u221D",vArr:"\u21D5",varr:"\u2195",varrho:"\u03F1",varsigma:"\u03C2",varsubsetneq:"\u228A\uFE00",varsubsetneqq:"\u2ACB\uFE00",varsupsetneq:"\u228B\uFE00",varsupsetneqq:"\u2ACC\uFE00",vartheta:"\u03D1",vartriangleleft:"\u22B2",vartriangleright:"\u22B3",Vbar:"\u2AEB",vBar:"\u2AE8",vBarv:"\u2AE9",Vcy:"\u0412",vcy:"\u0432",VDash:"\u22AB",Vdash:"\u22A9",vDash:"\u22A8",vdash:"\u22A2",Vdashl:"\u2AE6",Vee:"\u22C1",vee:"\u2228",veebar:"\u22BB",veeeq:"\u225A",vellip:"\u22EE",Verbar:"\u2016",verbar:"|",Vert:"\u2016",vert:"|",VerticalBar:"\u2223",VerticalLine:"|",VerticalSeparator:"\u2758",VerticalTilde:"\u2240",VeryThinSpace:"\u200A",Vfr:"\u{1D519}",vfr:"\u{1D533}",vltri:"\u22B2",vnsub:"\u2282\u20D2",vnsup:"\u2283\u20D2",Vopf:"\u{1D54D}",vopf:"\u{1D567}",vprop:"\u221D",vrtri:"\u22B3",Vscr:"\u{1D4B1}",vscr:"\u{1D4CB}",vsubnE:"\u2ACB\uFE00",vsubne:"\u228A\uFE00",vsupnE:"\u2ACC\uFE00",vsupne:"\u228B\uFE00",Vvdash:"\u22AA",vzigzag:"\u299A",Wcirc:"\u0174",wcirc:"\u0175",wedbar:"\u2A5F",Wedge:"\u22C0",wedge:"\u2227",wedgeq:"\u2259",weierp:"\u2118",Wfr:"\u{1D51A}",wfr:"\u{1D534}",Wopf:"\u{1D54E}",wopf:"\u{1D568}",wp:"\u2118",wr:"\u2240",wreath:"\u2240",Wscr:"\u{1D4B2}",wscr:"\u{1D4CC}",xcap:"\u22C2",xcirc:"\u25EF",xcup:"\u22C3",xdtri:"\u25BD",Xfr:"\u{1D51B}",xfr:"\u{1D535}",xhArr:"\u27FA",xharr:"\u27F7",Xi:"\u039E",xi:"\u03BE",xlArr:"\u27F8",xlarr:"\u27F5",xmap:"\u27FC",xnis:"\u22FB",xodot:"\u2A00",Xopf:"\u{1D54F}",xopf:"\u{1D569}",xoplus:"\u2A01",xotime:"\u2A02",xrArr:"\u27F9",xrarr:"\u27F6",Xscr:"\u{1D4B3}",xscr:"\u{1D4CD}",xsqcup:"\u2A06",xuplus:"\u2A04",xutri:"\u25B3",xvee:"\u22C1",xwedge:"\u22C0",Yacute:"\xDD",yacute:"\xFD",YAcy:"\u042F",yacy:"\u044F",Ycirc:"\u0176",ycirc:"\u0177",Ycy:"\u042B",ycy:"\u044B",yen:"\xA5",Yfr:"\u{1D51C}",yfr:"\u{1D536}",YIcy:"\u0407",yicy:"\u0457",Yopf:"\u{1D550}",yopf:"\u{1D56A}",Yscr:"\u{1D4B4}",yscr:"\u{1D4CE}",YUcy:"\u042E",yucy:"\u044E",Yuml:"\u0178",yuml:"\xFF",Zacute:"\u0179",zacute:"\u017A",Zcaron:"\u017D",zcaron:"\u017E",Zcy:"\u0417",zcy:"\u0437",Zdot:"\u017B",zdot:"\u017C",zeetrf:"\u2128",ZeroWidthSpace:"\u200B",Zeta:"\u0396",zeta:"\u03B6",Zfr:"\u2128",zfr:"\u{1D537}",ZHcy:"\u0416",zhcy:"\u0436",zigrarr:"\u21DD",Zopf:"\u2124",zopf:"\u{1D56B}",Zscr:"\u{1D4B5}",zscr:"\u{1D4CF}",zwj:"\u200D",zwnj:"\u200C"});Nn.entityMap=Nn.HTML_ENTITIES});var Ui=re(sr=>{"use strict";var Qt=Dt(),z=Xr(),Fi=Dn(),hl=Qt.isHTMLEscapableRawTextElement,gl=Qt.isHTMLMimeType,bl=Qt.isHTMLRawTextElement,On=Qt.hasOwn,$i=Qt.NAMESPACE,yl=Fi.ParseError,vl=Fi.DOMException,Gt=0,mt=1,Yt=2,$n=3,Jt=4,Xt=5,Ln=6,ar=7;function _i(){}_i.prototype={parse:function(t,e,n){var r=this.domBuilder;r.startDocument(),xl(e,e=Object.create(null)),wl(t,e,n,r,this.errorHandler),r.endDocument()}};var co=/&#?\w+;?/g;function wl(t,e,n,r,o){var i=gl(r.mimeType);t.indexOf(z.UNICODE_REPLACEMENT_CHARACTER)>=0&&o.warning("Unicode replacement character detected, source encoding issues?");function a(P){if(P>65535){P-=65536;var R=55296+(P>>10),Z=56320+(P&1023);return String.fromCharCode(R,Z)}else return String.fromCharCode(P)}function s(P){var R=P[P.length-1]===";"?P:P+";";if(!i&&R!==P)return o.error("EntityRef: expecting ;"),P;var Z=z.Reference.exec(R);if(!Z||Z[0].length!==R.length)return o.error("entity not matching Reference production: "+P),P;var j=R.slice(1,-1);return On(n,j)?n[j]:j.charAt(0)==="#"?a(parseInt(j.substring(1).replace("x","0x"))):(o.error("entity not found:"+P),P)}function l(P){if(P>O){var R=t.substring(O,P).replace(co,s);b&&S(O),r.characters(R,0,P-O),O=P}}var c=0,p=0,w=/\r\n?|\n|$/g,b=r.locator;function S(P,R){for(;P>=p&&(R=w.exec(t));)c=p,p=R.index+R[0].length,b.lineNumber++;b.columnNumber=P-c+1}for(var D=[{currentNSMap:e}],B=[],O=0;;){try{var $=t.indexOf("<",O);if($<0){if(!i&&B.length>0)return o.fatalError("unclosed xml tag(s): "+B.join(", "));if(!t.substring(O).match(/^\s*$/)){var E=r.doc,C=E.createTextNode(t.substring(O));if(E.documentElement)return o.error("Extra content at the end of the document");E.appendChild(C),r.currentElement=C}return}if($>O){var T=t.substring(O,$);!i&&B.length===0&&(T=T.replace(new RegExp(z.S_OPT.source,"g"),""),T&&o.error("Unexpected content outside root element: '"+T+"'")),l($)}switch(t.charAt($+1)){case"/":var I=t.indexOf(">",$+2),L=t.substring($+2,I>0?I:void 0);if(!L)return o.fatalError("end tag name missing");var h=z.reg("^",z.QName_group,z.S_OPT,"$"),d=I>0&&h.exec(L);if(!d){var y=I>0&&z.reg("^",z.QName_group).exec(L);if(i&&y)o.warning('end tag name contains invalid trailing characters: "'+L+'"'),d=y;else if(y&&new RegExp(h.source,h.flags+"m").test(L))o.error('end tag name is followed by a line break and trailing content: "'+L+'"'),d=y;else return o.fatalError('end tag name contains invalid characters: "'+L+'"')}if(!r.currentElement&&!r.doc.documentElement)return;var k=B[B.length-1]||r.currentElement.tagName||r.doc.documentElement.tagName||"";if(k!==d[1]){var u=d[1].toLowerCase();if(!i||k.toLowerCase()!==u)return o.fatalError('Opening and ending tag mismatch: "'+k+'" != "'+L+'"')}var m=D.pop();B.pop();var g=m.localNSMap;if(r.endElement(m.uri,m.localName,k),g)for(var v in g)On(g,v)&&r.endPrefixMapping(v);I++;break;case"?":b&&S($),I=Al(t,$,r,o);break;case"!":b&&S($),I=Pi(t,$,r,o,i);break;default:b&&S($);var x=new Ri,A=D[D.length-1].currentNSMap,I=El(t,$,x,A,s,o,i),N=x.length;if(x.closed||(i&&Qt.isHTMLVoidElement(x.tagName)?x.closed=!0:B.push(x.tagName)),b&&N){for(var _=Li(b,{}),F=0;F<N;F++){var M=x[F];S(M.offset),M.locator=Li(b,{})}r.locator=_,Oi(x,r,A)&&D.push(x),r.locator=b}else Oi(x,r,A)&&D.push(x);i&&!x.closed?I=Dl(t,I,x.tagName,s,r):I++}}catch(P){if(P instanceof yl)throw P;if(P instanceof vl)return o.fatalError("Error constructing the DOM: "+P.name+": "+P.message,P);o.error("element parse error: "+P),I=-1}I>O?O=I:l(Math.max($,O)+1)}}function Li(t,e){return e.lineNumber=t.lineNumber,e.columnNumber=t.columnNumber,e}function El(t,e,n,r,o,i,a){function s(S,D,B){if(On(n.attributeNames,S))return i.fatalError("Attribute "+S+" redefined");if(!a&&D.indexOf("<")>=0)return i.fatalError("Unescaped '<' not allowed in attributes values");n.addValue(S,D.replace(/[\t\n\r]/g," ").replace(co,o),B)}for(var l,c,p=++e,w=Gt;;){var b=t.charAt(p);if(w===Gt&&b==="<")throw new Error("unexpected < in tag name: "+t.slice(e,p));switch(b){case"=":if(w===mt)l=t.slice(e,p),w=$n;else if(w===Yt)w=$n;else throw new Error("attribute equal must after attrName");break;case"'":case'"':if(w===$n||w===mt)if(w===mt&&(i.warning('attribute value must after "="'),l=t.slice(e,p)),e=p+1,p=t.indexOf(b,e),p>0)c=t.slice(e,p),s(l,c,e-1),w=Xt;else throw new Error("attribute value no end '"+b+"' match");else if(w==Jt)c=t.slice(e,p),s(l,c,e),i.warning('attribute "'+l+'" missed start quot('+b+")!!"),e=p+1,w=Xt;else throw new Error('attribute value must after "="');break;case"/":switch(w){case Gt:n.setTagName(t.slice(e,p));case Xt:case Ln:case ar:w=ar,n.closed=!0;case Jt:case mt:break;case Yt:n.closed=!0;break;default:throw new Error("attribute invalid close char('/')")}break;case"":return i.error("unexpected end of input"),w==Gt&&n.setTagName(t.slice(e,p)),p;case">":switch(w){case Gt:n.setTagName(t.slice(e,p));case Xt:case Ln:case ar:break;case Jt:case mt:c=t.slice(e,p),c.slice(-1)==="/"&&(n.closed=!0,c=c.slice(0,-1));case Yt:w===Yt&&(c=l),w==Jt?(i.warning('attribute "'+c+'" missed quot(")!'),s(l,c,e)):(a||i.warning('attribute "'+c+'" missed value!! "'+c+'" instead!!'),s(c,c,e));break;case $n:if(!a)return i.fatalError(`AttValue: ' or " expected`)}return p;case"\x80":b=" ";default:if(b<=" ")switch(w){case Gt:n.setTagName(t.slice(e,p)),w=Ln;break;case mt:l=t.slice(e,p),w=Yt;break;case Jt:var c=t.slice(e,p);i.warning('attribute "'+c+'" missed quot(")!!'),s(l,c,e);case Xt:w=Ln;break}else switch(w){case Yt:a||i.warning('attribute "'+l+'" missed value!! "'+l+'" instead2!!'),s(l,l,e),e=p,w=mt;break;case Xt:i.warning('attribute space is required"'+l+'"!!');case Ln:w=mt,e=p;break;case $n:w=Jt,e=p;break;case ar:throw new Error("elements closed character '/' and '>' must be connected to")}}p++}}function Oi(t,e,n){for(var r=t.tagName,o=null,w=t.length;w--;){var i=t[w],a=i.qName,s=i.value,b=a.indexOf(":");if(b>0)var l=i.prefix=a.slice(0,b),c=a.slice(b+1),p=l==="xmlns"&&c;else c=a,l=null,p=a==="xmlns"&&"";i.localName=c,p!==!1&&(o==null&&(o=Object.create(null),n=Object.create(n)),n[p]=o[p]=s,i.uri=$i.XMLNS,e.startPrefixMapping(p,s))}for(var w=t.length;w--;)i=t[w],i.prefix&&(i.prefix==="xml"&&(i.uri=$i.XML),i.prefix!=="xmlns"&&(i.uri=n[i.prefix]));var b=r.indexOf(":");b>0?(l=t.prefix=r.slice(0,b),c=t.localName=r.slice(b+1)):(l=null,c=t.localName=r);var S=t.uri=n[l||""];if(e.startElement(S,c,r,t),t.closed){if(e.endElement(S,c,r),o)for(l in o)On(o,l)&&e.endPrefixMapping(l)}else return t.currentNSMap=n,t.localNSMap=o,!0}function Dl(t,e,n,r,o){var i=hl(n);if(i||bl(n)){var a=new RegExp("</"+n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+">","ig");a.lastIndex=e;var s=a.exec(t),l=s?s.index:-1;if(l<0)return e+1;var c=t.substring(e+1,l);return i&&(c=c.replace(co,r)),o.characters(c,0,c.length),l}return e+1}function xl(t,e){for(var n in t)On(t,n)&&(e[n]=t[n])}function Mi(t,e){var n=e;function r(p){return p=p||0,t.charAt(n+p)}function o(p){p=p||1,n+=p}function i(){for(var p=0;n<t.length;){var w=r();if(w!==" "&&w!==`
`&&w!=="	"&&w!=="\r")return p;p++,o()}return-1}function a(){return t.substring(n)}function s(p){return t.substring(n,n+p.length)===p}function l(p){return t.substring(n,n+p.length).toUpperCase()===p.toUpperCase()}function c(p){var w=z.reg("^",p),b=w.exec(a());return b?(o(b[0].length),b[0]):null}return{char:r,getIndex:function(){return n},getMatch:c,getSource:function(){return t},skip:o,skipBlanks:i,substringFromIndex:a,substringStartsWith:s,substringStartsWithCaseInsensitive:l}}function Cl(t,e){function n(s,l){var c=z.PI.exec(s.substringFromIndex());return c?c[1].toLowerCase()==="xml"?l.fatalError("xml declaration is only allowed at the start of the document, but found at position "+s.getIndex()):(s.skip(c[0].length),c[0]):l.fatalError("processing instruction is not well-formed at position "+s.getIndex())}var r=t.getSource();if(t.char()==="["){t.skip(1);for(var o=t.getIndex();t.getIndex()<r.length;){if(t.skipBlanks(),t.char()==="]"){var i=r.substring(o,t.getIndex());return t.skip(1),i}var a=null;if(t.char()==="<"&&t.char(1)==="!")switch(t.char(2)){case"E":t.char(3)==="L"?a=t.getMatch(z.elementdecl):t.char(3)==="N"&&(a=t.getMatch(z.EntityDecl));break;case"A":a=t.getMatch(z.AttlistDecl);break;case"N":a=t.getMatch(z.NotationDecl);break;case"-":a=t.getMatch(z.Comment);break}else if(t.char()==="<"&&t.char(1)==="?")a=n(t,e);else if(t.char()==="%")a=t.getMatch(z.PEReference);else return e.fatalError("Error detected in Markup declaration");if(!a)return e.fatalError("Error in internal subset at position "+t.getIndex())}return e.fatalError("doctype internal subset is not well-formed, missing ]")}}function Pi(t,e,n,r,o){var i=Mi(t,e);switch(o?i.char(2).toUpperCase():i.char(2)){case"-":var a=i.getMatch(z.Comment);return a?(n.comment(a,z.COMMENT_START.length,a.length-z.COMMENT_START.length-z.COMMENT_END.length),i.getIndex()):r.fatalError("comment is not well-formed at position "+i.getIndex());case"[":var s=i.getMatch(z.CDSect);return s?!o&&!n.currentElement?r.fatalError("CDATA outside of element"):(n.startCDATA(),n.characters(s,z.CDATA_START.length,s.length-z.CDATA_START.length-z.CDATA_END.length),n.endCDATA(),i.getIndex()):r.fatalError("Invalid CDATA starting at position "+e);case"D":{if(n.doc&&n.doc.documentElement)return r.fatalError("Doctype not allowed inside or after documentElement at position "+i.getIndex());if(o?!i.substringStartsWithCaseInsensitive(z.DOCTYPE_DECL_START):!i.substringStartsWith(z.DOCTYPE_DECL_START))return r.fatalError("Expected "+z.DOCTYPE_DECL_START+" at position "+i.getIndex());if(i.skip(z.DOCTYPE_DECL_START.length),i.skipBlanks()<1)return r.fatalError("Expected whitespace after "+z.DOCTYPE_DECL_START+" at position "+i.getIndex());var l={name:void 0,publicId:void 0,systemId:void 0,internalSubset:void 0};if(l.name=i.getMatch(z.Name),!l.name)return r.fatalError("doctype name missing or contains unexpected characters at position "+i.getIndex());if(o&&l.name.toLowerCase()!=="html"&&r.warning("Unexpected DOCTYPE in HTML document at position "+i.getIndex()),i.skipBlanks(),i.substringStartsWith(z.PUBLIC)||i.substringStartsWith(z.SYSTEM)){var c=z.ExternalID_match.exec(i.substringFromIndex());if(!c)return r.fatalError("doctype external id is not well-formed at position "+i.getIndex());c.groups.SystemLiteralOnly!==void 0?l.systemId=c.groups.SystemLiteralOnly:(l.systemId=c.groups.SystemLiteral,l.publicId=c.groups.PubidLiteral),i.skip(c[0].length)}else if(o&&i.substringStartsWithCaseInsensitive(z.SYSTEM)){if(i.skip(z.SYSTEM.length),i.skipBlanks()<1)return r.fatalError("Expected whitespace after "+z.SYSTEM+" at position "+i.getIndex());if(l.systemId=i.getMatch(z.ABOUT_LEGACY_COMPAT_SystemLiteral),!l.systemId)return r.fatalError("Expected "+z.ABOUT_LEGACY_COMPAT+" in single or double quotes after "+z.SYSTEM+" at position "+i.getIndex())}return o&&l.systemId&&!z.ABOUT_LEGACY_COMPAT_SystemLiteral.test(l.systemId)&&r.warning("Unexpected doctype.systemId in HTML document at position "+i.getIndex()),o||(i.skipBlanks(),l.internalSubset=Cl(i,r)),i.skipBlanks(),i.char()!==">"?r.fatalError("doctype not terminated with > at position "+i.getIndex()):(i.skip(1),n.startDTD(l.name,l.publicId,l.systemId,l.internalSubset),n.endDTD(),i.getIndex())}default:return r.fatalError('Not well-formed XML starting with "<!" at position '+e)}}function Al(t,e,n,r){var o=t.substring(e).match(z.PI);if(!o)return r.fatalError("Invalid processing instruction starting at position "+e);if(o[1].toLowerCase()==="xml"){if(e>0)return r.fatalError("processing instruction at position "+e+" is an xml declaration which is only at the start of the document");if(!z.XMLDecl.test(t.substring(e)))return r.fatalError("xml declaration is not well-formed")}return n.processingInstruction(o[1],o[2]),e+o[0].length}function Ri(){this.attributeNames=Object.create(null)}Ri.prototype={setTagName:function(t){if(!z.QName_exact.test(t))throw new Error("invalid tagName:"+t);this.tagName=t},addValue:function(t,e,n){if(!z.QName_exact.test(t))throw new Error("invalid attribute:"+t);this.attributeNames[t]=this.length,this[this.length++]={qName:t,value:e,offset:n}},length:0,getLocalName:function(t){return this[t].localName},getLocator:function(t){return this[t].locator},getQName:function(t){return this[t].qName},getURI:function(t){return this[t].uri},getValue:function(t){return this[t].value}};sr.XMLReader=_i;sr.parseUtils=Mi;sr.parseDoctypeCommentOrCData=Pi});var Ki=re(en=>{"use strict";var Ct=Dt(),Sl=so(),kl=Dn(),qi=Ni(),Il=Ui(),Tl=Sl.DOMImplementation,Bl=Ct.hasDefaultHTMLNamespace,Nl=Ct.isHTMLMimeType,$l=Ct.isValidMimeType,Wi=Ct.MIME_TYPE,lo=Ct.NAMESPACE,ji=kl.ParseError,Ll=Il.XMLReader;function Vi(t){return t.replace(/\r[\n\u0085]/g,`
`).replace(/[\r\u0085\u2028\u2029]/g,`
`)}function zi(t){if(t=t||{},t.locator===void 0&&(t.locator=!0),this.assign=t.assign||Ct.assign,this.domHandler=t.domHandler||lr,this.onError=t.onError||t.errorHandler,t.errorHandler&&typeof t.errorHandler!="function")throw new TypeError("errorHandler object is no longer supported, switch to onError!");t.errorHandler&&t.errorHandler("warning","The `errorHandler` option has been deprecated, use `onError` instead!",this),this.normalizeLineEndings=t.normalizeLineEndings||Vi,this.locator=!!t.locator,this.xmlns=this.assign(Object.create(null),t.xmlns)}zi.prototype.parseFromString=function(t,e){if(!$l(e))throw new TypeError('DOMParser.parseFromString: the provided mimeType "'+e+'" is not valid.');var n=this.assign(Object.create(null),this.xmlns),r=qi.XML_ENTITIES,o=n[""]||null;Bl(e)?(r=qi.HTML_ENTITIES,o=lo.HTML):e===Wi.XML_SVG_IMAGE&&(o=lo.SVG),n[""]=o,n.xml=n.xml||lo.XML;var i=new this.domHandler({mimeType:e,defaultNamespace:o,onError:this.onError}),a=this.locator?{}:void 0;this.locator&&i.setDocumentLocator(a);var s=new Ll;s.errorHandler=i,s.domBuilder=i;var l=!Ct.isHTMLMimeType(e);return l&&typeof t!="string"&&s.errorHandler.fatalError("source is not a string"),s.parse(this.normalizeLineEndings(String(t)),n,r),i.doc.documentElement||s.errorHandler.fatalError("missing root element"),i.doc};function lr(t){var e=t||{};this.mimeType=e.mimeType||Wi.XML_APPLICATION,this.defaultNamespace=e.defaultNamespace||null,this.cdata=!1,this.currentElement=void 0,this.doc=void 0,this.locator=void 0,this.onError=e.onError}function Zt(t,e){e.lineNumber=t.lineNumber,e.columnNumber=t.columnNumber}lr.prototype={startDocument:function(){var t=new Tl;this.doc=Nl(this.mimeType)?t.createHTMLDocument(!1):t.createDocument(this.defaultNamespace,"")},startElement:function(t,e,n,r){var o=this.doc,i=o.createElementNS(t,n||e),a=r.length;cr(this,i),this.currentElement=i,this.locator&&Zt(this.locator,i);for(var s=0;s<a;s++){var t=r.getURI(s),l=r.getValue(s),n=r.getQName(s),c=o.createAttributeNS(t,n);this.locator&&Zt(r.getLocator(s),c),c.value=c.nodeValue=l,i.setAttributeNode(c)}},endElement:function(t,e,n){this.currentElement=this.currentElement.parentNode},startPrefixMapping:function(t,e){},endPrefixMapping:function(t){},processingInstruction:function(t,e){var n=this.doc.createProcessingInstruction(t,e);this.locator&&Zt(this.locator,n),cr(this,n)},ignorableWhitespace:function(t,e,n){},characters:function(t,e,n){if(t=Hi.apply(this,arguments),t){if(this.cdata)var r=this.doc.createCDATASection(t);else var r=this.doc.createTextNode(t);this.currentElement?this.currentElement.appendChild(r):/^\s*$/.test(t)&&this.doc.appendChild(r),this.locator&&Zt(this.locator,r)}},skippedEntity:function(t){},endDocument:function(){this.doc.normalize()},setDocumentLocator:function(t){t&&(t.lineNumber=0),this.locator=t},comment:function(t,e,n){t=Hi.apply(this,arguments);var r=this.doc.createComment(t);this.locator&&Zt(this.locator,r),cr(this,r)},startCDATA:function(){this.cdata=!0},endCDATA:function(){this.cdata=!1},startDTD:function(t,e,n,r){var o=this.doc.implementation;if(o&&o.createDocumentType){var i=o.createDocumentType(t,e,n,r);this.locator&&Zt(this.locator,i),cr(this,i),this.doc.doctype=i}},reportError:function(t,e){if(typeof this.onError=="function")try{this.onError(t,e,this)}catch(n){throw new ji("Reporting "+t+' "'+e+'" caused '+n,this.locator)}else console.error("[xmldom "+t+"]	"+e,Ol(this.locator))},warning:function(t){this.reportError("warning",t)},error:function(t){this.reportError("error",t)},fatalError:function(t,e){throw this.reportError("fatalError",t),new ji(t,this.locator,e)}};function Ol(t){if(t)return`
@#[line:`+t.lineNumber+",col:"+t.columnNumber+"]"}function Hi(t,e,n){return typeof t=="string"?t.substr(e,n):t.length>=e+n||e?new java.lang.String(t,e,n)+"":t}"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g,function(t){lr.prototype[t]=function(){return null}});function cr(t,e){t.currentElement?t.currentElement.appendChild(e):t.doc.appendChild(e)}function Fl(t){if(t==="error")throw"onErrorStopParsing"}function _l(){throw"onWarningStopParsing"}en.__DOMHandler=lr;en.DOMParser=zi;en.normalizeLineEndings=Vi;en.onErrorStopParsing=Fl;en.onWarningStopParsing=_l});var Gi=re(X=>{"use strict";var tn=Dt();X.assign=tn.assign;X.hasDefaultHTMLNamespace=tn.hasDefaultHTMLNamespace;X.isHTMLMimeType=tn.isHTMLMimeType;X.isValidMimeType=tn.isValidMimeType;X.MIME_TYPE=tn.MIME_TYPE;X.NAMESPACE=tn.NAMESPACE;var ur=Dn();X.DOMException=ur.DOMException;X.DOMExceptionName=ur.DOMExceptionName;X.ExceptionCode=ur.ExceptionCode;X.ParseError=ur.ParseError;var we=so();X.Attr=we.Attr;X.CDATASection=we.CDATASection;X.CharacterData=we.CharacterData;X.Comment=we.Comment;X.Document=we.Document;X.DocumentFragment=we.DocumentFragment;X.DocumentType=we.DocumentType;X.DOMImplementation=we.DOMImplementation;X.Element=we.Element;X.Entity=we.Entity;X.EntityReference=we.EntityReference;X.LiveNodeList=we.LiveNodeList;X.NamedNodeMap=we.NamedNodeMap;X.Node=we.Node;X.NodeList=we.NodeList;X.Notation=we.Notation;X.ProcessingInstruction=we.ProcessingInstruction;X.Text=we.Text;X.XMLSerializer=we.XMLSerializer;var dr=Ki();X.DOMParser=dr.DOMParser;X.normalizeLineEndings=dr.normalizeLineEndings;X.onErrorStopParsing=dr.onErrorStopParsing;X.onWarningStopParsing=dr.onWarningStopParsing});var St=re((Xp,Zi)=>{"use strict";var{DOMParser:Ml,XMLSerializer:nn}=Gi(),Ji="http://schemas.microsoft.com/winfx/2006/xaml";function G(t,e){for(let n=0;n<t.childNodes.length;n++){let r=t.childNodes[n];if(r.nodeType===1&&r.localName===e)return r}return null}function Qe(t){if(!t)return null;for(let e=0;e<t.childNodes.length;e++)if(t.childNodes[e].nodeType===1)return t.childNodes[e];return null}function Pl(t){return t.getAttributeNS(Ji,"Name")||t.getAttribute("x:Name")||null}function Rl(t){return t.getAttributeNS(Ji,"Key")||t.getAttribute("x:Key")||null}function Ul(t){let e=G(t,"VisualPropertiesStorage");if(e)return e;for(let n=0;n<t.childNodes.length;n++){let r=t.childNodes[n];if(!(r.nodeType!==1||!r.localName.includes("."))&&(e=G(r,"VisualPropertiesStorage"),e))return e}return null}function ql(t){let e=Ul(t);if(!e)return{x:0,y:0};let n=0,r=0;for(let o=0;o<e.childNodes.length;o++){let i=e.childNodes[o];if(i.nodeType!==1)continue;let a=Rl(i);a==="ElementX"&&(n=parseFloat(i.textContent)||0),a==="ElementY"&&(r=parseFloat(i.textContent)||0)}return{x:n,y:r}}function At(t){let e=G(t,"DirectiveStep.Action");if(e)return Qe(e);for(let n=0;n<t.childNodes.length;n++){let r=t.childNodes[n];if(r.nodeType===1&&!(r.localName.includes(".")||r.localName==="VisualPropertiesStorage"))return r}return null}function pr(t){let e=G(t,"DirectiveCondition.Condition");if(e)return Qe(e);for(let n=0;n<t.childNodes.length;n++){let r=t.childNodes[n];if(r.nodeType===1&&!(r.localName.includes(".")||r.localName==="VisualPropertiesStorage"))return r}return null}var jl={CustomCodeAction:"Execute Custom Code",EnableDirectivesAction:"Enable Post Directive",RaiseExceptionAction:"Raise Exception",SetDataFieldAction:"Set Data Field",CallMethodAction:"Invoke BO Method",CompleteMethodCallAction:"Complete Method Call",SendEmailAction:"Send E-mail",ActivityTrackingAction:"Activity Tracking",LogMessageAction:"Log Message",ShowMessageAction:"Show Message",AttachDataTagAction:"Attach Data Tag",RemoveDataTagAction:"Remove Data Tag",AttachHoldAction:"Attach Hold",RemoveHoldsAction:"Remove Holds",EnablePostDirectiveAction:"Enable Post Directive",InvokeFunctionAction:"Invoke Function",InvokeExternalMethodAction:"Invoke External Method"},Hl={CustomCodeCondition:"C# Condition",FieldCondition:"Field Condition"};function Yi(t){if(!t)return null;let e=t.localName,n={};for(let p=0;p<t.attributes.length;p++){let w=t.attributes[p];w.name.startsWith("xmlns")||(n[w.name]=w.value)}let r=t.hasAttribute("Code")?t.getAttribute("Code"):null,o=null,i=Qe(t);i&&i.localName==="String"&&(o=i.textContent);let a=null,s=null;if(e==="SetBpmDataFieldAction"){let p=G(t,e+".Expression");if(p){let b=G(p,"ExpressionDefinition");b&&(a=b.getAttribute("Text"))}let w=G(t,e+".Field");if(w){let b=G(w,"ColumnInfo");b&&(s={tableName:b.getAttribute("TableName"),columnName:b.getAttribute("ColumnName")})}}let l=null;if(e==="InvokeEpicorFunctionAction2"||e==="InvokeEpicorFunctionAction"){l=[];for(let p of["InputParameters","OutputParameters"]){let w=G(t,e+"."+p);if(!w)continue;let b=G(w,"Array")||w;for(let S=0;S<b.childNodes.length;S++){let D=b.childNodes[S];if(D.nodeType!==1||D.localName!=="ParameterBinding2")continue;let B=G(D,"ParameterBinding2.BindingTarget"),O=B?G(B,"VariableBindingTarget"):null;l.push({paramName:D.getAttribute("ParameterName")||"",paramDirection:D.getAttribute("ParameterDirection")||"Input",variableName:O&&O.getAttribute("VariableName")||""})}}}let c=null;if(e==="ConditionBlock"){c=[];let w=G(t,"ConditionBlock.Items")||t;for(let b=0;b<w.childNodes.length;b++){let S=w.childNodes[b];if(S.nodeType!==1||S.localName!=="ConditionBlockItem")continue;let D=S.getAttribute("Operator")||"None",B=G(S,"ConditionBlockItem.Condition"),O=B?Qe(B):null;if(!O)continue;let $=O.localName,E={};for(let d=0;d<O.attributes.length;d++){let y=O.attributes[d];y.name.startsWith("xmlns")||(E[y.name]=y.value)}let C=null,T=G(O,$+".Expression");if(T){let d=G(T,"ExpressionDefinition");d&&(C=d.getAttribute("Text"))}let L=null,h=G(O,$+".Field");if(h){let d=G(h,"ColumnInfo");d&&(L={tableName:d.getAttribute("TableName"),columnName:d.getAttribute("ColumnName")})}c.push({localName:$,attrs:E,itemOperator:D,expressionText:C,fieldInfo:L})}}return{localName:e,attrs:n,code:r,message:o,conditions:c,actionExpressionText:a,actionFieldInfo:s,paramBindings:l,label:jl[e]||Hl[e]||e}}function Wl(t){for(let e=0;e<t.childNodes.length;e++){let n=t.childNodes[e];if(n.nodeType===1&&n.localName.endsWith(".StartNode"))return Qe(n)}for(let e=0;e<t.childNodes.length;e++){let n=t.childNodes[e];if(n.nodeType===1&&(n.localName==="DirectiveStep"||n.localName==="DirectiveCondition"))return n}return null}function it(t){if(!t)return null;let e=new Ml({onError:(l,c)=>{if(l==="fatalError")throw new Error(c)}}).parseFromString(t,"text/xml"),n=e.documentElement;if(!n)return null;let r=[],o=[],i=new Set;function a(l,c,p){if(!l||l.localName==="Null"||l.getAttribute("x:Null")!==null)return;let w=Pl(l)||`_node${r.length}`;if(i.has(w)){c!==null&&o.push({from:c,to:w,label:p});return}i.add(w),c!==null&&o.push({from:c,to:w,label:p});let{x:b,y:S}=ql(l);if(l.localName==="DirectiveCondition"){r.push({id:w,type:"condition",widget:Yi(pr(l)),x:b,y:S,_el:l});let D=G(l,"DirectiveCondition.True"),B=G(l,"DirectiveCondition.False"),O=D?Qe(D):null;O?a(O,w,"True"):o.push({from:w,to:null,label:"True"});let $=l.getAttribute("False"),E=B?Qe(B):null;E?a(E,w,"False"):(!$||$==="{x:Null}")&&o.push({from:w,to:null,label:"False"})}else if(l.localName==="DirectiveStep"){r.push({id:w,type:"step",widget:Yi(At(l)),x:b,y:S,_el:l});let D=G(l,"DirectiveStep.Next");D&&a(Qe(D),w,null)}}let s=Wl(n);return s&&a(s,null,null),{nodes:r,edges:o,startNodeId:r[0]?.id??null,doc:e,root:n}}var Vl=new Set(["CustomCodeAction","CustomCodeCondition"]);function Xi(t){return!!t&&Vl.has(t.localName)}function Qi(t){if(!t)return!1;let e=String(t).trimStart().slice(0,400);return e.startsWith("<")&&/Directive(Step|Condition|Definition)/.test(e)}function zl(t){if(!Qi(t))return null;let e;try{e=it(t)}catch{return null}if(!e||e.nodes.length===0)return null;let n=e.nodes.filter(r=>Xi(r.widget)).map(r=>({id:r.id,type:r.type,label:r.widget.label,localName:r.widget.localName,code:r.widget.code||""}));return{nodeCount:e.nodes.length,codeNodes:n,onlyCustomCode:e.nodes.length===1&&n.length===1}}function Kl(t,e,n){let r=it(t);if(!r)throw new Error("Failed to parse directive XAML");let o=r.nodes.find(a=>a.id===e);if(!o)throw new Error(`Node "${e}" not found`);let i=o.type==="condition"?pr(o._el):At(o._el);if(!i)throw new Error(`No widget element found in node "${e}"`);if(!i.hasAttribute("Code"))throw new Error(`Widget ${i.localName} has no Code attribute`);return i.setAttribute("Code",n),new nn().serializeToString(r.doc)}function Gl(t,e,n){let r=it(t);if(!r)throw new Error("Failed to parse directive XAML");let o=r.nodes.find(s=>s.id===e);if(!o||o.type!=="step")throw new Error(`Step node "${e}" not found`);let i=At(o._el);if(!i||i.localName!=="RaiseExceptionAction")throw new Error(`Node "${e}" is not a RaiseExceptionAction`);let a=Qe(i);return a&&a.localName==="String"&&(a.textContent=n),new nn().serializeToString(r.doc)}function Yl(t,e,n){let r=it(t);if(!r)throw new Error("Failed to parse directive XAML");let o=r.nodes.find(c=>c.id===e);if(!o)throw new Error(`Node "${e}" not found`);let i=o.type==="condition"?pr(o._el):At(o._el);if(!i||i.localName!=="ConditionBlock")throw new Error("Not a ConditionBlock node");let s=G(i,"ConditionBlock.Items")||i,l=[];for(let c=0;c<s.childNodes.length;c++){let p=s.childNodes[c];p.nodeType===1&&p.localName==="ConditionBlockItem"&&l.push(p)}for(let{index:c,conditionAttrs:p,expressionText:w,itemOperator:b,fieldInfo:S}of n){let D=l[c];if(!D)continue;b!==void 0&&D.setAttribute("Operator",b);let B=G(D,"ConditionBlockItem.Condition"),O=B?Qe(B):null;if(O){if(p)for(let[$,E]of Object.entries(p))O.setAttribute($,E);if(w!==void 0){let $=G(O,O.localName+".Expression");if($){let E=G($,"ExpressionDefinition");E&&E.setAttribute("Text",w)}}if(S){let $=G(O,O.localName+".Field");if($){let E=G($,"ColumnInfo");E&&(S.tableName!==void 0&&E.setAttribute("TableName",S.tableName),S.columnName!==void 0&&E.setAttribute("ColumnName",S.columnName))}}}}return new nn().serializeToString(r.doc)}function Jl(t,e,n){let r=it(t);if(!r)throw new Error("Failed to parse directive XAML");let o=r.nodes.find(a=>a.id===e);if(!o)throw new Error(`Node "${e}" not found`);let i=o.type==="condition"?pr(o._el):At(o._el);if(!i)throw new Error(`No widget element found in node "${e}"`);for(let[a,s]of Object.entries(n))i.setAttribute(a,s);return new nn().serializeToString(r.doc)}function Xl(t,e,n,r){let o=it(t);if(!o)throw new Error("Failed to parse directive XAML");let i=o.nodes.find(s=>s.id===e);if(!i)throw new Error(`Node "${e}" not found`);let a=At(i._el);if(!a)throw new Error(`No action element found in node "${e}"`);for(let[s,l]of Object.entries(n))a.setAttribute(s,l);for(let{paramName:s,variableName:l}of r)for(let c of["InputParameters","OutputParameters"]){let p=G(a,a.localName+"."+c);if(!p)continue;let w=G(p,"Array")||p;for(let b=0;b<w.childNodes.length;b++){let S=w.childNodes[b];if(S.nodeType!==1||S.localName!=="ParameterBinding2"||S.getAttribute("ParameterName")!==s)continue;let D=G(S,"ParameterBinding2.BindingTarget"),B=D?G(D,"VariableBindingTarget"):null;B&&B.setAttribute("VariableName",l)}}return new nn().serializeToString(o.doc)}function Ql(t,e,n,r){let o=it(t);if(!o)throw new Error("Failed to parse directive XAML");let i=o.nodes.find(s=>s.id===e);if(!i)throw new Error(`Node "${e}" not found`);let a=At(i._el);if(!a)throw new Error(`No action element found in node "${e}"`);if(n!==void 0){let s=G(a,a.localName+".Expression");if(s){let l=G(s,"ExpressionDefinition");l&&l.setAttribute("Text",n)}}if(r){let s=G(a,a.localName+".Field");if(s){let l=G(s,"ColumnInfo");l&&(r.tableName!==void 0&&l.setAttribute("TableName",r.tableName),r.columnName!==void 0&&l.setAttribute("ColumnName",r.columnName))}}return new nn().serializeToString(o.doc)}var Zl=new Set(["Id","ValidationState","IsNewRow","RowMod","BitFlag","SysRevID","SysRowID","Code"]);function eu(t,e){let n=[];if(!t)return n.push(e+"(no widget)"),n;let r=Object.entries(t.attrs||{}).filter(([o])=>!o.startsWith("xmlns")&&!o.startsWith("x:")&&!Zl.has(o)).sort(([o],[i])=>o.localeCompare(i));for(let[o,i]of r)n.push(e+o+" = "+i);t.message!=null&&n.push(e+"Message = "+t.message),t.actionFieldInfo&&n.push(e+"Field = "+(t.actionFieldInfo.tableName||"")+"."+(t.actionFieldInfo.columnName||"")),t.actionExpressionText!=null&&n.push(e+"Expression = "+t.actionExpressionText);for(let o of t.paramBindings||[])n.push(e+"Param "+o.paramDirection+" "+o.paramName+" <-> "+o.variableName);if((t.conditions||[]).forEach((o,i)=>{let a=[];if(i>0&&a.push(o.itemOperator),a.push(o.localName),o.fieldInfo&&a.push((o.fieldInfo.tableName||"")+"."+(o.fieldInfo.columnName||"")),o.attrs&&o.attrs.Operator&&a.push(o.attrs.Operator),o.expressionText!=null&&a.push(o.expressionText),o.attrs&&o.attrs.Filter!==void 0&&a.push("["+o.attrs.Filter+"]"),n.push(e+"Condition "+(i+1)+": "+a.join(" ")),o.attrs&&o.attrs.Code)for(let s of String(o.attrs.Code).split(`
`))n.push(e+"  | "+s)}),t.code!=null){n.push(e+"Code:");for(let o of String(t.code).split(`
`))n.push(e+"  | "+o)}return n}function tu(t){let e;try{e=it(t)}catch{return null}if(!e||e.nodes.length===0)return null;let n=new Map(e.nodes.map((i,a)=>[i.id,a+1])),r=i=>i==null?"(end)":"["+(n.get(i)??"?")+"]",o=[];return e.nodes.forEach((i,a)=>{o.push("["+(a+1)+"] "+(i.type==="condition"?"Condition":"Step")+": "+(i.widget?.label||i.widget?.localName||"(unknown)")),o.push(...eu(i.widget,"    "));for(let s of e.edges.filter(l=>l.from===i.id))o.push("    "+(s.label?s.label+" -> ":"-> ")+r(s.to));o.push("")}),o.join(`
`)}Zi.exports={parseDirective:it,summarizeFlow:zl,looksLikeFlowXaml:Qi,isCustomCodeWidget:Xi,setNodeCode:Kl,setRaiseExceptionMessage:Gl,setNodeAttrs:Jl,setConditionChildren:Yl,setInvokeFunctionAction:Xl,setActionField:Ql,directiveToCanonicalText:tu}});var kt=re((Qp,ra)=>{"use strict";var{looksLikeFlowXaml:ea,summarizeFlow:ta,setNodeCode:nu}=St();function uo(t){let e=t==null?"":String(t);if(!e.trim())return{kind:"code",code:"",usings:"",flow:null};if(ea(e)){let r=ta(e);return r?{kind:"flow",xaml:e,xamlProp:null,envelope:null,code:"",usings:"",flow:r}:{kind:"code",code:e,usings:"",flow:null,unparsedFlow:!0}}let n=null;try{n=JSON.parse(e)}catch{}if(n&&typeof n=="object"){for(let[r,o]of Object.entries(n)){if(typeof o!="string"||!ea(o))continue;let i=ta(o);if(i)return{kind:"flow",xaml:o,xamlProp:r,envelope:n,code:typeof n.Code=="string"?n.Code:"",usings:typeof n.Usings=="string"?n.Usings:"",flow:i}}return{kind:"code",code:n.Code||"",usings:n.Usings||"",flow:null}}return{kind:"code",code:e,usings:"",flow:null}}function na(t,e){if(t.kind!=="flow")throw new Error("Function body is not a widget flow");return t.xamlProp?JSON.stringify({...t.envelope,[t.xamlProp]:e}):e}function ru(t,e,n){let r=uo(t);return na(r,nu(r.xaml,e,n))}function ou(t){let e=uo(t);return e.unparsedFlow?"":e.kind!=="flow"?e.code||"":e.flow.codeNodes.map(n=>(e.flow.codeNodes.length>1?`// \u2500\u2500 ${n.label} (${n.id}) \u2500\u2500
`:"")+n.code).join(`

`)}function iu(t){if(t.unparsedFlow)return"Unrecognised widget body";if(t.kind!=="flow")return"Code-based";if(t.flow.onlyCustomCode)return"Widget flow \u2014 custom code only";let e=t.flow.codeNodes.length;return`Widget flow \u2014 ${t.flow.nodeCount} widgets, ${e} with custom code`}function au(t){return String(t||"").replace(/\r\n?/g,`
`).split(`
`).map(e=>e.replace(/[ \t]+$/,"")).join(`
`).replace(/^\n+/,"").replace(/\n+$/,"")}ra.exports={describeBody:uo,packFlowXaml:na,setBodyNodeCode:ru,bodyCodeText:ou,bodyKindLabel:iu,normalizeCode:au}});var oa=re(_e=>{"use strict";var su=_e&&_e.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),cu=_e&&_e.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),lu=_e&&_e.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&su(n,e,r[o]);return cu(n,e),n}})();Object.defineProperty(_e,"__esModule",{value:!0});_e.EfxTreeProvider=_e.FunctionNode=_e.LibraryNode=void 0;var ae=lu(require("vscode")),{describeBody:uu,bodyKindLabel:du}=kt(),Fn=class extends ae.TreeItem{constructor(e){super(e.LibraryID,ae.TreeItemCollapsibleState.Collapsed),this.library=e;let n=[];e.Published?n.push("$(cloud) Promoted"):n.push("Unpromoted / Editable"),e.Disabled&&n.push("$(circle-slash) Disabled"),e.LockedBy&&n.push(`$(lock) ${e.LockedBy}`),e.OwnedByCompany&&n.push(e.OwnedByCompany),this.description=e.Description||"",this.tooltip=[e.LibraryID,e.Description||"",`Status: ${e.Published?"Promoted":"Unpromoted / Editable"}`,e.LockedBy?`Locked by: ${e.LockedBy}`:"Unlocked",e.Disabled?"DISABLED":"",`Company: ${e.OwnedByCompany||"System"}`].filter(Boolean).join(`
`),this.contextValue=e.Published?"library-promoted":"library-unpromoted",e.Published?this.iconPath=new ae.ThemeIcon("cloud",new ae.ThemeColor("charts.green")):e.Disabled?this.iconPath=new ae.ThemeIcon("circle-slash",new ae.ThemeColor("charts.red")):e.LockedBy?this.iconPath=new ae.ThemeIcon("lock",new ae.ThemeColor("charts.yellow")):this.iconPath=new ae.ThemeIcon("package")}};_e.LibraryNode=Fn;var fr=class extends ae.TreeItem{constructor(e,n,r){super(n.FunctionID,ae.TreeItemCollapsibleState.None),this.libraryId=e,this.func=n,this.signatures=r;let o=r.filter(l=>!l.Response).map(l=>l.ArgumentName),i=r.filter(l=>l.Response).map(l=>l.ArgumentName),a=uu(n.Body),s=a.kind==="flow"&&!a.flow.onlyCustomCode;this.description=[n.Description||"",s?`${a.flow.nodeCount} widgets`:""].filter(Boolean).join(" \xB7 "),this.tooltip=[`${n.LibraryID}.${n.FunctionID}`,n.Description||"",du(a),o.length?`Request: ${o.join(", ")}`:"Request: (none)",`Response: ${i.join(", ")}`,n.Disabled?"DISABLED":"",n.Invalid?"INVALID":""].filter(Boolean).join(`
`),this.contextValue=s?"function-widgets":"function",this.iconPath=new ae.ThemeIcon(n.Invalid?"warning":n.Disabled?"circle-slash":s?"type-hierarchy":"symbol-function"),this.command=s?{command:"efx.openFunctionWidgets",title:"Open Widget Graph",arguments:[{libraryId:this.libraryId,func:this.func}]}:{command:"efx.pullFunction",title:"Pull Function",arguments:[{libraryId:this.libraryId,func:this.func,signatures:this.signatures}]}}},mr=class extends ae.TreeItem{constructor(e,n){super(`Functions (${n})`,ae.TreeItemCollapsibleState.Collapsed),this.libraryId=e,this.contextValue="function-group",this.iconPath=new ae.ThemeIcon("symbol-function")}},It=class extends ae.TreeItem{constructor(e,n,r,o){super(`${r} (${o})`,ae.TreeItemCollapsibleState.Collapsed),this.libraryId=e,this.kind=n,this.contextValue=`reference-group-${n}`;let i={tables:"database",services:"server",libraries:"library",assemblies:"package"};this.iconPath=new ae.ThemeIcon(i[n]||"references")}},rn=class extends ae.TreeItem{constructor(e,n){let r="",o="",i="",a="references";e==="tables"?(r=n.TableID,o=n.Updatable?"Updatable":"Read-only",i=[n.TableID,`Updatable: ${n.Updatable?"Yes":"No"}`,`SysRowID: ${n.SysRowID||""}`].join(`
`),a=n.Updatable?"edit":"lock"):e==="services"?(r=n.ServiceID,o="Service",i=[n.ServiceID,`SysRowID: ${n.SysRowID||""}`].join(`
`),a="server"):e==="libraries"?(r=n.LibraryRef,o=n.Mode===1?"Read-only":n.Mode===2?"Hidden":"Normal",i=[n.LibraryRef,`Mode: ${n.Mode}`,`SysRowID: ${n.SysRowID||""}`].join(`
`),a="library"):e==="assemblies"&&(r=n.Assembly,o="Assembly",i=[n.Assembly,`SysRowID: ${n.SysRowID||""}`].join(`
`),a="package"),super(r||"(unknown)",ae.TreeItemCollapsibleState.None),this.kind=e,this.row=n,this.description=o,this.tooltip=i,this.contextValue=`reference-item-${e}`,this.iconPath=new ae.ThemeIcon(a)}};_e.FunctionNode=fr;var po=class{constructor(e){this.client=e,this._onDidChangeTreeData=new ae.EventEmitter,this.onDidChangeTreeData=this._onDidChangeTreeData.event,this.libraries=[],this.libraryCache=new Map}setClient(e){this.client=e}async refresh(){if(!this.client){ae.window.showWarningMessage("EFx: Configure connection first (gear icon)");return}try{this.libraries=await this.client.getLibraryList(),this.libraryCache.clear(),this._onDidChangeTreeData.fire(void 0),ae.window.showInformationMessage(`EFx: Loaded ${this.libraries.length} libraries`)}catch(e){ae.window.showErrorMessage(`EFx: Failed to load libraries: ${e.message}`)}}async getLibraryTableset(e){if(this.client){if(this.libraryCache.has(e))return this.libraryCache.get(e);try{let n=await this.client.getLibrary(e);return this.libraryCache.set(e,n),n}catch(n){ae.window.showErrorMessage(`EFx: Failed to load ${e}: ${n.message}`);return}}}invalidateCache(e){this.libraryCache.delete(e)}getTreeItem(e){return e}async getChildren(e){if(!this.client)return[];if(!e)return this.libraries.sort((n,r)=>n.LibraryID.localeCompare(r.LibraryID)).map(n=>new Fn(n));if(e instanceof Fn){let n=await this.getLibraryTableset(e.library.LibraryID);if(!n)return[];let r=[],o=n.EfxFunction||[],i=n.EfxRefTable||[],a=n.EfxRefService||[],s=n.EfxRefLibrary||[],l=n.EfxRefAssembly||[];return o.length>0,o.length>0&&r.push(new mr(e.library.LibraryID,o.length)),r.push(new It(e.library.LibraryID,"tables","Tables",i.length)),r.push(new It(e.library.LibraryID,"services","Services",a.length)),r.push(new It(e.library.LibraryID,"libraries","Libraries",s.length)),r.push(new It(e.library.LibraryID,"assemblies","Assemblies",l.length)),r}if(e instanceof mr){let n=await this.getLibraryTableset(e.libraryId);return n?(n.EfxFunction||[]).sort((r,o)=>r.FunctionID.localeCompare(o.FunctionID)).map(r=>{let o=(n.EfxFunctionSignature||[]).filter(i=>i.FunctionID===r.FunctionID);return new fr(e.libraryId,r,o)}):[]}if(e instanceof It){let n=await this.getLibraryTableset(e.libraryId);return n?e.kind==="tables"?(n.EfxRefTable||[]).sort((r,o)=>r.TableID.localeCompare(o.TableID)).map(r=>new rn("tables",r)):e.kind==="services"?(n.EfxRefService||[]).sort((r,o)=>r.ServiceID.localeCompare(o.ServiceID)).map(r=>new rn("services",r)):e.kind==="libraries"?(n.EfxRefLibrary||[]).sort((r,o)=>r.LibraryRef.localeCompare(o.LibraryRef)).map(r=>new rn("libraries",r)):e.kind==="assemblies"?(n.EfxRefAssembly||[]).sort((r,o)=>r.Assembly.localeCompare(o.Assembly)).map(r=>new rn("assemblies",r)):[]:[]}return[]}};_e.EfxTreeProvider=po});var ia=re(Ze=>{"use strict";var pu=Ze&&Ze.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),fu=Ze&&Ze.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),mu=Ze&&Ze.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&pu(n,e,r[o]);return fu(n,e),n}})();Object.defineProperty(Ze,"__esModule",{value:!0});Ze.ExecuteViewProvider=void 0;var hu=mu(require("vscode")),fo=class{constructor(){this.view=null,this.loaded=!1,this.client=null,this.libraryId="",this.functionId="",this.signatures=[],this.companies=[],this.defaultCompany="",this.treeProvider=null,this.staging=!1}resolveWebviewView(e){this.view=e,e.webview.options={enableScripts:!0},e.webview.onDidReceiveMessage(async n=>{this.loaded&&(n.command==="execute"&&await this.execute(n.payload,n.company),n.command==="saveSignatures"&&await this.saveSignatures(n.signatures))}),e.onDidDispose(()=>{this.view=null}),e.webview.html=this.loaded?this.getHtml():this.getEmptyHtml()}async load(e,n,r,o,i,a,s,l=!1){this.client=e,this.libraryId=n,this.functionId=r,this.signatures=o,this.companies=Array.isArray(i)&&i.length>0?i:a?[a]:[],this.defaultCompany=a||this.companies[0]||"",this.treeProvider=s||null,this.staging=l,this.loaded=!0,await hu.commands.executeCommand("efxExecuteView.focus"),this.view&&(this.view.webview.html=this.getHtml())}async execute(e,n){this.view.webview.postMessage({command:"executing"});try{let r=await this.client.executeFunction(this.libraryId,this.functionId,e,n||void 0,this.staging);this.view.webview.postMessage({command:"result",data:JSON.stringify(r,null,2),success:!0})}catch(r){this.view.webview.postMessage({command:"result",data:r.message,success:!1})}}async saveSignatures(e){this.view.webview.postMessage({command:"sigSaving"});try{let{saved:n,diagnostics:r,updatedSigs:o}=await this.client.saveSignatures(this.libraryId,this.functionId,e);if(!n){let a=(r||[]).map(s=>typeof s=="object"?s.Message||JSON.stringify(s):String(s));this.view.webview.postMessage({command:"sigError",error:a.join(`
`)||"Epicor rejected the signature change"});return}let i=this.signatures.filter(a=>a.FunctionID!==this.functionId);this.signatures=[...i,...o],this.treeProvider&&this.treeProvider.invalidateCache(this.libraryId),this.view.webview.postMessage({command:"sigSaved",signatures:o})}catch(n){this.view.webview.postMessage({command:"sigError",error:n.message})}}getHtml(){let e=this.signatures.filter(b=>!b.Response),n=this.signatures.filter(b=>b.Response),r={};for(let b of e)b.DataType.includes("Int")||b.DataType.includes("Decimal")||b.DataType.includes("Double")?r[b.ArgumentName]=0:b.DataType.includes("Boolean")?r[b.ArgumentName]=!1:b.DataType.includes("DataSet")||b.DataType.includes("DataTable")?r[b.ArgumentName]={}:r[b.ArgumentName]="";let o=e.map(b=>`<span class="param">${b.ArgumentName} <span class="type">${b.DataType.split(".").pop()}${b.Optional?"?":""}</span></span>`).join("")||'<span class="param none">No request parameters</span>',i=n.map(b=>`<span class="param">${b.ArgumentName} <span class="type">${b.DataType.split(".").pop()}</span></span>`).join(""),a=(this.companies||[]).map(b=>`<option value="${b}"${b===this.defaultCompany?" selected":""}>${b}</option>`).join(""),s=this.companies&&this.companies.length>0?`<div class="company-row">
        <label for="companySelect">Company</label>
        <select id="companySelect">${a}</select>
        <button class="btn-secondary" id="toggleSigBtn" onclick="toggleSigEditor()">\u2699 Edit Signatures</button>
    </div>`:`<div class="company-row">
        <button class="btn-secondary" id="toggleSigBtn" onclick="toggleSigEditor()">\u2699 Edit Signatures</button>
    </div>`,l=b=>({ArgumentName:b.ArgumentName,DataType:b.DataType||"System.String",Optional:!!b.Optional,Response:!!b.Response,Order:b.Order??0}),c=JSON.stringify(e.map(l)),p=JSON.stringify(n.map(l)),w=[["System.String","String"],["System.Int32","Int32"],["System.Int64","Int64"],["System.Decimal","Decimal"],["System.Double","Double"],["System.Boolean","Boolean"],["System.DateTime","DateTime"],["System.Data.DataSet","DataSet"],["System.Data.DataTable","DataTable"]].map(([b,S])=>`<option value="${b}">${S}</option>`).join("")+'<option value="__custom__">Custom\u2026</option>';return`<!DOCTYPE html>
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
            ${s}

            <div class="sig-editor" id="sigEditor">
                <div class="sig-tabs">
                    <button class="sig-tab active" id="tabReq"  onclick="switchTab('request')">Request Params</button>
                    <button class="sig-tab"        id="tabResp" onclick="switchTab('response')">Response Params</button>
                </div>
                <div class="sig-col-headers"><span>Argument Name</span><span>Data Type</span><span>Optional</span><span></span></div>
                <div class="sig-rows" id="sigRows"></div>
                <div class="sig-footer">
                    <input  id="newArgName"    placeholder="ArgumentName" />
                    <select id="newDataType">${w}</select>
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

        let reqSigs  = ${c};
        let respSigs = ${p};
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
</html>`}};Ze.ExecuteViewProvider=fo});var Tt=re(Ee=>{"use strict";Object.defineProperty(Ee,"__esModule",{value:!0});Ee.BpmClient=void 0;var gu={PRE:1,BASE:2,POST:3};Ee.DIRECTIVE_TYPE=gu;var aa=["BO","DB","DQ"];Ee.BPM_SOURCES=aa;var sa={BO:{1:"Pre",2:"Base",3:"Post"},DQ:{1:"Pre",2:"Base",3:"Post"},DB:{0:"InTran",1:"Standard"}};function bu(t){let e=String(t?.Source??t?.source??"").trim().toUpperCase();return aa.includes(e)?e:"BO"}Ee.bpmSourceOf=bu;function yu(t,e){return sa[t||"BO"]?.[e]||`Type${e}`}Ee.directiveTypeLabel=yu;function vu(t,e){let n=sa[t||"BO"]||{};for(let[r,o]of Object.entries(n))if(o===e)return parseInt(r,10);return parseInt(String(e).replace("Type",""),10)}Ee.directiveTypeFromLabel=vu;function wu(t){let e=String(t||"");return e.includes("/")?"DQ":e.split(".").length===3?"DB":"BO"}Ee.inferBpmSource=wu;function ca(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\t/g,"&#x9;").replace(/\r\n/g,"&#xA;").replace(/\n/g,"&#xA;").replace(/\r/g,"&#xA;")}function la(t){return t.replace(/&#xA;/gi,`
`).replace(/&#xD;/gi,"\r").replace(/&#x9;/gi,"	").replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")}Ee.xmlDecode=la;Ee.xmlEncode=ca;function Eu(t){if(!t)return{code:"",hasCustomCode:!1};let e=t.indexOf("CustomCodeAction");if(e<0)return{code:"",hasCustomCode:!1};let n='Code="',r=t.indexOf(n,e);if(r<0)return{code:"",hasCustomCode:!1};let o=r+n.length,i=o;for(;i<t.length&&t[i]!=='"';){if(t[i]==="&"){let s=t.indexOf(";",i);if(s<0)break;i=s+1;continue}i++}let a=t.slice(o,i);return{code:la(a),hasCustomCode:!0}}Ee.extractBpmCode=Eu;function ua(t,e){let n=t.indexOf("CustomCodeAction");if(n<0)throw new Error("No CustomCodeAction found in directive body");let r='Code="',o=t.indexOf(r,n);if(o<0)throw new Error("No Code= attribute found in CustomCodeAction");let i=o+r.length,a=i;for(;a<t.length&&t[a]!=='"';){if(t[a]==="&"){let s=t.indexOf(";",a);if(s<0)break;a=s+1;continue}a++}return t.slice(0,i)+ca(e)+t.slice(a)}Ee.replaceBpmCode=ua;function Du(t){return t?String(t).replace(/></g,`>
<`):""}Ee.formatBpmBodyXaml=Du;function xu(t,e,n){let o=t.indexOf('"BpDirective":[');if(o<0)throw new Error("BpDirective array not found in raw tableset");let i=t.indexOf("[",o),a=`"DirectiveID":"${e}"`,s=i+1;for(;s<t.length;){let l=t.indexOf("{",s);if(l<0)break;let c=0,p=!1,w=!1,b=-1;for(let D=l;D<t.length;D++){let B=t[D];if(p){if(w){w=!1;continue}if(B==="\\"){w=!0;continue}B==='"'&&(p=!1);continue}if(B==='"'){p=!0;continue}if(B==="{")c++;else if(B==="}"&&(c--,c===0)){b=D;break}}if(b<0)throw new Error("Malformed BpDirective object in raw tableset");let S=t.slice(l,b+1);if(S.includes(a)){let D='"Body":"',B=S.indexOf(D);if(B<0)throw new Error("Body field not found in BpDirective row");let O=B+D.length,$=O,E=!1;for(;$<S.length;){let A=S[$];if(E){E=!1,$++;continue}if(A==="\\"){E=!0,$++;continue}if(A==='"')break;$++}if($>=S.length)throw new Error("Body string value did not terminate");let C=$,T='"'+S.slice(O,C)+'"',L;try{L=JSON.parse(T)}catch(A){throw new Error("Failed to JSON-parse Body value: "+A.message)}let h=ua(L,n),d=JSON.stringify(h).slice(1,-1),y=S.slice(0,O)+d+S.slice(C),k=t.slice(0,l)+S+","+y+t.slice(b+1),u='"BitFlag":0,"RowMod":""',m='"BitFlag":0,"RowMod":"U"',g=l+S.length+1,v=g+y.length,x=k.indexOf(u,g);if(x<0||x>v)throw new Error(`BitFlag/RowMod anchor not found for directive ${e}`);return k.slice(0,x)+m+k.slice(x+u.length)}s=b+1}throw new Error(`Directive ${e} not found in raw tableset`)}Ee.updateRawBpmDirective=xu;function da(t){let e=t.indexOf('"returnObj"');if(e<0)return null;let n=t.indexOf("{",e);if(n<0)return null;let r=0,o=!1,i=!1;for(let a=n;a<t.length;a++){let s=t[a];if(o){i?i=!1:s==="\\"?i=!0:s==='"'&&(o=!1);continue}if(s==='"')o=!0;else if(s==="{")r++;else if(s==="}"&&--r===0)return t.slice(n,a+1)}return null}Ee.extractReturnObjRaw=da;var mo=class{constructor(e){this._client=e}getBpmUrl(e){return`${this._client.config.serverUrl.replace(/\/$/,"")}/api/v2/odata/${this._client.config.company}/Ice.BO.BpMethodSvc/${e}`}async request(e,n){return this._client.request(e,n)}async requestRaw(e,n){return this._client.requestRaw(e,n)}async getBpmServices(){return(await this.request(this.getBpmUrl("GetBpmDirectiveServicesTS"),{})).returnObj?.BpDirectiveService||[]}async getBpmMethodsByService(e,n,r,o="BO"){let a=(await this.request(this.getBpmUrl("GetRowsEx"),{source:o,whereClauseBpMethod:`SystemCode = '${e}' and ObjectNS = '${n}' and BusinessObject = '${r}'`,whereClauseBpDirective:"",pageSize:500,absolutePage:1})).returnObj;return{methods:a?.BpMethod||[],directives:a?.BpDirective||[]}}async getBpmMethod(e,n){try{return(await this.request(this.getBpmUrl("GetByIDBpMethod"),{source:e,bpMethodCode:n})).returnObj}catch(r){if(!/record not found/i.test(r.message))throw r;let i=(await this.request(this.getBpmUrl("GetRowsEx"),this._oneMethodQuery(e,n))).returnObj;if(!i||!(i.BpMethod||[]).length)throw r;return i}}async getBpmMethodRaw(e,n){try{let r=await this.requestRaw(this.getBpmUrl("GetByIDBpMethod"),JSON.stringify({source:e,bpMethodCode:n})),o=r.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);return o?o[1]:r}catch(r){if(!/record not found/i.test(r.message))throw r;let o=await this.requestRaw(this.getBpmUrl("GetRowsEx"),JSON.stringify(this._oneMethodQuery(e,n))),i=da(o);if(!i||!/"BpMethod":\[\s*\{/.test(i))throw r;return i}}_oneMethodQuery(e,n){let r=String(n).replace(/'/g,"''");return{source:e,whereClauseBpMethod:`BpMethodCode = '${r}'`,whereClauseBpDirective:`BpMethodCode = '${r}'`,pageSize:0,absolutePage:0}}async updateBpmRaw(e){let n=`{"ds":${e}}`,r=await this.requestRaw(this.getBpmUrl("Update"),n);try{return JSON.parse(r)}catch{return{}}}async getBpmRowsBySource(e){let r=(await this.request(this.getBpmUrl("GetRowsEx"),{source:e,whereClauseBpMethod:"",whereClauseBpDirective:"",pageSize:0,absolutePage:0})).returnObj;return{methods:r?.BpMethod||[],directives:r?.BpDirective||[]}}async getKineticDirective(e){let n=await this._client.requestGet(this.getBpmUrl("GetKineticDirective")+"?directiveId="+encodeURIComponent(e)),r=n?.returnObj??n;if(typeof r=="string")try{return JSON.parse(r)}catch{return null}return r&&typeof r=="object"?r:null}async validateCustomCode(e,n){let r=JSON.stringify({Code:e,IsCondition:!1});return(await this.request(this.getBpmUrl("ValidateCustomCode"),{codeSnippetWithScope:r,functionDefinition:JSON.stringify(n),isAsync:!1})).returnObj?.diagnostics||null}};Ee.BpmClient=mo;function Cu(t,e){let n=t.SystemCode||"Erp",r=n.charAt(0).toUpperCase()+n.slice(1).toLowerCase(),o={INPUT:0,OUTPUT:1,"INPUT-OUTPUT":2};return{FunctionKind:0,Target:{kind:0,id:t.BpMethodCode,alias:t.BpMethodCode,productCode:{value:r},name:t.BusinessObject,method:t.Name,hasRootTransaction:t.HasRootTransaction},SupportsAdvancedFeatures:!0,SupportsDbAccessInCode:0,DebugMode:t.DebugMode||!1,Arguments:(e||[]).map(i=>({Name:i.BpArgumentName,Type:i.TypeInfo,TypeName:i.Type,Direction:o[i.Direction]??2,Kind:o[i.Direction]??2})),LocalVariables:[],CustomReferences:[{Name:"Assemblies",IsStandard:!1,IsEditable:!0,References:{}},{Name:"Externals",IsStandard:!1,IsEditable:!0,References:{}},{Name:"Standard",IsStandard:!0,IsEditable:!0,References:{}}],CustomUsings:""}}Ee.buildFunctionDefinition=Cu});var fa=re(Ne=>{"use strict";var Au=Ne&&Ne.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&Su(n,e,r[o]);return ku(n,e),n}})(),Su=Ne&&Ne.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),ku=Ne&&Ne.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e});Object.defineProperty(Ne,"__esModule",{value:!0});Ne.BpmTreeProvider=void 0;var Q=Au(require("vscode")),on=Tt(),pa={BO:"Method Directives",DB:"Data Directives",DQ:"UBAQ Directives"},an=class extends Q.TreeItem{constructor(e){super(pa[e],Q.TreeItemCollapsibleState.Collapsed),this.source=e,this.contextValue="bpm-group",this.iconPath=new Q.ThemeIcon(e==="DB"?"database":e==="DQ"?"table":"server-process")}},_n=class extends Q.TreeItem{constructor(e,n){super(e.replace(/^Ice\./,""),Q.TreeItemCollapsibleState.Collapsed),this.queryKey=e,this.methods=n,this.contextValue="bpm-query",this.iconPath=new Q.ThemeIcon("table");let r=n.reduce((o,i)=>o+i.directives.length,0);this.description=`${r} directive${r===1?"":"s"}`,this.tooltip=e}},Mn=class extends Q.TreeItem{constructor(e){let n=`${e.SystemCode}.${e.ServiceKind}.${e.ServiceName}`;super(n,Q.TreeItemCollapsibleState.Collapsed),this.svc=e,this.contextValue="bpm-service",this.iconPath=new Q.ThemeIcon("server"),this.tooltip=`${e.SystemCode} / ${e.ServiceKind} / ${e.ServiceName}`}},Bt=class extends Q.TreeItem{constructor(e,n,r){super(r||e.Name,Q.TreeItemCollapsibleState.Collapsed),this.method=e,this.directives=n,this.contextValue="bpm-method";let o=on.bpmSourceOf(e),i=[];if(o==="BO")e.HasPreProcessing&&i.push("Pre"),e.HasBaseProcessing&&i.push("Base"),e.HasPostProcessing&&i.push("Post");else for(let a of[...new Set((n||[]).map(s=>s.DirectiveType))].sort())i.push(on.directiveTypeLabel(o,a));e.Disabled&&i.push("Disabled"),e.HasOutdatedDirectives&&i.push("\u26A0 Outdated"),this.description=i.join(" \xB7 ")||"No directives",this.tooltip=[`${e.BpMethodCode}`,`Source: ${e.Source}`,i.length?`Flags: ${i.join(", ")}`:""].filter(Boolean).join(`
`),e.Disabled?this.iconPath=new Q.ThemeIcon("circle-slash",new Q.ThemeColor("charts.red")):e.HasOutdatedDirectives?this.iconPath=new Q.ThemeIcon("warning",new Q.ThemeColor("charts.yellow")):i.length>0?this.iconPath=new Q.ThemeIcon("symbol-event",new Q.ThemeColor("charts.blue")):this.iconPath=new Q.ThemeIcon("symbol-event")}},hr=class extends Q.TreeItem{constructor(e){super(e.Name,Q.TreeItemCollapsibleState.None),this.directive=e;let n=on.directiveTypeLabel(on.bpmSourceOf(e),e.DirectiveType),{hasCustomCode:r}=on.extractBpmCode(e.Body);this.description=[n,e.IsEnabled?"":"Disabled",r?"":"No code",e.DirectiveGroup?`[${e.DirectiveGroup}]`:""].filter(Boolean).join(" \xB7 "),this.contextValue=r?"bpm-directive-code":"bpm-directive-nocode",r||(this.command={command:"efx.bpm.openWidgetPanel",title:"Open Widget Panel",arguments:[{directive:e}]}),this.tooltip=[e.Name,`Type: ${n}`,`Enabled: ${e.IsEnabled}`,`Group: ${e.DirectiveGroup||"(none)"}`,r?"Has custom C# code":"No custom code (widget/condition only)",e.CompilerDiagnostics?`Diagnostics: ${e.CompilerDiagnostics}`:""].filter(Boolean).join(`
`),e.IsEnabled?r?e.DirectiveType===1?this.iconPath=new Q.ThemeIcon("arrow-up",new Q.ThemeColor("charts.blue")):e.DirectiveType===3?this.iconPath=new Q.ThemeIcon("arrow-down",new Q.ThemeColor("charts.green")):this.iconPath=new Q.ThemeIcon("symbol-event"):this.iconPath=new Q.ThemeIcon("gear"):this.iconPath=new Q.ThemeIcon("circle-slash",new Q.ThemeColor("charts.red")),r&&(this.command={command:"efx.bpm.pullDirective",title:"Pull Directive Code",arguments:[{directive:e}]})}};Ne.BpmGroupNode=an;Ne.BpmQueryNode=_n;Ne.BpmServiceNode=Mn;Ne.BpmMethodNode=Bt;Ne.BpmDirectiveNode=hr;var ho=class{constructor(e){this.bpmClient=e,this._onDidChangeTreeData=new Q.EventEmitter,this.onDidChangeTreeData=this._onDidChangeTreeData.event,this.services=[],this.methodCache=new Map,this.sourceCache=new Map}setClient(e){this.bpmClient=e}async refresh(){if(!this.bpmClient){Q.window.showWarningMessage("BPM: Configure EFx connection first");return}try{this.services=await this.bpmClient.getBpmServices(),this.methodCache.clear(),this.sourceCache.clear(),this._onDidChangeTreeData.fire(void 0),Q.window.showInformationMessage(`BPM: Loaded ${this.services.length} services`)}catch(e){Q.window.showErrorMessage(`BPM: Failed to load services: ${e.message}`)}}invalidateService(e,n,r){let o=`${e}.${n}.${r}`;this.methodCache.delete(o)}invalidateSource(e){this.sourceCache.delete(e)}async _loadSource(e){let n=this.sourceCache.get(e);if(n)return n;let r=await this.bpmClient.getBpmRowsBySource(e);return n={methods:r.methods.map(o=>({...o,Source:e})),directives:r.directives.map(o=>({...o,Source:e}))},this.sourceCache.set(e,n),n}_methodsWithDirectives(e){let n=new Map;for(let o of e.directives)n.has(o.BpMethodCode)||n.set(o.BpMethodCode,[]),n.get(o.BpMethodCode).push(o);let r=[];for(let[o,i]of n){let a=e.methods.find(s=>s.BpMethodCode===o)||{BpMethodCode:o,Name:o.split(".").pop(),Source:i[0].Source};r.push({method:a,directives:i})}return r.sort((o,i)=>o.method.BpMethodCode.localeCompare(i.method.BpMethodCode))}getTreeItem(e){return e}async getChildren(e){if(!this.bpmClient)return[];if(!e)return on.BPM_SOURCES.map(n=>new an(n));if(e instanceof an&&e.source!=="BO"){let n;try{n=await this._loadSource(e.source)}catch(i){return Q.window.showErrorMessage(`BPM: Failed to load ${pa[e.source]}: ${i.message}`),[]}let r=this._methodsWithDirectives(n);if(e.source==="DB")return r.map(({method:i,directives:a})=>new Bt(i,a,i.BpMethodCode.replace(/\.Update$/,"")));let o=new Map;for(let i of r){let a=i.method.BpMethodCode,s=a.slice(0,a.lastIndexOf("."));o.has(s)||o.set(s,[]),o.get(s).push(i)}return[...o.entries()].sort((i,a)=>i[0].localeCompare(a[0])).map(([i,a])=>new _n(i,a))}if(e instanceof _n)return e.methods.map(({method:n,directives:r})=>new Bt(n,r,n.BpMethodCode.split(".").pop()));if(e instanceof an)return this.services.sort((n,r)=>{let o=`${n.SystemCode}.${n.ServiceKind}.${n.ServiceName}`,i=`${r.SystemCode}.${r.ServiceKind}.${r.ServiceName}`;return o.localeCompare(i)}).map(n=>new Mn(n));if(e instanceof Mn){let{SystemCode:n,ServiceKind:r,ServiceName:o}=e.svc,i=`${n}.${r}.${o}`,a=this.methodCache.get(i);if(!a)try{a=await this.bpmClient.getBpmMethodsByService(n,r,o),this.methodCache.set(i,a)}catch(c){return Q.window.showErrorMessage(`BPM: Failed to load methods: ${c.message}`),[]}let{methods:s,directives:l}=a;return s.sort((c,p)=>c.Name.localeCompare(p.Name)).map(c=>{let p=l.filter(w=>w.BpMethodCode===c.BpMethodCode);return new Bt(c,p)})}if(e instanceof Bt){let n=e.directives;return!n||n.length===0?[]:n.sort((r,o)=>r.DirectiveType!==o.DirectiveType?r.DirectiveType-o.DirectiveType:(r.Order||0)-(o.Order||0)).map(r=>new hr(r))}return[]}};Ne.BpmTreeProvider=ho});var br=re((rf,ha)=>{"use strict";var Nt=require("vscode"),{parseDirective:Iu,setNodeCode:ma,setRaiseExceptionMessage:Tu,setNodeAttrs:Bu,setConditionChildren:Nu,setInvokeFunctionAction:$u,setActionField:Lu}=St(),gr=new Map;async function Ou(t,e){let n=gr.get(e.key);if(n){n.panel.reveal(Nt.ViewColumn.One);return}let r;try{r=await e.loadXaml()}catch(a){Nt.window.showErrorMessage(`Widget panel: could not load ${e.title} \u2014 ${a.message}`);return}let o=Nt.window.createWebviewPanel("epicorWidgets",e.title,Nt.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),i={panel:o,host:e,xaml:r,render:()=>{}};gr.set(e.key,i),o.onDidDispose(()=>gr.delete(e.key),null,t.subscriptions),i.render=()=>{let a=Iu(i.xaml);if(!a||a.nodes.length===0){o.webview.html=_u("Could not parse the widget XAML, or no widget nodes were found.<br>This may be a pure C# implementation with no visual widgets.");return}let s={nodes:a.nodes.map(l=>({id:l.id,type:l.type,widget:l.widget?{localName:l.widget.localName,label:l.widget.label,code:l.widget.code,message:l.widget.message,attrs:l.widget.attrs,conditions:l.widget.conditions,paramBindings:l.widget.paramBindings,actionExpressionText:l.widget.actionExpressionText,actionFieldInfo:l.widget.actionFieldInfo}:null,x:l.x,y:l.y})),edges:a.edges};o.webview.html=Mu(e.heading,e.badge||"",s)},i.render(),o.webview.onDidReceiveMessage(async a=>{a.type==="saveCode"?await sn(i,()=>ma(i.xaml,a.nodeId,a.code)):a.type==="saveMessage"?await sn(i,()=>Tu(i.xaml,a.nodeId,a.message)):a.type==="saveAttrs"?await sn(i,()=>Bu(i.xaml,a.nodeId,a.attrs)):a.type==="saveConditions"?await sn(i,()=>Nu(i.xaml,a.nodeId,a.conditions)):a.type==="saveInvokeFunction"?await sn(i,()=>$u(i.xaml,a.nodeId,a.attrs,a.paramBindings)):a.type==="saveActionField"?await sn(i,()=>Lu(i.xaml,a.nodeId,a.expressionText,a.fieldInfo)):a.type==="openCode"&&await Nt.commands.executeCommand("efx.widget.openCode",{panelKey:e.key,meta:e.meta,title:e.title,nodeId:a.nodeId,label:a.label||"Custom Code",code:a.code||""})},null,t.subscriptions)}async function sn(t,e){let{panel:n,host:r}=t;try{n.webview.postMessage({type:"saving"});let o=e();await r.saveXaml(o),t.xaml=o,n.webview.postMessage({type:"saved"}),Nt.window.showInformationMessage(`${r.heading}: saved.`)}catch(o){n.webview.postMessage({type:"saveError",message:o.message}),Nt.window.showErrorMessage(`Widget push failed: ${o.message}`)}}async function Fu(t,e,n){let r=await t.loadXaml(),o=ma(r,e,n);await t.saveXaml(o);let i=gr.get(t.key);return i&&(i.xaml=o,i.render()),o}function _u(t){return`<!DOCTYPE html><html><body style="color:#f87171;font-family:sans-serif;padding:24px;background:#1e1e1e;font-size:13px">${t}</body></html>`}function Mu(t,e,n){let r=Pu(),o=JSON.stringify(n),i=JSON.stringify(t),a=JSON.stringify(e);return`<!DOCTYPE html>
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
</body></html>`}function Pu(){let t="",e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let n=0;n<32;n++)t+=e[Math.floor(Math.random()*e.length)];return t}ha.exports={openWidgetPanel:Ou,pushNodeCode:Fu}});var va=re((of,ya)=>{"use strict";var{openWidgetPanel:Ru}=br(),{bpmSourceOf:Uu,directiveTypeLabel:qu}=Tt();function ga(t,e="BO"){return qu(e,t)}function ba(t,e){let n=Uu(e),r=ga(e.DirectiveType,n),o=e.Body||null;return{key:`bpm:${e.DirectiveID}`,title:`BPM: ${r} ${e.Name||e.DirectiveID}`,heading:e.Name||e.DirectiveID,badge:r,meta:{kind:"bpm",source:n,bpMethodCode:e.BpMethodCode,directiveId:e.DirectiveID,directiveType:e.DirectiveType,name:e.Name||e.DirectiveID},async loadXaml(){if(o)return o;let a=((await t.getBpmMethod(n,e.BpMethodCode))?.BpDirective||[]).find(s=>s.DirectiveID===e.DirectiveID);if(!a)throw new Error(`Directive ${e.DirectiveID} not found on ${e.BpMethodCode}`);return o=a.Body,o},async saveXaml(i){let a=await t.getBpmMethodRaw(n,e.BpMethodCode),s=Hu(a,e.DirectiveID,i),c=((await t.updateBpmRaw(s))?.returnObj?.BpMessageSvc||[]).filter(p=>p.Severity>1);if(c.length)throw new Error(c.map(p=>p.Message).join("; "));o=i,e.Body=i}}}function ju(t,e,n){return Ru(t,ba(e,n))}function Hu(t,e,n){let r=t.indexOf('"BpDirective":[');if(r<0)throw new Error("BpDirective array not found in tableset");let o=`"DirectiveID":"${e}"`,i=t.indexOf("[",r)+1;for(;i<t.length;){let a=t.indexOf("{",i);if(a<0)break;let s=0,l=!1,c=!1,p=-1;for(let h=a;h<t.length;h++){let d=t[h];if(l){if(c){c=!1;continue}if(d==="\\"){c=!0;continue}d==='"'&&(l=!1);continue}if(d==='"'){l=!0;continue}if(d==="{")s++;else if(d==="}"&&(s--,!s)){p=h;break}}if(p<0)throw new Error("Malformed BpDirective object in tableset");let w=t.slice(a,p+1);if(!w.includes(o)){i=p+1;continue}let b='"Body":"',S=w.indexOf(b);if(S<0)throw new Error("Body field not found in directive row");let D=S+b.length,B=D,O=!1;for(;B<w.length;){let h=w[B];if(O){O=!1,B++;continue}if(h==="\\"){O=!0,B++;continue}if(h==='"')break;B++}let $=JSON.stringify(n).slice(1,-1),E=w.slice(0,D)+$+w.slice(B),C=t.slice(0,a)+w+","+E+t.slice(p+1),T='"BitFlag":0,"RowMod":""',L=C.indexOf(T,a+w.length+1);if(L<0)throw new Error(`RowMod anchor not found for directive ${e}`);return C.slice(0,L)+'"BitFlag":0,"RowMod":"U"'+C.slice(L+T.length)}throw new Error(`Directive ${e} not found in tableset`)}ya.exports={openBpmWidgetPanel:ju,createBpmHost:ba,typeLabelOf:ga}});var xa=re((af,Da)=>{"use strict";var{openWidgetPanel:Wu}=br(),{describeBody:wa,packFlowXaml:Vu}=kt();function Ea(t,e,n,r){let o=r?wa(r):null;async function i(){if(!o){let s=((await t.getLibrary(e))?.EfxFunction||[]).find(l=>l.FunctionID===n);if(!s)throw new Error(`Function ${e}.${n} not found on server`);o=wa(s.Body)}if(o.kind!=="flow")throw new Error(`${e}.${n} has no widget flow \u2014 it is a code-based function`);return o}return{key:`efx:${e}.${n}`,title:`Function: ${e}.${n}`,heading:`${e}.${n}`,badge:"Function",meta:{kind:"efx",libraryId:e,functionId:n},async loadXaml(){return(await i()).xaml},async saveXaml(a){let s=await i();await t.saveFunctionBody(e,n,Vu(s,a)),o={...s,xaml:a}}}}function zu(t,e,n,r,o){return Wu(t,Ea(e,n,r,o))}Da.exports={openEfxWidgetPanel:zu,createEfxHost:Ea}});var Ta=re(ln=>{"use strict";var Pn=ln&&ln.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&(n[r[o]]=e[r[o]]);return n.default=e,n}})();Object.defineProperty(ln,"__esModule",{value:!0});ln.registerUpdateCommand=nd;ln.checkForUpdatesOnStartup=rd;var We=Pn(require("vscode")),Aa=Pn(require("https")),cn=Pn(require("fs")),Ku=Pn(require("path")),Gu=Pn(require("os")),Yu="mbcpi",Ju="epicor-customcode-manager",Xu="micah-bragg",Qu=`https://api.github.com/repos/${Yu}/${Ju}/releases/latest`,Ca="efx.updateSnoozedVersion";function Zu(t,e){let n=c=>String(c||"0").replace(/^v/,"").split(".").map(p=>parseInt(p)||0),[r,o,i]=n(t),[a,s,l]=n(e);return a!==r?a>r:s!==o?s>o:l>i}function Sa(t,e=3){return new Promise((n,r)=>{let o=Aa.get(t,{headers:{"User-Agent":"epicor-efx-manager-vscode"}},i=>{if((i.statusCode===301||i.statusCode===302)&&i.headers.location&&e>0)return n(Sa(i.headers.location,e-1));if(i.statusCode!==200)return i.resume(),r(new Error(`GitHub API returned ${i.statusCode}`));let a="";i.on("data",s=>{a+=s}),i.on("end",()=>{try{n(JSON.parse(a))}catch{r(new Error("Failed to parse GitHub API response"))}})});o.on("error",r),o.setTimeout(1e4,()=>{o.destroy(),r(new Error("Update check timed out"))})})}function ka(t,e,n=5){return new Promise((r,o)=>{let i=cn.createWriteStream(e),a=Aa.get(t,{headers:{"User-Agent":"epicor-efx-manager-vscode"}},s=>{if((s.statusCode===301||s.statusCode===302)&&s.headers.location&&n>0)return i.close(),cn.unlink(e,()=>{}),r(ka(s.headers.location,e,n-1));if(s.statusCode!==200)return i.close(),cn.unlink(e,()=>{}),o(new Error(`Download failed: HTTP ${s.statusCode}`));s.pipe(i),i.on("finish",()=>i.close(r)),i.on("error",l=>{cn.unlink(e,()=>{}),o(l)})});a.on("error",s=>{cn.unlink(e,()=>{}),o(s)}),a.setTimeout(6e4,()=>{a.destroy(),o(new Error("Download timed out"))})})}async function ed(){let t=await Sa(Qu),e=(t.assets||[]).find(n=>n.name&&n.name.endsWith(".vsix"));if(!e)throw new Error("No .vsix asset found in latest GitHub release");return{version:(t.tag_name||"").replace(/^v/,""),tagName:t.tag_name||"",releaseNotes:t.body||"",downloadUrl:e.browser_download_url,assetName:e.name}}async function td(t){let e=Ku.join(Gu.tmpdir(),t.assetName);await We.window.withProgress({location:We.ProgressLocation.Notification,title:`EFx: Downloading v${t.version}...`,cancellable:!1},async()=>{await ka(t.downloadUrl,e)});let n=We.Uri.file(e);await We.commands.executeCommand("workbench.extensions.installExtension",n),setTimeout(()=>{try{cn.unlinkSync(e)}catch{}},5e3),await We.window.showInformationMessage(`EFx Manager updated to v${t.version}. Reload window to activate?`,"Reload Now","Later")==="Reload Now"&&await We.commands.executeCommand("workbench.action.reloadWindow")}async function Ia(t,e=!1){let r=We.extensions.getExtension(`${Xu}.epicor-efx-manager`)?.packageJSON?.version||"0.0.0",o;try{o=await ed()}catch(s){e||We.window.showWarningMessage(`EFx: Update check failed \u2014 ${s.message}`);return}if(!Zu(r,o.version)){e||We.window.showInformationMessage(`EFx Manager is up to date (v${r})`);return}let i=t.globalState.get(Ca,"");if(e&&i===o.version)return;let a=await We.window.showInformationMessage(`EFx Manager v${o.version} is available (you have v${r})`,"Update Now","Later");if(a==="Update Now")try{await td(o)}catch(s){We.window.showErrorMessage(`EFx: Update failed \u2014 ${s.message}`)}else a==="Later"&&await t.globalState.update(Ca,o.version)}function nd(t){t.subscriptions.push(We.commands.registerCommand("efx.checkForUpdates",async()=>{await Ia(t,!1)}))}function rd(t){setTimeout(()=>{Ia(t,!0).catch(()=>{})},5e3)}});var go=re(yr=>{"use strict";var Ba=require("https"),Na=require("http");function $a(t){let e={layout:"layout",events:"events",dataviews:"dataviews",pages:"pages",rules:"rules",tools:"tools",classicLayout:"classicLayout",orphans:"orphans",properties:"properties"},n={};for(let[r,o]of Object.entries(t||{})){if(!o)continue;let i=r.replace(/\.jsonc?$/,"");if(e[i])try{n[e[i]]=JSON.parse(o)}catch{}}return n}var Rn=class{constructor(e){this.config=e}_getHeaders(){let n={"Content-Type":"application/json",Authorization:`Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64")}`};return this.config.apiKey&&(n["x-api-key"]=this.config.apiKey),n}_methodUrl(e){return`${this.config.serverUrl.replace(/\/$/,"")}/api/v2/odata/${this.config.company}/Ice.LIB.MetaFXSvc/${e}`}_call(e,n){return new Promise((r,o)=>{let i=this._methodUrl(e),a=new URL(i),s=a.protocol==="https:",l=s?Ba:Na,c=JSON.stringify(n),p={hostname:a.hostname,port:a.port||(s?443:80),path:a.pathname+a.search,method:"POST",headers:{...this._getHeaders(),"Content-Length":Buffer.byteLength(c)},rejectUnauthorized:!1},w=l.request(p,b=>{let S="";b.on("data",D=>{S+=D}),b.on("end",()=>{if(b.statusCode>=200&&b.statusCode<300)try{r(S?JSON.parse(S):null)}catch{r(S)}else{let D=`HTTP ${b.statusCode}`;try{let B=JSON.parse(S);D=B.error?.message||B.ErrorMessage||JSON.stringify(B,null,2)}catch{D=S||D}console.error(`[MetaFX] ${e} failed ${b.statusCode}: body=`,S.slice(0,2e3)),console.error(`[MetaFX] ${e} request body was:`,c.slice(0,1e3)),o(new Error(D))}})});w.on("error",o),w.write(c),w.end()})}_get(e,n){return new Promise((r,o)=>{let i=this._methodUrl(e),a=new URL(i);a.searchParams.set("request",JSON.stringify(n));let s=a.protocol==="https:",l=s?Ba:Na,c=this._getHeaders();delete c["Content-Type"];let p={hostname:a.hostname,port:a.port||(s?443:80),path:a.pathname+"?"+a.searchParams.toString(),method:"GET",headers:c,rejectUnauthorized:!1},w=l.request(p,b=>{let S="";b.on("data",D=>{S+=D}),b.on("end",()=>{if(b.statusCode>=200&&b.statusCode<300)try{r(S?JSON.parse(S):null)}catch{r(S)}else{let D=`HTTP ${b.statusCode}`;try{let B=JSON.parse(S);D=B.error?.message||B.ErrorMessage||S}catch{D=S||D}console.error(`[MetaFX] GET ${e} failed ${b.statusCode}:`,S.slice(0,1e3)),o(new Error(D))}})});w.on("error",o),w.end()})}async listApps(){let e=await this._call("GetApplications",{request:{Type:"view",SubType:"",SearchText:"",IncludeAllLayers:!0}});return Array.isArray(e?.returnObj)?e.returnObj:[]}async getLayers(e){let n=await this._call("GetLayers",{request:{ViewId:e,IncludeUnpublishedLayers:!0}}),r=n?.returnObj,o=i=>Array.isArray(i)&&i.length>0&&typeof i[0]=="object"&&i[0]!==null&&("LayerName"in i[0]||"LayerDescription"in i[0]||"TypeCode"in i[0]);if(Array.isArray(r))return r;if(r&&typeof r=="object"){let i=["Layers","layers","EpMetaFXLayerForApplicationList","LayerList","value","Value","data","Data","items","Items","Result","result","EpMetaFXLayerList","AppLayerList","LayerDescriptors"];for(let a of i)if(o(r[a]))return r[a];for(let[a,s]of Object.entries(r))if(o(s))return console.error("[MetaFX] GetLayers used layer-shaped fallback key:",a,"shape keys:",Object.keys(r)),s;for(let a of i)if(Array.isArray(r[a])&&r[a].length>0)return r[a];for(let[a,s]of Object.entries(r))if(Array.isArray(s)&&s.length>0)return console.error("[MetaFX] GetLayers used fallback key:",a,"shape keys:",Object.keys(r)),s;for(let a of i)if(Array.isArray(r[a]))return r[a]}return r!=null?console.error("[MetaFX] GetLayers returnObj (no array found):",JSON.stringify(r).slice(0,600)):console.error("[MetaFX] GetLayers result:",JSON.stringify(n).slice(0,600)),[]}async applicationExists(e){return(await this._call("ApplicationExists",{viewId:e}))?.returnObj===!0}async deleteApp(e){await this._call("DeleteApp",{viewId:e})}async exportApp(e){return(await this._call("ExportApp",{viewId:e}))?.returnObj||null}async getAppForLayer(e,n,r="Desktop"){console.log(`[MetaFX] getAppForLayer \u2192 viewId="${e}" layer="${n}"`);let o={id:e,properties:{deviceType:r||"Desktop",layers:[n],baseAppVersion:0,layerVersion:0,mode:"AppStudio",applicationType:"view",ignorePersonalization:!1,additionalContext:{doValidation:!0,menuId:"preview",inPreviewMode:!0},checkDuplicateIds:!1,debug:!1}};console.log("[MetaFX] getAppForLayer request:",JSON.stringify(o));try{let i=await this._get("GetApp",o),a=i?.returnObj;return a?(console.log("[MetaFX] getAppForLayer OK \u2014 top-level keys:",Object.keys(a)),a):(console.error("[MetaFX] getAppForLayer: empty returnObj. Full response:",JSON.stringify(i).slice(0,500)),null)}catch(i){throw console.error(`[MetaFX] getAppForLayer failed for layer="${n}":`,i.message),i}}async getApplicationInfo(e){return(await this.listApps()).find(r=>r.Id===e)||null}async getNewApplication(e,n,r){await this._call("GetNewApplication",{request:{Id:e,Type:n,SubType:r}})}_buildLayerInfo(e,n={},r=!0){let o=n.layerDescription||"";return{ViewId:e,LayerDescription:o,LayerName:o,TypeCode:n.typeCode||"KNTCCustLayer",WIP:r,IsNew:n.isNew||!1,Company:n.company||this.config.company||"",DeviceType:"Desktop",CGCCode:"",SystemFlag:!1,HasDraftContent:r,PublishParentLayers:!1,CommentText:n.comment||"",ParentLayers:null,UserName:null,Content:null,ChangedOn:new Date().toISOString().slice(0,10)+"T00:00:00",LayerUpdatedToPropDiffFormat:null,ProcessedInfo:null,LastUpdatedBy:""}}async saveApp(e,n,r={}){let o=$a(n),i=r.subType||o.layout?.viewType||"Dashboard";return(await this._call("SaveApp",{request:{id:e,viewType:i,...o,applicationType:"view",subApplicationType:i,uxAppVersion:0,commentText:r.comment||"",deviceType:"Desktop",layerInfo:this._buildLayerInfo(e,r,!0)}}))?.returnObj}async publishApp(e,n,r={}){let o=$a(n),i=r.subType||o.layout?.viewType||"Dashboard";return(await this._call("PublishApp",{request:{id:e,viewType:i,...o,applicationType:"view",subApplicationType:i,uxAppVersion:0,commentText:r.comment||"",deviceType:"Desktop",layerInfo:this._buildLayerInfo(e,r,!1)}}))?.returnObj}async exportLayers(e){return(await this._call("ExportLayers",{apps:e}))?.returnObj??null}async importLayers(e,n=!0){let r=await this._call("ImportLayers",{fileContent:{content:e,overwrite:n}});if(r&&typeof r=="object"){let o=r.error?.message||r.ErrorMessage||r.returnObj?.ErrorMessage||null;if(o)throw new Error(o)}return r}};yr.KineticMetaFXClient=Rn;yr.KineticLayerClient=Rn;yr.KineticAppClient=Rn});var Ra=re((lf,Pa)=>{"use strict";var{parseDirective:od,directiveToCanonicalText:id,looksLikeFlowXaml:ad}=St(),{formatBpmBodyXaml:sd,directiveTypeLabel:cd}=Tt();function vo(t){if(t&&typeof t=="object")return t;if(typeof t!="string")return null;let e=t.trim();if(!e.startsWith("{"))return null;try{return JSON.parse(e)}catch{return null}}function Un(t){if(!t||!String(t).trim())return"empty";let e=vo(t);return e&&(e.Nodes||e.Links||e.Version!==void 0)?"json":ad(t)?"xaml":"other"}function wr(t){if(Array.isArray(t))return t.map(wr);if(t&&typeof t=="object"){if(Array.isArray(t.$values))return t.$values.map(wr);let e={};for(let n of Object.keys(t))e[n]=wr(t[n]);return e}return t}function vr(t){if(!t)return"";let e=String(t).split(",")[0];return e.slice(e.lastIndexOf(".")+1)}function yo(t){return Array.isArray(t)?t.map(yo):t&&typeof t=="object"?Object.keys(t).sort().reduce((e,n)=>(e[n]=yo(t[n]),e),{}):t}var $t=t=>t&&typeof t=="object"?JSON.stringify(yo(t)):String(t),ld=new Set(["$type","Id","Code","VisualProperties","ValidationState"]);function bo(t,e){let n=[];if(!t||typeof t!="object")return n;for(let r of Object.keys(t).sort()){if(ld.has(r)||r.startsWith("_"))continue;let o=t[r];o==null||o===""||n.push(e+r+" = "+$t(o))}return n}function La(t,e){return String(t).replace(/\r\n/g,`
`).split(`
`).map(n=>e+"| "+n)}function _a(t){let e=vo(t);if(!e)return null;let n=wr(e),r=Array.isArray(n.Nodes)?n.Nodes:[],o=n.Links||n,i=o.NextNodes||{},a=o.TrueNodes||{},s=o.FalseNodes||{},l=new Map(r.map(E=>[String(E.Id),E])),c=[],p=new Set,w=E=>{E!=null&&(E=String(E),!(p.has(E)||!l.has(E))&&(p.add(E),c.push(E),w(i[E]),w(a[E]),w(s[E])))};w(o.StartNodeId);for(let E of r)p.has(String(E.Id))||(p.add(String(E.Id)),c.push(String(E.Id)));let b=new Map(c.map((E,C)=>[E,C+1])),S=E=>E==null?"(end)":"["+(b.get(String(E))??"?")+"]",D=[],B=[],O=[],$={nodes:[],edges:[]};if(n.AdditionalUsings&&D.push("Usings = "+$t(n.AdditionalUsings)),n.AdditionalReferences&&(!Array.isArray(n.AdditionalReferences)||n.AdditionalReferences.length)&&D.push("References = "+$t(n.AdditionalReferences)),Array.isArray(n.Variables)&&n.Variables.length)for(let E of n.Variables)D.push("Variable "+(E.Name||"?")+" : "+$t(E.TypeData||E.Type||""));return D.length&&D.push(""),n.VisualProperties&&O.push("(directive) "+$t(n.VisualProperties)),c.forEach((E,C)=>{let T=l.get(E),L=C+1,h=vr(T.$type),d=h==="DirectiveCondition"||!!T.Condition,y=d?"Condition":vr(T.Action&&T.Action.$type)||h||"(unknown)",k="["+L+"] "+(d?"Condition":"Step")+": "+y+(T.DisplayName?'  "'+T.DisplayName+'"':""),u=D.length;if(D.push(k),d)(T.Condition&&T.Condition.Items||[]).forEach((v,x)=>{let A=v.Condition||{};D.push("    Condition "+(x+1)+": "+(x>0&&v.Operator!=null?v.Operator+" ":"")+vr(A.$type)),D.push(...bo(A,"        ")),A.Code&&(D.push(...La(A.Code,"        ")),B.push("// ["+L+"] condition "+(x+1)+" "+vr(A.$type),String(A.Code),""))}),D.push(...bo(T.Condition,"    ").filter(v=>!v.trim().startsWith("Items ="))),D.push("    True -> "+S(a[E])),D.push("    False -> "+S(s[E]));else{let g=T.Action||{};D.push(...bo(g,"    ")),g.Code&&(D.push("    Code:",...La(g.Code,"      ")),B.push("// ["+L+"] "+y+(T.DisplayName?' "'+T.DisplayName+'"':""),String(g.Code),"")),D.push("    -> "+S(i[E]))}let m=T.VisualProperties||{};$.nodes.push({n:L,kind:d?"condition":"step",widget:y,label:T.DisplayName||"",x:+m.ElementX||0,y:+m.ElementY||0,sig:D.slice(u+1).filter(g=>!/^\s*(True |False )?-> /.test(g)).join(`
`)}),d?($.edges.push({from:L,to:b.get(String(a[E]))||null,label:"True"}),$.edges.push({from:L,to:b.get(String(s[E]))||null,label:"False"})):i[E]!=null&&$.edges.push({from:L,to:b.get(String(i[E]))||null,label:""}),D.push(""),O.push("["+L+"] "+y+"  "+$t(m))}),{text:D.join(`
`),code:B.join(`
`),layout:O.join(`
`),graph:$}}function ud(t){let e=id(t);if(e==null)return{text:sd(t),code:"",layout:"",graph:null};let n=[],r=[],o={nodes:[],edges:[]};try{let i=od(t),a=new Map((i?.nodes||[]).map((s,l)=>[s.id,l+1]));for(let s of i?.edges||[])a.has(s.from)&&o.edges.push({from:a.get(s.from),to:s.to==null?null:a.get(s.to)||null,label:s.label||""});(i?.nodes||[]).forEach((s,l)=>{let c=s.widget||{},p=l+1,{attrs:w,...b}=c,S={};for(let D of Object.keys(w||{}).sort())!D.startsWith("x:")&&!D.startsWith("xmlns")&&D!=="Id"&&D!=="ValidationState"&&(S[D]=w[D]);o.nodes.push({n:p,kind:s.type==="condition"?"condition":"step",widget:s.type==="condition"?"Condition":c.localName||s.type,label:s._el&&s._el.getAttribute&&s._el.getAttribute("DisplayName")||"",x:+s.x||0,y:+s.y||0,sig:$t({...b,attrs:S})}),c.code!=null&&n.push("// ["+p+"] "+(c.localName||""),String(c.code),""),(c.conditions||[]).forEach((D,B)=>{D.attrs&&D.attrs.Code&&n.push("// ["+p+"] condition "+(B+1)+" "+D.localName,String(D.attrs.Code),"")}),r.push("["+p+"] "+(c.localName||s.type)+"  x="+s.x+" y="+s.y)})}catch{}return{text:e,code:n.join(`
`),layout:r.join(`
`),graph:o}}function Ma(t){let e=Un(t);return e==="empty"?{format:e,text:"",code:"",layout:"",graph:null}:e==="json"?{format:e,..._a(t)||{text:String(t),code:"",layout:"",graph:null}}:e==="xaml"?{format:e,...ud(t)}:{format:e,text:String(t),code:"",layout:"",graph:null}}function Er(t){return[t.Source||"BO",t.BpMethodCode,t.DirectiveType,t.Name].join("|")}function Oa(t,e){let n=t._canon||Ma(t.Body||"");return{key:Er(t),Source:t.Source||"BO",BpMethodCode:t.BpMethodCode,DirectiveID:t.DirectiveID||"",Name:t.Name||"",DirectiveType:t.DirectiveType,IsEnabled:t.IsEnabled,Order:t.Order??t.Sequence??"",DirectiveGroup:t.DirectiveGroup||"",MethodDisabled:!!(e&&e.Disabled),format:n.format,origFormat:t._origFormat||n.format,normalized:!!t._normalized,text:n.text,code:n.code,layout:n.layout,graph:n.graph||null}}var dd=[["Widgets","text"],["Code","code"]],pd=["DirectiveType","IsEnabled","Order","DirectiveGroup","MethodDisabled"];function Fa(t,e){let n={},r=!1;for(let[o,i]of dd){let a=(t[i]||"")===(e[i]||"");a||(r=!0),n[o]={same:a}}for(let o of pd){let i=String(t[o]??""),a=String(e[o]??""),s=i===a;s||(r=!0),n[o]={a:i,b:a,same:s}}return n.Layout={same:(t.layout||"")===(e.layout||""),infoOnly:!0},n.Format={a:t.origFormat,b:e.origFormat,same:t.origFormat===e.origFormat,infoOnly:!0},n.hasDiff=r,n}function fd(t,e,n,r){let o=E=>(E.Source||"BO")+"|"+E.BpMethodCode,i=new Map(t.map(E=>[o(E),E])),a=new Map(n.map(E=>[o(E),E])),s=new Map,l=new Map;for(let E of e){let C=Oa(E,i.get((E.Source||"BO")+"|"+E.BpMethodCode));s.set(C.key,C)}for(let E of r){let C=Oa(E,a.get((E.Source||"BO")+"|"+E.BpMethodCode));l.set(C.key,C)}let c=[],p=[...new Set([...s.keys(),...l.keys()])].sort();for(let E of p){let C=s.get(E)||null,T=l.get(E)||null;if(C&&T){let L=Fa(C,T);c.push({key:E,status:L.hasDiff?"diff":"match",a:C,b:T,fields:L,layoutDiff:!L.Layout.same})}else c.push({key:E,status:C?"only-a":"only-b",a:C,b:T,fields:null,layoutDiff:!1})}let w=c.filter(E=>E.status==="only-a"&&E.a.DirectiveID),b=c.filter(E=>E.status==="only-b"&&E.b.DirectiveID),S=new Set;for(let E of w){let C=b.find(T=>!S.has(T)&&T.b.DirectiveID===E.a.DirectiveID&&T.b.BpMethodCode===E.a.BpMethodCode&&T.b.Source===E.a.Source);C&&(S.add(C),E.b=C.b,E.status="renamed",E.fields=Fa(E.a,E.b),E.layoutDiff=!E.fields.Layout.same,E.renamedTo=C.b.Name)}let D=c.filter(E=>!S.has(E)),B=new Map;for(let E of D){let C=E.a||E.b,T=i.get(C.Source+"|"+C.BpMethodCode)||a.get(C.Source+"|"+C.BpMethodCode)||{},L=T.SystemCode||String(C.BpMethodCode).split(".")[0]||"Erp",h=T.BusinessObject||String(C.BpMethodCode).split(".").slice(-2,-1)[0]||C.BpMethodCode,d=C.Source+":"+L+":"+h;B.has(d)||B.set(d,{svcKey:d,source:C.Source,systemCode:L,businessObject:h,methods:new Map});let y=B.get(d);y.methods.has(C.BpMethodCode)||y.methods.set(C.BpMethodCode,{methodCode:C.BpMethodCode,methodName:T.Name||String(C.BpMethodCode).split(".").pop(),inA:i.has(C.Source+"|"+C.BpMethodCode),inB:a.has(C.Source+"|"+C.BpMethodCode),dirs:[]}),y.methods.get(C.BpMethodCode).dirs.push({...E,typeLabel:cd(C.Source,C.DirectiveType)})}let O={match:0,diff:0,"only-a":0,"only-b":0,renamed:0};for(let E of D)O[E.status]++;let $=[...B.values()].map(E=>{let C=[...E.methods.values()].map(h=>(h.dirs.sort((d,y)=>(d.a||d.b).DirectiveType-(y.a||y.b).DirectiveType||String((d.a||d.b).Order).localeCompare(String((y.a||y.b).Order))||(d.a||d.b).Name.localeCompare((y.a||y.b).Name)),h.status=h.dirs.some(d=>d.status!=="match")?"diff":"match",h)).sort((h,d)=>h.methodName.localeCompare(d.methodName)),T=C.reduce((h,d)=>h+d.dirs.filter(y=>y.status!=="match").length,0),L=C.reduce((h,d)=>h+d.dirs.length,0);return{svcKey:E.svcKey,source:E.source,systemCode:E.systemCode,businessObject:E.businessObject,status:T?"diff":"match",diffCount:T,dirCount:L,methods:C}}).sort((E,C)=>(E.status===C.status?0:E.status==="diff"?-1:1)||E.businessObject.localeCompare(C.businessObject));return{services:$,counts:O,total:D.length,serviceTotal:$.length}}function md(t,e){let n=new Map(t.map(o=>[Er(o),o])),r=[];for(let o of e){let i=n.get(Er(o));if(!i)continue;let a=Un(i.Body),s=Un(o.Body);a!==s&&a!=="empty"&&s!=="empty"&&r.push({a:i,b:o})}return r}function hd(t){let e=Un(t);if(e==="empty")return"";if(e==="json")return JSON.stringify(vo(t),null,2);let n=String(t).match(/<[^>]+>|[^<]+/g)||[],r=[],o=0,i=()=>"  ".repeat(Math.max(0,o));for(let a of n){if(!a.trim())continue;if(!a.startsWith("<")){r.push(i()+a.trim());continue}let s=a.startsWith("</"),l=a.endsWith("/>")||a.startsWith("<?")||a.startsWith("<!");if(s&&o--,a.length>120&&!s){let c=a.split(/\s+(?=[\w:.]+=")/);r.push(i()+c[0]);for(let p of c.slice(1))r.push(i()+"    "+p)}else r.push(i()+a);!s&&!l&&o++}return r.join(`
`)}Pa.exports={bodyFormat:Un,canonicalizeBody:Ma,jsonToCanonical:_a,buildBpmCompare:fd,mixedFormatPairs:md,directiveKey:Er,prettyBody:hd}});var Va=re((uf,Wa)=>{"use strict";var gd="KNTCCustLayer";function qa(t){return!!t&&t.TypeCode===gd&&!t.SystemFlag&&!!t.LayerName}function Lt(t){let e=[t.LayerName];return t.DeviceType&&t.DeviceType!=="Desktop"&&e.push(t.DeviceType),e.join(" \xB7 ")}function bd(t){return t?{LayerName:t.LayerName,TypeCode:t.TypeCode,DeviceType:t.DeviceType||"Desktop",Company:t.Company||"",IsPublished:t.IsPublished,HasDraftContent:t.HasDraftContent,LastUpdated:t.LastUpdated||"",LastUpdatedBy:t.LastUpdatedBy||"",CGCCode:t.CGCCode||""}:null}function yd(t,e,n){let r=b=>{let S=new Map;for(let D of b||[]){let B=(D.Layers||[]).filter(qa).map(bd);B.length&&S.set(D.Id,{app:D,layers:B})}return S},o=b=>b.Company||"",i=(b,S)=>{let D=[...b],B=[...S],O=[],$=T=>{for(let L=0;L<D.length;L++){let h=B.findIndex(d=>T(D[L],d));h<0||(O.push([D[L],B[h]]),D.splice(L--,1),B.splice(h,1))}};n&&$((T,L)=>Lt(T)===Lt(L)&&o(T)===o(L)),$((T,L)=>Lt(T)===Lt(L));for(let T of D)O.push([T,null]);for(let T of B)O.push([null,T]);let E=new Map;for(let[T,L]of O){let h=Lt(T||L);E.set(h,(E.get(h)||0)+1)}let C=new Set;return O.map(([T,L])=>{let h=T||L,d=Lt(h),y=E.get(d)>1?d+" \xB7 "+(o(h)||"all companies"):d,k=2,u=y;for(;C.has(y);)y=u+" #"+k++;return C.add(y),{key:y,lA:T,lB:L}})},a=r(t),s=r(e),l=[...new Set([...a.keys(),...s.keys()])].sort(),c={"only-a":0,"only-b":0,"layers-differ":0,"in-both":0},p=l.map(b=>{let S=a.get(b),D=s.get(b),B=(S||D).app,O=i(S?S.layers:[],D?D.layers:[]).map(({key:E,lA:C,lB:T})=>({key:E,lA:C,lB:T,status:C&&T?"in-both":C?"only-a":"only-b",updatedDiffers:!!(C&&T&&(C.LastUpdated!==T.LastUpdated||C.LastUpdatedBy!==T.LastUpdatedBy)),companyDiffers:!!(C&&T&&o(C)!==o(T)),publishDiffers:!!(C&&T&&C.IsPublished!==T.IsPublished)})).sort((E,C)=>E.key.localeCompare(C.key)),$=S?D?O.some(E=>E.status!=="in-both")?"layers-differ":"in-both":"only-a":"only-b";return c[$]++,{id:b,status:$,type:B.Type,subType:B.SubType,systemApp:!!B.SystemFlag,layerCount:O.length,layerDelta:O.filter(E=>E.status!=="in-both").length,updatedDelta:O.filter(E=>E.updatedDiffers).length,layers:O}}),w={"only-a":0,"only-b":1,"layers-differ":2,"in-both":3};return p.sort((b,S)=>w[b.status]-w[S.status]||b.id.localeCompare(S.id)),{apps:p,counts:c,total:p.length}}var ja=t=>t&&typeof t=="object"&&!Array.isArray(t)&&typeof t.sourceTypeId=="string";function ht(t,e=[]){if(Array.isArray(t)){for(let n of t)ht(n,e);return e}if(!t||typeof t!="object")return e;if(ja(t))return e.push(t),e;for(let n of Object.keys(t))ht(t[n],e);return e}function vd(t){let e=[];for(let n of Object.keys(t))n!=="sourceTypeId"&&ht(t[n],e);return e}function wd(t){let e=r=>{if(Array.isArray(r))return r.map(e);if(!r||typeof r!="object")return r;if(ja(r))return{"@child":r.id};let o={};for(let i of Object.keys(r))o[i]=e(r[i]);return o},n={};for(let r of Object.keys(t))n[r]=e(t[r]);return n}function Ha(t){let e=t.model||{};return e.labelText||e.title||e.caption||e.text||e.headerText||t.id}function Dr(t,e,n,r){let o=e,i=2;for(;t.has(o);)o=e+" #"+i++;t.set(o,{key:o,label:n,value:r})}function Ua(t,e){let n=new Map,r=t?t[e]:void 0;if(e==="Layout"||e==="Pages"){let o=e==="Layout"?r?[r]:[]:r||[];for(let i of o){let a=e==="Layout"?"(layout)":i.name||i.guid||"?",s={};for(let c of Object.keys(i))c!=="components"&&(s[c]=i[c]);Dr(n,a+" / (page)",a,s);let l=c=>{Dr(n,a+" / "+(c.id||c.model?.guid||"?"),c.sourceTypeId+"  "+Ha(c),wd(c));for(let p of vd(c))l(p)};for(let c of ht(i.components||[]))l(c)}return n}return Array.isArray(r)?(r.forEach((o,i)=>{let a=o&&(o.id??o.Id??o.name??o.Name);Dr(n,a!=null?String(a):"#"+i,a!=null?String(a):"#"+i,o)}),n):(r!=null&&Dr(n,"(value)",e,r),n)}function Cr(t,e,n){if(Array.isArray(t))t.length||(n[e||"(root)"]="[]"),t.forEach((r,o)=>Cr(r,e+"["+o+"]",n));else if(t&&typeof t=="object"){let r=Object.keys(t);r.length||(n[e||"(root)"]="{}");for(let o of r.sort())Cr(t[o],e?e+"."+o:o,n)}else n[e||"(root)"]=JSON.stringify(t);return n}function wo(t){return Array.isArray(t)?t.map(wo):t&&typeof t=="object"?Object.keys(t).sort().reduce((e,n)=>(e[n]=wo(t[n]),e),{}):t}var xr=t=>JSON.stringify(wo(t),null,2),Ed=["Layout","Pages","Events","DataViews","Rules","ToolBar","Orphans","Properties"],Dd=300;function xd(t,e){let n=[...new Set([...Ed,...Object.keys(t||{}),...Object.keys(e||{})])],r=[];for(let o of n){let i=Ua(t,o),a=Ua(e,o);if(!i.size&&!a.size)continue;let s={added:0,removed:0,changed:0,same:0},l=[],c=[...new Set([...i.keys(),...a.keys()])];for(let p of c){let w=i.get(p),b=a.get(p);if(w&&b){let S=Cr(w.value,"",{}),D=Cr(b.value,"",{}),B=[];for(let $ of[...new Set([...Object.keys(S),...Object.keys(D)])].sort())S[$]!==D[$]&&B.push({path:$,a:S[$]??null,b:D[$]??null});if(!B.length){s.same++;continue}s.changed++;let O=B.every($=>$.path.includes("@child"));l.push({key:p,label:w.label,status:"changed",structural:O,fields:B.slice(0,Dd),fieldCount:B.length,a:xr(w.value),b:xr(b.value)})}else w?(s.removed++,l.push({key:p,label:w.label,status:"only-a",fields:[],fieldCount:0,a:xr(w.value),b:""})):(s.added++,l.push({key:p,label:b.label,status:"only-b",fields:[],fieldCount:0,a:"",b:xr(b.value)}))}r.push({name:o,counts:s,items:l})}return r}var Cd={expandedHeaderComponents:"header",extensionComponents:"ext"};function Ad(t){let e=[];for(let r of ht(t.components||[]))e.push([r,"body"]);let n=t.model||{};for(let r of Object.keys(n))if(r!=="gridModel")for(let o of ht(n[r]))e.push([o,Cd[r]||"body"]);return e}function Sd(t){let e=t.model||{},n={};for(let r of["title","labelText","flexBasis","columns","orientation","readonly","required","disabled","isKeyField","hidden","enableSearch","enabledCaption","disabledCaption","status","comboBoxLabel","trueCaption","falseCaption","expanded","textHAlign","fullScreenButtonVisible"])e[r]!==void 0&&e[r]!==null&&typeof e[r]!="object"?n[r]=e[r]:r==="columns"&&Array.isArray(e[r])&&(n.navColumns=e[r].filter(o=>typeof o=="string"));return e.gridModel&&Array.isArray(e.gridModel.columns)&&(n.gridColumns=e.gridModel.columns.map(r=>r&&(r.title||r.caption||r.field)).filter(Boolean).slice(0,40)),Array.isArray(e.data)&&t.sourceTypeId==="metafx-tabstrip"&&(n.tabs=e.data.map(r=>({title:r.title||r.id,page:r.page||"",selected:!!r.selected}))),Array.isArray(e.data)&&t.sourceTypeId==="erp-radio-button"&&(n.options=e.data.map(r=>r&&(r.text||r.label||r.Val||r.value)).filter(Boolean).slice(0,8)),n}function Eo(t,e,n){let r=t.model||{};return{key:e+" / "+(t.id||r.guid||"?"),id:t.id||"",type:t.sourceTypeId,slot:n||"body",label:Ha(t),binding:r.epBinding||"",props:Sd(t),children:Ad(t).map(([o,i])=>Eo(o,e,i))}}function kd(t){if(!t)return[];let e=[];t.Layout&&e.push({key:"(layout)",caption:t.Layout.caption||"(layout)",roots:ht(t.Layout.components||[]).map(n=>Eo(n,"(layout)","body"))});for(let n of t.Pages||[]){let r=n.name||n.guid||"?";e.push({key:r,caption:n.caption||r,roots:ht(n.components||[]).map(o=>Eo(o,r,"body"))})}return e}Wa.exports={buildLayerApps:yd,diffAppSections:xd,buildWireframe:kd,isCustomLayer:qa,layerKey:Lt}});var za=re((df,Id)=>{Id.exports=`// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
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
`});var Co=re(kr=>{"use strict";var $e=require("vscode"),{EpicorClient:Do}=Kn(),{BpmClient:Ka}=Tt(),Pe=Ra(),Ar=Va(),Td=za(),{directiveToCanonicalText:Bd}=St(),{describeBody:Xa,normalizeCode:Ga}=kt(),{KineticMetaFXClient:Nd}=go();function $d(t){let e=Xa(t);return e.kind!=="flow"?{code:e.code,usings:e.usings,isFlow:!1}:{code:Bd(e.xaml)||e.xaml,usings:e.usings,isFlow:!0}}function Ya(t){let e=t.EfxFunction||[],n=t.EfxFunctionSignature||[],r=t.EfxLibrary||[],o={};for(let c of n){let p=`${c.LibraryID}|${c.FunctionID}`;o[p]||(o[p]={inputs:[],outputs:[]});let w={name:c.ArgumentName,type:c.DataType,order:c.Order};(c.Response?o[p].outputs:o[p].inputs).push(w)}for(let c of Object.keys(o))o[c].inputs.sort((p,w)=>p.order-w.order),o[c].outputs.sort((p,w)=>p.order-w.order);let i={},a=(c,p,w)=>{(i[c]=i[c]||{})[p]=(i[c]||{})[p]||[],i[c][p].push(w)};for(let c of t.EfxRefLibrary||[])a(c.LibraryID,"libs",c.LibraryRef);for(let c of t.EfxRefAssembly||[])a(c.LibraryID,"assemblies",c.Assembly);for(let c of t.EfxRefService||[])a(c.LibraryID,"services",c.ServiceID);for(let c of t.EfxRefTable||[])a(c.LibraryID,"tables",`${c.TableID} (${c.Updatable?"rw":"ro"})`);let s={};for(let c of r)s[c.LibraryID]=c;let l={};for(let c of e){let{code:p,usings:w,isFlow:b}=$d(c.Body);l[c.LibraryID]||(l[c.LibraryID]={}),l[c.LibraryID][c.FunctionID]={...c,_code:p,_usings:w,_isFlow:b,_sig:o[`${c.LibraryID}|${c.FunctionID}`]||{inputs:[],outputs:[]}}}return{fnMap:l,refMap:i,libDetail:s}}function Ld(t,e){let n={},r=!1;for(let[s,l]of[["_code","Code"],["_usings","Usings"]]){let c=t[s]||"",p=e[s]||"",w=Ga(c)===Ga(p);w||(r=!0),n[l]={a:c,b:p,same:w}}for(let s of["Description","Kind","RequireTransaction","SingleRowMode","Private","Disabled"]){let l=String(t[s]??""),c=String(e[s]??""),p=l===c;p||(r=!0),n[s]={a:l,b:c,same:p}}let o=s=>(s||[]).map(l=>`${l.name}: ${l.type}`).join(", "),i=t._sig||{},a=e._sig||{};for(let[s,l]of[["Inputs","inputs"],["Outputs","outputs"]]){let c=o(i[l]),p=o(a[l]),w=c===p;w||(r=!0),n[s]={a:c,b:p,same:w,params_a:i[l]||[],params_b:a[l]||[]}}return n.hasDiff=r,n}var Od=["DirectDBAccess","AllowCustomCodeFunctions","AllowCustomCodeWidgets","Frozen","Disabled"],Fd=["Description","Owner","Revision","EpicorVersion","Mode","Notes","Package","PackageVersion","Publisher","LockedBy","LockedOn","DebugMode","DumpSources","AdvTracing"];function _d(t,e,n,r){let o={},i=!1;for(let a of["libs","assemblies","services","tables"]){let s=[...t[a]||[]].sort().join(`
`),l=[...e[a]||[]].sort().join(`
`),c=s===l;c||(i=!0),o[a]={a:s,b:l,same:c}}for(let a of Od){let s=String((n||{})[a]??""),l=String((r||{})[a]??""),c=s===l;c||(i=!0),o[a]={a:s,b:l,same:c}}for(let a of Fd){let s=String((n||{})[a]??""),l=String((r||{})[a]??"");o[a]={a:s,b:l,same:s===l,infoOnly:!0}}return o.hasDiff=i,o}function Sr(t){return t?{FunctionID:t.FunctionID||"",Description:t.Description||"",Kind:t.Kind,RequireTransaction:t.RequireTransaction,SingleRowMode:t.SingleRowMode,Private:t.Private,Disabled:t.Disabled,_code:t._code||"",_usings:t._usings||"",_sig:t._sig||{inputs:[],outputs:[]}}:null}function Md(t,e,n,r,o,i,a,s){let l=[...new Set([...t.map(p=>p.LibraryID),...e.map(p=>p.LibraryID),...Object.keys(n),...Object.keys(r)])].sort(),c=[];for(let p of l){let w=p in n||p in a,b=p in r||p in s,S=n[p]||{},D=r[p]||{},B=[...new Set([...Object.keys(S),...Object.keys(D)])].sort(),O=[];for(let C of B){let T=S[C],L=D[C];if(!T)O.push({fnID:C,status:"only-b",fa:null,fb:Sr(L)});else if(!L)O.push({fnID:C,status:"only-a",fa:Sr(T),fb:null});else{let h=Ld(T,L);O.push({fnID:C,status:h.hasDiff?"diff":"match",fa:Sr(T),fb:Sr(L),fields:h})}}let $=_d(o[p]||{},i[p]||{},a[p],s[p]),E;w?b?O.some(C=>C.status!=="match")||$.hasDiff?E="diff":E="match":E="only-a":E="only-b",c.push({libID:p,status:E,inA:w,inB:b,libDiff:$,fnDiffs:O})}return c}function xo(t){return Array.isArray(t)?t.map(xo):t&&typeof t=="object"?Object.keys(t).sort().reduce((e,n)=>(e[n]=xo(t[n]),e),{}):t}function Ja(t){if(!t||!t.trim())return t||"";try{return JSON.stringify(xo(JSON.parse(t)),null,2)}catch{return t}}async function Qa(t,e,n,r,o=()=>{}){o("Fetching library lists\u2026");let[i,a]=await Promise.all([t.getLibraryList(),e.getLibraryList()]),s=[...new Set([...i.map(T=>T.LibraryID),...a.map(T=>T.LibraryID)])];o(`Fetching ${s.length} libraries from both environments\u2026`);let[l,c]=await Promise.all([t.request(t.getDesignerUrl("GetLibraries"),{libraryIds:s}),e.request(e.getDesignerUrl("GetLibraries"),{libraryIds:s})]);o("Computing diff\u2026");for(let[T,L]of[[l,n],[c,r]])if(!T||typeof T!="object")throw new Error(`Unexpected GetLibraries response from ${L} \u2014 expected JSON, got ${typeof T}.`);let p=l.returnObj||l,w=c.returnObj||c,{fnMap:b,refMap:S,libDetail:D}=Ya(p),{fnMap:B,refMap:O,libDetail:$}=Ya(w),E=Md(i,a,b,B,S,O,D,$),C={match:0,diff:0,"only-a":0,"only-b":0};for(let T of E)C[T.status]=(C[T.status]||0)+1;return{meta:{env_a_name:n,env_b_name:r,counts:C,total:E.length},libraries:E}}async function Za(t,e,n,r,o=()=>{}){let i=new Ka(t),a=new Ka(e),s=[],l=async(S,D)=>{let B=await S.getBpmServices(),O=6,$=new Array(B.length),E=0,C=async()=>{for(;E<B.length;){let d=E++,{SystemCode:y,ServiceKind:k,ServiceName:u}=B[d];$[d]=await S.getBpmMethodsByService(y,k,u)}};await Promise.all(Array.from({length:Math.min(O,B.length)},C));let T=[],L=[];for(let d of $){for(let y of d.methods)T.push({...y,Source:y.Source||"BO"});for(let y of d.directives)L.push({...y,Source:y.Source||"BO"})}for(let[d,y]of[["DB","data"],["DQ","UBAQ"]])try{let k=await S.getBpmRowsBySource(d);for(let u of k.methods)T.push({...u,Source:d});for(let u of k.directives)L.push({...u,Source:d})}catch(k){s.push(`${D}: ${y} directives not loaded \u2014 ${k.message}`)}let h=new Set;return{methods:T,directives:L.filter(d=>{let y=d.DirectiveID||Pe.directiveKey(d);return h.has(y)?!1:(h.add(y),!0)})}};o("Fetching BPM directives from both environments\u2026");let[c,p]=await Promise.all([l(i,n),l(a,r)]),w=Pe.mixedFormatPairs(c.directives,p.directives);if(w.length){o(`Normalizing ${w.length} directive(s) stored in different formats\u2026`);let S=0,D=0,B=async()=>{for(;S<w.length;){let{a:O,b:$}=w[S++];try{let[E,C]=await Promise.all([i.getKineticDirective(O.DirectiveID),a.getKineticDirective($.DirectiveID)]),T=E&&Pe.jsonToCanonical(E),L=C&&Pe.jsonToCanonical(C);if(!T||!L){D++;continue}O._origFormat=Pe.bodyFormat(O.Body),$._origFormat=Pe.bodyFormat($.Body),O._canon={format:"json",...T},$._canon={format:"json",...L},O._normalized=$._normalized=!0}catch{D++}}};await Promise.all(Array.from({length:Math.min(6,w.length)},B)),D&&s.push(`${D} directive pair(s) stored as XAML vs JSON could not be normalized \u2014 they compare as raw text and will show as different.`)}o("Computing BPM diff\u2026");let b=Pe.buildBpmCompare(c.methods,c.directives,p.methods,p.directives);return b.warnings=s,{bpmData:b,rawA:new Map(c.directives.map(S=>[Pe.directiveKey(S),S.Body||""])),rawB:new Map(p.directives.map(S=>[Pe.directiveKey(S),S.Body||""]))}}var qn=class t{constructor(e,n){this.panel=e,this.context=n,this.disposed=!1,e.webview.onDidReceiveMessage(async r=>{try{switch(r.command){case"ready":this._postProfiles();break;case"runCompare":await this._runFunctionsCompare(r);break;case"runBpmCompare":await this._runBpmCompare(r);break;case"runLayersCompare":await this._runLayersCompare(r);break;case"fetchLayerList":await this._fetchLayerList(r);break;case"fetchLayerContent":await this._fetchLayerContent(r);break;case"openNativeDiff":await this._openNativeDiff(r);break;case"openBpmRaw":await this._openBpmRaw(r);break;case"applyFunction":await this._applyFunction(r);break}}catch(o){this._post({command:"error",message:o.message})}}),e.onDidDispose(()=>{this.disposed=!0,t.panels.delete(t.KEY)}),e.webview.html=this.getHtml()}static show(e){let n=t.panels.get(t.KEY);if(n&&!n.disposed){n.panel.reveal();return}let r=$e.window.createWebviewPanel("efxCompare","Compare",$e.ViewColumn.Two,{enableScripts:!0,retainContextWhenHidden:!0});t.panels.set(t.KEY,new t(r,e))}_post(e){this.disposed||this.panel.webview.postMessage(e)}_postProfiles(){let e=$e.workspace.getConfiguration().get("efx.profiles")||[],n=$e.workspace.getConfiguration().get("efx.activeProfile")||"",r=$e.workspace.getConfiguration().get("efx.activeCompany")||"";this._post({command:"profiles",data:e.map(o=>({name:o.name,companies:o.companies||[]})),activeProfile:n,activeCompany:r})}async _secrets(e){let n=await this.context.secrets.get(`efx.profile.${e}.password`)||"",r=await this.context.secrets.get(`efx.profile.${e}.apiKey`)||"";if(!n)throw new Error(`No password stored for profile "${e}" \u2014 open Manage Profiles and re-enter it.`);return{password:n,apiKey:r}}async _efxClient(e,n){let o=($e.workspace.getConfiguration().get("efx.profiles")||[]).find(s=>s.name===e);if(!o)throw new Error(`Profile "${e}" not found`);let{password:i,apiKey:a}=await this._secrets(e);return new Do({serverUrl:o.serverUrl,company:n,username:o.username,password:i,apiKey:a})}async _metafxClient(e,n){let o=($e.workspace.getConfiguration().get("efx.profiles")||[]).find(s=>s.name===e);if(!o)throw new Error(`Profile "${e}" not found`);let{password:i,apiKey:a}=await this._secrets(e);return new Nd({serverUrl:o.serverUrl,company:n,username:o.username,password:i,apiKey:a})}async _runFunctionsCompare({profileA:e,companyA:n,profileB:r,companyB:o}){this._post({command:"status",text:"Building clients\u2026"}),this._post({command:"compareStarted"});try{let[i,a]=await Promise.all([this._efxClient(e,n),this._efxClient(r,o)]),s=await Qa(i,a,e,r,l=>this._post({command:"status",text:l}));this._post({command:"functionsReady",data:s})}catch(i){this._post({command:"error",tab:"functions",message:i.message})}}async _runBpmCompare({profileA:e,companyA:n,profileB:r,companyB:o}){this._post({command:"status",text:"Fetching BPM services\u2026"});try{let[i,a]=await Promise.all([this._efxClient(e,n),this._efxClient(r,o)]),{bpmData:s,rawA:l,rawB:c}=await Za(i,a,e,r,p=>this._post({command:"status",text:p}));this._bpmRawA=l,this._bpmRawB=c,this._post({command:"bpmReady",data:s})}catch(i){this._post({command:"error",tab:"bpm",message:i.message})}}async _runLayersCompare({profileA:e,companyA:n,profileB:r,companyB:o}){this._post({command:"status",text:"Fetching app list\u2026"});try{let[i,a]=await Promise.all([this._metafxClient(e,n),this._metafxClient(r,o)]),[s,l]=await Promise.all([i.listApps(),a.listApps()]),c=Ar.buildLayerApps(s,l,n===o);this._post({command:"layersReady",data:c})}catch(i){this._post({command:"error",tab:"layers",message:i.message})}}async _fetchLayerList({appId:e,profileA:n,companyA:r,profileB:o,companyB:i}){this._post({command:"layerListLoading",appId:e});try{let[a,s]=await Promise.all([this._metafxClient(n,r),this._metafxClient(o,i)]),[l,c]=await Promise.all([a.getLayers(e).then(p=>({layers:p})).catch(p=>(console.error("[layers A]",p.message),{layers:[],error:p.message})),s.getLayers(e).then(p=>({layers:p})).catch(p=>(console.error("[layers B]",p.message),{layers:[],error:p.message}))]);this._post({command:"status",text:`Layers for ${e}: ${n}=${l.error?"ERROR":l.layers.length}, ${o}=${c.error?"ERROR":c.layers.length}`}),this._post({command:"layerListReady",appId:e,layersA:l.layers,layersB:c.layers,errorA:l.error||null,errorB:c.error||null})}catch(a){this._post({command:"layerListError",appId:e,message:a.message})}}async _fetchLayerContent({appId:e,layerKey:n,layerA:r,layerB:o,profileA:i,companyA:a,profileB:s,companyB:l}){this._post({command:"layerContentLoading",appId:e,layerKey:n});try{let[c,p]=await Promise.all([this._metafxClient(i,a),this._metafxClient(s,l)]),w=(E,C,T)=>{let L=C&&(C.LayerName||C.LayerDescription);return L?E.getAppForLayer(e,L,C.DeviceType).then(h=>({raw:h})).catch(h=>(console.error(`[comparePanel] getAppForLayer ${T} failed:`,h.message),{raw:null,error:h.message})):Promise.resolve({raw:null})},[b,S]=await Promise.all([w(c,r,"A"),w(p,o,"B")]);if(b.error&&S.error)throw new Error(`Could not load layer content from either environment \u2014 ${b.error} / ${S.error}`);if(b.error||S.error){this._post({command:"layerContentError",appId:e,layerKey:n,message:`${b.error?i:s} failed: ${b.error||S.error}`});return}let D=E=>E?JSON.stringify(E,null,2):"",B=Ja(D(b.raw)),O=Ja(D(S.raw)),$=Ar.diffAppSections(b.raw,S.raw);(!b.raw||!S.raw)&&($=$.map(E=>({...E,items:[]}))),this._post({command:"layerSectionsReady",appId:e,layerKey:n,sections:$,wireA:Ar.buildWireframe(b.raw),wireB:Ar.buildWireframe(S.raw)}),this._post({command:"layerContentReady",appId:e,layerKey:n,normA:B,normB:O,same:B===O})}catch(c){console.error("[comparePanel] _fetchLayerContent error:",c.message),this._post({command:"layerContentError",appId:e,layerKey:n,message:c.message})}}async _applyFunction({libraryId:e,functionId:n,direction:r,profileA:o,companyA:i,profileB:a,companyB:s}){let l=r==="aToB"?o:a,c=r==="aToB"?i:s,p=r==="aToB"?a:o,w=r==="aToB"?s:i,b=`${e}.${n}`;if(await $e.window.showWarningMessage(`Apply ${b} from ${l} -> ${p}?`,{modal:!0},"Apply")!=="Apply"){this._post({command:"applyFnCancelled",libraryId:e,functionId:n});return}this._post({command:"applyFnStarted",libraryId:e,functionId:n});let D=!1,B=null;try{let[O,$]=await Promise.all([this._efxClient(l,c),this._efxClient(p,w)]);B=$,this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Reading ${b} from ${l}\u2026`});let E=await O.getLibrary(e),C=E?.EfxFunction?.find(A=>A.FunctionID===n);if(!C)throw new Error(`${b} not found on ${l}`);if(Xa(C.Body).kind==="flow")throw new Error(`${b} is a widget-based function \u2014 apply only supports code-based functions.`);let{code:T,usings:L}=Do.extractCode(C.Body);this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Checking ${p}\u2026`});let h=await B.getLibrary(e),d=h?.EfxLibrary?.[0];if(!d)throw new Error(`Library ${e} does not exist on ${p} \u2014 create it there first.`);if(!h.EfxFunction?.some(A=>A.FunctionID===n))throw new Error(`${b} does not exist on ${p} \u2014 this applies changes to existing functions, it cannot create new ones.`);if(d.Frozen===!0){if(!d.Published)throw new Error(`${e} is locked/frozen on ${p}. Unfreeze it in Epicor first.`);if(await $e.window.showWarningMessage(`${e} is promoted to production on ${p}. Demote it, apply ${n}, then re-promote?`,{modal:!0},"Demote, Apply, Re-promote")!=="Demote, Apply, Re-promote"){this._post({command:"applyFnCancelled",libraryId:e,functionId:n});return}this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Demoting ${e} on ${p}\u2026`}),await B.demoteFromProduction(e),D=!0}this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Applying to ${p}\u2026`});let y=await B.validateFunctionViaWrapper(e,n,T,L,"Utilities","ApplyChangesWithDiagnostics");if(!y.saved){let A=(y.diagnostics||y.errors||[]).map(I=>typeof I=="object"&&I!==null?[I.Code,I.Message].filter(Boolean).join(": "):String(I));throw new Error(A[0]||y.outMsg||y.outResult||"Apply rejected by Epicor")}this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Verifying on ${p}\u2026`});let k=await B.getLibrary(e),u=k?.EfxFunction?.find(A=>A.FunctionID===n);if(!u)throw new Error(`Verification failed: ${b} not found on ${p} after apply.`);let m=Do.extractCode(u.Body).code,g=A=>String(A||"").replace(/\r\n/g,`
`).trimEnd();if(g(m)!==g(T))throw new Error(`Apply reported success, but ${p} code does not match ${l}.`);let v=A=>JSON.stringify((A?.EfxFunctionSignature||[]).filter(I=>I.FunctionID===n).map(I=>[I.ArgumentName,I.DataType,!!I.Response,!!I.Optional]).sort()),x=v(E)!==v(k);this._post({command:"applyFnDone",libraryId:e,functionId:n}),x?$e.window.showWarningMessage(`Applied ${b} to ${p} \u2014 but signatures still differ. Code only; edit parameters via Execute -> Edit Signatures.`):$e.window.showInformationMessage(`Verified ${b} on ${p} \u2014 code matches ${l}`)}catch(O){this._post({command:"applyFnError",libraryId:e,functionId:n,message:O.message})}finally{if(D&&B)try{this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Re-promoting ${e}\u2026`}),await B.promoteToProduction(e),this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:""})}catch(O){$e.window.showErrorMessage(`${e} on ${p} could NOT be re-promoted and is still demoted \u2014 promote it manually. (${O.message})`)}}}async _openBpmRaw({keyA:e,keyB:n,name:r,labelA:o,labelB:i}){let a=e&&this._bpmRawA&&this._bpmRawA.get(e)||"",s=n&&this._bpmRawB&&this._bpmRawB.get(n)||"",l=Pe.bodyFormat(a),c=Pe.bodyFormat(s),p=b=>b==="json"?"json":b==="xaml"?"xml":null,w=p(l)&&(p(l)===p(c)||c==="empty")?p(l):l==="empty"&&p(c)?p(c):"txt";await this._openNativeDiff({diffId:"raw::"+(e||n),fileName:String(r||"directive").replace(/[^a-zA-Z0-9._-]/g,"_")+"."+w,labelA:o,labelB:i,contentA:Pe.prettyBody(a),contentB:Pe.prettyBody(s)})}async _openNativeDiff({diffId:e,fileName:n,labelA:r,labelB:o,contentA:i,contentB:a}){let s=require("os"),l=require("path"),c=require("fs"),p=require("crypto"),w=i||"",b=a||"",S=(n||"diff").replace(/[^a-zA-Z0-9._-]/g,"_"),D=p.createHash("sha1").update(`${e||""}::${n||""}`).digest("hex").slice(0,12),B=(C,T)=>{let L=String(C||"").replace(/[^a-zA-Z0-9._-]/g,"_")||T,h=l.join(s.tmpdir(),"efx-compare",D,L);return c.mkdirSync(h,{recursive:!0}),h},O=l.join(B(r,"A"),S),$=l.join(B(o,"B"),S);c.writeFileSync(O,w,"utf8"),c.writeFileSync($,b,"utf8");let E=`${n}: ${r||"A"} vs ${o||"B"}`;await $e.commands.executeCommand("vscode.diff",$e.Uri.file(O),$e.Uri.file($),E)}getHtml(){return`<!DOCTYPE html>
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
${Td}
</script>
</body>
</html>`}};qn.KEY="efxCompare";qn.panels=new Map;kr.ComparePanel=qn;kr.compareFunctionsData=Qa;kr.compareBpmData=Za});var ko=re((ff,os)=>{"use strict";var De=require("vscode"),{bodyCodeText:Pd}=kt(),un=null,es=300,ts=200;function Rd(){un=null}function Ao(t){return`${t.config.serverUrl}|${t.config.company}`}function Ud(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}async function qd(t){let e=await t.getLibraryList(),n=[...new Set(e.map(a=>a.LibraryID))].sort();if(!n.length)return{key:Ao(t),loadedAt:Date.now(),fns:[],libCount:0};let r=await t.request(t.getDesignerUrl("GetLibraries"),{libraryIds:n});if(!r||typeof r!="object")throw new Error(`Unexpected GetLibraries response \u2014 expected JSON, got ${typeof r}.`);let o=r.returnObj||r,i=[];for(let a of o.EfxFunction||[]){let s=Pd(a.Body);s&&i.push({libraryId:a.LibraryID,functionId:a.FunctionID,description:a.Description||"",lines:String(s||"").replace(/\r\n/g,`
`).replace(/\r/g,`
`).split(`
`)})}return i.sort((a,s)=>a.libraryId.localeCompare(s.libraryId)||a.functionId.localeCompare(s.functionId)),{key:Ao(t),loadedAt:Date.now(),fns:i,libCount:n.length}}async function So(t,e){let n=Ao(t);return!e&&un&&un.key===n||(un=await De.window.withProgress({location:De.ProgressLocation.Notification,title:"EFx: Indexing function library\u2026"},()=>qd(t))),un}function jd(t,e){let n=e.regex?t:Ud(t);return e.word&&(n=`\\b${n}\\b`),new RegExp(n,e.caseSensitive?"g":"gi")}function ns(t,e){t.lastIndex=0;let n=t.exec(e);return n&&n[0].length>0?n:null}function Hd(t,e,n){let r=t.length-t.replace(/^\s+/,"").length,o=t.slice(r),i=e-r;if(o.length>ts){let a=Math.max(0,i-30);o=(a>0?"\u2026":"")+o.slice(a,a+ts),i=i-a+(a>0?1:0)}return{text:o,start:i,end:i+n}}function rs(t,e,n,r){let o=jd(e,n),i=[],a=0;for(let s of t.fns)if(!(r&&s.libraryId!==r)){ns(o,s.functionId)&&(a++,i.length<es&&i.push({fn:s,line:0,col:0,len:0,kind:"name"}));for(let l=0;l<s.lines.length;l++){let c=ns(o,s.lines[l]);c&&(a++,i.length<es&&i.push({fn:s,line:l+1,col:c.index,len:c[0].length,kind:"code"}))}}return{hits:i,total:a}}function Wd(t,e){let n=t.hits.map(r=>r.kind==="name"?{label:`$(symbol-function) ${r.fn.functionId}`,description:`${r.fn.libraryId} \u2014 function name`,detail:r.fn.description||void 0,alwaysShow:!0,hit:r}:{label:Hd(r.fn.lines[r.line-1],r.col,r.len).text||"(blank line)",description:`${r.fn.libraryId}.${r.fn.functionId}:${r.line}`,alwaysShow:!0,hit:r});return t.total>t.hits.length&&n.push({label:`$(ellipsis) ${t.total-t.hits.length} more matches not shown`,description:`narrow the search \u2014 showing the first ${t.hits.length} of ${t.total}`,alwaysShow:!0}),n.length||n.push({label:"$(search-stop) No matches",description:`searched ${e.fns.length} functions`,alwaysShow:!0}),n}function Vd(t){let e=Math.min(t.lineCount,12);for(let n=0;n<e;n++){let r=t.lineAt(n).text;if(/^\/\/\s*(-{10,}|─{10,})/.test(r))return n+2;if(!r.startsWith("//")&&r.trim()!=="")break}return 0}function zd(t,e){if(e.kind!=="code")return 0;let n=e.fn.lines[e.line-1],r=Vd(t)+e.line-1;if(r<t.lineCount&&t.lineAt(r).text===n)return r;for(let o=0;o<t.lineCount;o++)if(t.lineAt(o).text===n)return o;return Math.min(Math.max(r,0),Math.max(t.lineCount-1,0))}async function Kd(t){let{libraryId:e,functionId:n}=t.fn;await De.commands.executeCommand("efx.pullFunction",{libraryId:e,func:{FunctionID:n},signatures:[]});let r=De.window.activeTextEditor;if(!r||!r.document.fileName.endsWith(`${n}.cs`))return;let o=zd(r.document,t),i=r.document.lineAt(o).text.length,a=t.kind==="code"?Math.min(t.col,i):0,s=t.kind==="code"?Math.min(t.col+t.len,i):0,l=new De.Range(o,a,o,s);r.selection=new De.Selection(l.start,l.end),r.revealRange(l,De.TextEditorRevealType.InCenter)}var gt={case:{iconPath:new De.ThemeIcon("case-sensitive"),tooltip:"Toggle Match Case"},word:{iconPath:new De.ThemeIcon("whole-word"),tooltip:"Toggle Match Whole Word"},regex:{iconPath:new De.ThemeIcon("regex"),tooltip:"Toggle Use Regular Expression"},reload:{iconPath:new De.ThemeIcon("refresh"),tooltip:"Re-index the function library"}};function Gd(t){let e=Math.round((Date.now()-t)/1e3);if(e<60)return"just now";let n=Math.round(e/60);return n<60?`${n}m ago`:`${Math.round(n/60)}h ago`}async function Yd(t,e={}){if(!t){De.window.showWarningMessage("EFx: Configure connection first (gear icon)");return}let n;try{n=await So(t,!1)}catch(b){De.window.showErrorMessage(`EFx Find: could not index the library: ${b.message}`);return}let r=e.libraryId||null,o={caseSensitive:!1,word:!1,regex:!1},i=De.window.createQuickPick();i.buttons=[gt.case,gt.word,gt.regex,gt.reload],i.matchOnDescription=!1,i.matchOnDetail=!1,i.ignoreFocusOut=!1;let a=b=>o[b]?"on":"off",s=b=>{let S=r?`in ${r}`:"in all libraries";i.title=`Find in Functions \u2014 ${S}  \xB7  Aa ${a("case")}  \xB7  ab ${a("word")}  \xB7  .* ${a("regex")}${b?`  \xB7  ${b}`:""}`},l=()=>{let b=r?n.fns.filter(S=>S.libraryId===r).length:n.fns.length;i.placeholder=`Search ${b} function${b===1?"":"s"} \xB7 ${t.config.company} \xB7 indexed ${Gd(n.loadedAt)}`},c=()=>{let b=i.value;if(!b){i.items=[],s();return}try{let S=rs(n,b,o,r);i.items=Wd(S,n),s(`${S.total} match${S.total===1?"":"es"}`)}catch(S){i.items=[{label:"$(error) Invalid regular expression",description:S.message,alwaysShow:!0}],s()}};i.onDidChangeValue(c),i.onDidTriggerButton(async b=>{if(b===gt.reload){i.busy=!0;try{n=await So(t,!0)}catch(S){De.window.showErrorMessage(`EFx Find: re-index failed: ${S.message}`)}i.busy=!1,l()}else b===gt.case?o.caseSensitive=!o.caseSensitive:b===gt.word?o.word=!o.word:b===gt.regex&&(o.regex=!o.regex);c()}),i.onDidAccept(async()=>{let b=i.selectedItems[0];if(!(!b||!b.hit)){i.hide();try{await Kd(b.hit)}catch(S){De.window.showErrorMessage(`EFx Find: could not open ${b.hit.fn.functionId}: ${S.message}`)}}}),i.onDidHide(()=>i.dispose());let p=De.window.activeTextEditor?.selection,w=p&&!p.isEmpty&&p.isSingleLine?De.window.activeTextEditor.document.getText(p).trim():"";w&&(i.value=w),l(),c(),i.show()}os.exports={openFunctionSearch:Yd,clearSearchCache:Rd,getCorpus:So,search:rs}});var ds=re((mf,us)=>{"use strict";var bt=require("vscode"),at=require("fs"),Ot=require("path"),Jd=require("os"),as=/^[A-Za-z0-9-]{8,64}$/,is=/^([A-Za-z0-9-]{8,64})\.json$/,Tr=["off","read","write","risky"],Xd=600*1e3,Qd=20*1e3,ss=Ot.join(Jd.homedir(),".efx-manager"),cs=Ot.join(ss,"bridge.json"),ls="_claude",Zd="micah-bragg.epicor-efx-manager";function Ir(t){let e=t&&t.claudeAccess;return Tr.includes(e)?e:"off"}function To(t,e){return Tr.indexOf(t)>=Tr.indexOf(e)}function Io(t,e){let n=`${t}.${process.pid}.tmp`;at.writeFileSync(n,JSON.stringify(e,null,2),"utf-8"),at.renameSync(n,t)}function ep(t,e,n){let r;return Promise.race([t.finally(()=>clearTimeout(r)),new Promise((o,i)=>{r=setTimeout(()=>i(new Error(n)),e)})])}var Bo=class{constructor(e,n,r){this.context=e,this.api=n,this.ops=r,this.queue=Promise.resolve(),this.inFlight=new Set,this.watcher=null,this.watchedDir=null,this.sweepTimer=null}start(){let e=this.context;e.subscriptions.push(bt.window.registerUriHandler({handleUri:n=>this.handleUri(n)})),e.subscriptions.push(bt.workspace.onDidChangeConfiguration(n=>{n.affectsConfiguration("efx")&&this.refresh()})),e.subscriptions.push({dispose:()=>this.stopWatching()}),this.refresh()}refresh(){try{this.writeBridgeFile()}catch(e){console.error("EFx Claude bridge: bridge.json write failed",e)}this.watchActiveDir()}requestDir(e){let n=this.api.profileRootNoPrompt(e);return n?Ot.join(n,ls):null}writeBridgeFile(){let e=this.api.getActiveProfileName(),n=this.api.getProfiles().map(r=>({name:r.name,serverUrl:r.serverUrl||"",companies:r.companies||[],claudeAccess:Ir(r),root:this.api.profileRootNoPrompt(r.name)}));at.mkdirSync(ss,{recursive:!0}),Io(cs,{version:1,pid:process.pid,appName:bt.env.appName,uriScheme:bt.env.uriScheme,extensionId:Zd,activeProfile:e||null,activeCompany:this.api.getActiveCompany()||null,requestDir:e?this.requestDir(e):null,storageLocationSet:!!this.api.profileRootNoPrompt(e||"Default"),profiles:n,updatedAt:new Date().toISOString()})}stopWatching(){if(this.watcher)try{this.watcher.close()}catch{}this.sweepTimer&&clearInterval(this.sweepTimer),this.watcher=null,this.sweepTimer=null,this.watchedDir=null}watchActiveDir(){let e=this.api.getActiveProfileName(),n=e?this.requestDir(e):null;if(n!==this.watchedDir&&(this.stopWatching(),!!n)){try{at.mkdirSync(n,{recursive:!0})}catch{return}this.watchedDir=n;try{this.watcher=at.watch(n,(r,o)=>{let i=o&&String(o).match(is);i&&this.enqueue(i[1])}),this.watcher.on("error",()=>{})}catch{}this.sweepTimer=setInterval(()=>this.sweep(),2e3),this.sweep()}}sweep(){let e=this.watchedDir;if(!e)return;let n=[];try{n=at.readdirSync(e)}catch{return}for(let r of n){let o=r.match(is);o&&this.enqueue(o[1])}}handleUri(e){if(e.path!=="/request")return;let n=new URLSearchParams(e.query).get("id")||"";if(!as.test(n)){bt.window.showWarningMessage("EFx: Ignored a Claude request link with an invalid id.");return}this.watchActiveDir(),this.enqueue(n)}enqueue(e){this.inFlight.has(e)||(this.inFlight.add(e),this.queue=this.queue.then(()=>this.process(e)).catch(n=>console.error("EFx Claude bridge:",n)).finally(()=>this.inFlight.delete(e)))}async process(e){let n=this.watchedDir;if(!n)return;let r=Ot.join(n,`${e}.json`),o=Ot.join(n,`${e}.claimed-${process.pid}`);try{at.renameSync(r,o)}catch{return}let i=null,a=null;try{i=JSON.parse(at.readFileSync(o,"utf-8"))}catch(c){a=c.message}try{at.unlinkSync(o)}catch{}try{Io(Ot.join(n,`${e}.ack.json`),{id:e,pid:process.pid,at:new Date().toISOString()})}catch{}let s;try{s=a?{ok:!1,error:`Request file is not valid JSON: ${a}`}:await this.run(e,i)}catch(c){s={ok:!1,error:c.message||String(c),...c.needsDemote?{needsDemote:c.needsDemote}:{}}}let l={id:e,profile:i&&i.profile,op:i&&i.op,finishedAt:new Date().toISOString(),...s};try{Io(Ot.join(n,`${e}.result.json`),l)}catch(c){console.error("EFx Claude bridge: result write failed",c)}this.notify(l)}async run(e,n){if(!n||typeof n!="object")return{ok:!1,error:"Empty request"};if(n.id!==e)return{ok:!1,error:"Request id does not match its file name"};let r=Date.now()-Date.parse(n.createdAt||"");if(!(r>=-6e4&&r<=Xd))return{ok:!1,error:"Request is missing createdAt or is older than 10 minutes"};let o=this.ops[n.op];if(!o)return{ok:!1,error:`Unknown op "${n.op}"`};try{await ep(this.api.clientReady(),Qd,"timeout")}catch{}let i=this.api.getActiveProfileName();if(!i)return{ok:!1,error:"No active EFx profile in VS Code"};if(n.profile!==i)return{ok:!1,error:`Request is for profile "${n.profile}" but the active profile is "${i}". Claude never switches profiles implicitly \u2014 use switch_profile.`};let a=this.api.getActiveProfile(),s=Ir(a);if(!To(s,o.level)||s==="off")return{ok:!1,error:`Claude access for profile "${i}" is "${s}"; ${n.op} needs "${o.level}". Change it in VS Code: EFx: Manage Profiles \u2192 Edit Profile.`};if(o.needsClient!==!1&&!this.api.getClient())return{ok:!1,error:`Profile "${i}" is not connected (no stored password?). Open EFx: Manage Profiles in VS Code.`};let l=await o.run(n.args||{},{profile:a,level:s,id:e,levelOf:Ir,atLeast:To});return{ok:l&&typeof l.ok=="boolean"?l.ok:!0,result:l}}notify(e){let n=this.ops[e.op],r=e.result&&e.result.summary,o=`Claude: ${e.op||"request"} on ${e.profile||"?"} \u2014 ${e.ok?r||"done":r||e.error||"failed"}`;n&&n.level!=="read"?(e.ok?bt.window.showInformationMessage:bt.window.showWarningMessage)(o):bt.window.setStatusBarMessage(o,6e3)}};us.exports={ClaudeBridge:Bo,LEVELS:Tr,levelOf:Ir,atLeast:To,BRIDGE_FILE:cs,REQUEST_DIR:ls,ID_RE:as}});var hs=re((hf,ms)=>{"use strict";var yt=require("vscode"),Re=require("fs"),Ue=require("path"),{EpicorClient:Br}=Kn(),dn=Tt(),et=kt(),{directiveToCanonicalText:tp}=St(),{compareFunctionsData:np,compareBpmData:rp}=Co(),{getCorpus:op,search:ip}=ko(),Nr=500,ps=/^[A-Za-z0-9_\-. ]+$/,No=/^[^\s"\\]+$/;function qe(t,e,{optional:n=!1}={}){let r=t[e];if(r==null||r===""){if(n)return;throw new Error(`Missing argument "${e}"`)}if(typeof r!="string")throw new Error(`Argument "${e}" must be a string`);return r.trim()}function be(t,e){let n=qe(t,e);if(!No.test(n))throw new Error(`"${e}" cannot contain spaces, quotes or backslashes`);return n}function ap(){return new Date().toISOString().replace(/[:.]/g,"-")}function fs(t,e=["Thumbnail","SysRevID","SysRowID","BitFlag","RowMod"]){let n={};for(let[r,o]of Object.entries(t||{}))e.includes(r)||(n[r]=o);return n}function sp(t){let e=()=>t.getClient(),n=()=>t.getBpmClient();function r(){let u=t.profileRootNoPrompt(t.getActiveProfileName());if(!u)throw new Error("EFx storage location is not set in VS Code (EFx: Change Storage Location).");return u}let o=()=>Ue.join(r(),"Libraries"),i=new Map;function a(u,...m){i.has(u.id)||i.set(u.id,Ue.join(r(),"_backup",ap()));let g=Ue.join(i.get(u.id),...m);return Re.mkdirSync(Ue.dirname(g),{recursive:!0}),g}function s(u){let m=t.normalizeFsPath(u);return yt.workspace.textDocuments.find(g=>g.uri&&t.normalizeFsPath(g.uri.fsPath)===m)}function l(u){let m=s(u);if(!m||!m.isDirty)return!1;let g="";try{g=Re.readFileSync(u,"utf-8")}catch{return!0}let v=x=>et.normalizeCode(t.stripGeneratedHeaderInfo(x).content);return v(m.getText())!==v(g)}let c="Open in VS Code with unsaved changes that differ from the file on disk \u2014 save or revert it first (pushing would overwrite one of the two).";async function p(u){let m=await e().getLibrary(u),g=m&&m.EfxLibrary&&m.EfxLibrary[0];if(!g)throw new Error(`Library ${u} not found on server`);return{ts:m,row:g}}function w(u,m){let g=new Error(`${u.join(", ")} ${u.length>1?"are":"is"} promoted to production. `+(m.level==="risky"?"Ask the user whether to demote for this change. If yes, call again with allowDemote: true \u2014 it's demoted, changed, and re-promoted right after (callers of the library fail for those few seconds).":`Changing it means demoting, which needs Claude access "risky" on profile "${m.profile.name}" (it is "${m.level}").`));return g.needsDemote=u,g}async function b(u,m,g,v){let{ts:x,row:A}=await p(u);if(!A.Published){if(A.Frozen)throw new Error(`${u} is locked/frozen in Epicor (not promoted). Unfreeze it first.`);return{value:await v(x),demoted:!1}}if(!g||m.level!=="risky")throw w([u],m);await e().demoteFromProduction(u);let I={demoted:!0,repromoted:!1},N=null;try{let _=await p(u);I.value=await v(_.ts)}catch(_){N=_}try{await e().promoteToProduction(u),I.repromoted=!0}catch(_){I.repromoteError=`FAILED to re-promote ${u}: ${_.message} \u2014 it is still demoted, promote it manually.`}if(t.treeProvider().invalidateCache(u),N)throw N.message+=I.repromoted?` (${u} was re-promoted)`:` (${I.repromoteError})`,N;return I}function S(u,m,g){return m.demoted?{...u,ok:u.ok!==!1&&m.repromoted,demoted:[g],repromoted:m.repromoted?[g]:[],...m.repromoteError?{warning:m.repromoteError}:{},summary:`${u.summary} (demoted + ${m.repromoted?"re-promoted":"NOT re-promoted"} ${g})`}:u}function D(u,m){let g=(u.EfxFunctionSignature||[]).filter(v=>v.FunctionID===m).sort((v,x)=>(v.Order||0)-(x.Order||0)).map(v=>({name:v.ArgumentName,type:v.DataType,optional:!!v.Optional,default:v.DefaultValue||"",direction:v.Response?"out":"in"}));return{inputs:g.filter(v=>v.direction==="in"),outputs:g.filter(v=>v.direction==="out")}}function B(u){let m=et.describeBody(u.Body);return m.unparsedFlow?{kind:"unreadable widget body"}:m.kind==="flow"?m.flow.onlyCustomCode?{kind:"widget flow (single custom-code widget)",code:m.flow.codeNodes[0].code,usings:m.usings}:{kind:et.bodyKindLabel(m),flow:tp(m.xaml)||m.xaml}:{kind:"code",code:m.code,usings:m.usings}}function O(u,m){return typeof u=="object"&&u!==null?{line:u.Line!=null?u.Line+m:null,column:u.Column??null,severity:u.Severity??2,message:[u.Code,u.Message].filter(Boolean).join(": ")||String(u)}:{line:null,column:null,severity:2,message:String(u)}}function $(u,m){t.efxDiagnostics.set(yt.Uri.file(u),m.map(g=>{let v=Math.max(0,(g.line??1)-1),x=Math.max(0,(g.column??1)-1);return new yt.Diagnostic(new yt.Range(v,x,v,x+1),g.message,g.severity===1?yt.DiagnosticSeverity.Warning:yt.DiagnosticSeverity.Error)}))}function E(u,m){return{directiveId:u.DirectiveID,source:m,method:u.BpMethodCode,type:dn.directiveTypeLabel(m,u.DirectiveType),name:u.Name,enabled:!!u.IsEnabled,group:u.DirectiveGroup||"",order:u.Order,hasCode:dn.extractBpmCode(u.Body).hasCustomCode}}function C(u){let m=String(u.source||"BO").toUpperCase();if(!dn.BPM_SOURCES.includes(m))throw new Error(`source must be one of ${dn.BPM_SOURCES.join(", ")}`);return m}function T(u,m){let g=r(),v=Ue.resolve(g,u);if(!m.some(A=>v.startsWith(Ue.join(g,A)+Ue.sep)))throw new Error(`Path must be inside ${m.join(" or ")} under the profile folder`);return v}async function L(u,m){let g=t.getProfiles().find(I=>I.name===u);if(!g)throw new Error(`Profile "${u}" not found`);let v=await t.context.secrets.get(t.profileSecretKey(u,"password"));if(!v)throw new Error(`No password stored for profile "${u}"`);let x=await t.context.secrets.get(t.profileSecretKey(u,"apiKey"))||"",A=m||(g.companies||[])[0];if(!(g.companies||[]).includes(A))throw new Error(`Company "${A}" is not in profile "${u}"`);return new Br({serverUrl:g.serverUrl,company:A,username:g.username,password:v,apiKey:x})}async function h(u){return yt.window.showInputBox({prompt:u,password:!0,ignoreFocusOut:!0})}let d={};d.status={level:"read",needsClient:!1,async run(u,m){let g=m.profile;return{activeProfile:g.name,activeCompany:t.getActiveCompany(),companies:g.companies||[],serverUrl:g.serverUrl,connected:!!e(),claudeAccess:m.level,profileFolder:t.profileRootNoPrompt(g.name)}}},d.list_libraries={level:"read",async run(){let u=await e().getLibraryList();return{count:u.length,libraries:u.map(m=>fs(m))}}},d.get_library={level:"read",async run(u){let m=be(u,"library"),{ts:g,row:v}=await p(m),x=(g.EfxFunction||[]).map(A=>{let I={function:A.FunctionID,description:A.Description||"",implementation:et.bodyKindLabel(et.describeBody(A.Body)),private:!!A.Private,disabled:!!A.Disabled,invalid:!!A.Invalid,requireTransaction:!!A.RequireTransaction,singleRowMode:!!A.SingleRowMode,...D(g,A.FunctionID)};return u.includeCode&&Object.assign(I,B(A)),I});return{library:fs(v),functions:x,references:{tables:(g.EfxRefTable||[]).map(A=>({table:A.TableID,updatable:!!A.Updatable})),services:(g.EfxRefService||[]).map(A=>A.ServiceID),assemblies:(g.EfxRefAssembly||[]).map(A=>A.Assembly),libraries:(g.EfxRefLibrary||[]).map(A=>({library:A.LibraryRef,mode:A.Mode}))}}}},d.get_function={level:"read",async run(u){let m=be(u,"library"),g=be(u,"function"),{ts:v}=await p(m),x=(v.EfxFunction||[]).find(A=>A.FunctionID===g);if(!x)throw new Error(`Function ${g} not found in ${m}`);return{library:m,function:g,description:x.Description||"",...D(v,g),...B(x),localFile:Ue.join(o(),m,`${g}.cs`)}}},d.search_functions={level:"read",async run(u){let m=qe(u,"query"),g=await op(e(),!!u.refresh),v=ip(g,m,{regex:!!u.regex,caseSensitive:!!u.caseSensitive,word:!!u.word},u.library||null);return{total:v.total,shown:v.hits.length,indexedAt:new Date(g.loadedAt).toISOString(),hits:v.hits.map(x=>({library:x.fn.libraryId,function:x.fn.functionId,kind:x.kind,line:x.line,text:x.line>0?String(x.fn.lines[x.line-1]).trim().slice(0,240):x.fn.functionId}))}}},d.pull={level:"read",async run(u){let m=o(),g=u.overwrite?"overwrite":"keep",v,x,A;if(u.all){let N=await t.collectAllLibraryFiles();({files:v,skipped:x}=N),A=`all ${N.libCount} libraries`}else{let N=be(u,"library");t.treeProvider().invalidateCache(N);let _=await e().getLibrary(N);if(!_||!_.EfxLibrary||!_.EfxLibrary[0])throw new Error(`Library ${N} not found on server`);t.pulledTablesets.set(N,_);let F=t.buildLibraryFiles(N,_,new Date().toISOString());if(v=F.files,x=F.skipped,Array.isArray(u.functions)&&u.functions.length){let M=new Set(u.functions),P=new Set(v.map(R=>R.functionId));v=v.filter(R=>M.has(R.functionId));for(let R of M)P.has(R)||x.push(`${N}.${R} (not found on server)`)}A=N}let I=await t.writePulledFiles(m,v,x,g);return{folder:m,written:I.written.map(N=>({library:N.libraryId,function:N.functionId,file:Ue.join(m,N.libraryId,N.file),pushable:N.pushable})),skipped:I.skipped,summary:`pulled ${I.written.length} function(s) from ${A}${I.skipped.length?`, skipped ${I.skipped.length}`:""}`}}},d.list_bpm={level:"read",async run(u){let m=C(u),g=String(u.filter||"").toLowerCase(),v=n(),x=[];if(m==="BO"){let I=await v.getBpmServices(),N=F=>`${F.SystemCode}.${F.ServiceKind}.${F.ServiceName}`,_;if(u.service){if(_=I.filter(F=>N(F).toLowerCase()===String(u.service).toLowerCase()),!_.length)throw new Error(`Service "${u.service}" has no method directives (format: Erp.BO.SalesOrder)`)}else if(g)_=I.filter(F=>N(F).toLowerCase().includes(g)).slice(0,10);else return{source:m,services:I.map(N).sort(),note:"Pass service (e.g. Erp.BO.SalesOrder) or filter to list directives."};for(let F of _){let M=await v.getBpmMethodsByService(F.SystemCode,F.ServiceKind,F.ServiceName,"BO");x.push(...M.directives)}!u.service&&g||g&&(x=x.filter(F=>`${F.BpMethodCode} ${F.Name}`.toLowerCase().includes(g)))}else x=(await v.getBpmRowsBySource(m)).directives.filter(N=>!g||`${N.BpMethodCode} ${N.Name}`.toLowerCase().includes(g));let A=x.map(I=>E(I,m)).sort((I,N)=>I.method.localeCompare(N.method)||String(I.type).localeCompare(String(N.type))||(I.order||0)-(N.order||0));return{source:m,total:A.length,directives:A.slice(0,Nr),truncated:A.length>Nr}}},d.pull_directive={level:"read",async run(u){let m=C(u),g=qe(u,"method"),v=qe(u,"directiveId"),x=await n().getBpmMethod(m,g),A=(x&&x.BpDirective||[]).find(R=>R.DirectiveID===v);if(!A)throw new Error(`Directive ${v} not found on ${m} ${g}`);A.Source=m;let{code:I,hasCustomCode:N}=dn.extractBpmCode(A.Body);if(!N)throw new Error(`"${A.Name}" has no custom C# code \u2014 it uses widget actions only`);let _=r(),F=dn.directiveTypeLabel(m,A.DirectiveType),M=Ue.join(_,"BPM",t.bpmMethodDirName(g),`${F}_${A.Name.replace(/[^a-zA-Z0-9_\-. ]/g,"_")}.cs`);if(l(M))throw new Error(c);if(Re.existsSync(M)&&!u.overwrite&&et.normalizeCode(t.stripGeneratedHeaderInfo(Re.readFileSync(M,"utf-8")).content)!==et.normalizeCode(I))return{ok:!1,file:M,summary:"local file differs from Epicor (unpushed edits?) \u2014 pass overwrite: true to replace it"};let{filePath:P}=await t.writeDirectiveFile(A,I,_);return{file:P,relative:Ue.relative(_,P),directive:E(A,m),summary:`pulled ${F} "${A.Name}"`}}},d.compare={level:"read",async run(u,m){let g=qe(u,"profileA"),v=qe(u,"profileB");for(let F of[g,v]){let M=t.getProfiles().find(P=>P.name===F);if(!M)throw new Error(`Profile "${F}" not found`);if(!m.atLeast(m.levelOf(M),"read")||m.levelOf(M)==="off")throw new Error(`Claude access for profile "${F}" is off \u2014 compare needs at least read on both profiles.`)}let[x,A]=await Promise.all([L(g,u.companyA),L(v,u.companyB)]),I=u.kind||"functions";if(I==="bpm"){let{bpmData:F}=await rp(x,A,g,v),M=[];for(let P of F.services)for(let R of P.methods)for(let Z of R.dirs){if(Z.status==="match")continue;let j=Z.a||Z.b;M.push({source:P.source,service:`${P.systemCode}.${P.businessObject}`,method:R.methodCode,name:j.Name,type:Z.typeLabel,status:Z.status,changed:Z.fields?Object.keys(Z.fields).filter(ee=>Z.fields[ee]&&Z.fields[ee].same===!1):[]})}return{kind:I,counts:F.counts,total:F.total,warnings:F.warnings||[],differences:M.slice(0,Nr),truncated:M.length>Nr}}let N=await np(x,A,g,v),_=N.libraries.filter(F=>F.status!=="match"&&(!u.library||F.libID===u.library)).map(F=>({library:F.libID,status:F.status,libraryChanges:Object.keys(F.libDiff||{}).filter(M=>M!=="hasDiff"&&F.libDiff[M]&&F.libDiff[M].same===!1&&!F.libDiff[M].infoOnly),functions:F.fnDiffs.filter(M=>M.status!=="match").map(M=>{let P={function:M.fnID,status:M.status,changed:M.fields?Object.keys(M.fields).filter(R=>R!=="hasDiff"&&M.fields[R].same===!1):[]};return u.library&&u.includeCode&&(P.codeA=M.fa?M.fa._code:null,P.codeB=M.fb?M.fb._code:null),P})}));return{kind:"functions",profileA:g,profileB:v,counts:N.meta.counts,total:N.meta.total,differences:_}}},d.push_functions={level:"write",async run(u,m){let g=Array.isArray(u.functions)?u.functions:[];if(!g.length)throw new Error('"functions" must be a non-empty array of { library, function }');let v=[],x=[],A=new Map;for(let j of g){let ee=String(j.library||""),he=String(j.function||"");if(!No.test(ee)||!No.test(he)){v.push({ok:!1,libraryId:ee,functionId:he,message:"Invalid library/function name",errors:["Invalid library/function name"],diagnostics:[]});continue}A.has(ee)||A.set(ee,[]),A.get(ee).includes(he)||A.get(ee).push(he)}let I=(j,ee,he,Ie={})=>v.push({ok:!1,libraryId:j,functionId:ee,message:he,errors:[he],diagnostics:[],...Ie}),N=(j,ee)=>({libraryId:j,func:{FunctionID:ee}}),_=[];for(let j of A.keys())try{(await p(j)).row.Published&&_.push(j)}catch{}if(_.length&&(!u.allowDemote||m.level!=="risky"))throw w(_,m);let F=[],M=[],P=async(j,ee,he)=>{let Ie=[],Ke=[];for(let V of ee){let ue=Ue.join(o(),j,`${V}.cs`);if(!Re.existsSync(ue)){I(j,V,`Local file not found: ${ue} \u2014 pull it first`);continue}if(l(ue)){I(j,V,c);continue}let te=(he.EfxFunction||[]).find(Te=>Te.FunctionID===V);if(!te){I(j,V,`Function ${V} not found on server`);continue}let ie=et.describeBody(te.Body);if(ie.unparsedFlow){I(j,V,"Widget body this extension can't read \u2014 refusing to overwrite it");continue}ie.kind==="flow"?Re.writeFileSync(a(m,j,`${V}.body`),String(te.Body||""),"utf-8"):Re.writeFileSync(a(m,j,`${V}.cs`),Br.extractCode(te.Body).code||"","utf-8"),(ie.kind==="flow"?Ke:Ie).push({functionId:V,filePath:ue,fnRow:te})}let ye=async V=>v.push(await t.pushFunctionCommand(N(j,V.functionId)));if(Ie.length===1)await ye(Ie[0]);else if(Ie.length>1){let V=Ie.map(te=>{let ie=t.stripGeneratedHeaderInfo(Re.readFileSync(te.filePath,"utf-8"));return{...te,code:ie.content,headerOffset:ie.lineOffset,usings:Br.extractCode(te.fnRow.Body).usings}}),ue;try{ue=await e().applyFunctionsViaWrapper(j,V.map(te=>({functionId:te.functionId,code:te.code,usings:te.usings})),he)}catch(te){for(let ie of V)I(j,ie.functionId,`Batch save failed: ${te.message}`);return}if(ue.oldWrapper){x.push(`${j}: server has the old single-function Utilities wrapper \u2014 pushed one at a time.`);for(let te of V)await ye(te)}else if(ue.saved){let te=await e().getLibrary(j);for(let ie of V){let Te=(te.EfxFunction||[]).find(zn=>zn.FunctionID===ie.functionId),ct=Te?Br.extractCode(Te.Body).code:null;if(ct===null||et.normalizeCode(ct)!==et.normalizeCode(ie.code))I(j,ie.functionId,"Verification failed: wrapper reported success but server code does not match the file");else{t.efxDiagnostics.set(yt.Uri.file(ie.filePath),[]);let zn=t.pulledTablesets.get(j),Uo=zn&&(zn.EfxFunction||[]).find(_s=>_s.FunctionID===ie.functionId);Uo&&Te&&(Uo.Body=Te.Body),v.push({ok:!0,libraryId:j,functionId:ie.functionId,message:`Verified save of ${j}.${ie.functionId} (batch of ${V.length})`,errors:[],diagnostics:[]})}}t.treeProvider().invalidateCache(j),t.clearSearchCache()}else for(let te of V){let ie=ue.perFunction[te.functionId]||{errors:[],diagnostics:[]},Te=(ie.diagnostics||[]).map(ct=>O(ct,te.headerOffset));Te.length&&$(te.filePath,Te),v.push({ok:!1,libraryId:j,functionId:te.functionId,message:ie.errors&&ie.errors.length?`Compile failed \u2014 nothing in this batch of ${V.length} was saved`:`Batch of ${V.length} failed because another function in it has errors \u2014 nothing was saved`,errors:ie.errors||[],diagnostics:Te})}}for(let V of Ke)await ye(V)};for(let[j,ee]of A)try{let he=await b(j,m,!!u.allowDemote,Ie=>P(j,ee,Ie));he.demoted&&F.push(j),he.repromoted&&M.push(j),he.repromoteError&&x.push(he.repromoteError)}catch(he){for(let Ie of ee)v.some(Ke=>Ke.libraryId===j&&Ke.functionId===Ie)||I(j,Ie,he.message)}let R=v.filter(j=>j.ok).length,Z=F.filter(j=>!M.includes(j));return{ok:R===v.length&&Z.length===0,results:v,demoted:F,repromoted:M,notes:x,backupFolder:i.get(m.id)||null,summary:`pushed ${R} of ${v.length} function(s)${R<v.length?` (${v.length-R} failed)`:""}`+(F.length?`; demoted + ${Z.length?`re-promoted ${M.join(", ")||"none"}, NOT re-promoted ${Z.join(", ")}`:`re-promoted ${F.join(", ")}`}`:"")}}},d.push_directives={level:"write",async run(u,m){let g=Array.isArray(u.files)?u.files:[];if(!g.length)throw new Error('"files" must be a non-empty array of paths relative to the profile folder (as returned by pull_directive)');let v=[];for(let A of g){let I={file:A,ok:!1};try{let N=T(String(A),["BPM",Ue.join("Widgets","BPM")]);if(!Re.existsSync(N))throw new Error("File not found \u2014 pull the directive first");if(l(N))throw new Error(c);let _=await t.resolveMapping(N);if(!_||!_.isBpm)throw new Error("Not a pulled BPM directive file");let F=_.source||"BO",M=await n().getBpmMethod(F,_.bpmMethodCode),P=(M&&M.BpDirective||[]).find(R=>R.DirectiveID===_.directiveId);if(!P)throw new Error(`Directive ${_.directiveId} not found on ${_.bpmMethodCode}`);if(Re.writeFileSync(a(m,"BPM",t.bpmMethodDirName(_.bpmMethodCode),`${_.directiveId}.body.xml`),String(P.Body||""),"utf-8"),_.isWidgetCode){let R=await t.pushWidgetCodeFile(N,_);if(!R||!R.ok)throw new Error(R&&R.message||"Widget push failed")}else await t.corePushDirective(N,_);if(F==="BO"){let R=_.bpmMethodCode.split(".");R.length>=3&&t.bpmTreeProvider().invalidateService(R[0].toUpperCase(),R[1],R[2])}else t.bpmTreeProvider().invalidateSource(F);I.ok=!0,I.message=`Pushed ${P.Name} (${F} ${_.bpmMethodCode})`}catch(N){I.message=N.message}v.push(I)}let x=v.filter(A=>A.ok).length;return{ok:x===v.length,results:v,backupFolder:i.get(m.id)||null,summary:`pushed ${x} of ${v.length} directive(s)`}}},d.new_function={level:"write",async run(u,m){let g=be(u,"library"),v=be(u,"function"),x=y(u.signatures),A=await b(g,m,!!u.allowDemote,async N=>{if((N.EfxFunction||[]).some(_=>_.FunctionID===v))throw new Error(`${g}.${v} already exists`);return t.coreCreateFunction(g,v,u.description||"",x)}),I=A.value;return S({ok:I.signaturesSaved,diagnostics:I.diagnostics,signaturesSaved:I.signaturesSaved,signatureError:I.signatureError,summary:`created ${g}.${v}${I.signaturesSaved?"":" (signatures failed)"}`},A,g)}};function y(u){if(u===void 0)return[];if(!Array.isArray(u))throw new Error('"signatures" must be an array');let m=0,g=0;return u.map(v=>{if(!v||!v.name||!v.type)throw new Error("Each signature needs name and type");let x=v.direction==="out";return{ArgumentName:String(v.name),DataType:String(v.type),Response:x,Order:x?g++:m++,...v.optional!==void 0?{Optional:!!v.optional}:{},...v.default!==void 0?{DefaultValue:String(v.default)}:{}}})}d.delete_function={level:"write",async run(u,m){let g=be(u,"library"),v=be(u,"function"),x=await b(g,m,!!u.allowDemote,async A=>{let I=(A.EfxFunction||[]).find(N=>N.FunctionID===v);if(!I)throw new Error(`${g}.${v} not found`);Re.writeFileSync(a(m,g,`${v}.body`),String(I.Body||""),"utf-8"),Re.writeFileSync(a(m,g,`${v}.signatures.json`),JSON.stringify(D(A,v),null,2),"utf-8"),await t.coreDeleteFunction(g,v)});return S({backupFolder:i.get(m.id),summary:`deleted ${g}.${v}`},x,g)}},d.new_library={level:"write",async run(u){let m=be(u,"library");if((await e().getLibraryList()).some(x=>x.LibraryID===m))throw new Error(`Library ${m} already exists`);return{diagnostics:await t.coreCreateLibrary(m,u.description||""),summary:`created library ${m}`}}},d.add_reference={level:"write",async run(u,m){let g=be(u,"library"),v=qe(u,"kind"),x=be(u,"value"),A=await b(g,m,!!u.allowDemote,()=>t.coreAddReference(g,v,x,{updatable:!!u.updatable,mode:u.mode}));return S({diagnostics:A.value,summary:`added ${v} reference ${x} to ${g}`},A,g)}},d.set_table_updatable={level:"write",async run(u,m){let g=be(u,"library"),v=be(u,"table");if(typeof u.updatable!="boolean")throw new Error('"updatable" must be true or false');let x=await b(g,m,!!u.allowDemote,()=>t.coreSetTableUpdatable(g,v,u.updatable));return S({summary:`${v} in ${g} set to ${u.updatable?"updatable":"read-only"}`},x,g)}},d.save_signatures={level:"write",async run(u,m){let g=be(u,"library"),v=be(u,"function"),x=y(u.signatures||[]),A=await b(g,m,!!u.allowDemote,async N=>{if(!(N.EfxFunction||[]).some(_=>_.FunctionID===v))throw new Error(`${g}.${v} not found`);Re.writeFileSync(a(m,g,`${v}.signatures.json`),JSON.stringify(D(N,v),null,2),"utf-8"),await e().saveSignatures(g,v,x)});t.treeProvider().invalidateCache(g);let I=await e().getLibrary(g);return S({signatures:D(I,v),backupFolder:i.get(m.id),summary:`saved signatures for ${g}.${v}`},A,g)}},d.regenerate_library={level:"write",async run(u){let m=be(u,"library"),v=(await e().regenerateLibrary(m)).errors||[];return{ok:v.length===0,errors:v.length?t.formatBOUpdErrors(v).split(`

`):[],summary:v.length?`${m} has ${v.length} validation error(s)`:`${m} validated with no errors`}}},d.execute_function={level:"write",async run(u,m){let g=be(u,"library"),v=be(u,"function"),x=u.company||t.getActiveCompany();if(!(m.profile.companies||[]).includes(x))throw new Error(`Company "${x}" is not in profile "${m.profile.name}"`);let I=(await e().getLibraryList()).find(P=>P.LibraryID===g);if(!I)throw new Error(`Library ${g} not found`);let N=!I.Published,_=await e().executeFunction(g,v,u.params||{},x,N),F=_,M=JSON.stringify(_);return M&&M.length>2e5&&(F={truncated:!0,preview:M.slice(0,2e5)}),{company:x,staging:N,response:F,summary:`executed ${g}.${v} in ${x}`}}},d.switch_profile={level:"write",needsClient:!1,async run(u,m){let g=qe(u,"profile"),v=t.getProfiles().find(x=>x.name===g);if(!v)throw new Error(`Profile "${g}" not found`);if(m.levelOf(v)==="off")throw new Error(`Claude access for "${g}" is off \u2014 enable it in VS Code (EFx: Manage Profiles \u2192 Edit) first.`);if(await t.activateProfile(g),t.getActiveProfileName()!==g||!e())throw new Error(`Could not activate "${g}" (no stored password?)`);return u.company&&await t.applyActiveCompany(String(u.company)),{activeProfile:g,activeCompany:t.getActiveCompany(),claudeAccess:m.levelOf(v),summary:`switched to ${g} / ${t.getActiveCompany()}`}}},d.switch_company={level:"write",async run(u,m){let g=qe(u,"company");if(!(m.profile.companies||[]).includes(g))throw new Error(`Company "${g}" is not in profile "${m.profile.name}"`);if(await t.applyActiveCompany(g),t.getActiveCompany()!==g)throw new Error(`Could not switch to ${g}`);return{activeCompany:g,summary:`switched company to ${g}`}}};function k(u,m){if("claudeAccess"in u)throw new Error("claudeAccess can only be changed in VS Code (EFx: Manage Profiles \u2192 Edit Profile).");let g={...m};if(u.serverUrl!==void 0){if(!/^https?:\/\/\S+$/.test(String(u.serverUrl)))throw new Error("serverUrl must start with http:// or https://");g.serverUrl=String(u.serverUrl).replace(/\/+$/,"")}if(u.username!==void 0&&(g.username=String(u.username)),u.companies!==void 0){if(!Array.isArray(u.companies)||!u.companies.length)throw new Error("companies must be a non-empty array");g.companies=u.companies.map(String)}return u.autoPush!==void 0&&(g.autoPush=!!u.autoPush),u.autoClean!==void 0&&(g.autoClean=!!u.autoClean),g}return d.create_profile={level:"write",needsClient:!1,async run(u){let m=qe(u,"name");if(!ps.test(m))throw new Error("Profile name: letters, numbers, space, dash, dot, underscore");let g=t.getProfiles();if(g.some(I=>I.name===m))throw new Error(`Profile "${m}" already exists`);let v=k(u,{name:m,serverUrl:"",username:"",companies:[],autoPush:!1,autoClean:!1,claudeAccess:"off"});if(!v.serverUrl||!v.username||!v.companies.length)throw new Error("serverUrl, username and companies are required");let x=await h(`Claude is creating EFx profile "${m}" (${v.serverUrl}, user ${v.username}). Enter the Epicor password \u2014 it goes to VS Code SecretStorage, never to Claude.`);if(!x)return{ok:!1,summary:"cancelled \u2014 no password entered, profile not created"};let A=await h(`API key for "${m}" (leave blank for none)`);return await t.context.secrets.store(t.profileSecretKey(m,"password"),x),await t.context.secrets.store(t.profileSecretKey(m,"apiKey"),A||""),g.push(v),await t.setProfiles(g),{profile:{...v},summary:`created profile ${m} (Claude access off until you enable it in VS Code)`}}},d.update_profile={level:"write",needsClient:!1,async run(u){let m=qe(u,"name"),g=t.getProfiles(),v=g.findIndex(F=>F.name===m);if(v<0)throw new Error(`Profile "${m}" not found`);let x=k(u,g[v]),A=u.newName!==void 0?String(u.newName).trim():m;if(A!==m){if(!ps.test(A))throw new Error("newName: letters, numbers, space, dash, dot, underscore");if(g.some(F=>F.name===A))throw new Error(`Profile "${A}" already exists`);for(let F of["password","apiKey"]){let M=await t.context.secrets.get(t.profileSecretKey(m,F));M&&await t.context.secrets.store(t.profileSecretKey(A,F),M),await t.context.secrets.delete(t.profileSecretKey(m,F))}x.name=A}let I=t.getActiveProfileName()===m;g[v]=x,await t.setProfiles(g),I&&(A!==m&&await t.setActiveProfileName(A),await t.activateProfile(A));let{claudeAccess:N,..._}=x;return{profile:_,summary:`updated profile ${A}`}}},d.delete_profile={level:"write",needsClient:!1,async run(u){let m=qe(u,"name");if(t.getActiveProfileName()===m)throw new Error("Can't delete the active profile \u2014 switch_profile to another one first.");let g=t.getProfiles();if(!g.some(v=>v.name===m))throw new Error(`Profile "${m}" not found`);return await t.setProfiles(g.filter(v=>v.name!==m)),await t.context.secrets.delete(t.profileSecretKey(m,"password")),await t.context.secrets.delete(t.profileSecretKey(m,"apiKey")),{summary:`deleted profile ${m}`}}},d.set_profile_secret={level:"write",needsClient:!1,async run(u){let m=qe(u,"name"),g=u.kind==="apiKey"?"apiKey":"password";if(!t.getProfiles().some(x=>x.name===m))throw new Error(`Profile "${m}" not found`);let v=await h(`Claude asked to set the ${g==="apiKey"?"API key":"password"} for EFx profile "${m}". Type it here \u2014 it never goes to Claude.`);return v===void 0||g==="password"&&!v?{ok:!1,summary:"cancelled \u2014 nothing changed"}:(await t.context.secrets.store(t.profileSecretKey(m,g),v),t.getActiveProfileName()===m&&await t.activateProfile(m),{summary:`${g} updated for ${m}`})}},d.promote_library={level:"risky",async run(u){let m=be(u,"library");return await e().promoteToProduction(m),await t.treeProvider().refresh(),{summary:`promoted ${m}`}}},d.demote_library={level:"risky",async run(u){let m=be(u,"library");return await e().demoteFromProduction(m),await t.treeProvider().refresh(),{summary:`demoted ${m}`}}},d}ms.exports={buildOps:sp}});var cp=exports&&exports.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),lp=exports&&exports.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),Mo=exports&&exports.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&cp(n,e,r[o]);return lp(n,e),n}})();Object.defineProperty(exports,"__esModule",{value:!0});exports.activate=Sp;exports.deactivate=Up;var f=Mo(require("vscode")),se=Mo(require("path")),ge=Mo(require("fs")),vt=Kn(),up=oa(),dp=ia(),xe=Tt(),$o=fa(),{openBpmWidgetPanel:pp,createBpmHost:fp,typeLabelOf:mp}=va(),{openEfxWidgetPanel:gs,createEfxHost:ks}=xa(),{pushNodeCode:Is}=br(),st=kt(),bs=Ta(),hp=go(),{ComparePanel:gp}=Co(),{openFunctionSearch:ys,clearSearchCache:Hn}=ko(),{ClaudeBridge:bp}=ds(),yp=hs(),fn=new Map,Se=new Map,Fo=new Set,q=null,oe=null,Ts=null,Y,tt,_r=null,Mr=null,Lo=null;function ce(t){return String(t||"").toLowerCase()}function _o(t){return JSON.stringify(String(t))}function Mt(t,e,n,r){let o=0,i=!1,a=!1;for(let s=e;s<t.length;s++){let l=t[s];if(i){a?a=!1:l==="\\"?a=!0:l==='"'&&(i=!1);continue}if(l==='"'){i=!0;continue}if(l===n)o++;else if(l===r&&(o--,o===0))return s}return-1}function vp(t,e,n){let o=t.indexOf('"EfxFunction"');if(o<0)throw new Error("EfxFunction array not found in raw tableset");let i=t.indexOf("[",o);if(i<0)throw new Error("EfxFunction array start not found in raw tableset");let a=Mt(t,i,"[","]");if(a<0)throw new Error("EfxFunction array end not found in raw tableset");let s='"LibraryID":'+_o(e),l='"FunctionID":'+_o(n),c=i+1;for(;c<a;){let p=t.indexOf("{",c);if(p<0||p>a)break;let w=Mt(t,p,"{","}");if(w<0||w>a)throw new Error("Malformed EfxFunction row object in raw tableset");let b=t.slice(p,w+1);if(b.includes(s)&&b.includes(l))return{start:p,end:w+1,row:b};c=w+1}throw new Error(`EfxFunction row not found in raw tableset for ${e}.${n}`)}function Po(t,e,n){let r='"'+e+'":',o=t.indexOf(r);if(o<0)throw new Error(`${e} property not found in target EfxFunction row`);let i=o+r.length;for(;/\s/.test(t[i]||"");)i++;if(t[i]!=='"')throw new Error(`${e} is not a JSON string in target EfxFunction row`);let a=i+1,s=!1;for(;a<t.length;a++){let l=t[a];if(s){s=!1;continue}if(l==="\\"){s=!0;continue}if(l==='"')break}if(a>=t.length)throw new Error(`${e} string did not terminate in target EfxFunction row`);return t.slice(0,i)+n+t.slice(a+1)}function wp(t,e,n){let r=vp(t,e,n),o=Po(r.row,"RowMod",JSON.stringify("D"));if(o===r.row)throw new Error(`Target EfxFunction row did not change for ${e}.${n}`);let i=t.slice(0,r.start)+o+t.slice(r.end);return JSON.parse(i),i}function Bs(t,e,n){let r=`"${e}":[`,o=t.indexOf(r);if(o===-1)throw new Error(`Array "${e}" not found in raw tableset`);let i=t.indexOf("[",o),a=Mt(t,i,"[","]");if(a<0)throw new Error(`Could not find end of "${e}" array`);let l=t.substring(i+1,a).trim().length>0?",":"";return t.substring(0,a)+l+n+t.substring(a)}function Ep(t,e){let r=t.indexOf('"EfxRefTable"');if(r<0)throw new Error("EfxRefTable array not found in raw tableset");let o=t.indexOf("[",r);if(o<0)throw new Error("EfxRefTable array start not found in raw tableset");let i=Mt(t,o,"[","]");if(i<0)throw new Error("EfxRefTable array end not found in raw tableset");let a='"TableID":'+_o(e),s=o+1;for(;s<i;){let l=t.indexOf("{",s);if(l<0||l>i)break;let c=Mt(t,l,"{","}");if(c<0||c>i)throw new Error("Malformed EfxRefTable row object in raw tableset");let p=t.slice(l,c+1);if(p.includes(a))return{start:l,end:c+1,row:p};s=c+1}throw new Error(`EfxRefTable row not found in raw tableset for ${e}`)}function Dp(t,e){let n=t.indexOf('"EfxLibrary":[');if(n<0)throw new Error("EfxLibrary array not found in raw tableset");let r=t.indexOf("[",n),o=t.indexOf("{",r);if(o<0)throw new Error("No EfxLibrary row found in raw tableset");let i=Mt(t,o,"{","}"),a=t.slice(o,i+1),s=Po(a,"RowMod",JSON.stringify(e));return t.slice(0,o)+s+t.slice(i+1)}function xp(t,e,n){let r='"'+e+'":',o=t.indexOf(r);if(o<0)throw new Error(`${e} not found in object`);let i=o+r.length;for(;/\s/.test(t[i]||"");)i++;let a=t.startsWith("true",i),s=t.startsWith("false",i);if(!a&&!s)throw new Error(`${e} is not a boolean in object`);let l=i+(a?4:5);return t.slice(0,i)+String(n)+t.slice(l)}function Cp(t,e,n){let r=Ep(t,e),o=xp(r.row,"Updatable",n);o=Po(o,"RowMod",JSON.stringify("U"));let i=t.slice(0,r.start)+o+t.slice(r.end);return i=Dp(i,"U"),JSON.parse(i),i}function Ns(t){return(t||[]).some(e=>typeof e=="object"?(e.Severity??2)>=2:/\berror\b/i.test(String(e)))}function Wn(t){return(t||[]).map(e=>typeof e=="object"?e.ErrorText||e.Message||JSON.stringify(e):String(e))}async function vs(t,e,n,r=[]){let o=await q.getLibraryRaw(t),i=JSON.stringify({Code:`// New function\r
`,Usings:""}),a=JSON.stringify({LibraryID:t,FunctionID:e,Description:n||null,Kind:2,RequireTransaction:!1,SingleRowMode:!1,Private:!1,Disabled:!1,Invalid:!1,Thumbnail:null,Body:i,Notes:null,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",BitFlag:0,RowMod:"A"});o=Bs(o,"EfxFunction",a);let s=await q.applyChangesRaw(o),l=Wn(s.diagnostics),c=r.length===0,p=null;if(r.length>0)for(let w=0;w<4&&!c;w++){w>0&&await new Promise(b=>setTimeout(b,800*w));try{await q.saveSignatures(t,e,r),c=!0}catch(b){p=b.message}}return Y.invalidateCache(t),await Y.refresh(),{diagnostics:l,signaturesSaved:c,signatureError:p}}async function ws(t,e){let n=await q.getLibrary(t),r=n&&n.EfxLibrary&&n.EfxLibrary[0];if(!r)throw new Error(`Library ${t} not found on server`);if(r.Frozen===!0)throw new Error(r.Published?`${t} is promoted to production \u2014 demote it first (right-click the library \u2192 Demote from Production).`:`${t} is locked/frozen in Epicor. Unfreeze it before deleting functions.`);let o=await q.getLibraryRaw(t),i=wp(o,t,e),a=await q.applyChangesRaw(i);if(Ns(a.diagnostics))throw new Error(`Server rejected delete:
${Wn(a.diagnostics).join(`
`)}`);fn.delete(t);for(let[s,l]of Se.entries())l&&l.libraryId===t&&l.functionId===e&&Se.delete(s);Y.invalidateCache(t),await Y.refresh()}async function Es(t,e){if(!/^[^\s"\\]+$/.test(String(t||"")))throw new Error("Library ID cannot be empty or contain spaces, quotes or backslashes");let n=await q.getDefaultsRaw();n=n.replace(/"LibraryID":"@library"/g,`"LibraryID":"${t}"`),n=n.replace(/"OriginalID":"@library"/,`"OriginalID":"${t}"`),n=n.replace(/"FunctionID":"@function"/,'"FunctionID":"__placeholder__"'),e&&(n=n.replace(/"Description":null/,()=>`"Description":${JSON.stringify(String(e))}`)),n=n.replace(/("OriginalID":"[^"]*"[^}]*"RowMod":")(")/,"$1A$2"),n=n.replace('"AllowCustomCodeFunctions":false','"AllowCustomCodeFunctions":true'),n=n.replace('"DirectDBAccess":0','"DirectDBAccess":2');let r=n.indexOf('"EfxFunction":[');if(r!==-1){let i=n.indexOf("[",r),a=Mt(n,i,"[","]");a>i&&(n=n.substring(0,i)+"[]"+n.substring(a+1))}let o=await q.applyChangesRaw(n);return await Y.refresh(),Wn(o.diagnostics)}async function jn(t,e,n,r={}){let o={LibraryID:t},i,a;if(e==="table"){if(!String(n).includes("."))throw new Error("Table ID format must be NAMESPACE.TableName (e.g. ERP.Part)");i="EfxRefTable",a={...o,TableID:n,Updatable:!!r.updatable}}else if(e==="service"){if(String(n).split(":").length<3)throw new Error("Service ID format must be NAMESPACE:TYPE:Name (e.g. ERP:BO:Part)");i="EfxRefService",a={...o,ServiceID:n}}else if(e==="assembly"){if(!String(n).toLowerCase().endsWith(".dll"))throw new Error("Assembly must end in .dll");i="EfxRefAssembly",a={...o,Assembly:n}}else if(e==="library")i="EfxRefLibrary",a={...o,LibraryRef:n,Mode:Number.isInteger(r.mode)?r.mode:0};else throw new Error(`Unknown reference kind "${e}"`);let s=await q.getLibraryRaw(t),l=JSON.stringify({...a,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",RowMod:"A"});s=Bs(s,i,l);let c=await q.applyChangesRaw(s);return Y.invalidateCache(t),Y._onDidChangeTreeData.fire(void 0),Wn(c.diagnostics)}async function Ds(t,e,n){let r=await q.getLibraryRaw(t),o=Cp(r,e,n),i=await q.applyChangesRaw(o);if(Ns(i.diagnostics))throw new Error(`Server rejected update:
${Wn(i.diagnostics).join(`
`)}`);Y.invalidateCache(t),Y._onDidChangeTreeData.fire(void 0)}async function xs(t){let e=ce(t),n=f.workspace.textDocuments.find(r=>r.uri&&ce(r.uri.fsPath)===e);if(n&&n.isDirty){Fo.add(e);try{if(!await n.save())throw new Error(`Could not save ${t}`)}finally{Fo.delete(e)}}}function Cs(t){return t===1?f.DiagnosticSeverity.Warning:t===0?f.DiagnosticSeverity.Hint:f.DiagnosticSeverity.Error}function Ap(t){return mn(t).content}function mn(t){let e=t.split(/\r?\n/);if(!/^\/\/ (EFx Function|BPM Directive):/.test(e[0]||""))return{content:t,lineOffset:0};let n=p=>p.startsWith("// \u2500\u2500\u2500\u2500\u2500")||p.startsWith("// -----"),r=-1;for(let p=0;p<e.length;p++){if(n(e[p])){r=p;break}if(!e[p].startsWith("//")&&e[p].trim()!=="")break}if(r<0)return{content:t,lineOffset:0};let o=e[r],i=o.indexOf("// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),a=o.indexOf("// --------------------------------------------------"),s="";i>=0?s=o.slice(i+40).trimStart():a>=0&&(s=o.slice(a+53).trimStart());let l=e.slice(r+1);if(s)return{content:[s,...l].join(`
`),lineOffset:r};let c=0;for(;c<l.length&&l[c].trim()==="";)c++;return l=l.slice(c),{content:l.join(`
`),lineOffset:r+1+c}}function pn(t){return st.normalizeCode(t)}function As(t){return!t||t.length===0?"":t.map((e,n)=>{let r=e.ErrorLevel!==void 0?`Level ${e.ErrorLevel}`:"Error",o=e.ErrorType?` (${e.ErrorType})`:"",i=e.TableName?`
Table: ${e.TableName}`:"",a=e.ErrorText||e.Message||JSON.stringify(e);return`${n+1}. ${r}${o}${i}
${a}`}).join(`

`)}function Sp(t){Ts=t,Y=new up.EfxTreeProvider(null),_r=f.window.createTreeView("efxLibraries",{treeDataProvider:Y}),t.subscriptions.push(_r),tt=new $o.BpmTreeProvider(null),Mr=f.window.createTreeView("bpmMethods",{treeDataProvider:tt}),t.subscriptions.push(Mr),Lo=new dp.ExecuteViewProvider,t.subscriptions.push(f.window.registerWebviewViewProvider("efxExecuteView",Lo,{webviewOptions:{retainContextWhenHidden:!0}}));let e=Rp(t).catch(h=>console.error("EFx: initClient failed",h));e.then(()=>qr()),bs.registerUpdateCommand(t),bs.checkForUpdatesOnStartup(t);let n=async()=>{await $s(t)};t.subscriptions.push(f.commands.registerCommand("efx.manageProfiles",n)),t.subscriptions.push(f.commands.registerCommand("efx.configureConnection",n)),t.subscriptions.push(f.commands.registerCommand("efx.switchProfile",async()=>{await Op(t)})),t.subscriptions.push(f.commands.registerCommand("efx.switchCompany",async()=>{await Fp(t)})),t.subscriptions.push(f.commands.registerCommand("efx.changeStorageLocation",async()=>{await f.workspace.getConfiguration("efx").update("storageLocation","",f.ConfigurationTarget.Global);let h=await Fs();h&&f.window.showInformationMessage(`EFx: Storage location changed to ${h}`)})),t.subscriptions.push(f.commands.registerCommand("efx.refreshLibraries",async()=>{if(!q){f.window.showWarningMessage("EFx: Configure connection first");return}Hn(),await Y.refresh()})),t.subscriptions.push(f.commands.registerCommand("efx.pullFunction",async h=>{if(!q||!h)return;let d=h.libraryId,y=h.func.FunctionID;await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Pulling ${y}...`},async()=>{try{Y.invalidateCache(d);let k=await Y.getLibraryTableset(d);if(!k)return;fn.set(d,k);let u=k.EfxFunction.find(M=>M.FunctionID===y);if(!u){f.window.showErrorMessage(`Function ${y} not found`);return}let m=st.describeBody(u.Body);if(m.unparsedFlow){f.window.showErrorMessage(`EFx: ${y} has a widget body this extension can't read. Run "EFx: DEV: Dump Function Bodies" for ${d} and share the output \u2014 pulling it as C# would corrupt the function.`);return}if(m.kind==="flow"&&!m.flow.onlyCustomCode){await gs(t,q,d,y,u.Body);return}let g=m.kind==="flow"?m.flow.codeNodes[0].id:null,v=g?m.flow.codeNodes[0].code:m.code,x=m.usings,A=await $r();if(!A){f.window.showWarningMessage("EFx: Storage location not set \u2014 pull cancelled.");return}let I=se.join(A,d);ge.mkdirSync(I,{recursive:!0});let N=se.join(I,`${y}.cs`),_=[`// EFx Function: ${d}.${y}`,`// Pulled: ${new Date().toISOString()}`,x?`// Usings: ${x}`:"",g?`// Widget: ${g}`:"","// --------------------------------------------------",""].filter(M=>M!=="").join(`
`);ge.writeFileSync(N,_.replace(/\s*$/,"")+`

`+v,"utf-8"),Se.set(ce(N),{libraryId:d,functionId:y,widgetNodeId:g});let F=await f.workspace.openTextDocument(N);await f.window.showTextDocument(F,f.ViewColumn.One),f.window.showInformationMessage(`EFx: Pulled ${d}.${y}`)}catch(k){f.window.showErrorMessage(`EFx Pull failed: ${k.message}`)}})}));let r="// --------------------------------------------------";function o(h,d,y){let{directiveToCanonicalText:k}=St(),u=[],m=[];for(let g of d&&d.EfxFunction||[]){if(g.LibraryID&&g.LibraryID!==h)continue;let v=g.FunctionID,x=st.describeBody(g.Body);if(x.unparsedFlow){m.push(`${h}.${v} (widget body this extension can't read)`);continue}if(x.kind==="flow"&&!x.flow.onlyCustomCode){let F=[`// EFx Function: ${h}.${v}`,`// Pulled: ${y}`,"// Widget flow \u2014 read-only view; edit in the widget panel",r,""].join(`
`);u.push({libraryId:h,functionId:v,file:`${v}.widgets.txt`,pushable:!1,content:F+`
`+(k(x.xaml)||x.xaml)});continue}let A=x.kind==="flow"?x.flow.codeNodes[0].id:null,I=A?x.flow.codeNodes[0].code:x.code,N=x.usings,_=[`// EFx Function: ${h}.${v}`,`// Pulled: ${y}`,N?`// Usings: ${N}`:"",A?`// Widget: ${A}`:"",r,""].filter(F=>F!=="").join(`
`);u.push({libraryId:h,functionId:v,file:`${v}.cs`,pushable:!0,widgetNodeId:A,content:_.replace(/\s*$/,"")+`

`+I})}return{files:u,skipped:m}}async function i(h,d,y,k="ask"){let u=A=>{let I=String(A).replace(/\r\n/g,`
`),N=I.indexOf(r);return(N>=0?I.slice(I.indexOf(`
`,N)+1):I).trim()},m=A=>se.join(h,A.libraryId,A.file),g=new Set(f.workspace.textDocuments.filter(A=>A.isDirty).map(A=>ce(A.uri.fsPath))),v=d.filter(A=>g.has(ce(m(A))));for(let A of v)y.push(`${A.libraryId}.${A.functionId} (open with unsaved changes)`);d=d.filter(A=>!v.includes(A));let x=d.filter(A=>{let I=m(A);if(!ge.existsSync(I))return!1;try{return u(ge.readFileSync(I,"utf-8"))!==u(A.content)}catch{return!1}});if(x.length){let A=x.map(_=>`${_.libraryId}.${_.functionId}`),I=A.slice(0,15).join(", ")+(A.length>15?`, +${A.length-15} more`:""),N=k==="overwrite"?"Overwrite":k==="keep"?"Keep Local Copies":await f.window.showWarningMessage(`${x.length} local file(s) differ from Epicor (unpushed edits?): ${I}`,{modal:!0},"Overwrite","Keep Local Copies");if(!N)return null;if(N==="Keep Local Copies"){d=d.filter(_=>!x.includes(_));for(let _ of x)y.push(`${_.libraryId}.${_.functionId} (kept local copy)`)}}for(let A of d){let I=m(A);ge.mkdirSync(se.dirname(I),{recursive:!0}),ge.writeFileSync(I,A.content,"utf-8"),A.pushable&&Se.set(ce(I),{libraryId:A.libraryId,functionId:A.functionId,widgetNodeId:A.widgetNodeId})}return{written:d,skipped:y}}async function a(h,d,y){let{written:k,skipped:u}=d,m=new Set(k.map(x=>x.libraryId)).size,g=`EFx: Pulled ${k.length} function(s) from ${h}${m>1?` (${m} libraries)`:""}`+(u.length?` \u2014 skipped ${u.length}: ${u.slice(0,10).join("; ")}${u.length>10?"; ...":""}`:""),v=await(u.length?f.window.showWarningMessage:f.window.showInformationMessage)(g,"Reveal in Finder","Copy Path");v==="Reveal in Finder"?await f.commands.executeCommand("revealFileInOS",f.Uri.file(y)):v==="Copy Path"&&await f.env.clipboard.writeText(y)}async function s(h=()=>{},d=()=>!1){let y=[],k=[],u=Y.libraries&&Y.libraries.length?Y.libraries:await q.getLibraryList(),m=[...new Set(u.map(x=>x.LibraryID))].sort(),g=new Date().toISOString(),v=20;for(let x=0;x<m.length;x+=v){if(d())return{files:y,skipped:k,libCount:m.length,cancelled:!0};let A=m.slice(x,x+v);h(`${Math.min(x+v,m.length)} / ${m.length} libraries`,A.length/m.length*100);let I=null;try{let N=await q.request(q.getDesignerUrl("GetLibraries"),{libraryIds:A}),_=N&&typeof N=="object"?N.returnObj||N:null;if(_&&Array.isArray(_.EfxFunction)){I=new Map(A.map(F=>[F,{EfxFunction:[]}]));for(let F of _.EfxFunction)I.has(F.LibraryID)&&I.get(F.LibraryID).EfxFunction.push(F)}}catch{}for(let N of A){let _=I?I.get(N):null;if(!_)try{_=await q.getLibrary(N)}catch(M){k.push(`${N} (could not load: ${M.message})`);continue}let F=o(N,_,g);y.push(...F.files),k.push(...F.skipped)}}return{files:y,skipped:k,libCount:m.length,cancelled:!1}}t.subscriptions.push(f.commands.registerCommand("efx.pullLibrary",async h=>{if(!q||!h?.library)return;let d=h.library.LibraryID,y=await $r();if(!y){f.window.showWarningMessage("EFx: Storage location not set \u2014 pull cancelled.");return}let k;try{k=await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Pulling ${d}...`},async()=>{Y.invalidateCache(d);let m=await Y.getLibraryTableset(d);if(!m)throw new Error(`Library ${d} not found`);return fn.set(d,m),o(d,m,new Date().toISOString())})}catch(m){f.window.showErrorMessage(`EFx Pull failed: ${m.message}`);return}let u=await i(y,k.files,k.skipped);u&&await a(d,u,se.join(y,d))})),t.subscriptions.push(f.commands.registerCommand("efx.pullAllLibraries",async()=>{if(!q){f.window.showWarningMessage("EFx: Configure connection first");return}let h=await $r();if(!h){f.window.showWarningMessage("EFx: Storage location not set \u2014 pull cancelled.");return}let d=[],y=[],k=0;try{if(!await f.window.withProgress({location:f.ProgressLocation.Notification,title:"Pulling all libraries",cancellable:!0},async(g,v)=>{let x=await s((A,I)=>g.report({message:A,increment:I}),()=>v.isCancellationRequested);return{files:d,skipped:y,libCount:k}=x,!x.cancelled})){f.window.showInformationMessage("EFx: Pull all cancelled \u2014 nothing written.");return}}catch(m){f.window.showErrorMessage(`EFx Pull failed: ${m.message}`);return}let u=await i(h,d,y);u&&await a(`all ${k} libraries`,u,h)})),t.subscriptions.push(f.commands.registerCommand("efx.pushFunction",async(h,d=!1)=>{let y=h?.libraryId,k=h?.func?.FunctionID,u,m=[],g=[],v=(x,A)=>({ok:x,libraryId:y,functionId:k,message:A,errors:x?[]:m.length?m:[A],diagnostics:g});if(!q)return v(!1,"EFx: Not connected");if(h){let x=await $r();if(!x)return f.window.showWarningMessage("EFx: Storage location not set \u2014 push cancelled."),v(!1,"EFx: Storage location not set \u2014 push cancelled.");u=se.join(x,y,`${k}.cs`)}else{let x=f.window.activeTextEditor;if(!x)return f.window.showWarningMessage("EFx: No active file to push"),v(!1,"EFx: No active file to push");u=x.document.uri.fsPath;let A=await Ft(u);if(!A)return f.window.showWarningMessage("EFx: This file is not a pulled EFx function"),v(!1,"EFx: This file is not a pulled EFx function");if(A.isWidgetCode){y=A.libraryId,k=A.functionId;let I=await Lr(u,A);return v(!!I?.ok,I?.message||"Widget push finished")}y=A.libraryId,k=A.functionId}return!u||!ge.existsSync(u)?(f.window.showErrorMessage("EFx: File not found. Pull the function first."),v(!1,"EFx: File not found. Pull the function first.")):!d&&await f.window.showWarningMessage(`Push ${k} to ${y}?`,{modal:!0},"Push")!=="Push"?v(!1,"Push cancelled"):await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Pushing ${k}...`},async()=>{try{await xs(u);let x=Y.libraryCache.get(y)||await q.getLibrary(y),A=x.EfxLibrary&&x.EfxLibrary[0];if(!A)throw new Error(`Library ${y} not found on server`);if(A.Frozen===!0){let ye=A.Published?`${y} is promoted to production \u2014 demote it first (right-click the library \u2192 Demote from Production).`:`${y} is locked/frozen in Epicor. Unfreeze it before editing.`;throw new Error(ye)}let I=mn(ge.readFileSync(u,"utf-8")),N=I.content,_=I.lineOffset,F=x.EfxFunction.find(ye=>ye.FunctionID===k);if(!F)throw new Error(`Function ${k} not found on server`);let M=st.describeBody(F.Body);if(M.unparsedFlow)throw new Error(`${k} has a widget body this extension can't read \u2014 refusing to overwrite it with C#.`);if(M.kind==="flow"){let V=(await Ft(u))?.widgetNodeId||(M.flow.codeNodes.length===1?M.flow.codeNodes[0].id:null);if(!V)throw new Error(`${k} has ${M.flow.codeNodes.length} custom-code widgets \u2014 edit them from the widget graph.`);let ue=ks(q,y,k,F.Body);await Is(ue,V,N);let ie=(await q.getLibrary(y)).EfxFunction.find(ct=>ct.FunctionID===k),Te=st.describeBody(ie?.Body).flow?.codeNodes.find(ct=>ct.id===V);if(!Te||pn(Te.code)!==pn(N))throw new Error("EFx Push verification failed: server widget code does not match editor text.");return c.set(f.Uri.file(u),[]),f.window.showInformationMessage(`EFx: Verified save of ${y}.${k} (widget ${V})`),Y.invalidateCache(y),Hn(),v(!0,`Verified save of ${y}.${k} (widget ${V})`)}let P=vt.EpicorClient.extractCode(F.Body),R=await q.validateFunctionViaWrapper(y,k,N,P.usings,"Utilities","ApplyChangesWithDiagnostics"),Z=f.Uri.file(u);if(!R.saved){let ye=R.diagnostics||R.errors||[];if(m=(R.errors||[]).map(String),g=ye.map(V=>typeof V=="object"&&V!==null?{line:V.Line!=null?V.Line+_:null,column:V.Column??null,severity:V.Severity??2,message:[V.Code,V.Message].filter(Boolean).join(": ")||String(V)}:{line:null,column:null,severity:2,message:String(V)}),ye.length>0){let V=ye.map(ue=>{if(typeof ue=="object"&&ue!==null){let te=Math.max(0,(ue.Line??1)-1)+_,ie=Math.max(0,(ue.Column??1)-1),Te=[ue.Code,ue.Message].filter(Boolean).join(": ")||String(ue);return new f.Diagnostic(new f.Range(te,ie,te,ie+1),Te,f.DiagnosticSeverity.Error)}return new f.Diagnostic(new f.Range(0,0,0,1),String(ue),f.DiagnosticSeverity.Error)});c.set(Z,V)}throw new Error(R.errors?.[0]||R.outMsg||R.outResult||"Wrapper save failed")}let ee=(await q.getLibrary(y)).EfxFunction.find(ye=>ye.FunctionID===k);if(!ee)throw new Error(`Verification failed: ${y}.${k} not found after save`);let he=vt.EpicorClient.extractCode(ee.Body).code;if(pn(he)!==pn(N))throw new Error("EFx Push verification failed: wrapper returned success, but server Body does not match editor text.");c.set(Z,[]),f.window.showInformationMessage(`EFx: Verified save of ${y}.${k}`);let Ke=fn.get(y)?.EfxFunction?.find(ye=>ye.FunctionID===k);return Ke&&R.newBody&&(Ke.Body=R.newBody),Y.invalidateCache(y),Hn(),v(!0,`Verified save of ${y}.${k}`)}catch(x){return console.error("EFx Push failed:",x),f.window.showErrorMessage(`EFx Push failed: ${x.message}`),v(!1,x.message)}})})),t.subscriptions.push(f.commands.registerCommand("efx.regenerateLibrary",async h=>{if(!q){f.window.showWarningMessage("EFx: Configure connection first");return}let d;if(h?.library?.LibraryID)d=h.library.LibraryID;else if(h?.libraryId)d=h.libraryId;else{let y=f.window.activeTextEditor;if(y){let k=Se.get(ce(y.document.uri.fsPath));k&&!k.isBpm&&(d=k.libraryId)}}d||(d=await f.window.showInputBox({prompt:"Library ID to regenerate / validate",placeHolder:"e.g. PimberlyFuncts"})),d&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Validating ${d}...`},async()=>{try{let k=(await q.regenerateLibrary(d)).errors||[];if(k.length===0){f.window.showInformationMessage(`EFx: ${d} validated with no reported errors`);return}let u=As(k),m=await f.workspace.openTextDocument({language:"markdown",content:`# EFx Validation Errors: ${d}

\`\`\`text
${u}
\`\`\`
`});await f.window.showTextDocument(m,f.ViewColumn.Two),f.window.showWarningMessage(`EFx: ${d} has ${k.length} validation error(s)`)}catch(y){f.window.showErrorMessage(`EFx Validate failed: ${y.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.executeFunction",async h=>{if(!q||!h)return;let d=hn(),y=d?d.companies||[]:[],k=wt()||y[0]||"",u=(Y.libraries||[]).find(g=>g.LibraryID===h.libraryId),m=u?!u.Published:!1;await Lo.load(q,h.libraryId,h.func.FunctionID,h.signatures,y,k,Y,m)})),t.subscriptions.push(f.commands.registerCommand("efx.demoteLibrary",async h=>{if(!(!q||!h||await f.window.showWarningMessage(`Demote ${h.library.LibraryID} from production?`,{modal:!0},"Demote")!=="Demote"))try{await q.demoteFromProduction(h.library.LibraryID),f.window.showInformationMessage(`EFx: Demoted ${h.library.LibraryID}`),await Y.refresh()}catch(y){f.window.showErrorMessage(`EFx Demote failed: ${y.message}`)}})),t.subscriptions.push(f.commands.registerCommand("efx.promoteLibrary",async h=>{if(!(!q||!h||await f.window.showWarningMessage(`Promote ${h.library.LibraryID} to production?`,{modal:!0},"Promote")!=="Promote"))try{await q.promoteToProduction(h.library.LibraryID),f.window.showInformationMessage(`EFx: Promoted ${h.library.LibraryID}`),await Y.refresh()}catch(y){f.window.showErrorMessage(`EFx Promote failed: ${y.message}`)}})),t.subscriptions.push(f.commands.registerCommand("efx.newFunction",async h=>{if(!q){f.window.showWarningMessage("EFx: Configure connection first");return}let d;if(h&&h.library?d=h.library.LibraryID:h&&h.libraryId?d=h.libraryId:d=await f.window.showInputBox({prompt:"Library ID to add the function to",placeHolder:"e.g. PaintLineFuncts"}),!d)return;let y=await f.window.showInputBox({prompt:"New Function ID",placeHolder:"e.g. MyNewFunction",validateInput:N=>!N||N.trim().length===0?"Function ID is required":/\s/.test(N)?"Function ID cannot contain spaces":null});if(!y)return;let k=await f.window.showInputBox({prompt:"Description (optional)",placeHolder:"Short description of the function"}),u=["string","int","decimal","bool","DateTime","System.Data.DataSet","System.Data.DataTable","Custom\u2026"];async function m(N){let _=[];for(;;){let F=await f.window.showInputBox({prompt:`${N} param name (leave blank to finish)`,placeHolder:"e.g. partNum",ignoreFocusOut:!0});if(!F)break;let M=await f.window.showQuickPick(u.map(R=>({label:R})),{placeHolder:`Data type for "${F}"`,ignoreFocusOut:!0});if(!M)break;let P=M.label;if(P==="Custom\u2026"){let R=await f.window.showInputBox({prompt:"Enter full .NET type name",placeHolder:"e.g. Erp.Tablesets.SalesOrderTableset",ignoreFocusOut:!0});if(!R)break;P=R}_.push({ArgumentName:F,DataType:P})}return _}let v=(await f.window.showQuickPick([{label:"Skip \u2014 add later",value:!1},{label:"Add request params now",value:!0}],{placeHolder:"Add request parameters?",ignoreFocusOut:!0}))?.value?await m("Request"):[],A=(await f.window.showQuickPick([{label:"Skip \u2014 add later",value:!1},{label:"Add response params now",value:!0}],{placeHolder:"Add response parameters?",ignoreFocusOut:!0}))?.value?await m("Response"):[],I=[...v.map((N,_)=>({...N,Response:!1,Order:_})),...A.map((N,_)=>({...N,Response:!0,Order:_}))];await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Creating ${y}...`},async()=>{try{let N=await vs(d,y,k,I);N.diagnostics.length>0?f.window.showWarningMessage(`EFx: ${y} created with diagnostics:
${N.diagnostics.join(`
`)}`):f.window.showInformationMessage(`EFx: Created ${d}.${y} \u2713`),I.length>0&&(N.signaturesSaved?f.window.showInformationMessage(`EFx: Saved ${I.length} parameter(s) for ${y} \u2713`):f.window.showWarningMessage(`EFx: Function created but signatures failed: ${N.signatureError}. Add them via \u2699 Edit Signatures in the Execute panel.`))}catch(N){f.window.showErrorMessage(`EFx: Create function failed: ${N.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.deleteFunction",async h=>{if(!q){f.window.showWarningMessage("EFx: Configure connection first");return}if(!h){f.window.showWarningMessage("EFx: Delete must be invoked from a function in the tree.");return}let d=h.libraryId,y=h.func&&h.func.FunctionID;if(!d||!y){f.window.showErrorMessage("EFx: Could not determine library/function from selection.");return}await f.window.showWarningMessage(`Delete function "${y}" from library "${d}"? This cannot be undone.`,{modal:!0},"Delete")==="Delete"&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Deleting ${y}...`},async()=>{try{await ws(d,y),f.window.showInformationMessage(`EFx: Deleted ${d}.${y} \u2713 (local .cs file, if any, was left in place)`)}catch(u){f.window.showErrorMessage(`EFx: Delete function failed: ${u.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.newLibrary",async()=>{if(!q){f.window.showWarningMessage("EFx: Configure connection first");return}let h=await f.window.showInputBox({prompt:"New Library ID",placeHolder:"e.g. MyNewLibrary",validateInput:y=>!y||y.trim().length===0?"Library ID is required":/\s/.test(y)?"Library ID cannot contain spaces":null});if(!h)return;let d=await f.window.showInputBox({prompt:"Description (optional)",placeHolder:"Short description of the library"});await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Creating library ${h}...`},async()=>{try{let y=await Es(h,d);y.length>0?f.window.showWarningMessage(`EFx: Library ${h} created with diagnostics:
${y.join(`
`)}`):f.window.showInformationMessage(`EFx: Created library ${h} \u2713`)}catch(y){f.window.showErrorMessage(`EFx: Create library failed: ${y.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.addTable",async h=>{if(!q||!h)return;let d=h.libraryId,y=["ERP.Part","ERP.PartBin","ERP.PartCost","ERP.PartPlant","ERP.PartUOM","ERP.PartWhse","ERP.PartCOO","ERP.PartPC","ERP.PartRev","ERP.Customer","ERP.CustCnt","ERP.ShipTo","ERP.OrderHed","ERP.OrderDtl","ERP.OrderRel","ERP.QuoteHed","ERP.QuoteDtl","ERP.JobHead","ERP.JobAsmbl","ERP.JobMtl","ERP.JobOper","ERP.ShipHead","ERP.ShipDtl","ERP.PurchaseOrder","ERP.PODetail","ERP.PORel","ERP.Vendor","ERP.VendPart","ERP.PriceLst","ERP.PriceLstParts","ERP.LaborDtl","ERP.LaborHed","ERP.PlantWhse","ERP.PartTran","ERP.Country","ERP.Currency","ERP.UD01","ERP.UD02","ERP.UD03","ERP.UD04","ERP.UD05","ERP.UD06","ERP.UD07","ERP.UD08","ERP.UD09","ERP.UD10","ICE.UD11","ICE.UD12","ICE.UD13","ICE.UD14","ICE.UD15","ICE.UD16","ICE.UD17","ICE.UD18","ICE.UD19","ICE.UD20"].sort(),k=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...y.map(v=>({label:v,manual:!1}))],u=await f.window.showQuickPick(k,{placeHolder:"Select a table or enter manually (format: ERP.Part)",matchOnDescription:!0});if(!u)return;let m;if(u.manual?m=await f.window.showInputBox({prompt:"Table ID",placeHolder:"e.g. ERP.PartBin or ICE.UD11",validateInput:v=>!v||!v.includes(".")?"Format must be NAMESPACE.TableName":null}):m=u.label,!m)return;let g=await f.window.showQuickPick([{label:"Read-only",value:!1},{label:"Updatable",value:!0}],{placeHolder:"Read-only or Updatable?"});g&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Adding table ${m}...`},async()=>{try{let v=await jn(d,"table",m,{updatable:g.value});v.length>0?f.window.showWarningMessage(`EFx: Table added with diagnostics: ${v.join(", ")}`):f.window.showInformationMessage(`EFx: Added table ${m} to ${d} \u2713`)}catch(v){f.window.showErrorMessage(`EFx: Add table failed: ${v.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.setTableUpdatable",async h=>{if(!q){f.window.showWarningMessage("EFx: Configure connection first");return}if(!h||!h.row){f.window.showWarningMessage("EFx: Must be invoked from a table in the tree.");return}let d=h.row.LibraryID,y=h.row.TableID,k=h.row.Updatable;if(!d||!y){f.window.showErrorMessage("EFx: Could not determine library/table from selection.");return}let u=await f.window.showQuickPick([{label:"$(lock) Read-only",value:!1,description:k===!1?"current":""},{label:"$(edit) Updatable",value:!0,description:k===!0?"current":""}],{placeHolder:`${y} \u2014 choose access mode`});!u||u.value===k||await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Updating ${y}...`},async()=>{try{await Ds(d,y,u.value),f.window.showInformationMessage(`EFx: ${y} set to ${u.value?"Updatable":"Read-only"} \u2713`)}catch(m){f.window.showErrorMessage(`EFx: Set updatable failed: ${m.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.addService",async h=>{if(!q||!h)return;let d=h.libraryId,y=["ERP:BO:Part","ERP:BO:PartBin","ERP:BO:PartWhse","ERP:BO:PartCost","ERP:BO:PartTran","ERP:BO:Customer","ERP:BO:ShipTo","ERP:BO:SalesOrder","ERP:BO:QuoteMgr","ERP:BO:JobEntry","ERP:BO:JobStatus","ERP:BO:CustShip","ERP:BO:SubShipD","ERP:BO:PurchaseOrder","ERP:BO:Receipt","ERP:BO:Vendor","ERP:BO:LaborDtl","ERP:BO:PriceLst","ERP:BO:Currency","ERP:BO:Country","ERP:BO:Inventory","ICE:BO:UD11","ICE:BO:UD12","ICE:BO:UD13","ICE:BO:UD14","ICE:BO:UD15","ICE:BO:UD16","ICE:BO:UD17","ICE:BO:UD18","ICE:BO:UD19","ICE:BO:UD20","ICE:LIB:EfxLibraryDesigner"].sort(),k=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...y.map(g=>({label:g,manual:!1}))],u=await f.window.showQuickPick(k,{placeHolder:"Select a service or enter manually (format: ERP:BO:Part)"});if(!u)return;let m;u.manual?m=await f.window.showInputBox({prompt:"Service ID",placeHolder:"e.g. ERP:BO:Part or ICE:BO:UD11",validateInput:g=>!g||g.split(":").length<3?"Format must be NAMESPACE:TYPE:Name":null}):m=u.label,m&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Adding service ${m}...`},async()=>{try{let g=await jn(d,"service",m,{});g.length>0?f.window.showWarningMessage(`EFx: Service added with diagnostics: ${g.join(", ")}`):f.window.showInformationMessage(`EFx: Added service ${m} to ${d} \u2713`)}catch(g){f.window.showErrorMessage(`EFx: Add service failed: ${g.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.addAssembly",async h=>{if(!q||!h)return;let d=h.libraryId,y=["Newtonsoft.Json.dll","Ice.Contracts.BO.DynamicQuery.dll","Ice.Contracts.BO.BAQDesigner.dll","Erp.Contracts.BO.Part.dll","Erp.Contracts.BO.JobEntry.dll","Erp.Contracts.BO.SalesOrder.dll","Erp.Contracts.BO.QuoteMgr.dll","Erp.Contracts.BO.CustShip.dll","Erp.Contracts.BO.PurchaseOrder.dll","Erp.Contracts.BO.LaborDtl.dll","Erp.Contracts.BO.Inventory.dll","Erp.Contracts.BO.Customer.dll","Erp.Contracts.BO.Vendor.dll","Ice.Contracts.BO.UD11.dll","Ice.Contracts.BO.UD15.dll","System.Net.Http.dll","System.Xml.dll","System.Linq.dll"].sort(),k=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...y.map(g=>({label:g,manual:!1}))],u=await f.window.showQuickPick(k,{placeHolder:"Select an assembly or enter manually (include .dll)"});if(!u)return;let m;u.manual?m=await f.window.showInputBox({prompt:"Assembly filename",placeHolder:"e.g. Newtonsoft.Json.dll",validateInput:g=>!g||!g.toLowerCase().endsWith(".dll")?"Must end in .dll":null}):m=u.label,m&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Adding assembly ${m}...`},async()=>{try{let g=await jn(d,"assembly",m,{});g.length>0?f.window.showWarningMessage(`EFx: Assembly added with diagnostics: ${g.join(", ")}`):f.window.showInformationMessage(`EFx: Added assembly ${m} to ${d} \u2713`)}catch(g){f.window.showErrorMessage(`EFx: Add assembly failed: ${g.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.addLibraryRef",async h=>{if(!q||!h)return;let d=h.libraryId,k=(Y.libraries||[]).map(x=>x.LibraryID).filter(x=>x!==d).sort(),u=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...k.map(x=>({label:x,manual:!1}))],m=await f.window.showQuickPick(u,{placeHolder:k.length>0?"Select a library to reference":"Enter library ID (refresh tree first to get suggestions)"});if(!m)return;let g;if(m.manual?g=await f.window.showInputBox({prompt:"Library ID to reference",placeHolder:"e.g. LogFuncts",validateInput:x=>!x||x.trim().length===0?"Library ID is required":null}):g=m.label,!g)return;let v=await f.window.showQuickPick([{label:"Normal (0)",value:0,description:"Standard reference"},{label:"Read-only (1)",value:1,description:"Cannot call mutating functions"},{label:"Hidden (2)",value:2,description:"Not visible in designer"}],{placeHolder:"Reference mode"});v&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Adding library ref ${g}...`},async()=>{try{let x=await jn(d,"library",g,{mode:v.value});x.length>0?f.window.showWarningMessage(`EFx: Library ref added with diagnostics: ${x.join(", ")}`):f.window.showInformationMessage(`EFx: Added library ref ${g} to ${d} \u2713`)}catch(x){f.window.showErrorMessage(`EFx: Add library ref failed: ${x.message}`)}})}));let l=f.languages.createDiagnosticCollection("epicor-bpm");t.subscriptions.push(l);let c=f.languages.createDiagnosticCollection("epicor-efx");t.subscriptions.push(c);let p=new Map;function w(h){return p.has(h)||p.set(h,{status:"idle",timer:null}),p.get(h)}function b(h,d){let y=w(h);if(y.status==="running"||y.status==="dirty"){y.timer&&(clearTimeout(y.timer),y.timer=null),y.status="dirty";return}y.timer&&clearTimeout(y.timer),y.timer=setTimeout(()=>{y.timer=null,y.status="running",S(h,d)},500)}async function S(h,d){if(p.get(h))try{if(!oe||!d.isBpm||!d.functionDefinition)return;let k=f.workspace.textDocuments.find(A=>ce(A.uri.fsPath)===ce(h)),u=mn(k?k.getText():ge.readFileSync(h,"utf-8")),m=u.content,g=u.lineOffset,v=await oe.validateCustomCode(m,d.functionDefinition),x=f.Uri.file(h);if(!v||v.length===0)l.set(x,[]);else{let A=v.map(I=>{let N=Math.max(0,(I.Span?.start?.line??1)-1),_=Math.max(N,(I.Span?.end?.line??N+1)-1),F=N+g,M=_+g,P=Math.max(0,I.Span?.start?.column??0),R=Math.max(0,I.Span?.end?.column??P+1),Z=new f.Range(F,P,M,R),j=Cs(I.Severity),ee=`${I.Code}: ${I.Message}`;return new f.Diagnostic(Z,ee,j)});l.set(x,A)}}catch{}finally{let k=p.get(h);if(!k)return;let u=k.status==="dirty";k.status="idle",u&&(k.status="running",S(h,d))}}t.subscriptions.push(f.workspace.onDidOpenTextDocument(async h=>{let d=h.uri.fsPath;if(!d.endsWith(".cs")||Se.has(ce(d)))return;let y=f.workspace.getConfiguration("efx").get("storageLocation");!y||!d.startsWith(String(y))||await Ft(d)})),t.subscriptions.push(f.workspace.onDidChangeTextDocument(h=>{let d=h.document.uri.fsPath,y=Se.get(ce(d));y&&y.isBpm&&y.functionDefinition&&b(d,y),y&&!y.isBpm&&!y.widgetNodeId&&!y.isWidgetCode&&q&&O(d,y)})),t.subscriptions.push(f.workspace.onDidSaveTextDocument(async h=>{let d=ce(h.uri.fsPath);if(Fo.has(d))return;let y=await Ft(h.uri.fsPath);if(y?.isWidgetCode){await Lr(h.uri.fsPath,y);return}!y||y.isBpm||!q||!hn()?.autoPush||await f.commands.executeCommand("efx.pushFunction",null,!0)})),t.subscriptions.push(f.workspace.onDidCloseTextDocument(h=>{let d=h.uri.fsPath,y=Se.get(ce(d));if(y&&y.isBpm){l.delete(h.uri);let k=p.get(d);k?.timer&&clearTimeout(k.timer),p.delete(d)}if(y&&!y.isBpm){c.delete(h.uri);let k=D.get(d);k?.timer&&clearTimeout(k.timer),D.delete(d)}if(y&&!h.isDirty&&hn()?.autoClean)try{ge.unlinkSync(d),Se.delete(ce(d))}catch{}}));let D=new Map;function B(h){return D.has(h)||D.set(h,{status:"idle",timer:null}),D.get(h)}function O(h,d){let y=B(h);if(y.status==="running"||y.status==="dirty"){y.timer&&(clearTimeout(y.timer),y.timer=null),y.status="dirty";return}y.timer&&clearTimeout(y.timer),y.timer=setTimeout(()=>{y.timer=null,y.status="running",$(h,d)},1500)}async function $(h,d){if(D.get(h))try{if(!q||!d.libraryId||!d.functionId||d.widgetNodeId||d.isWidgetCode)return;let k=f.workspace.textDocuments.find(M=>ce(M.uri.fsPath)===ce(h)),u=mn(k?k.getText():ge.readFileSync(h,"utf-8")),m=u.content,g=u.lineOffset,v=fn.get(d.libraryId),x=v?.EfxFunction?.find(M=>M.FunctionID===d.functionId);if(x){let M=vt.EpicorClient.extractCode(x.Body).code;if(pn(M)===pn(m)){c.set(f.Uri.file(h),[]);return}}let A=x?vt.EpicorClient.extractCode(x.Body).usings:"",{diagnostics:I,saved:N,newBody:_}=await q.validateFunctionViaWrapper(d.libraryId,d.functionId,m,A,"Utilities","ApplyChangesWithDiagnostics",v);N&&v&&x&&(x.Body=_);let F=f.Uri.file(h);if(!I||I.length===0)c.set(F,[]);else{let M=I.map(P=>{if(typeof P=="object"&&P!==null){let Z=Number.isInteger(P.Line)?P.Line:void 0,j=Number.isInteger(P.Column)?P.Column-1:void 0,ee=Math.max(0,(P.Span?.start?.line??Z??1)-1),he=Math.max(ee,(P.Span?.end?.line??Z??ee+1)-1),Ie=ee+g,Ke=he+g,ye=Math.max(0,P.Span?.start?.column??j??0),V=Math.max(0,P.Span?.end?.column??ye+1),ue=Cs(P.Severity),te=[P.Code,P.Message].filter(Boolean).join(": ");return new f.Diagnostic(new f.Range(Ie,ye,Ke,V),te||String(P),ue)}let R=String(P).match(/\((\d+),(\d+)\).*?(error|warning|info)\s+(CS\w+)?:?\s*(.*)/i);if(R){let Z=Math.max(0,parseInt(R[1])-1)+g,j=Math.max(0,parseInt(R[2])-1),ee=R[3].toLowerCase();return new f.Diagnostic(new f.Range(Z,j,Z,j+1),`${R[4]?R[4]+": ":""}${R[5]}`,ee==="warning"?f.DiagnosticSeverity.Warning:ee==="info"?f.DiagnosticSeverity.Information:f.DiagnosticSeverity.Error)}return new f.Diagnostic(new f.Range(0,0,0,1),String(P),f.DiagnosticSeverity.Error)});c.set(F,M)}}catch{}finally{let k=D.get(h);if(!k)return;let u=k.status==="dirty";k.status="idle",u&&(k.status="running",$(h,d))}}t.subscriptions.push(f.commands.registerCommand("efx.bpm.refresh",async()=>{if(!oe){f.window.showWarningMessage("BPM: Configure connection first");return}await tt.refresh()})),t.subscriptions.push(f.commands.registerCommand("efx.bpm.openWidgetPanel",async h=>{if(!oe){f.window.showWarningMessage("BPM: Configure connection first");return}let d;if((h?.directive||h instanceof $o.BpmDirectiveNode)&&(d=h.directive),!d){f.window.showWarningMessage("BPM: Select a directive");return}pp(t,oe,d)})),t.subscriptions.push(f.commands.registerCommand("efx.openFunctionWidgets",async h=>{if(!q){f.window.showWarningMessage("EFx: Configure connection first");return}let d=h?.libraryId,y=h?.func?.FunctionID||h?.functionId;if(!d||!y){f.window.showWarningMessage("EFx: Select a function");return}try{await gs(t,q,d,y,h?.func?.Body)}catch(k){f.window.showErrorMessage(`EFx: Could not open widget graph \u2014 ${k.message}`)}})),t.subscriptions.push(f.commands.registerCommand("efx.widget.openCode",async h=>{let d=h?.meta;if(!d||!h.nodeId)return;let y=await Fr();if(!y){f.window.showWarningMessage("EFx: Storage location not set \u2014 cannot open widget code.");return}let k=N=>String(N||"").replace(/[^a-zA-Z0-9_\-. ]/g,"_"),u=d.kind==="bpm",m=u?se.join(y,"Widgets","BPM",k(d.bpMethodCode),k(d.name)):se.join(y,"Widgets",k(d.libraryId),k(d.functionId));ge.mkdirSync(m,{recursive:!0});let g=se.join(m,`${k(h.nodeId)}.cs`),v=null;if(u&&oe&&(d.source||"BO")==="BO")try{let N=await oe.getBpmMethod("BO",d.bpMethodCode),_=N?.BpMethod?.[0];_&&(v=xe.buildFunctionDefinition(_,N?.BpArgument||[]))}catch{}let x=(u?[`// BPM Directive: ${d.name}`,`// Source: ${d.source||"BO"}`,`// Method: ${d.bpMethodCode}`,`// Type: ${mp(d.directiveType,d.source||"BO")}`,`// DirectiveID: ${d.directiveId}`]:[`// EFx Function: ${d.libraryId}.${d.functionId}`]).concat([`// Widget Code: ${h.nodeId} (${h.label})`,`// Pulled: ${new Date().toISOString()}`,"// Saving this file pushes the code back into this widget.","// --------------------------------------------------",""]);f.workspace.textDocuments.find(N=>ce(N.uri.fsPath)===ce(g)&&N.isDirty)||ge.writeFileSync(g,x.join(`
`)+`
`+(h.code||""),"utf-8"),Se.set(ce(g),{isWidgetCode:!0,nodeId:h.nodeId,widgetMeta:d,isBpm:u,libraryId:u?"__BPM__":d.libraryId,functionId:u?d.directiveId:d.functionId,bpmMethodCode:d.bpMethodCode,source:d.source||"BO",directiveId:d.directiveId,directiveType:d.directiveType,functionDefinition:v});let I=await f.workspace.openTextDocument(g);await f.window.showTextDocument(I,f.ViewColumn.One),f.window.showInformationMessage(`Widget "${h.label}" opened \u2014 save to push it back to Epicor.`),v&&b(g,Se.get(ce(g)))}));async function E(h,d,y){let k=xe.bpmSourceOf(h),u=xe.directiveTypeLabel(k,h.DirectiveType),m=se.join(y,"BPM",Oo(h.BpMethodCode));ge.mkdirSync(m,{recursive:!0});let g=h.Name.replace(/[^a-zA-Z0-9_\-. ]/g,"_"),v=se.join(m,`${u}_${g}.cs`),x=[`// BPM Directive: ${h.Name}`,`// Source: ${k}`,`// Method: ${h.BpMethodCode}`,`// Type: ${u}`,`// Enabled: ${h.IsEnabled}`,`// Group: ${h.DirectiveGroup||"(none)"}`,`// DirectiveID: ${h.DirectiveID}`,`// Pulled: ${new Date().toISOString()}`,"// --------------------------------------------------",""].join(`
`);ge.writeFileSync(v,x+d,"utf-8");let A=null;if(k==="BO"){let I=await oe.getBpmMethod("BO",h.BpMethodCode),N=I?.BpMethod?.[0],_=I?.BpArgument||[];A=N?xe.buildFunctionDefinition(N,_):null}return Se.set(ce(v),{libraryId:"__BPM__",functionId:h.DirectiveID,bpmMethodCode:h.BpMethodCode,source:k,directiveId:h.DirectiveID,directiveType:h.DirectiveType,isBpm:!0,functionDefinition:A}),{filePath:v,typeLabel:u,functionDefinition:A}}t.subscriptions.push(f.commands.registerCommand("efx.bpm.pullDirective",async h=>{if(!oe){f.window.showWarningMessage("BPM: Configure connection first");return}let d;if(h&&h.directive)d=h.directive;else if(h instanceof $o.BpmDirectiveNode)d=h.directive;else{f.window.showWarningMessage("BPM: Select a directive to pull");return}let{code:y,hasCustomCode:k}=xe.extractBpmCode(d.Body);if(!k){f.window.showWarningMessage(`BPM: "${d.Name}" has no custom C# code \u2014 it uses widget actions only`);return}await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Pulling BPM: ${d.Name}...`},async()=>{try{let u=await Fr();if(!u){f.window.showWarningMessage("BPM: Storage location not set \u2014 pull cancelled.");return}let{filePath:m,typeLabel:g,functionDefinition:v}=await E(d,y,u),x=await f.workspace.openTextDocument(m);if(await f.window.showTextDocument(x,f.ViewColumn.One),f.window.showInformationMessage(`BPM: Pulled ${g} directive "${d.Name}"`),v){let A=Se.get(ce(m));b(m,A)}}catch(u){f.window.showErrorMessage(`BPM Pull failed: ${u.message}`)}})}));async function C(h,d){let y=Ap(ge.readFileSync(h,"utf-8")),k=d.source||"BO",u=await oe.getBpmMethodRaw(k,d.bpmMethodCode),m=xe.updateRawBpmDirective(u,d.directiveId,y);JSON.parse(`{"ds":${m}}`);let v=((await oe.updateBpmRaw(m))?.returnObj?.BpMessageSvc||[]).filter(N=>N.Severity>1);if(v.length)throw new Error(v.map(N=>N.Message).join("; "));let A=((await oe.getBpmMethod(k,d.bpmMethodCode))?.BpDirective||[]).find(N=>N.DirectiveID===d.directiveId),I=A?xe.extractBpmCode(A.Body).code:null;if(I===null||st.normalizeCode(I)!==st.normalizeCode(y))throw new Error("BPM push verification failed: server directive code does not match the file.")}t.subscriptions.push(f.commands.registerCommand("efx.bpm.pushDirective",async h=>{if(!oe){f.window.showWarningMessage("BPM: Configure connection first");return}let d,y;if(h&&h.directive){let u=h.directive,m=xe.directiveTypeLabel(xe.bpmSourceOf(u),u.DirectiveType),g=u.Name.replace(/[^a-zA-Z0-9_\-. ]/g,"_"),v=await Fr();if(!v){f.window.showWarningMessage("BPM: Storage location not set \u2014 push cancelled.");return}d=se.join(v,"BPM",Oo(u.BpMethodCode),`${m}_${g}.cs`),y=await Ft(d)}else{let u=f.window.activeTextEditor;if(!u){f.window.showWarningMessage("BPM: No active file to push");return}d=u.document.uri.fsPath,y=await Ft(d)}if(y?.isWidgetCode){await Lr(d,y);return}if(!y||!y.isBpm){f.window.showWarningMessage("BPM: This file is not a pulled BPM directive. Pull it first.");return}if(!d||!ge.existsSync(d)){f.window.showErrorMessage("BPM: File not found. Pull the directive first.");return}await f.window.showWarningMessage(`Push BPM directive to ${y.bpmMethodCode}?`,{modal:!0},"Push")==="Push"&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:"Pushing BPM directive..."},async()=>{try{await xs(d),await C(d,y),f.window.showInformationMessage(`BPM: Pushed directive to ${y.bpmMethodCode} \u2713`),y.functionDefinition&&b(d,y);let u=y.bpmMethodCode.split(".");(y.source||"BO")!=="BO"?tt.invalidateSource(y.source):u.length>=3&&tt.invalidateService(u[0].toUpperCase(),u[1],u[2])}catch(u){f.window.showErrorMessage(`BPM Push failed: ${u.message}`)}})}));async function T(h){let d=Ve();if(d.length<1)return f.window.showWarningMessage("EFx: No profiles configured. Add profiles via Manage Profiles first."),null;let y=await f.window.showQuickPick(d.map(g=>({label:g.name,description:g.serverUrl,profile:g})),{placeHolder:h,ignoreFocusOut:!0});if(!y)return null;let k;if(y.profile.companies.length===1?k=y.profile.companies[0]:k=await f.window.showQuickPick(y.profile.companies,{placeHolder:`Company on ${y.profile.name}`,ignoreFocusOut:!0}),!k)return null;let u=await t.secrets.get(me(y.profile.name,"password"));if(!u)return f.window.showErrorMessage(`EFx: No password stored for "${y.profile.name}".`),null;let m=await t.secrets.get(me(y.profile.name,"apiKey"))||"";return new hp.KineticMetaFXClient({serverUrl:y.profile.serverUrl,company:k,username:y.profile.username,password:u,apiKey:m})}t.subscriptions.push(f.commands.registerCommand("efx.dev.dumpFunctionBody",async()=>{if(!q){f.window.showErrorMessage("EFx: Not connected \u2014 configure a profile first.");return}let h=await f.window.showInputBox({prompt:"Library ID to dump",ignoreFocusOut:!0});if(!h)return;let d=f.window.createOutputChannel("EFx Function Body Dump");d.show(!0),d.appendLine(`Fetching ${h}...`);try{let k=(await q.getLibrary(h.trim()))?.EfxFunction||[];d.appendLine(`Got ${k.length} function(s)
`);for(let u of k){let m=st.describeBody(u.Body);if(d.appendLine("=".repeat(70)),d.appendLine(`${u.FunctionID}  Kind=${u.Kind}  \u2192 ${st.bodyKindLabel(m)}`),m.kind==="flow"){d.appendLine(`  envelope property: ${m.xamlProp||"(raw XAML)"}`);for(let g of m.flow.codeNodes)d.appendLine(`  code widget ${g.id} (${g.label}), ${g.code.split(`
`).length} lines`)}d.appendLine("  --- raw Body ---"),d.appendLine(u.Body||"(empty)"),d.appendLine("")}}catch(y){d.appendLine(`ERROR: ${y.message}`)}})),t.subscriptions.push(f.commands.registerCommand("efx.dev.dumpBpmXaml",async()=>{if(!oe){f.window.showErrorMessage("EFx: Not connected \u2014 configure a profile first.");return}let h=await f.window.showInputBox({prompt:"BPM method code",value:"Erp.BO.Labor.Update",ignoreFocusOut:!0});if(!h)return;let d=f.window.createOutputChannel("EFx Widget XAML Dump");d.show(!0),d.appendLine(`Fetching ${h}...`);try{let y=xe.inferBpmSource(h.trim()),u=(await oe.getBpmMethod(y,h.trim()))?.BpDirective||[];d.appendLine(`Got ${u.length} directive(s)
`);for(let m of u){let g=xe.directiveTypeLabel(y,m.DirectiveType);if(d.appendLine("=".repeat(70)),d.appendLine(`[${g}] "${m.Name}"  enabled=${m.IsEnabled}  group=${m.DirectiveGroup||"(none)"}`),!m.Body){d.appendLine("  (no body)");continue}let v=[...new Set([...m.Body.matchAll(/<(\w+Action)\b/g)].map(I=>I[1]))];d.appendLine(`  Action elements: ${v.join(", ")||"(none found)"}`);let x=0,A=0;for(;;){let I=m.Body.indexOf("CustomCodeAction",x);if(I<0)break;let N='Code="',_=m.Body.indexOf(N,I);if(_<0){x=I+1;continue}let F=_+N.length,M=F;for(;M<m.Body.length&&m.Body[M]!=='"';){if(m.Body[M]==="&"){let Z=m.Body.indexOf(";",M);if(Z<0)break;M=Z+1;continue}M++}let P=m.Body.slice(F,M),R=xe.xmlDecode(P);d.appendLine(`
  --- CustomCodeAction[${A++}] ---`),d.appendLine(R),x=M+1}A===0&&(d.appendLine(`
  No CustomCodeAction found \u2014 full XAML body:`),d.appendLine(m.Body))}}catch(y){d.appendLine(`ERROR: ${y.message}`)}})),t.subscriptions.push(f.commands.registerCommand("efx.compareLibraries",()=>{gp.show(t)})),t.subscriptions.push(f.commands.registerCommand("efx.searchFunctions",async()=>{await ys(q,{})})),t.subscriptions.push(f.commands.registerCommand("efx.searchInLibrary",async h=>{await ys(q,{libraryId:h?.library?.LibraryID||h?.libraryId})}));let L={context:t,getClient:()=>q,getBpmClient:()=>oe,treeProvider:()=>Y,bpmTreeProvider:()=>tt,clientReady:()=>e,getProfiles:Ve,setProfiles:Pr,getActiveProfileName:ze,setActiveProfileName:Rr,getActiveProfile:hn,getActiveCompany:wt,profileRootNoPrompt:_p,profileSecretKey:me,activateProfile:h=>Vn(t,h),applyActiveCompany:h=>Ro(t,h),normalizeFsPath:ce,stripGeneratedHeaderInfo:mn,formatBOUpdErrors:As,bpmMethodDirName:Oo,resolveMapping:Ft,pushWidgetCodeFile:Lr,pushFunctionCommand:h=>f.commands.executeCommand("efx.pushFunction",h,!0),buildLibraryFiles:o,writePulledFiles:i,collectAllLibraryFiles:s,writeDirectiveFile:E,corePushDirective:C,coreCreateFunction:vs,coreDeleteFunction:ws,coreCreateLibrary:Es,coreAddReference:jn,coreSetTableUpdatable:Ds,efxDiagnostics:c,pulledTablesets:fn,clearSearchCache:Hn};new bp(t,L,yp.buildOps(L)).start()}var _t={ignoreFocusOut:!0};function Ve(){let e=f.workspace.getConfiguration("efx").get("profiles");return Array.isArray(e)?e:[]}async function Pr(t){await f.workspace.getConfiguration("efx").update("profiles",t,f.ConfigurationTarget.Global)}function ze(){return f.workspace.getConfiguration("efx").get("activeProfile")||""}async function Rr(t){await f.workspace.getConfiguration("efx").update("activeProfile",t,f.ConfigurationTarget.Global)}function wt(){return f.workspace.getConfiguration("efx").get("activeCompany")||""}async function Ur(t){await f.workspace.getConfiguration("efx").update("activeCompany",t,f.ConfigurationTarget.Global)}function hn(){let t=ze();return t&&Ve().find(e=>e.name===t)||null}function me(t,e){return`efx.profile.${t}.${e}`}function qr(){let t=ze(),e=wt(),n=t&&e?`${t} / ${e}`:t||"";_r&&(_r.description=n),Mr&&(Mr.description=n)}async function $s(t){let e=Ve(),n=ze(),r=[];r.push({label:"$(add) New Profile\u2026",description:"Create a new Epicor environment profile",action:"new"});for(let i of e){let a=i.name===n;r.push({label:`${a?"$(check) ":"$(blank) "}${i.name}`,description:i.serverUrl||"",detail:`${i.username||"(no user)"} \u2022 ${(i.companies||[]).join(", ")||"no companies"}`,action:"use",profileName:i.name})}e.length>0&&(r.push({label:"$(edit) Edit Profile\u2026",action:"edit"}),r.push({label:"$(trash) Delete Profile\u2026",action:"delete"}));let o=await f.window.showQuickPick(r,{placeHolder:e.length===0?"No profiles yet \u2014 create your first one":`Select a profile to activate, or manage profiles (${e.length} configured)`,ignoreFocusOut:!0});if(o){if(o.action==="new")await kp(t);else if(o.action==="use")await Vn(t,o.profileName);else if(o.action==="edit"){let i=await Ss("Select profile to edit");i&&await Tp(t,i)}else if(o.action==="delete"){let i=await Ss("Select profile to delete");i&&await Bp(t,i)}}}async function Ss(t){let e=Ve();if(e.length===0)return f.window.showInformationMessage("EFx: No profiles configured."),null;let n=await f.window.showQuickPick(e.map(r=>({label:r.name,description:r.serverUrl||"",detail:r.username||"",profileName:r.name})),{placeHolder:t,ignoreFocusOut:!0});return n?n.profileName:null}async function kp(t){let e={name:"",serverUrl:"",username:"",companies:[]};if(!await Ls(t,e,!0))return;let r=Ve();if(r.some(o=>o.name===e.name)){f.window.showErrorMessage(`EFx: Profile "${e.name}" already exists.`);return}r.push(e),await Pr(r),r.length===1||await Ip(e.name)?await Vn(t,e.name):f.window.showInformationMessage(`EFx: Profile "${e.name}" saved.`)}async function Ip(t){let e=await f.window.showQuickPick([{label:"Activate now",value:!0},{label:"Save only",value:!1}],{placeHolder:`Activate profile "${t}"?`,ignoreFocusOut:!0});return e?e.value:!1}async function Tp(t,e){let n=Ve(),r=n.findIndex(s=>s.name===e);if(r<0)return;let o=JSON.parse(JSON.stringify(n[r])),i=o.name;if(await Ls(t,o,!1)){if(o.name!==i){let s=await t.secrets.get(me(i,"password")),l=await t.secrets.get(me(i,"apiKey"));s&&await t.secrets.store(me(o.name,"password"),s),l&&await t.secrets.store(me(o.name,"apiKey"),l),await t.secrets.delete(me(i,"password")),await t.secrets.delete(me(i,"apiKey")),ze()===i&&await Rr(o.name)}n[r]=o,await Pr(n),ze()===o.name?await Vn(t,o.name):f.window.showInformationMessage(`EFx: Profile "${o.name}" updated.`)}}async function Bp(t,e){if(await f.window.showWarningMessage(`Delete profile "${e}"? This will remove its stored credentials.`,{modal:!0},"Delete")!=="Delete")return;let r=Ve().filter(o=>o.name!==e);await Pr(r),await t.secrets.delete(me(e,"password")),await t.secrets.delete(me(e,"apiKey")),ze()===e&&(await Rr(""),await Ur(""),q=null,oe=null,Y.setClient(null),tt.setClient(null),qr()),f.window.showInformationMessage(`EFx: Profile "${e}" deleted.`)}async function Ls(t,e,n){let r=await f.window.showInputBox({..._t,prompt:n?"Profile name (e.g. Dev, Prod, Pilot)":"Profile name",value:e.name,validateInput:D=>!D||!D.trim()?"Name is required":/^[A-Za-z0-9_\-. ]+$/.test(D)?null:"Use letters, numbers, space, dash, dot, underscore"});if(r===void 0)return!1;e.name=r.trim();let o=await f.window.showInputBox({..._t,prompt:"Epicor Server URL",value:e.serverUrl,placeHolder:"https://your-epicor-server/your-app",validateInput:D=>!D||!D.trim()?"Server URL is required":null});if(o===void 0)return!1;e.serverUrl=o.trim();let i=await f.window.showInputBox({..._t,prompt:"Username",value:e.username,validateInput:D=>!D||!D.trim()?"Username is required":null});if(i===void 0)return!1;e.username=i.trim();let a=n?null:await t.secrets.get(me(e.name,"password")),s=n;if(!n){let D=await f.window.showQuickPick([{label:"Keep existing password",value:!1},{label:"Change password",value:!0}],{placeHolder:"Password",ignoreFocusOut:!0});if(!D)return!1;s=D.value}if(s){let D=await f.window.showInputBox({..._t,prompt:`Password for ${e.username}`,password:!0,validateInput:B=>B?null:"Password is required"});if(D===void 0)return!1;await t.secrets.store(me(e.name,"password"),D),a=D}let l=n?"":await t.secrets.get(me(e.name,"apiKey"))||"",c=n;if(!n){let D=await f.window.showQuickPick([{label:"Keep existing API key",value:!1},{label:"Change API key",value:!0},{label:"Clear API key",value:"clear"}],{placeHolder:"API Key",ignoreFocusOut:!0});if(!D)return!1;D.value==="clear"?(await t.secrets.delete(me(e.name,"apiKey")),l="",c=!1):c=D.value===!0}if(c){let D=await f.window.showInputBox({..._t,prompt:"API Key (leave blank if not required)",password:!0,value:""});if(D===void 0)return!1;await t.secrets.store(me(e.name,"apiKey"),D||""),l=D||""}let p=await $p(t,e,a,l);if(p===void 0)return!1;e.companies=p;let w=await f.window.showQuickPick([{label:"No \u2014 push manually",value:!1},{label:"Yes \u2014 auto-push on file save",value:!0}],{placeHolder:"Auto-push changes to Epicor when you save a .cs file?",ignoreFocusOut:!0});if(w===void 0)return!1;e.autoPush=w.value;let b=await f.window.showQuickPick([{label:"No \u2014 keep the local file after closing",value:!1},{label:"Yes \u2014 delete the local file when its tab is closed (only if fully saved)",value:!0}],{placeHolder:"Delete the local .cs file automatically when you close it?",ignoreFocusOut:!0});if(b===void 0)return!1;e.autoClean=b.value;let S=await f.window.showQuickPick(Np.map(D=>({...D,description:(e.claudeAccess||"off")===D.value?"current":""})),{placeHolder:"Claude access for this profile (EFx MCP server)",ignoreFocusOut:!0});return S===void 0?!1:(e.claudeAccess=S.value,!0)}var Np=[{label:"Off \u2014 Claude can't use this profile",value:"off"},{label:"Read \u2014 list, search, pull, compare",value:"read"},{label:"Read + write \u2014 push, create/delete, references, signatures, execute, profiles",value:"write"},{label:"Read + write + risky \u2014 also promote/demote libraries",value:"risky"}];async function $p(t,e,n,r){let o=!e.companies||e.companies.length===0,i;if(o)i="fetch";else{let a=[],s=ze()===e.name,l=wt();s&&e.companies.length>1&&a.push({label:"$(arrow-right) Switch active company",description:`currently ${l||"(none)"}`,value:"switch"}),a.push({label:"$(check) Keep current selection",description:(e.companies||[]).join(", "),value:"keep"}),a.push({label:"$(refresh) Re-fetch from server",description:"Discover companies again via UserFile",value:"fetch"}),a.push({label:"$(list-selection) Pick from current list",description:"Multi-select among already saved companies",value:"pick"}),a.push({label:"$(edit) Enter manually",description:"Comma-separated list",value:"manual"});let c=await f.window.showQuickPick(a,{placeHolder:"Companies",ignoreFocusOut:!0});if(!c)return;if(i=c.value,i==="keep")return e.companies;if(i==="switch"){let p=await f.window.showQuickPick(e.companies.map(w=>({label:`${w===l?"$(check) ":"$(blank) "}${w}`,company:w})),{placeHolder:`Active company (profile: ${e.name})`,ignoreFocusOut:!0});return p?(p.company!==l&&await Ro(t,p.company),e.companies):void 0}}if(i==="fetch"){let a=await Lp(e,n,r);return a===void 0?void 0:a}return i==="pick"?await Os(e.companies,e.companies):await Or(e.companies)}async function Lp(t,e,n){if(!e)return f.window.showWarningMessage("EFx: Cannot fetch companies \u2014 no password available. Falling back to manual entry."),await Or(t.companies);let r=t.companies&&t.companies[0]||"",o=await f.window.showInputBox({..._t,prompt:"Default company (used to authenticate the discovery call)",placeHolder:"your default company code",value:r,validateInput:c=>!c||!c.trim()?"Default company is required":null});if(o===void 0)return;let i=o.trim(),a;try{a=await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Fetching companies for ${t.username}...`},async()=>await new vt.EpicorClient({serverUrl:t.serverUrl,company:i,username:t.username,password:e,apiKey:n||""}).getUserCompanies())}catch(c){return await f.window.showErrorMessage(`EFx: Could not fetch companies \u2014 ${c.message}`,{modal:!1},"Enter Manually","Cancel")!=="Enter Manually"?void 0:await Or([i])}if(!a||a.length===0)return await f.window.showWarningMessage(`EFx: Server returned no companies for user "${t.username}". Enter manually?`,"Enter Manually","Cancel")!=="Enter Manually"?void 0:await Or([i]);let s=Array.from(new Set([i,...a]));return await Os(s,s)}async function Os(t,e){let n=new Set(e||[]),r=t.map(i=>({label:i,picked:n.has(i)})),o=await f.window.showQuickPick(r,{canPickMany:!0,placeHolder:"Select companies to include in this profile",ignoreFocusOut:!0});if(o){if(o.length===0){f.window.showWarningMessage("EFx: At least one company is required.");return}return o.map(i=>i.label)}}async function Or(t){let e=await f.window.showInputBox({..._t,prompt:"Companies (comma-separated)",value:(t||[]).join(", "),validateInput:n=>!n||!n.trim()||n.split(",").map(o=>o.trim()).filter(Boolean).length===0?"At least one company is required":null});if(e!==void 0)return e.split(",").map(n=>n.trim()).filter(Boolean)}async function Vn(t,e){let n=Ve().find(a=>a.name===e);if(!n){f.window.showErrorMessage(`EFx: Profile "${e}" not found.`);return}let r=await t.secrets.get(me(e,"password"));if(!r){f.window.showErrorMessage(`EFx: No password stored for "${e}". Edit the profile to set one.`);return}let o=await t.secrets.get(me(e,"apiKey"))||"",i=wt();n.companies.includes(i)||(i=n.companies[0]),await Rr(e),await Ur(i),q=new vt.EpicorClient({serverUrl:n.serverUrl,company:i,username:n.username,password:r,apiKey:o}),Y.setClient(q),oe=new xe.BpmClient(q),tt.setClient(oe),await Y.refresh(),qr(),f.window.showInformationMessage(`EFx: Active profile "${e}" (company ${i})`)}async function Op(t){let e=Ve();if(e.length===0){await f.window.showInformationMessage("EFx: No profiles configured. Create one?","Create Profile")==="Create Profile"&&await $s(t);return}let n=ze(),r=await f.window.showQuickPick(e.map(o=>({label:`${o.name===n?"$(check) ":"$(blank) "}${o.name}`,description:o.serverUrl||"",profileName:o.name})),{placeHolder:"Switch to profile",ignoreFocusOut:!0});r&&await Vn(t,r.profileName)}async function Fp(t){let e=hn();if(!e){f.window.showWarningMessage("EFx: No active profile. Manage Profiles first.");return}if(!e.companies||e.companies.length===0){f.window.showWarningMessage(`EFx: Profile "${e.name}" has no companies configured. Edit the profile to add some.`);return}if(e.companies.length===1){f.window.showInformationMessage(`EFx: Only one company in profile "${e.name}" (${e.companies[0]}).`);return}let n=wt(),r=await f.window.showQuickPick(e.companies.map(o=>({label:`${o===n?"$(check) ":"$(blank) "}${o}`,company:o})),{placeHolder:`Active company (profile: ${e.name})`,ignoreFocusOut:!0});r&&r.company!==n&&await Ro(t,r.company)}async function Ro(t,e){let n=hn();if(!n)return;if(!n.companies.includes(e)){f.window.showErrorMessage(`EFx: "${e}" is not in profile "${n.name}".`);return}let r=await t.secrets.get(me(n.name,"password"));if(!r){f.window.showErrorMessage(`EFx: No password stored for "${n.name}".`);return}let o=await t.secrets.get(me(n.name,"apiKey"))||"";await Ur(e),q=new vt.EpicorClient({serverUrl:n.serverUrl,company:e,username:n.username,password:r,apiKey:o}),Y.setClient(q),oe=new xe.BpmClient(q),tt.setClient(oe),await Y.refresh(),qr(),f.window.showInformationMessage(`EFx: Active company \u2192 ${e}`)}async function Fs(){let t=f.workspace.getConfiguration("efx"),e=t.get("storageLocation");if(e&&String(e).trim())return String(e).trim();let n=await f.window.showQuickPick([{label:"Use default location (VS Code internal storage)",value:"default"},{label:"Choose a folder...",value:"custom"}],{placeHolder:"EFx: Where should pulled functions and BPM directives be stored?",ignoreFocusOut:!0});if(!n)return null;let r;if(n.value==="default")r=se.join(Ts.globalStorageUri.fsPath,"EpicorExtension");else{let o=await f.window.showOpenDialog({canSelectFolders:!0,canSelectFiles:!1,canSelectMany:!1,openLabel:"Select EFx Storage Folder"});if(!o||o.length===0)return null;r=se.join(o[0].fsPath,"EpicorExtension")}return ge.mkdirSync(r,{recursive:!0}),await t.update("storageLocation",r,f.ConfigurationTarget.Global),f.window.showInformationMessage(`EFx: Storage location set to ${r}`),r}async function Fr(){let t=await Fs();if(!t)return null;let n=(ze()||"Default").replace(/[^a-zA-Z0-9_\-. ]/g,"_");return se.join(t,n)}function _p(t){let e=f.workspace.getConfiguration("efx").get("storageLocation"),n=e&&String(e).trim();return!n||!t?null:se.join(n,String(t).replace(/[^a-zA-Z0-9_\-. ]/g,"_"))}async function $r(){let t=await Fr();return t?se.join(t,"Libraries"):null}function Oo(t){return String(t||"").replace(/[^a-zA-Z0-9_\-. ]/g,"_")}function Mp(t){let e;try{e=ge.readFileSync(t,"utf-8")}catch{return{}}let n={};for(let r of e.split(/\r?\n/).slice(0,12)){let o=r.match(/^\/\/\s*([A-Za-z ]+):\s*(.*)$/);o&&(n[o[1].trim()]=o[2].trim())}return n}function Pp(t){return t?t.kind==="bpm"?oe?fp(oe,{DirectiveID:t.directiveId,Source:t.source||"BO",BpMethodCode:t.bpMethodCode,Name:t.name,DirectiveType:t.directiveType}):null:q?ks(q,t.libraryId,t.functionId):null:null}async function Lr(t,e){let n=Pp(e.widgetMeta);if(!n)return f.window.showWarningMessage("EFx: Configure connection first"),{ok:!1,message:"EFx: Configure connection first"};let{content:r}=mn(ge.readFileSync(t,"utf-8"));return await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Pushing widget ${e.nodeId}...`},async()=>{try{return await Is(n,e.nodeId,r),f.window.showInformationMessage(`${n.heading}: widget "${e.nodeId}" saved.`),e.widgetMeta.kind==="efx"&&(Y.invalidateCache(e.widgetMeta.libraryId),Hn()),{ok:!0,message:`${n.heading}: widget "${e.nodeId}" saved.`}}catch(o){return f.window.showErrorMessage(`Widget push failed: ${o.message}`),{ok:!1,message:`Widget push failed: ${o.message}`}}})}async function Ft(t){let e=ce(t),n=Se.get(e);if(n)return n;if(!t.endsWith(".cs")||!ge.existsSync(t))return null;let r=Mp(t),o=r["Widget Code"]?String(r["Widget Code"]).split(" (")[0].trim():null;if(r["BPM Directive"]&&r.Method&&r.DirectiveID){if(!oe)return null;let i=r.Method,a=r.DirectiveID,s=xe.bpmSourceOf({Source:r.Source}),l=xe.directiveTypeFromLabel(s,r.Type);try{let c=null;if(s==="BO"){let w=await oe.getBpmMethod("BO",i),b=w?.BpMethod?.[0],S=w?.BpArgument||[];c=b?xe.buildFunctionDefinition(b,S):null}let p={libraryId:"__BPM__",functionId:a,bpmMethodCode:i,source:s,directiveId:a,directiveType:l,isBpm:!0,functionDefinition:c};return o&&(p.isWidgetCode=!0,p.nodeId=o,p.widgetMeta={kind:"bpm",source:s,bpMethodCode:i,directiveId:a,directiveType:l,name:r["BPM Directive"]}),Se.set(e,p),p}catch{return null}}if(r["EFx Function"]){if(o){let c=String(r["EFx Function"]).indexOf("."),p=c>0?String(r["EFx Function"]).slice(0,c):se.basename(se.dirname(se.dirname(t))),w=c>0?String(r["EFx Function"]).slice(c+1):se.basename(se.dirname(t)),b={libraryId:p,functionId:w,isWidgetCode:!0,nodeId:o,widgetMeta:{kind:"efx",libraryId:p,functionId:w}};return Se.set(e,b),b}let i=se.basename(t,".cs"),a=se.basename(se.dirname(t)),s=r.Widget?String(r.Widget).split(" (")[0].trim():null,l={libraryId:a,functionId:i,widgetNodeId:s};return Se.set(e,l),l}return null}async function Rp(t){let e=ze();if(!e)return;let n=Ve().find(a=>a.name===e);if(!n)return;let r=await t.secrets.get(me(e,"password"));if(!r)return;let o=await t.secrets.get(me(e,"apiKey"))||"",i=wt();n.companies.includes(i)||(i=n.companies[0]||""),i&&(i!==wt()&&await Ur(i),q=new vt.EpicorClient({serverUrl:n.serverUrl,company:i,username:n.username,password:r,apiKey:o}),Y.setClient(q),oe=new xe.BpmClient(q),tt.setClient(oe))}function Up(){}
