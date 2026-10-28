"use strict";var K=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports);var ir=K(Ie=>{"use strict";var Ta=Ie&&Ie.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),Ia=Ie&&Ie.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),Xr=Ie&&Ie.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&Ta(n,e,r[o]);return Ia(n,e),n}})();Object.defineProperty(Ie,"__esModule",{value:!0});Ie.EpicorClient=void 0;var Kr=Xr(require("https")),Jr=Xr(require("http")),or=class t{constructor(e){this.config=e}getHeaders(){let n={"Content-Type":"application/json",Authorization:`Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64")}`};return this.config.apiKey&&(n["x-api-key"]=this.config.apiKey),n}getDesignerUrl(e){return`${this.config.serverUrl.replace(/\/$/,"")}/api/v2/odata/${this.config.company}/Ice.LIB.EfxLibraryDesignerSvc/${e}`}getEfxUrl(e,n,r,o=!1){let i=this.config.serverUrl.replace(/\/$/,""),a=r||this.config.company;return o?`${i}/api/v2/efx/staging/${a}/${e}/${n}`:`${i}/api/v2/efx/${a}/${e}/${n}`}async request(e,n){let r=await this.requestRaw(e,typeof n=="string"?n:JSON.stringify(n));try{return r?JSON.parse(r):{}}catch{return r}}async requestGet(e){return new Promise((n,r)=>{let o=new URL(e),i=o.protocol==="https:",a=i?Kr:Jr,s={hostname:o.hostname,port:o.port||(i?443:80),path:o.pathname+o.search,method:"GET",headers:this.getHeaders(),rejectUnauthorized:!1},u=a.request(s,c=>{let m="";c.on("data",y=>{m+=y}),c.on("end",()=>{if(c.statusCode&&c.statusCode>=200&&c.statusCode<300)try{n(m?JSON.parse(m):{})}catch{n(m)}else{let y=`HTTP ${c.statusCode}`;try{let b=JSON.parse(m);y=b.ErrorMessage||b.error?.message||JSON.stringify(b,null,2)}catch{y=m||y}r(new Error(y))}})});u.on("error",r),u.end()})}async getUserCompanies(){let e=this.config.serverUrl.replace(/\/$/,""),n=encodeURIComponent(this.config.username),r=`${e}/api/v2/odata/${this.config.company}/Ice.BO.UserFileSvc/UserFiles('${n}')/UserComps?$select=Company,Name`,o=await this.requestGet(r);return(Array.isArray(o?.value)?o.value:[]).map(a=>a.Company).filter(Boolean)}async requestRaw(e,n){return new Promise((r,o)=>{let i=new URL(e),a=i.protocol==="https:",s=a?Kr:Jr,u={hostname:i.hostname,port:i.port||(a?443:80),path:i.pathname+i.search,method:"POST",headers:{...this.getHeaders(),"Content-Length":Buffer.byteLength(n)},rejectUnauthorized:!1},c=s.request(u,m=>{let y="";m.on("data",b=>{y+=b}),m.on("end",()=>{if(m.statusCode&&m.statusCode>=200&&m.statusCode<300)r(y);else{let b=`HTTP ${m.statusCode}`;try{let d=JSON.parse(y);b=d.ErrorMessage||d.error?.message||JSON.stringify(d,null,2)}catch{b=y||b}console.error("EFx HTTP failure status:",m.statusCode),console.error("EFx HTTP failure body:",y),o(new Error(b))}})});c.on("error",o),c.write(n),c.end()})}async getLibraryList(){return(await this.request(this.getDesignerUrl("GetLibraryList"),{options:{kind:0,startsWith:"",rollOutMode:2,status:0}})).returnObj?.EfxLibraryList||[]}async getLibrary(e){return(await this.request(this.getDesignerUrl("GetLibrary"),{libraryId:e})).returnObj}async getDefaults(){return(await this.request(this.getDesignerUrl("GetDefaults"),{})).returnObj}async getDefaultsRaw(){let e=await this.requestRaw(this.getDesignerUrl("GetDefaults"),"{}"),n=e.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);return n?n[1]:e}async getLibraryRaw(e){let n=await this.requestRaw(this.getDesignerUrl("GetLibrary"),JSON.stringify({libraryId:e})),r=n.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);return r?r[1]:n}async applyChangesRaw(e){let n=`{"libraryTableset":${e}}`,r=await this.requestRaw(this.getDesignerUrl("ApplyChangesWithDiagnostics"),n);try{let o=JSON.parse(r);return{diagnostics:o.returnObj?.diagnostics||o.parameters?.diagnostics||[]}}catch{return{diagnostics:[]}}}async applyChanges(e){let n=await this.request(this.getDesignerUrl("ApplyChangesWithDiagnostics"),{libraryTableset:e});return{tableset:n.returnObj?.libraryTableset||n.parameters?.libraryTableset||e,diagnostics:n.returnObj?.diagnostics||n.parameters?.diagnostics||[]}}async saveFunctionBody(e,n,r){let o=await this.getLibraryRaw(e),i=this._patchFunctionBody(o,n,r,"U"),{diagnostics:a}=await this.applyChangesRaw(i),s=(a||[]).filter(u=>typeof u=="object"?(u.Severity??2)>=2:/\berror\b/i.test(String(u)));if(s.length)throw new Error(s.map(u=>typeof u=="object"?u.Message||JSON.stringify(u):String(u)).join("; "));return{diagnostics:a||[]}}async promoteToProduction(e){await this.request(this.getDesignerUrl("PromoteToProduction"),{libraryID:e})}async regenerateLibrary(e){let n=await this.request(this.getDesignerUrl("RegenerateLibrary"),{libraryID:e});return console.log("EFx Regenerate raw result:",JSON.stringify(n,null,2)),{errors:n.returnObj?.BOUpdError||n.returnObj?.BOUpdErrorList||n.returnObj?.BOUpdErrorTableset?.BOUpdError||n.parameters?.result?.BOUpdError||n.parameters?.result?.BOUpdErrorList||n.parameters?.result?.BOUpdErrorTableset?.BOUpdError||n.parameters?.errors||n.errors||[],raw:n}}async demoteFromProduction(e){await this.request(this.getDesignerUrl("DemoteFromProduction"),{libraryID:e})}async lockLibrary(e){await this.request(this.getDesignerUrl("LockLibrary"),{libraryID:e})}async releaseLibrary(e){await this.request(this.getDesignerUrl("ReleaseLibrary"),{libraryID:e})}async validateFunctionRaw(e,n,r,o){let i=await this.getLibraryRaw(e),a=t.packCode(r,o||""),u=`{"libraryTableset":${this._patchFunctionBody(i,n,a,"U")}}`,c=await this.requestRaw(this.getDesignerUrl("ApplyChangesWithDiagnostics"),u);try{let m=JSON.parse(c),y=m.returnObj?.diagnostics||m.parameters?.diagnostics||[],b=y.some(d=>typeof d=="object"?(d.Severity??2)>=2:/\berror\b/i.test(String(d)));return{diagnostics:y,saved:!b,newBody:a}}catch{return{diagnostics:[],saved:!1,newBody:a}}}async validateFunctionViaWrapper(e,n,r,o,i="Utilities",a="ApplyChangesWithDiagnostics",s=null){let u=s;if((!u?.EfxLibrary?.[0]||!u.EfxFunction?.some(k=>k.FunctionID===n))&&(u=await this.getLibrary(e)),!u?.EfxLibrary?.[0]){let k=`Library '${e}' not found`;return{saved:!1,diagnostics:[{Severity:2,Message:k}],errors:[k],outResult:"",outMsg:"",raw:null,newBody:null}}let c=u.EfxFunction?.find(k=>k.FunctionID===n);if(!c){let k=`Function '${n}' not found in library '${e}'`;return{saved:!1,diagnostics:[{Severity:2,Message:k}],errors:[k],outResult:"",outMsg:"",raw:null,newBody:null}}let m={...u.EfxLibrary[0],RowMod:"U"},y={...c,Code:r,Usings:o||"",Body:"",RowMod:"U"},b={EfxLibrary:[m],EfxFunction:[y]},d;try{d=await this.request(this.getEfxUrl(i,a),{inFunctionID:n,inDS:b})}catch(k){if(/HTTP 404/.test(k.message))try{let T=await this.validateFunctionRaw(e,n,r,o);return{saved:T.saved,diagnostics:T.diagnostics||[],errors:T.saved?[]:T.diagnostics?.map(N=>N.Message||String(N))||["Save failed"],outResult:T.saved?"Success":"",outMsg:T.saved?"Saved Successfully":"Save failed",raw:null,newBody:T.saved?T.newBody:null}}catch(T){let N=T.message||String(T);return{saved:!1,diagnostics:[{Severity:2,Message:N}],errors:[N],outResult:"",outMsg:N,raw:null,newBody:null}}throw k}let l=d?.outMsg??d?.parameters?.outMsg??"",p=d?.outResult??d?.parameters?.outResult??"",w=d?.outSuccess??d?.parameters?.outSuccess??!1,v=[],h=new Set,g=k=>{let T=k.trim();T&&!h.has(T)&&(h.add(T),v.push(T))};for(let k of String(l).split(/\r?\n/)){let T=k.match(/^Error:\s*(.+)$/i);if(T){g(T[1]);continue}/\(\d+,\d+\):\s*(?:error|warning)\s+CS/i.test(k)&&g(k)}let E=v.filter(k=>!/\(\d+,\d+\):\s*warning\s+CS/i.test(k)),x=w===!0||E.length===0&&/Saved Successfully/i.test(l),C=v.map(k=>{let T=k.match(/\((\d+),(\d+)\):\s*(?:error|warning)/i)||k.match(/\((\d+),(\d+)\)/)||k.match(/\bline\s+(\d+)/i);return{Severity:/\(\d+,\d+\):\s*warning\s+CS/i.test(k)?1:2,Message:k,Line:T?parseInt(T[1],10):void 0,Column:T&&T[2]!==void 0?parseInt(T[2],10):void 0}}),D=String(r).split(/\r?\n/),A=new Map;for(let k of C){if(!k.Line||!k.Column)continue;let T=k.Message.match(/'([^']+)'/);if(!(!T||!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(T[1]))){for(let N=0;N<D.length;N++)if(D[N].slice(k.Column-1).startsWith(T[1])){let _=k.Line-(N+1);_>=0&&A.set(_,(A.get(_)||0)+1)}}}let I=0,S=0,L=!1;for(let[k,T]of A)T>S?(S=T,I=k,L=!1):T===S&&k!==I&&(L=!0);if(S>0&&!L&&I>0)for(let k of C)k.Line&&(k.Line=Math.max(1,k.Line-I));return{saved:x,diagnostics:C,errors:v,outResult:p,outMsg:l,raw:d,newBody:t.packCode(r,o||"")}}_patchFunctionBody(e,n,r,o){let i=`"FunctionID":${JSON.stringify(n)}`,a=JSON.stringify(r),s=this._setParentLibraryRowMod(e,o),u=s.indexOf('"EfxFunction":[');if(u<0)throw new Error("EfxFunction array not found");let m=s.indexOf("[",u)+1;for(;m<s.length;){let y=s.indexOf("{",m);if(y<0)break;let b=this._findJsonObjectEnd(s,y,"EfxFunction row"),d=s.slice(y,b+1);if(!d.includes(i)){m=b+1;continue}let l=this._replaceJsonStringValue(d,"Body",a);return l=this._replaceJsonStringValue(l,"RowMod",JSON.stringify(o)),s.slice(0,y)+l+s.slice(b+1)}throw new Error(`Function ${n} not found in raw tableset`)}_setParentLibraryRowMod(e,n){let r=e.indexOf('"EfxLibrary":[');if(r<0)throw new Error("EfxLibrary array not found");let o=e.indexOf("[",r),i=e.indexOf("{",o);if(i<0)throw new Error("No EfxLibrary row found");let a=this._findJsonObjectEnd(e,i,"EfxLibrary row"),s=e.slice(i,a+1),u=this._replaceJsonStringValue(s,"RowMod",JSON.stringify(n));return e.slice(0,i)+u+e.slice(a+1)}_findJsonObjectEnd(e,n,r){let o=0,i=!1,a=!1;for(let s=n;s<e.length;s++){let u=e[s];if(i){if(a){a=!1;continue}if(u==="\\"){a=!0;continue}u==='"'&&(i=!1);continue}if(u==='"'){i=!0;continue}if(u==="{")o++;else if(u==="}"&&(o--,o===0))return s}throw new Error(`Malformed ${r}`)}_replaceJsonStringValue(e,n,r){let o=`"${n}":`,i=e.lastIndexOf(o);if(i<0)throw new Error(`${n} not found in object`);let a=i+o.length;for(;/\s/.test(e[a]||"");)a++;if(e[a]!=='"')throw new Error(`${n} value is not a JSON string`);let s=a+1,u=!1;for(;s<e.length;s++){let c=e[s];if(u){u=!1;continue}if(c==="\\"){u=!0;continue}if(c==='"')break}return e.slice(0,a)+r+e.slice(s+1)}async executeFunction(e,n,r,o,i=!1){let a=this.getEfxUrl(e,n,o,i);return this.request(a,r)}async saveSignatures(e,n,r){let o=await this.getLibraryRaw(e),i=JSON.parse(o);if(!i?.EfxLibrary?.[0])throw new Error(`Library '${e}' not found`);if(!i.EfxFunction?.find(g=>g.FunctionID===n))throw new Error(`Function '${n}' not found in library '${e}'`);let a=(i.EfxFunctionSignature||[]).filter(g=>g.FunctionID===n),s=(i.EfxFunctionSignature||[]).reduce((g,E)=>Math.max(g,E.ParameterID||0),0)+1,c=o.indexOf('"EfxFunctionSignature":[');if(c<0)throw new Error("EfxFunctionSignature array not found");let m=o.indexOf("[",c),y=this._rawFindClose(o,m,"[","]"),b=[],d=m+1;for(;d<y;){let g=o.indexOf("{",d);if(g<0||g>=y)break;let E=this._rawFindClose(o,g,"{","}");if(E<0||E>=y)break;let x=o.slice(g,E+1),C=null;try{C=JSON.parse(x)}catch{}b.push({objStr:x,sigData:C}),d=E+1}let l=[];for(let{objStr:g,sigData:E}of b)(!E||E.FunctionID!==n)&&l.push(g);for(let g of r){let E=a.find(x=>x.ArgumentName===g.ArgumentName&&!!x.Response==!!g.Response);if(E){let{objStr:x}=b.find(D=>D.sigData?.ArgumentName===E.ArgumentName&&!!D.sigData?.Response==!!E.Response)||{};if(!x)continue;if(!(E.DataType!==(g.DataType??E.DataType)||E.DataTypeInfo!==(g.DataTypeInfo??E.DataTypeInfo)||!!E.Optional!=!!(g.Optional??E.Optional)||E.DefaultValue!==(g.DefaultValue??E.DefaultValue)||E.Order!==(g.Order??E.Order)))l.push(x);else{let D=x;D=this._rawSetStringProp(D,"DataType",g.DataType??E.DataType),D=this._rawSetStringProp(D,"DataTypeInfo",g.DataTypeInfo??E.DataTypeInfo??""),D=this._rawSetBoolProp(D,"Optional",g.Optional??E.Optional??!1),D=this._rawSetStringProp(D,"DefaultValue",g.DefaultValue??E.DefaultValue??""),D=this._rawSetIntProp(D,"Order",g.Order??E.Order),D=this._rawSetStringProp(D,"RowMod","U"),l.push(x),l.push(D)}}else{let x={LibraryID:e,FunctionID:n,Response:!!g.Response,ParameterID:s++,ArgumentName:g.ArgumentName,Order:g.Order??l.length,DataType:g.DataType||"System.String",DataTypeInfo:g.DataTypeInfo||"",Optional:g.Optional??!1,DefaultValue:g.DefaultValue??"",SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",BitFlag:0,RowMod:"A"};l.push(JSON.stringify(x))}}for(let g of a)if(!r.some(x=>x.ArgumentName===g.ArgumentName&&!!x.Response==!!g.Response)){let{objStr:x}=b.find(D=>D.sigData?.ArgumentName===g.ArgumentName&&!!D.sigData?.Response==!!g.Response)||{};if(!x)continue;let C=this._rawSetStringProp(x,"RowMod","D");l.push(x),l.push(C)}let p=o.slice(0,m+1)+l.join(",")+o.slice(y);p=this._setParentLibraryRowMod(p,"U"),p=this._setEfxFunctionRowMod(p,n,"U"),JSON.parse(p);let w=await this.applyChangesRaw(p),v=(w.diagnostics||[]).some(g=>typeof g=="object"?(g.Severity??2)>=2:/\berror\b/i.test(String(g))),h=r.map((g,E)=>{let x=a.find(C=>C.ArgumentName===g.ArgumentName&&!!C.Response==!!g.Response);return x?{...x,DataType:g.DataType??x.DataType,DataTypeInfo:g.DataTypeInfo??x.DataTypeInfo??"",Optional:g.Optional??x.Optional??!1,DefaultValue:g.DefaultValue??x.DefaultValue??"",Order:g.Order??E}:{LibraryID:e,FunctionID:n,Response:!!g.Response,ArgumentName:g.ArgumentName,DataType:g.DataType||"System.String",DataTypeInfo:g.DataTypeInfo||"",Optional:g.Optional??!1,DefaultValue:g.DefaultValue??"",Order:g.Order??E}});return{saved:!v,diagnostics:w.diagnostics||[],updatedSigs:h}}_rawFindClose(e,n,r,o){let i=0,a=!1,s=!1;for(let u=n;u<e.length;u++){let c=e[u];if(a){if(s){s=!1;continue}if(c==="\\"){s=!0;continue}c==='"'&&(a=!1);continue}if(c==='"'){a=!0;continue}if(c===r)i++;else if(c===o&&(i--,i===0))return u}return-1}_rawSetStringProp(e,n,r){let o=`"${n}":`,i=e.indexOf(o);if(i<0)throw new Error(`Property "${n}" not found`);let a=i+o.length;for(;e[a]===" ";)a++;let s;if(e[a]==='"'){s=a+1;let u=!1;for(;s<e.length;s++){let c=e[s];if(u){u=!1;continue}if(c==="\\"){u=!0;continue}if(c==='"'){s++;break}}}else for(s=a;s<e.length&&e[s]!==","&&e[s]!=="}"&&e[s]!==" "&&e[s]!==`
`&&e[s]!=="\r";)s++;return e.slice(0,a)+JSON.stringify(r)+e.slice(s)}_rawSetBoolProp(e,n,r){let o=`"${n}":`,i=e.indexOf(o);if(i<0)throw new Error(`Property "${n}" not found`);let a=i+o.length;for(;e[a]===" ";)a++;let s=a;for(;s<e.length&&e[s]!==","&&e[s]!=="}"&&e[s]!==" ";)s++;return e.slice(0,a)+(r?"true":"false")+e.slice(s)}_rawSetIntProp(e,n,r){let o=`"${n}":`,i=e.indexOf(o);if(i<0)throw new Error(`Property "${n}" not found`);let a=i+o.length;for(;e[a]===" ";)a++;let s=a;for(;s<e.length&&e[s]!==","&&e[s]!=="}"&&e[s]!==" ";)s++;return e.slice(0,a)+String(Math.floor(r))+e.slice(s)}_setEfxFunctionRowMod(e,n,r){let o=`"FunctionID":${JSON.stringify(n)}`,i=e.indexOf('"EfxFunction":[');if(i<0)throw new Error("EfxFunction array not found");let s=e.indexOf("[",i)+1;for(;s<e.length;){let u=e.indexOf("{",s);if(u<0)break;let c=this._findJsonObjectEnd(e,u,"EfxFunction row"),m=e.slice(u,c+1);if(m.includes(o)){let y=this._replaceJsonStringValue(m,"RowMod",JSON.stringify(r));return e.slice(0,u)+y+e.slice(c+1)}s=c+1}throw new Error(`EfxFunction row for '${n}' not found`)}static extractCode(e){try{let n=JSON.parse(e);return{code:n.Code||"",usings:n.Usings||""}}catch{return{code:e,usings:""}}}static packCode(e,n=""){return JSON.stringify({Code:e,Usings:n})}};Ie.EpicorClient=or});var Qe=K(le=>{"use strict";function Na(t,e,n){if(n===void 0&&(n=Array.prototype),t&&typeof n.find=="function")return n.find.call(t,e);for(var r=0;r<t.length;r++)if(Xe(t,r)){var o=t[r];if(e.call(void 0,o,r,t))return o}}function ct(t,e){return e===void 0&&(e=Object),e&&typeof e.getOwnPropertyDescriptors=="function"&&(t=e.create(null,e.getOwnPropertyDescriptors(t))),e&&typeof e.freeze=="function"?e.freeze(t):t}function Xe(t,e){return Object.prototype.hasOwnProperty.call(t,e)}function Ba(t,e){if(t===null||typeof t!="object")throw new TypeError("target is not an object");for(var n in e)Xe(e,n)&&(t[n]=e[n]);return t}var Qr=ct({allowfullscreen:!0,async:!0,autofocus:!0,autoplay:!0,checked:!0,controls:!0,default:!0,defer:!0,disabled:!0,formnovalidate:!0,hidden:!0,ismap:!0,itemscope:!0,loop:!0,multiple:!0,muted:!0,nomodule:!0,novalidate:!0,open:!0,playsinline:!0,readonly:!0,required:!0,reversed:!0,selected:!0});function La(t){return Xe(Qr,t.toLowerCase())}var Zr=ct({area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function Oa(t){return Xe(Zr,t.toLowerCase())}var Rt=ct({script:!1,style:!1,textarea:!0,title:!0});function $a(t){var e=t.toLowerCase();return Xe(Rt,e)&&!Rt[e]}function _a(t){var e=t.toLowerCase();return Xe(Rt,e)&&Rt[e]}function eo(t){return t===Ut.HTML}function Fa(t){return eo(t)||t===Ut.XML_XHTML_APPLICATION}var Ut=ct({HTML:"text/html",XML_APPLICATION:"application/xml",XML_TEXT:"text/xml",XML_XHTML_APPLICATION:"application/xhtml+xml",XML_SVG_IMAGE:"image/svg+xml"}),Ma=Object.keys(Ut).map(function(t){return Ut[t]});function Pa(t){return Ma.indexOf(t)>-1}var Ra=ct({HTML:"http://www.w3.org/1999/xhtml",SVG:"http://www.w3.org/2000/svg",XML:"http://www.w3.org/XML/1998/namespace",XMLNS:"http://www.w3.org/2000/xmlns/"});le.assign=Ba;le.find=Na;le.freeze=ct;le.HTML_BOOLEAN_ATTRIBUTES=Qr;le.HTML_RAW_TEXT_ELEMENTS=Rt;le.HTML_VOID_ELEMENTS=Zr;le.hasDefaultHTMLNamespace=Fa;le.hasOwn=Xe;le.isHTMLBooleanAttribute=La;le.isHTMLRawTextElement=$a;le.isHTMLEscapableRawTextElement=_a;le.isHTMLMimeType=eo;le.isHTMLVoidElement=Oa;le.isValidMimeType=Pa;le.MIME_TYPE=Ut;le.NAMESPACE=Ra});var Vt=K(Wt=>{"use strict";var Ua=Qe();function no(t,e){t.prototype=Object.create(Error.prototype,{constructor:{value:t},name:{value:t.name,enumerable:!0,writable:e}})}var jt=Ua.freeze({Error:"Error",IndexSizeError:"IndexSizeError",DomstringSizeError:"DomstringSizeError",HierarchyRequestError:"HierarchyRequestError",WrongDocumentError:"WrongDocumentError",InvalidCharacterError:"InvalidCharacterError",NoDataAllowedError:"NoDataAllowedError",NoModificationAllowedError:"NoModificationAllowedError",NotFoundError:"NotFoundError",NotSupportedError:"NotSupportedError",InUseAttributeError:"InUseAttributeError",InvalidStateError:"InvalidStateError",SyntaxError:"SyntaxError",InvalidModificationError:"InvalidModificationError",NamespaceError:"NamespaceError",InvalidAccessError:"InvalidAccessError",ValidationError:"ValidationError",TypeMismatchError:"TypeMismatchError",SecurityError:"SecurityError",NetworkError:"NetworkError",AbortError:"AbortError",URLMismatchError:"URLMismatchError",QuotaExceededError:"QuotaExceededError",TimeoutError:"TimeoutError",InvalidNodeTypeError:"InvalidNodeTypeError",DataCloneError:"DataCloneError",EncodingError:"EncodingError",NotReadableError:"NotReadableError",UnknownError:"UnknownError",ConstraintError:"ConstraintError",DataError:"DataError",TransactionInactiveError:"TransactionInactiveError",ReadOnlyError:"ReadOnlyError",VersionError:"VersionError",OperationError:"OperationError",NotAllowedError:"NotAllowedError",OptOutError:"OptOutError"}),ro=Object.keys(jt);function oo(t){return typeof t=="number"&&t>=1&&t<=25}function qa(t){return typeof t=="string"&&t.substring(t.length-jt.Error.length)===jt.Error}function Ht(t,e){oo(t)?(this.name=ro[t],this.message=e||""):(this.message=t,this.name=qa(e)?e:jt.Error),Error.captureStackTrace&&Error.captureStackTrace(this,Ht)}no(Ht,!0);Object.defineProperties(Ht.prototype,{code:{enumerable:!0,get:function(){var t=ro.indexOf(this.name);return oo(t)?t:0}}});var io={INDEX_SIZE_ERR:1,DOMSTRING_SIZE_ERR:2,HIERARCHY_REQUEST_ERR:3,WRONG_DOCUMENT_ERR:4,INVALID_CHARACTER_ERR:5,NO_DATA_ALLOWED_ERR:6,NO_MODIFICATION_ALLOWED_ERR:7,NOT_FOUND_ERR:8,NOT_SUPPORTED_ERR:9,INUSE_ATTRIBUTE_ERR:10,INVALID_STATE_ERR:11,SYNTAX_ERR:12,INVALID_MODIFICATION_ERR:13,NAMESPACE_ERR:14,INVALID_ACCESS_ERR:15,VALIDATION_ERR:16,TYPE_MISMATCH_ERR:17,SECURITY_ERR:18,NETWORK_ERR:19,ABORT_ERR:20,URL_MISMATCH_ERR:21,QUOTA_EXCEEDED_ERR:22,TIMEOUT_ERR:23,INVALID_NODE_TYPE_ERR:24,DATA_CLONE_ERR:25},ar=Object.entries(io);for(qt=0;qt<ar.length;qt++)to=ar[qt][0],Ht[to]=ar[qt][1];var to,qt;function sr(t,e){this.message=t,this.locator=e,Error.captureStackTrace&&Error.captureStackTrace(this,sr)}no(sr);Wt.DOMException=Ht;Wt.DOMExceptionName=jt;Wt.ExceptionCode=io;Wt.ParseError=sr});var mr=K(M=>{"use strict";function fo(t){try{typeof t!="function"&&(t=RegExp);var e=new t("\u{1D306}","u").exec("\u{1D306}");return!!e&&e[0].length===2}catch{}return!1}var dt=fo();function je(t){if(t.source[0]!=="[")throw new Error(t+" can not be used with chars");return t.source.slice(1,t.source.lastIndexOf("]"))}function lt(t,e){if(t.source[0]!=="[")throw new Error("/"+t.source+"/ can not be used with chars_without");if(!e||typeof e!="string")throw new Error(JSON.stringify(e)+" is not a valid search");if(t.source.indexOf(e)===-1)throw new Error('"'+e+'" is not is /'+t.source+"/");if(e==="-"&&t.source.indexOf(e)!==1)throw new Error('"'+e+'" is not at the first postion of /'+t.source+"/");return new RegExp(t.source.replace(e,""),dt?"u":"")}function R(t){var e=this;return new RegExp(Array.prototype.slice.call(arguments).map(function(n){var r=typeof n=="string";if(r&&e===void 0&&n==="|")throw new Error("use regg instead of reg to wrap expressions with `|`!");return r?n:n.source}).join(""),dt?"mu":"m")}function F(t){if(arguments.length===0)throw new Error("no parameters provided");return R.apply(F,["(?:"].concat(Array.prototype.slice.call(arguments),[")"]))}var ja="\uFFFD",He=/[-\x09\x0A\x0D\x20-\x2C\x2E-\uD7FF\uE000-\uFFFD]/;dt&&(He=R("[",je(He),"\\u{10000}-\\u{10FFFF}","]"));var Ha=new RegExp("[^"+je(He)+"]",dt?"u":""),lr=/[\x20\x09\x0D\x0A]/,Wa=je(lr),z=R(lr,"+"),Q=R(lr,"*"),zt=/[:_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;dt&&(zt=R("[",je(zt),"\\u{10000}-\\u{10FFFF}","]"));var Va=je(zt),ur=R("[",Va,je(/[-.0-9\xB7]/),je(/[\u0300-\u036F\u203F-\u2040]/),"]"),De=R(zt,ur,"*"),ao=R(ur,"+"),za=R("&",De,";"),Ya=F(/&#[0-9]+;|&#x[0-9a-fA-F]+;/),Yt=F(za,"|",Ya),Gt=R("%",De,";"),dr=F(R('"',F(/[^%&"]/,"|",Gt,"|",Yt),"*",'"'),"|",R("'",F(/[^%&']/,"|",Gt,"|",Yt),"*","'")),Ga=F('"',F(/[^<&"]/,"|",Yt),"*",'"',"|","'",F(/[^<&']/,"|",Yt),"*","'"),Ka=lt(zt,":"),Ja=lt(ur,":"),so=R(Ka,Ja,"*"),Kt=R(so,F(":",so),"?"),Xa=R("^",Kt,"$"),Qa=R("(",Kt,")"),ut=F(/"[^"]*"|'[^']*'/),Za=R(/^<\?/,"(",De,")",F(z,"(",He,"*?)"),"?",/\?>/),co=/[\x20\x0D\x0Aa-zA-Z0-9-'()+,./:=?;!*#@$_%]/,Jt=F('"',co,'*"',"|","'",lt(co,"'"),"*'"),mo="<!--",go="-->",es=R(mo,F(lt(He,"-"),"|",R("-",lt(He,"-"))),"*",go),lo="#PCDATA",ts=F(R(/\(/,Q,lo,F(Q,/\|/,Q,Kt),"*",Q,/\)\*/),"|",R(/\(/,Q,lo,Q,/\)/)),ns=/[?*+]?/,rs=R(/\([^>]+\)/,ns),os=F("EMPTY","|","ANY","|",ts,"|",rs),is="<!ELEMENT",as=R(is,z,F(Kt,"|",Gt),z,F(os,"|",Gt),Q,">"),ss=R("NOTATION",z,/\(/,Q,De,F(Q,/\|/,Q,De),"*",Q,/\)/),cs=R(/\(/,Q,ao,F(Q,/\|/,Q,ao),"*",Q,/\)/),ls=F(ss,"|",cs),us=F(/CDATA|ID|IDREF|IDREFS|ENTITY|ENTITIES|NMTOKEN|NMTOKENS/,"|",ls),ds=F(/#REQUIRED|#IMPLIED/,"|",F(F("#FIXED",z),"?",Ga)),ps=F(z,De,z,us,z,ds),fs="<!ATTLIST",ms=R(fs,z,De,ps,"*",Q,">"),cr="about:legacy-compat",gs=F('"'+cr+'"',"|","'"+cr+"'"),pr="SYSTEM",hn="PUBLIC",bn=F(F(pr,z,ut),"|",F(hn,z,Jt,z,ut)),hs=R("^",F(F(pr,z,"(?<SystemLiteralOnly>",ut,")"),"|",F(hn,z,"(?<PubidLiteral>",Jt,")",z,"(?<SystemLiteral>",ut,")"))),bs=R("^",Jt,"$"),ys=R("^",ut,"$"),vs=F(z,"NDATA",z,De),ws=F(dr,"|",F(bn,vs,"?")),ho="<!ENTITY",Es=R(ho,z,De,z,ws,Q,">"),xs=F(dr,"|",bn),Ds=R(ho,z,"%",z,De,z,xs,Q,">"),Cs=F(Es,"|",Ds),As=R(hn,z,Jt),ks=R("<!NOTATION",z,De,z,F(bn,"|",As),Q,">"),fr=R(Q,"=",Q),uo=/1[.]\d+/,Ss=R(z,"version",fr,F("'",uo,"'","|",'"',uo,'"')),po=/[A-Za-z][-A-Za-z0-9._]*/,Ts=F(z,"encoding",fr,F('"',po,'"',"|","'",po,"'")),Is=F(z,"standalone",fr,F("'",F("yes","|","no"),"'","|",'"',F("yes","|","no"),'"')),Ns=R(/^<\?xml/,Ss,Ts,"?",Is,"?",Q,/\?>/),Bs="<!DOCTYPE",Ls="<![CDATA[",Os="]]>",$s=/<!\[CDATA\[/,_s=/\]\]>/,Fs=R(He,"*?",_s),Ms=R($s,Fs);M.chars=je;M.chars_without=lt;M.detectUnicodeSupport=fo;M.reg=R;M.regg=F;M.ABOUT_LEGACY_COMPAT=cr;M.ABOUT_LEGACY_COMPAT_SystemLiteral=gs;M.AttlistDecl=ms;M.CDATA_START=Ls;M.CDATA_END=Os;M.CDSect=Ms;M.Char=He;M.Comment=es;M.COMMENT_START=mo;M.COMMENT_END=go;M.DOCTYPE_DECL_START=Bs;M.elementdecl=as;M.EntityDecl=Cs;M.EntityValue=dr;M.ExternalID=bn;M.ExternalID_match=hs;M.Name=De;M.NotationDecl=ks;M.Reference=Yt;M.PEReference=Gt;M.PI=Za;M.PUBLIC=hn;M.PubidLiteral=Jt;M.PubidLiteral_match=bs;M.QName=Kt;M.QName_exact=Xa;M.QName_group=Qa;M.S=z;M.SChar_s=Wa;M.S_OPT=Q;M.SYSTEM=pr;M.SystemLiteral=ut;M.SystemLiteral_match=ys;M.InvalidChar=Ha;M.UNICODE_REPLACEMENT_CHARACTER=ja;M.UNICODE_SUPPORT=dt;M.XMLDecl=Ns});var xr=K(te=>{"use strict";var ke=Qe(),Be=ke.find,Ps=ke.hasDefaultHTMLNamespace,ft=ke.hasOwn,Rs=ke.isHTMLMimeType,Us=ke.isHTMLRawTextElement,qs=ke.isHTMLVoidElement,Xt=ke.MIME_TYPE,Le=ke.NAMESPACE,ge=Symbol(),Do=Vt(),O=Do.DOMException,Ce=Do.DOMExceptionName,ue=mr();function be(t){if(t!==ge)throw new TypeError("Illegal constructor")}function js(t){return t!==""}function Hs(t){return t?t.split(/[\t\n\f\r ]+/).filter(js):[]}function Ws(t,e){return ft(t,e)||(t[e]=!0),t}function bo(t){if(!t)return[];var e=Hs(t);return Object.keys(e.reduce(Ws,{}))}function Vs(t){return function(e){return t&&t.indexOf(e)!==-1}}function Co(t){if(!ue.QName_exact.test(t))throw new O(O.INVALID_CHARACTER_ERR,'invalid character in qualified name "'+t+'"')}function hr(t,e){Co(e),t=t||null;var n=null,r=e;if(e.indexOf(":")>=0){var o=e.split(":");n=o[0],r=o[1]}if(n!==null&&t===null)throw new O(O.NAMESPACE_ERR,"prefix is non-null and namespace is null");if(n==="xml"&&t!==ke.NAMESPACE.XML)throw new O(O.NAMESPACE_ERR,'prefix is "xml" and namespace is not the XML namespace');if((n==="xmlns"||e==="xmlns")&&t!==ke.NAMESPACE.XMLNS)throw new O(O.NAMESPACE_ERR,'either qualifiedName or prefix is "xmlns" and namespace is not the XMLNS namespace');if(t===ke.NAMESPACE.XMLNS&&n!=="xmlns"&&e!=="xmlns")throw new O(O.NAMESPACE_ERR,'namespace is the XMLNS namespace and neither qualifiedName nor prefix is "xmlns"');return[t,n,r]}function ht(t,e){for(var n in t)ft(t,n)&&(e[n]=t[n])}function ye(t,e){var n=t.prototype;if(!(n instanceof e)){let r=function(){};r.prototype=e.prototype,r=new r,ht(n,r),t.prototype=n=r}n.constructor!=t&&(typeof t!="function"&&console.error("unknown Class:"+t),n.constructor=t)}var ve={},Ae=ve.ELEMENT_NODE=1,mt=ve.ATTRIBUTE_NODE=2,wn=ve.TEXT_NODE=3,Ao=ve.CDATA_SECTION_NODE=4,ko=ve.ENTITY_REFERENCE_NODE=5,zs=ve.ENTITY_NODE=6,br=ve.PROCESSING_INSTRUCTION_NODE=7,yr=ve.COMMENT_NODE=8,pt=ve.DOCUMENT_NODE=9,So=ve.DOCUMENT_TYPE_NODE=10,We=ve.DOCUMENT_FRAGMENT_NODE=11,Ys=ve.NOTATION_NODE=12,ee=ke.freeze({DOCUMENT_POSITION_DISCONNECTED:1,DOCUMENT_POSITION_PRECEDING:2,DOCUMENT_POSITION_FOLLOWING:4,DOCUMENT_POSITION_CONTAINS:8,DOCUMENT_POSITION_CONTAINED_BY:16,DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:32});function To(t,e){if(e.length<t.length)return To(e,t);var n=null;for(var r in t){if(t[r]!==e[r])return n;n=t[r]}return n}function yo(t){return t.guid||(t.guid=Math.random()),t.guid}function ie(){}ie.prototype={length:0,item:function(t){return t>=0&&t<this.length?this[t]:null},toString:function(t){var e;typeof t=="function"?e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:t}:t?e={requireWellFormed:!!t.requireWellFormed,splitCDATASections:t.splitCDATASections!==!1,nodeFilter:t.nodeFilter||null}:e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:null};for(var n=[],r=0;r<this.length;r++)Er(this[r],n,null,e);return n.join("")},filter:function(t){return Array.prototype.filter.call(this,t)},indexOf:function(t){return Array.prototype.indexOf.call(this,t)}};ie.prototype[Symbol.iterator]=function(){var t=this,e=0;return{next:function(){return e<t.length?{value:t[e++],done:!1}:{done:!0}},return:function(){return{done:!0}}}};function Ne(t,e){this._node=t,this._refresh=e,xn(this)}function xn(t){var e=t._node._inc||t._node.ownerDocument._inc;if(t._inc!==e){var n=t._refresh(t._node);if(Uo(t,"length",n.length),!t.$$length||n.length<t.$$length)for(var r=n.length;r in t;r++)ft(t,r)&&delete t[r];ht(n,t),t._inc=e}}Ne.prototype.item=function(t){return xn(this),this[t]||null};ye(Ne,ie);function gt(){}function Io(t,e){for(var n=0;n<t.length;){if(t[n]===e)return n;n++}}function Gs(t,e,n,r){if(r?e[Io(e,r)]=n:(e[e.length]=n,e.length++),t){n.ownerElement=t;var o=t.ownerDocument;o&&(r&&Lo(o,t,r),Ks(o,t,n))}}function vo(t,e,n){var r=Io(e,n);if(r>=0){for(var o=e.length-1;r<=o;)e[r]=e[++r];if(e.length=o,t){var i=t.ownerDocument;i&&Lo(i,t,n),n.ownerElement=null}}}gt.prototype={length:0,item:ie.prototype.item,getNamedItem:function(t){this._ownerElement&&this._ownerElement._isInHTMLDocumentAndNamespace()&&(t=t.toLowerCase());for(var e=0;e<this.length;){var n=this[e];if(n.nodeName===t)return n;e++}return null},setNamedItem:function(t){var e=t.ownerElement;if(e&&e!==this._ownerElement)throw new O(O.INUSE_ATTRIBUTE_ERR);var n=this.getNamedItemNS(t.namespaceURI,t.localName);return n===t?t:(Gs(this._ownerElement,this,t,n),n)},setNamedItemNS:function(t){return this.setNamedItem(t)},removeNamedItem:function(t){var e=this.getNamedItem(t);if(!e)throw new O(O.NOT_FOUND_ERR,t);return vo(this._ownerElement,this,e),e},removeNamedItemNS:function(t,e){var n=this.getNamedItemNS(t,e);if(!n)throw new O(O.NOT_FOUND_ERR,t?t+" : "+e:e);return vo(this._ownerElement,this,n),n},getNamedItemNS:function(t,e){t||(t=null);for(var n=0;n<this.length;){var r=this[n];if(r.localName===e&&r.namespaceURI===t)return r;n++}return null}};gt.prototype[Symbol.iterator]=function(){var t=this,e=0;return{next:function(){return e<t.length?{value:t[e++],done:!1}:{done:!0}},return:function(){return{done:!0}}}};function No(){}No.prototype={hasFeature:function(t,e){return!0},createDocument:function(t,e,n){var r=Xt.XML_APPLICATION;t===Le.HTML?r=Xt.XML_XHTML_APPLICATION:t===Le.SVG&&(r=Xt.XML_SVG_IMAGE);var o=new Pe(ge,{contentType:r});if(o.implementation=this,o.childNodes=new ie,o.doctype=n||null,n&&o.appendChild(n),e){var i=o.createElementNS(t,e);o.appendChild(i)}return o},createDocumentType:function(t,e,n,r){Co(t);var o=new An(ge);return o.name=t,o.nodeName=t,o.publicId=e||"",o.systemId=n||"",o.internalSubset=r||"",o.childNodes=new ie,o},createHTMLDocument:function(t){var e=new Pe(ge,{contentType:Xt.HTML});if(e.implementation=this,e.childNodes=new ie,t!==!1){e.doctype=this.createDocumentType("html"),e.doctype.ownerDocument=e,e.appendChild(e.doctype);var n=e.createElement("html");e.appendChild(n);var r=e.createElement("head");if(n.appendChild(r),typeof t=="string"){var o=e.createElement("title");o.appendChild(e.createTextNode(t)),r.appendChild(o)}n.appendChild(e.createElement("body"))}return e}};function j(t){be(t)}j.prototype={firstChild:null,lastChild:null,previousSibling:null,nextSibling:null,parentNode:null,get parentElement(){return this.parentNode&&this.parentNode.nodeType===this.ELEMENT_NODE?this.parentNode:null},childNodes:null,ownerDocument:null,nodeValue:null,namespaceURI:null,prefix:null,localName:null,baseURI:"about:blank",get isConnected(){var t=this.getRootNode();return t&&t.nodeType===t.DOCUMENT_NODE},contains:function(t){if(!t)return!1;var e=t;do{if(this===e)return!0;e=e.parentNode}while(e);return!1},getRootNode:function(t){var e=this;do{if(!e.parentNode)return e;e=e.parentNode}while(e)},isEqualNode:function(t){if(!t)return!1;for(var e=[{node:this,other:t}];e.length>0;){var n=e.pop(),r=n.node,o=n.other;if(r.nodeType!==o.nodeType)return!1;switch(r.nodeType){case r.DOCUMENT_TYPE_NODE:if(r.name!==o.name||r.publicId!==o.publicId||r.systemId!==o.systemId)return!1;break;case r.ELEMENT_NODE:if(r.namespaceURI!==o.namespaceURI||r.prefix!==o.prefix||r.localName!==o.localName||r.attributes.length!==o.attributes.length)return!1;for(var i=0;i<r.attributes.length;i++){var a=r.attributes.item(i),s=o.getAttributeNodeNS(a.namespaceURI,a.localName);if(!s)return!1;e.push({node:a,other:s})}break;case r.ATTRIBUTE_NODE:if(r.namespaceURI!==o.namespaceURI||r.localName!==o.localName||r.value!==o.value)return!1;break;case r.PROCESSING_INSTRUCTION_NODE:if(r.target!==o.target||r.data!==o.data)return!1;break;case r.TEXT_NODE:case r.CDATA_SECTION_NODE:case r.COMMENT_NODE:if(r.data!==o.data)return!1;break}if(r.childNodes.length!==o.childNodes.length)return!1;for(var i=r.childNodes.length-1;i>=0;i--)e.push({node:r.childNodes[i],other:o.childNodes[i]})}return!0},isSameNode:function(t){return this===t},insertBefore:function(t,e){return En(this,t,e)},replaceChild:function(t,e){En(this,t,e,Fo),e&&this.removeChild(e)},removeChild:function(t){return $o(this,t)},appendChild:function(t){return this.insertBefore(t,null)},hasChildNodes:function(){return this.firstChild!=null},cloneNode:function(t){return Ro(this.ownerDocument||this,this,t)},normalize:function(){de(this,null,{enter:function(t){for(var e=t.firstChild;e;){var n=e.nextSibling;n!==null&&n.nodeType===wn&&e.nodeType===wn?(t.removeChild(n),e.appendData(n.data)):e=n}return!0}})},isSupported:function(t,e){return this.ownerDocument.implementation.hasFeature(t,e)},lookupPrefix:function(t){for(var e=this;e;){var n=e._nsMap;if(n){for(var r in n)if(ft(n,r)&&n[r]===t)return r}e=e.nodeType==mt?e.ownerDocument:e.parentNode}return null},lookupNamespaceURI:function(t){for(var e=this;e;){var n=e._nsMap;if(n&&ft(n,t))return n[t];e=e.nodeType==mt?e.ownerDocument:e.parentNode}return null},isDefaultNamespace:function(t){var e=this.lookupPrefix(t);return e==null},compareDocumentPosition:function(t){if(this===t)return 0;var e=t,n=this,r=null,o=null;if(e instanceof Ze&&(r=e,e=r.ownerElement),n instanceof Ze&&(o=n,n=o.ownerElement,r&&e&&n===e))for(var i=0,a;a=n.attributes[i];i++){if(a===r)return ee.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC+ee.DOCUMENT_POSITION_PRECEDING;if(a===o)return ee.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC+ee.DOCUMENT_POSITION_FOLLOWING}if(!e||!n||n.ownerDocument!==e.ownerDocument)return ee.DOCUMENT_POSITION_DISCONNECTED+ee.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC+(yo(n.ownerDocument)>yo(e.ownerDocument)?ee.DOCUMENT_POSITION_FOLLOWING:ee.DOCUMENT_POSITION_PRECEDING);if(o&&e===n)return ee.DOCUMENT_POSITION_CONTAINS+ee.DOCUMENT_POSITION_PRECEDING;if(r&&e===n)return ee.DOCUMENT_POSITION_CONTAINED_BY+ee.DOCUMENT_POSITION_FOLLOWING;for(var s=[],u=e.parentNode;u;){if(!o&&u===n)return ee.DOCUMENT_POSITION_CONTAINED_BY+ee.DOCUMENT_POSITION_FOLLOWING;s.push(u),u=u.parentNode}s.reverse();for(var c=[],m=n.parentNode;m;){if(!r&&m===e)return ee.DOCUMENT_POSITION_CONTAINS+ee.DOCUMENT_POSITION_PRECEDING;c.push(m),m=m.parentNode}c.reverse();var y=To(s,c);for(var b in y.childNodes){var d=y.childNodes[b];if(d===n)return ee.DOCUMENT_POSITION_FOLLOWING;if(d===e)return ee.DOCUMENT_POSITION_PRECEDING;if(c.indexOf(d)>=0)return ee.DOCUMENT_POSITION_FOLLOWING;if(s.indexOf(d)>=0)return ee.DOCUMENT_POSITION_PRECEDING}return 0}};function Bo(t){return t=="<"&&"&lt;"||t==">"&&"&gt;"||t=="&"&&"&amp;"||t=='"'&&"&quot;"||"&#"+t.charCodeAt()+";"}ht(ve,j);ht(ve,j.prototype);ht(ee,j);ht(ee,j.prototype);function vn(t,e){de(t,null,{enter:function(n){return e(n)?de.STOP:!0}})}function de(t,e,n){for(var r=[{node:t,context:e,phase:de.ENTER}];r.length>0;){var o=r.pop();if(o.phase===de.ENTER){var i=n.enter(o.node,o.context);if(i===de.STOP)return de.STOP;if(r.push({node:o.node,context:i,phase:de.EXIT}),i==null)continue;for(var a=o.node.lastChild;a;)r.push({node:a,context:i,phase:de.ENTER}),a=a.previousSibling}else n.exit&&n.exit(o.node,o.context)}}de.STOP=Symbol("walkDOM.STOP");de.ENTER=0;de.EXIT=1;function Pe(t,e){be(t);var n=e||{};this.ownerDocument=this,this.contentType=n.contentType||Xt.XML_APPLICATION,this.type=Rs(this.contentType)?"html":"xml"}function Ks(t,e,n){t&&t._inc++;var r=n.namespaceURI;r===Le.XMLNS&&(e._nsMap[n.prefix?n.localName:""]=n.value)}function Lo(t,e,n,r){t&&t._inc++;var o=n.namespaceURI;o===Le.XMLNS&&delete e._nsMap[n.prefix?n.localName:""]}function Oo(t,e,n){if(t&&t._inc){t._inc++;var r=e.childNodes;if(n&&!n.nextSibling)r[r.length++]=n;else{for(var o=e.firstChild,i=0;o;)r[i++]=o,o=o.nextSibling;r.length=i,delete r[r.length]}}}function $o(t,e){if(t!==e.parentNode)throw new O(O.NOT_FOUND_ERR,"child's parent is not parent");var n=e.previousSibling,r=e.nextSibling;return n?n.nextSibling=r:t.firstChild=r,r?r.previousSibling=n:t.lastChild=n,Oo(t.ownerDocument,t),e.parentNode=null,e.previousSibling=null,e.nextSibling=null,e}function Js(t){return t&&(t.nodeType===j.DOCUMENT_NODE||t.nodeType===j.DOCUMENT_FRAGMENT_NODE||t.nodeType===j.ELEMENT_NODE)}function Xs(t){return t&&(t.nodeType===j.CDATA_SECTION_NODE||t.nodeType===j.COMMENT_NODE||t.nodeType===j.DOCUMENT_FRAGMENT_NODE||t.nodeType===j.DOCUMENT_TYPE_NODE||t.nodeType===j.ELEMENT_NODE||t.nodeType===j.PROCESSING_INSTRUCTION_NODE||t.nodeType===j.TEXT_NODE)}function Ve(t){return t&&t.nodeType===j.DOCUMENT_TYPE_NODE}function Me(t){return t&&t.nodeType===j.ELEMENT_NODE}function _o(t){return t&&t.nodeType===j.TEXT_NODE}function wo(t,e){var n=t.childNodes||[];if(Be(n,Me)||Ve(e))return!1;var r=Be(n,Ve);return!(e&&r&&n.indexOf(r)>n.indexOf(e))}function Eo(t,e){var n=t.childNodes||[];function r(i){return Me(i)&&i!==e}if(Be(n,r))return!1;var o=Be(n,Ve);return!(e&&o&&n.indexOf(o)>n.indexOf(e))}function Qs(t,e,n){if(!Js(t))throw new O(O.HIERARCHY_REQUEST_ERR,"Unexpected parent node type "+t.nodeType);if(n&&n.parentNode!==t)throw new O(O.NOT_FOUND_ERR,"child not in parent");if(!Xs(e)||Ve(e)&&t.nodeType!==j.DOCUMENT_NODE)throw new O(O.HIERARCHY_REQUEST_ERR,"Unexpected node type "+e.nodeType+" for parent node type "+t.nodeType)}function Zs(t,e,n){var r=t.childNodes||[],o=e.childNodes||[];if(e.nodeType===j.DOCUMENT_FRAGMENT_NODE){var i=o.filter(Me);if(i.length>1||Be(o,_o))throw new O(O.HIERARCHY_REQUEST_ERR,"More than one element or text in fragment");if(i.length===1&&!wo(t,n))throw new O(O.HIERARCHY_REQUEST_ERR,"Element in fragment can not be inserted before doctype")}if(Me(e)&&!wo(t,n))throw new O(O.HIERARCHY_REQUEST_ERR,"Only one element can be added and only after doctype");if(Ve(e)){if(Be(r,Ve))throw new O(O.HIERARCHY_REQUEST_ERR,"Only one doctype is allowed");var a=Be(r,Me);if(n&&r.indexOf(a)<r.indexOf(n))throw new O(O.HIERARCHY_REQUEST_ERR,"Doctype can only be inserted before an element");if(!n&&a)throw new O(O.HIERARCHY_REQUEST_ERR,"Doctype can not be appended since element is present")}}function Fo(t,e,n){var r=t.childNodes||[],o=e.childNodes||[];if(e.nodeType===j.DOCUMENT_FRAGMENT_NODE){var i=o.filter(Me);if(i.length>1||Be(o,_o))throw new O(O.HIERARCHY_REQUEST_ERR,"More than one element or text in fragment");if(i.length===1&&!Eo(t,n))throw new O(O.HIERARCHY_REQUEST_ERR,"Element in fragment can not be inserted before doctype")}if(Me(e)&&!Eo(t,n))throw new O(O.HIERARCHY_REQUEST_ERR,"Only one element can be added and only after doctype");if(Ve(e)){if(Be(r,function(u){return Ve(u)&&u!==n}))throw new O(O.HIERARCHY_REQUEST_ERR,"Only one doctype is allowed");var a=Be(r,Me);if(n&&r.indexOf(a)<r.indexOf(n))throw new O(O.HIERARCHY_REQUEST_ERR,"Doctype can only be inserted before an element")}}function En(t,e,n,r){Qs(t,e,n),t.nodeType===j.DOCUMENT_NODE&&(r||Zs)(t,e,n);var o=e.parentNode;if(o&&o.removeChild(e),e.nodeType===We){var i=e.firstChild;if(i==null)return e;var a=e.lastChild}else i=a=e;var s=n?n.previousSibling:t.lastChild;i.previousSibling=s,a.nextSibling=n,s?s.nextSibling=i:t.firstChild=i,n==null?t.lastChild=a:n.previousSibling=a;do i.parentNode=t;while(i!==a&&(i=i.nextSibling));return Oo(t.ownerDocument||t,t,e),e.nodeType==We&&(e.firstChild=e.lastChild=null),e}Pe.prototype={implementation:null,nodeName:"#document",nodeType:pt,doctype:null,documentElement:null,_inc:1,insertBefore:function(t,e){if(t.nodeType===We){for(var n=t.firstChild;n;){var r=n.nextSibling;this.insertBefore(n,e),n=r}return t}return En(this,t,e),t.ownerDocument=this,this.documentElement===null&&t.nodeType===Ae&&(this.documentElement=t),t},removeChild:function(t){var e=$o(this,t);return e===this.documentElement&&(this.documentElement=null),e},replaceChild:function(t,e){En(this,t,e,Fo),t.ownerDocument=this,e&&this.removeChild(e),Me(t)&&(this.documentElement=t)},importNode:function(t,e){return ec(this,t,e)},getElementById:function(t){var e=null;return vn(this.documentElement,function(n){if(n.nodeType==Ae&&n.getAttribute("id")==t)return e=n,!0}),e},createElement:function(t){var e=new Re(ge);e.ownerDocument=this,this.type==="html"&&(t=t.toLowerCase()),Ps(this.contentType)&&(e.namespaceURI=Le.HTML),e.nodeName=t,e.tagName=t,e.localName=t,e.childNodes=new ie;var n=e.attributes=new gt;return n._ownerElement=e,e},createDocumentFragment:function(){var t=new yt(ge);return t.ownerDocument=this,t.childNodes=new ie,t},createTextNode:function(t){var e=new Qt(ge);return e.ownerDocument=this,e.childNodes=new ie,e.appendData(t),e},createComment:function(t){var e=new Dn(ge);return e.ownerDocument=this,e.childNodes=new ie,e.appendData(t),e},createCDATASection:function(t){if(t.indexOf("]]>")!==-1)throw new O(O.INVALID_CHARACTER_ERR,'data contains "]]>"');var e=new Cn(ge);return e.ownerDocument=this,e.childNodes=new ie,e.appendData(t),e},createProcessingInstruction:function(t,e){var n=new Sn(ge);return n.ownerDocument=this,n.childNodes=new ie,n.nodeName=n.target=t,n.nodeValue=n.data=e,n},createAttribute:function(t){if(!ue.QName_exact.test(t))throw new O(O.INVALID_CHARACTER_ERR,'invalid character in name "'+t+'"');return this.type==="html"&&(t=t.toLowerCase()),this._createAttribute(t)},_createAttribute:function(t){var e=new Ze(ge);return e.ownerDocument=this,e.childNodes=new ie,e.name=t,e.nodeName=t,e.localName=t,e.specified=!0,e},createEntityReference:function(t){if(!ue.Name.test(t))throw new O(O.INVALID_CHARACTER_ERR,'not a valid xml name "'+t+'"');if(this.type==="html")throw new O("document is an html document",Ce.NotSupportedError);var e=new kn(ge);return e.ownerDocument=this,e.childNodes=new ie,e.nodeName=t,e},createElementNS:function(t,e){var n=hr(t,e),r=new Re(ge),o=r.attributes=new gt;return r.childNodes=new ie,r.ownerDocument=this,r.nodeName=e,r.tagName=e,r.namespaceURI=n[0],r.prefix=n[1],r.localName=n[2],o._ownerElement=r,r},createAttributeNS:function(t,e){var n=hr(t,e),r=new Ze(ge);return r.ownerDocument=this,r.childNodes=new ie,r.nodeName=e,r.name=e,r.specified=!0,r.namespaceURI=n[0],r.prefix=n[1],r.localName=n[2],r}};ye(Pe,j);function Re(t){be(t),this._nsMap=Object.create(null)}Re.prototype={nodeType:Ae,attributes:null,getQualifiedName:function(){return this.prefix?this.prefix+":"+this.localName:this.localName},_isInHTMLDocumentAndNamespace:function(){return this.ownerDocument.type==="html"&&this.namespaceURI===Le.HTML},hasAttributes:function(){return!!(this.attributes&&this.attributes.length)},hasAttribute:function(t){return!!this.getAttributeNode(t)},getAttribute:function(t){var e=this.getAttributeNode(t);return e?e.value:null},getAttributeNode:function(t){return this._isInHTMLDocumentAndNamespace()&&(t=t.toLowerCase()),this.attributes.getNamedItem(t)},setAttribute:function(t,e){this._isInHTMLDocumentAndNamespace()&&(t=t.toLowerCase());var n=this.getAttributeNode(t);n?n.value=n.nodeValue=""+e:(n=this.ownerDocument._createAttribute(t),n.value=n.nodeValue=""+e,this.setAttributeNode(n))},removeAttribute:function(t){var e=this.getAttributeNode(t);e&&this.removeAttributeNode(e)},setAttributeNode:function(t){return this.attributes.setNamedItem(t)},setAttributeNodeNS:function(t){return this.attributes.setNamedItemNS(t)},removeAttributeNode:function(t){return this.attributes.removeNamedItem(t.nodeName)},removeAttributeNS:function(t,e){var n=this.getAttributeNodeNS(t,e);n&&this.removeAttributeNode(n)},hasAttributeNS:function(t,e){return this.getAttributeNodeNS(t,e)!=null},getAttributeNS:function(t,e){var n=this.getAttributeNodeNS(t,e);return n?n.value:null},setAttributeNS:function(t,e,n){var r=hr(t,e),o=r[2],i=this.getAttributeNodeNS(t,o);i?i.value=i.nodeValue=""+n:(i=this.ownerDocument.createAttributeNS(t,e),i.value=i.nodeValue=""+n,this.setAttributeNode(i))},getAttributeNodeNS:function(t,e){return this.attributes.getNamedItemNS(t,e)},getElementsByClassName:function(t){var e=bo(t);return new Ne(this,function(n){var r=[];return e.length>0&&vn(n,function(o){if(o!==n&&o.nodeType===Ae){var i=o.getAttribute("class");if(i){var a=t===i;if(!a){var s=bo(i);a=e.every(Vs(s))}a&&r.push(o)}}}),r})},getElementsByTagName:function(t){var e=(this.nodeType===pt?this:this.ownerDocument).type==="html",n=t.toLowerCase();return new Ne(this,function(r){var o=[];return vn(r,function(i){if(!(i===r||i.nodeType!==Ae))if(t==="*")o.push(i);else{var a=i.getQualifiedName(),s=e&&i.namespaceURI===Le.HTML?n:t;a===s&&o.push(i)}}),o})},getElementsByTagNameNS:function(t,e){return new Ne(this,function(n){var r=[];return vn(n,function(o){o!==n&&o.nodeType===Ae&&(t==="*"||o.namespaceURI===t)&&(e==="*"||o.localName==e)&&r.push(o)}),r})}};Pe.prototype.getElementsByClassName=Re.prototype.getElementsByClassName;Pe.prototype.getElementsByTagName=Re.prototype.getElementsByTagName;Pe.prototype.getElementsByTagNameNS=Re.prototype.getElementsByTagNameNS;ye(Re,j);function Ze(t){be(t),this.namespaceURI=null,this.prefix=null,this.ownerElement=null}Ze.prototype.nodeType=mt;ye(Ze,j);function bt(t){be(t)}bt.prototype={data:"",substringData:function(t,e){return this.data.substring(t,t+e)},appendData:function(t){t=this.data+t,this.nodeValue=this.data=t,this.length=t.length},insertData:function(t,e){this.replaceData(t,0,e)},deleteData:function(t,e){this.replaceData(t,e,"")},replaceData:function(t,e,n){var r=this.data.substring(0,t),o=this.data.substring(t+e);n=r+n+o,this.nodeValue=this.data=n,this.length=n.length}};ye(bt,j);function Qt(t){be(t)}Qt.prototype={nodeName:"#text",nodeType:wn,splitText:function(t){var e=this.data,n=e.substring(t);e=e.substring(0,t),this.data=this.nodeValue=e,this.length=e.length;var r=this.ownerDocument.createTextNode(n);return this.parentNode&&this.parentNode.insertBefore(r,this.nextSibling),r}};ye(Qt,bt);function Dn(t){be(t)}Dn.prototype={nodeName:"#comment",nodeType:yr};ye(Dn,bt);function Cn(t){be(t)}Cn.prototype={nodeName:"#cdata-section",nodeType:Ao};ye(Cn,Qt);function An(t){be(t)}An.prototype.nodeType=So;ye(An,j);function vr(t){be(t)}vr.prototype.nodeType=Ys;ye(vr,j);function wr(t){be(t)}wr.prototype.nodeType=zs;ye(wr,j);function kn(t){be(t)}kn.prototype.nodeType=ko;ye(kn,j);function yt(t){be(t)}yt.prototype.nodeName="#document-fragment";yt.prototype.nodeType=We;ye(yt,j);function Sn(t){be(t)}Sn.prototype.nodeType=br;ye(Sn,bt);function Mo(){}Mo.prototype.serializeToString=function(t,e){return Po.call(t,e)};j.prototype.toString=Po;function Po(t){var e;typeof t=="function"?e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:t}:t!=null?e={requireWellFormed:!!t.requireWellFormed,splitCDATASections:t.splitCDATASections!==!1,nodeFilter:t.nodeFilter||null}:e={requireWellFormed:!1,splitCDATASections:!0,nodeFilter:null};var n=[],r=this.nodeType===pt&&this.documentElement||this,o=r.prefix,i=r.namespaceURI;if(i&&o==null){var o=r.lookupPrefix(i);if(o==null)var a=[{namespace:i,prefix:null}]}return Er(this,n,a,e),n.join("")}function xo(t,e,n){var r=t.prefix||"",o=t.namespaceURI;if(!o||r==="xml"&&o===Le.XML||o===Le.XMLNS)return!1;for(var i=n.length;i--;){var a=n[i];if(a.prefix===r)return a.namespace!==o}return!0}function yn(t,e,n){t.push(" ",e,'="',n.replace(/[<>&"\t\n\r]/g,Bo),'"')}function Er(t,e,n,r){n||(n=[]);var o=r.nodeFilter,i=r.requireWellFormed,a=r.splitCDATASections,s=t.nodeType===pt?t:t.ownerDocument,u=s.type==="html";de(t,{ns:n},{enter:function(c,m){var y=m.ns;if(o)if(c=o(c),c){if(typeof c=="string")return e.push(c),null}else return null;switch(c.nodeType){case Ae:var b=c.attributes,d=b.length,l=c.tagName,p=l;if(!u&&!c.prefix&&c.namespaceURI){for(var w,v=0;v<b.length;v++)if(b.item(v).name==="xmlns"){w=b.item(v).value;break}if(!w)for(var h=y.length-1;h>=0;h--){var g=y[h];if(g.prefix===""&&g.namespace===c.namespaceURI){w=g.namespace;break}}if(w!==c.namespaceURI)for(var h=y.length-1;h>=0;h--){var g=y[h];if(g.namespace===c.namespaceURI){g.prefix&&(p=g.prefix+":"+l);break}}}e.push("<",p);for(var E=y.slice(),x=0;x<d;x++){var C=b.item(x);C.prefix=="xmlns"?E.push({prefix:C.localName,namespace:C.value}):C.nodeName=="xmlns"&&E.push({prefix:"",namespace:C.value})}for(var x=0;x<d;x++){var C=b.item(x);if(xo(C,u,E)){var D=C.prefix||"",A=C.namespaceURI;yn(e,D?"xmlns:"+D:"xmlns",A),E.push({prefix:D,namespace:A})}var I=o?o(C):C;I&&(typeof I=="string"?e.push(I):yn(e,I.name,I.value))}if(l===p&&xo(c,u,E)){var S=c.prefix||"",A=c.namespaceURI;yn(e,S?"xmlns:"+S:"xmlns",A),E.push({prefix:S,namespace:A})}var L=!c.firstChild;if(L&&(u||c.namespaceURI===Le.HTML)&&(L=qs(l)),L)return e.push("/>"),null;if(e.push(">"),u&&Us(l)){for(var k=c.firstChild;k;)k.data?e.push(k.data):Er(k,e,E.slice(),r),k=k.nextSibling;return e.push("</",p,">"),null}return{ns:E,tag:p};case pt:case We:if(i&&c.nodeType===pt&&c.documentElement==null)throw new O("The Document has no documentElement",Ce.InvalidStateError);return{ns:y};case mt:return yn(e,c.name,c.value),null;case wn:if(i&&ue.InvalidChar.test(c.data))throw new O("The Text node data contains characters outside the XML Char production",Ce.InvalidStateError);return e.push(c.data.replace(/[<&>]/g,Bo)),null;case Ao:if(i&&c.data.indexOf("]]>")!==-1)throw new O('The CDATASection data contains "]]>"',Ce.InvalidStateError);return a?e.push(ue.CDATA_START,c.data.replace(/]]>/g,"]]]]><![CDATA[>"),ue.CDATA_END):e.push(ue.CDATA_START,c.data,ue.CDATA_END),null;case yr:if(i){if(ue.InvalidChar.test(c.data))throw new O("The comment node data contains characters outside the XML Char production",Ce.InvalidStateError);if(c.data.indexOf("--")!==-1||c.data[c.data.length-1]==="-")throw new O('The comment node data contains "--" or ends with "-"',Ce.InvalidStateError)}return e.push(ue.COMMENT_START,c.data,ue.COMMENT_END),null;case So:var T=c.publicId,N=c.systemId;if(i){if(T&&!ue.PubidLiteral_match.test(T))throw new O("DocumentType publicId is not a valid PubidLiteral",Ce.InvalidStateError);if(N&&N!=="."&&!ue.SystemLiteral_match.test(N))throw new O("DocumentType systemId is not a valid SystemLiteral",Ce.InvalidStateError);if(c.internalSubset&&c.internalSubset.indexOf("]>")!==-1)throw new O('DocumentType internalSubset contains "]>"',Ce.InvalidStateError)}return e.push(ue.DOCTYPE_DECL_START," ",c.name),T?(e.push(" ",ue.PUBLIC," ",T),N&&N!=="."&&e.push(" ",N)):N&&N!=="."&&e.push(" ",ue.SYSTEM," ",N),c.internalSubset&&e.push(" [",c.internalSubset,"]"),e.push(">"),null;case br:if(i){if(c.target.indexOf(":")!==-1||c.target.toLowerCase()==="xml")throw new O("The ProcessingInstruction target is not well-formed",Ce.InvalidStateError);if(ue.InvalidChar.test(c.data))throw new O("The ProcessingInstruction data contains characters outside the XML Char production",Ce.InvalidStateError);if(c.data.indexOf("?>")!==-1)throw new O('The ProcessingInstruction data contains "?>"',Ce.InvalidStateError)}return e.push("<?",c.target," ",c.data,"?>"),null;case ko:return e.push("&",c.nodeName,";"),null;default:return e.push("??",c.nodeName),null}},exit:function(c,m){m&&m.tag&&e.push("</",m.tag,">")}})}function ec(t,e,n){var r;return de(e,null,{enter:function(o,i){var a=o.cloneNode(!1);a.ownerDocument=t,a.parentNode=null,i===null?r=a:i.appendChild(a);var s=o.nodeType===mt||n;return s?a:null}}),r}function Ro(t,e,n){var r;return de(e,null,{enter:function(o,i){var a=new o.constructor(ge);for(var s in o)if(ft(o,s)){var u=o[s];typeof u!="object"&&u!=a[s]&&(a[s]=u)}o.childNodes&&(a.childNodes=new ie),a.ownerDocument=t;var c=n;switch(a.nodeType){case Ae:var m=o.attributes,y=a.attributes=new gt,b=m.length;y._ownerElement=a;for(var d=0;d<b;d++)a.setAttributeNode(Ro(t,m.item(d),!0));break;case mt:c=!0}return i!==null?i.appendChild(a):r=a,c?a:null}}),r}function Uo(t,e,n){t[e]=n}function gr(t){for(var e=[],n=t.firstChild;n;)n.nodeType===Ae&&e.push(n),n=n.nextSibling;return e}try{Object.defineProperty&&(Object.defineProperty(Ne.prototype,"length",{get:function(){return xn(this),this.$$length}}),Object.defineProperty(j.prototype,"textContent",{get:function(){if(this.nodeType===Ae||this.nodeType===We){var t=[];return de(this,null,{enter:function(e){if(e.nodeType===Ae||e.nodeType===We)return!0;if(e.nodeType===br||e.nodeType===yr)return null;t.push(e.nodeValue)}}),t.join("")}return this.nodeValue},set:function(t){switch(this.nodeType){case Ae:case We:for(;this.firstChild;)this.removeChild(this.firstChild);(t||String(t))&&this.appendChild(this.ownerDocument.createTextNode(t));break;default:this.data=t,this.value=t,this.nodeValue=t}}}),Object.defineProperty(Re.prototype,"children",{get:function(){return new Ne(this,gr)}}),Object.defineProperty(Pe.prototype,"children",{get:function(){return new Ne(this,gr)}}),Object.defineProperty(yt.prototype,"children",{get:function(){return new Ne(this,gr)}}),Uo=function(t,e,n){t["$$"+e]=n})}catch{}te._updateLiveList=xn;te.Attr=Ze;te.CDATASection=Cn;te.CharacterData=bt;te.Comment=Dn;te.Document=Pe;te.DocumentFragment=yt;te.DocumentType=An;te.DOMImplementation=No;te.Element=Re;te.Entity=wr;te.EntityReference=kn;te.LiveNodeList=Ne;te.NamedNodeMap=gt;te.Node=j;te.NodeList=ie;te.Notation=vr;te.Text=Qt;te.ProcessingInstruction=Sn;te.walkDOM=de;te.XMLSerializer=Mo});var jo=K(Zt=>{"use strict";var qo=Qe().freeze;Zt.XML_ENTITIES=qo({amp:"&",apos:"'",gt:">",lt:"<",quot:'"'});Zt.HTML_ENTITIES=qo({Aacute:"\xC1",aacute:"\xE1",Abreve:"\u0102",abreve:"\u0103",ac:"\u223E",acd:"\u223F",acE:"\u223E\u0333",Acirc:"\xC2",acirc:"\xE2",acute:"\xB4",Acy:"\u0410",acy:"\u0430",AElig:"\xC6",aelig:"\xE6",af:"\u2061",Afr:"\u{1D504}",afr:"\u{1D51E}",Agrave:"\xC0",agrave:"\xE0",alefsym:"\u2135",aleph:"\u2135",Alpha:"\u0391",alpha:"\u03B1",Amacr:"\u0100",amacr:"\u0101",amalg:"\u2A3F",AMP:"&",amp:"&",And:"\u2A53",and:"\u2227",andand:"\u2A55",andd:"\u2A5C",andslope:"\u2A58",andv:"\u2A5A",ang:"\u2220",ange:"\u29A4",angle:"\u2220",angmsd:"\u2221",angmsdaa:"\u29A8",angmsdab:"\u29A9",angmsdac:"\u29AA",angmsdad:"\u29AB",angmsdae:"\u29AC",angmsdaf:"\u29AD",angmsdag:"\u29AE",angmsdah:"\u29AF",angrt:"\u221F",angrtvb:"\u22BE",angrtvbd:"\u299D",angsph:"\u2222",angst:"\xC5",angzarr:"\u237C",Aogon:"\u0104",aogon:"\u0105",Aopf:"\u{1D538}",aopf:"\u{1D552}",ap:"\u2248",apacir:"\u2A6F",apE:"\u2A70",ape:"\u224A",apid:"\u224B",apos:"'",ApplyFunction:"\u2061",approx:"\u2248",approxeq:"\u224A",Aring:"\xC5",aring:"\xE5",Ascr:"\u{1D49C}",ascr:"\u{1D4B6}",Assign:"\u2254",ast:"*",asymp:"\u2248",asympeq:"\u224D",Atilde:"\xC3",atilde:"\xE3",Auml:"\xC4",auml:"\xE4",awconint:"\u2233",awint:"\u2A11",backcong:"\u224C",backepsilon:"\u03F6",backprime:"\u2035",backsim:"\u223D",backsimeq:"\u22CD",Backslash:"\u2216",Barv:"\u2AE7",barvee:"\u22BD",Barwed:"\u2306",barwed:"\u2305",barwedge:"\u2305",bbrk:"\u23B5",bbrktbrk:"\u23B6",bcong:"\u224C",Bcy:"\u0411",bcy:"\u0431",bdquo:"\u201E",becaus:"\u2235",Because:"\u2235",because:"\u2235",bemptyv:"\u29B0",bepsi:"\u03F6",bernou:"\u212C",Bernoullis:"\u212C",Beta:"\u0392",beta:"\u03B2",beth:"\u2136",between:"\u226C",Bfr:"\u{1D505}",bfr:"\u{1D51F}",bigcap:"\u22C2",bigcirc:"\u25EF",bigcup:"\u22C3",bigodot:"\u2A00",bigoplus:"\u2A01",bigotimes:"\u2A02",bigsqcup:"\u2A06",bigstar:"\u2605",bigtriangledown:"\u25BD",bigtriangleup:"\u25B3",biguplus:"\u2A04",bigvee:"\u22C1",bigwedge:"\u22C0",bkarow:"\u290D",blacklozenge:"\u29EB",blacksquare:"\u25AA",blacktriangle:"\u25B4",blacktriangledown:"\u25BE",blacktriangleleft:"\u25C2",blacktriangleright:"\u25B8",blank:"\u2423",blk12:"\u2592",blk14:"\u2591",blk34:"\u2593",block:"\u2588",bne:"=\u20E5",bnequiv:"\u2261\u20E5",bNot:"\u2AED",bnot:"\u2310",Bopf:"\u{1D539}",bopf:"\u{1D553}",bot:"\u22A5",bottom:"\u22A5",bowtie:"\u22C8",boxbox:"\u29C9",boxDL:"\u2557",boxDl:"\u2556",boxdL:"\u2555",boxdl:"\u2510",boxDR:"\u2554",boxDr:"\u2553",boxdR:"\u2552",boxdr:"\u250C",boxH:"\u2550",boxh:"\u2500",boxHD:"\u2566",boxHd:"\u2564",boxhD:"\u2565",boxhd:"\u252C",boxHU:"\u2569",boxHu:"\u2567",boxhU:"\u2568",boxhu:"\u2534",boxminus:"\u229F",boxplus:"\u229E",boxtimes:"\u22A0",boxUL:"\u255D",boxUl:"\u255C",boxuL:"\u255B",boxul:"\u2518",boxUR:"\u255A",boxUr:"\u2559",boxuR:"\u2558",boxur:"\u2514",boxV:"\u2551",boxv:"\u2502",boxVH:"\u256C",boxVh:"\u256B",boxvH:"\u256A",boxvh:"\u253C",boxVL:"\u2563",boxVl:"\u2562",boxvL:"\u2561",boxvl:"\u2524",boxVR:"\u2560",boxVr:"\u255F",boxvR:"\u255E",boxvr:"\u251C",bprime:"\u2035",Breve:"\u02D8",breve:"\u02D8",brvbar:"\xA6",Bscr:"\u212C",bscr:"\u{1D4B7}",bsemi:"\u204F",bsim:"\u223D",bsime:"\u22CD",bsol:"\\",bsolb:"\u29C5",bsolhsub:"\u27C8",bull:"\u2022",bullet:"\u2022",bump:"\u224E",bumpE:"\u2AAE",bumpe:"\u224F",Bumpeq:"\u224E",bumpeq:"\u224F",Cacute:"\u0106",cacute:"\u0107",Cap:"\u22D2",cap:"\u2229",capand:"\u2A44",capbrcup:"\u2A49",capcap:"\u2A4B",capcup:"\u2A47",capdot:"\u2A40",CapitalDifferentialD:"\u2145",caps:"\u2229\uFE00",caret:"\u2041",caron:"\u02C7",Cayleys:"\u212D",ccaps:"\u2A4D",Ccaron:"\u010C",ccaron:"\u010D",Ccedil:"\xC7",ccedil:"\xE7",Ccirc:"\u0108",ccirc:"\u0109",Cconint:"\u2230",ccups:"\u2A4C",ccupssm:"\u2A50",Cdot:"\u010A",cdot:"\u010B",cedil:"\xB8",Cedilla:"\xB8",cemptyv:"\u29B2",cent:"\xA2",CenterDot:"\xB7",centerdot:"\xB7",Cfr:"\u212D",cfr:"\u{1D520}",CHcy:"\u0427",chcy:"\u0447",check:"\u2713",checkmark:"\u2713",Chi:"\u03A7",chi:"\u03C7",cir:"\u25CB",circ:"\u02C6",circeq:"\u2257",circlearrowleft:"\u21BA",circlearrowright:"\u21BB",circledast:"\u229B",circledcirc:"\u229A",circleddash:"\u229D",CircleDot:"\u2299",circledR:"\xAE",circledS:"\u24C8",CircleMinus:"\u2296",CirclePlus:"\u2295",CircleTimes:"\u2297",cirE:"\u29C3",cire:"\u2257",cirfnint:"\u2A10",cirmid:"\u2AEF",cirscir:"\u29C2",ClockwiseContourIntegral:"\u2232",CloseCurlyDoubleQuote:"\u201D",CloseCurlyQuote:"\u2019",clubs:"\u2663",clubsuit:"\u2663",Colon:"\u2237",colon:":",Colone:"\u2A74",colone:"\u2254",coloneq:"\u2254",comma:",",commat:"@",comp:"\u2201",compfn:"\u2218",complement:"\u2201",complexes:"\u2102",cong:"\u2245",congdot:"\u2A6D",Congruent:"\u2261",Conint:"\u222F",conint:"\u222E",ContourIntegral:"\u222E",Copf:"\u2102",copf:"\u{1D554}",coprod:"\u2210",Coproduct:"\u2210",COPY:"\xA9",copy:"\xA9",copysr:"\u2117",CounterClockwiseContourIntegral:"\u2233",crarr:"\u21B5",Cross:"\u2A2F",cross:"\u2717",Cscr:"\u{1D49E}",cscr:"\u{1D4B8}",csub:"\u2ACF",csube:"\u2AD1",csup:"\u2AD0",csupe:"\u2AD2",ctdot:"\u22EF",cudarrl:"\u2938",cudarrr:"\u2935",cuepr:"\u22DE",cuesc:"\u22DF",cularr:"\u21B6",cularrp:"\u293D",Cup:"\u22D3",cup:"\u222A",cupbrcap:"\u2A48",CupCap:"\u224D",cupcap:"\u2A46",cupcup:"\u2A4A",cupdot:"\u228D",cupor:"\u2A45",cups:"\u222A\uFE00",curarr:"\u21B7",curarrm:"\u293C",curlyeqprec:"\u22DE",curlyeqsucc:"\u22DF",curlyvee:"\u22CE",curlywedge:"\u22CF",curren:"\xA4",curvearrowleft:"\u21B6",curvearrowright:"\u21B7",cuvee:"\u22CE",cuwed:"\u22CF",cwconint:"\u2232",cwint:"\u2231",cylcty:"\u232D",Dagger:"\u2021",dagger:"\u2020",daleth:"\u2138",Darr:"\u21A1",dArr:"\u21D3",darr:"\u2193",dash:"\u2010",Dashv:"\u2AE4",dashv:"\u22A3",dbkarow:"\u290F",dblac:"\u02DD",Dcaron:"\u010E",dcaron:"\u010F",Dcy:"\u0414",dcy:"\u0434",DD:"\u2145",dd:"\u2146",ddagger:"\u2021",ddarr:"\u21CA",DDotrahd:"\u2911",ddotseq:"\u2A77",deg:"\xB0",Del:"\u2207",Delta:"\u0394",delta:"\u03B4",demptyv:"\u29B1",dfisht:"\u297F",Dfr:"\u{1D507}",dfr:"\u{1D521}",dHar:"\u2965",dharl:"\u21C3",dharr:"\u21C2",DiacriticalAcute:"\xB4",DiacriticalDot:"\u02D9",DiacriticalDoubleAcute:"\u02DD",DiacriticalGrave:"`",DiacriticalTilde:"\u02DC",diam:"\u22C4",Diamond:"\u22C4",diamond:"\u22C4",diamondsuit:"\u2666",diams:"\u2666",die:"\xA8",DifferentialD:"\u2146",digamma:"\u03DD",disin:"\u22F2",div:"\xF7",divide:"\xF7",divideontimes:"\u22C7",divonx:"\u22C7",DJcy:"\u0402",djcy:"\u0452",dlcorn:"\u231E",dlcrop:"\u230D",dollar:"$",Dopf:"\u{1D53B}",dopf:"\u{1D555}",Dot:"\xA8",dot:"\u02D9",DotDot:"\u20DC",doteq:"\u2250",doteqdot:"\u2251",DotEqual:"\u2250",dotminus:"\u2238",dotplus:"\u2214",dotsquare:"\u22A1",doublebarwedge:"\u2306",DoubleContourIntegral:"\u222F",DoubleDot:"\xA8",DoubleDownArrow:"\u21D3",DoubleLeftArrow:"\u21D0",DoubleLeftRightArrow:"\u21D4",DoubleLeftTee:"\u2AE4",DoubleLongLeftArrow:"\u27F8",DoubleLongLeftRightArrow:"\u27FA",DoubleLongRightArrow:"\u27F9",DoubleRightArrow:"\u21D2",DoubleRightTee:"\u22A8",DoubleUpArrow:"\u21D1",DoubleUpDownArrow:"\u21D5",DoubleVerticalBar:"\u2225",DownArrow:"\u2193",Downarrow:"\u21D3",downarrow:"\u2193",DownArrowBar:"\u2913",DownArrowUpArrow:"\u21F5",DownBreve:"\u0311",downdownarrows:"\u21CA",downharpoonleft:"\u21C3",downharpoonright:"\u21C2",DownLeftRightVector:"\u2950",DownLeftTeeVector:"\u295E",DownLeftVector:"\u21BD",DownLeftVectorBar:"\u2956",DownRightTeeVector:"\u295F",DownRightVector:"\u21C1",DownRightVectorBar:"\u2957",DownTee:"\u22A4",DownTeeArrow:"\u21A7",drbkarow:"\u2910",drcorn:"\u231F",drcrop:"\u230C",Dscr:"\u{1D49F}",dscr:"\u{1D4B9}",DScy:"\u0405",dscy:"\u0455",dsol:"\u29F6",Dstrok:"\u0110",dstrok:"\u0111",dtdot:"\u22F1",dtri:"\u25BF",dtrif:"\u25BE",duarr:"\u21F5",duhar:"\u296F",dwangle:"\u29A6",DZcy:"\u040F",dzcy:"\u045F",dzigrarr:"\u27FF",Eacute:"\xC9",eacute:"\xE9",easter:"\u2A6E",Ecaron:"\u011A",ecaron:"\u011B",ecir:"\u2256",Ecirc:"\xCA",ecirc:"\xEA",ecolon:"\u2255",Ecy:"\u042D",ecy:"\u044D",eDDot:"\u2A77",Edot:"\u0116",eDot:"\u2251",edot:"\u0117",ee:"\u2147",efDot:"\u2252",Efr:"\u{1D508}",efr:"\u{1D522}",eg:"\u2A9A",Egrave:"\xC8",egrave:"\xE8",egs:"\u2A96",egsdot:"\u2A98",el:"\u2A99",Element:"\u2208",elinters:"\u23E7",ell:"\u2113",els:"\u2A95",elsdot:"\u2A97",Emacr:"\u0112",emacr:"\u0113",empty:"\u2205",emptyset:"\u2205",EmptySmallSquare:"\u25FB",emptyv:"\u2205",EmptyVerySmallSquare:"\u25AB",emsp:"\u2003",emsp13:"\u2004",emsp14:"\u2005",ENG:"\u014A",eng:"\u014B",ensp:"\u2002",Eogon:"\u0118",eogon:"\u0119",Eopf:"\u{1D53C}",eopf:"\u{1D556}",epar:"\u22D5",eparsl:"\u29E3",eplus:"\u2A71",epsi:"\u03B5",Epsilon:"\u0395",epsilon:"\u03B5",epsiv:"\u03F5",eqcirc:"\u2256",eqcolon:"\u2255",eqsim:"\u2242",eqslantgtr:"\u2A96",eqslantless:"\u2A95",Equal:"\u2A75",equals:"=",EqualTilde:"\u2242",equest:"\u225F",Equilibrium:"\u21CC",equiv:"\u2261",equivDD:"\u2A78",eqvparsl:"\u29E5",erarr:"\u2971",erDot:"\u2253",Escr:"\u2130",escr:"\u212F",esdot:"\u2250",Esim:"\u2A73",esim:"\u2242",Eta:"\u0397",eta:"\u03B7",ETH:"\xD0",eth:"\xF0",Euml:"\xCB",euml:"\xEB",euro:"\u20AC",excl:"!",exist:"\u2203",Exists:"\u2203",expectation:"\u2130",ExponentialE:"\u2147",exponentiale:"\u2147",fallingdotseq:"\u2252",Fcy:"\u0424",fcy:"\u0444",female:"\u2640",ffilig:"\uFB03",fflig:"\uFB00",ffllig:"\uFB04",Ffr:"\u{1D509}",ffr:"\u{1D523}",filig:"\uFB01",FilledSmallSquare:"\u25FC",FilledVerySmallSquare:"\u25AA",fjlig:"fj",flat:"\u266D",fllig:"\uFB02",fltns:"\u25B1",fnof:"\u0192",Fopf:"\u{1D53D}",fopf:"\u{1D557}",ForAll:"\u2200",forall:"\u2200",fork:"\u22D4",forkv:"\u2AD9",Fouriertrf:"\u2131",fpartint:"\u2A0D",frac12:"\xBD",frac13:"\u2153",frac14:"\xBC",frac15:"\u2155",frac16:"\u2159",frac18:"\u215B",frac23:"\u2154",frac25:"\u2156",frac34:"\xBE",frac35:"\u2157",frac38:"\u215C",frac45:"\u2158",frac56:"\u215A",frac58:"\u215D",frac78:"\u215E",frasl:"\u2044",frown:"\u2322",Fscr:"\u2131",fscr:"\u{1D4BB}",gacute:"\u01F5",Gamma:"\u0393",gamma:"\u03B3",Gammad:"\u03DC",gammad:"\u03DD",gap:"\u2A86",Gbreve:"\u011E",gbreve:"\u011F",Gcedil:"\u0122",Gcirc:"\u011C",gcirc:"\u011D",Gcy:"\u0413",gcy:"\u0433",Gdot:"\u0120",gdot:"\u0121",gE:"\u2267",ge:"\u2265",gEl:"\u2A8C",gel:"\u22DB",geq:"\u2265",geqq:"\u2267",geqslant:"\u2A7E",ges:"\u2A7E",gescc:"\u2AA9",gesdot:"\u2A80",gesdoto:"\u2A82",gesdotol:"\u2A84",gesl:"\u22DB\uFE00",gesles:"\u2A94",Gfr:"\u{1D50A}",gfr:"\u{1D524}",Gg:"\u22D9",gg:"\u226B",ggg:"\u22D9",gimel:"\u2137",GJcy:"\u0403",gjcy:"\u0453",gl:"\u2277",gla:"\u2AA5",glE:"\u2A92",glj:"\u2AA4",gnap:"\u2A8A",gnapprox:"\u2A8A",gnE:"\u2269",gne:"\u2A88",gneq:"\u2A88",gneqq:"\u2269",gnsim:"\u22E7",Gopf:"\u{1D53E}",gopf:"\u{1D558}",grave:"`",GreaterEqual:"\u2265",GreaterEqualLess:"\u22DB",GreaterFullEqual:"\u2267",GreaterGreater:"\u2AA2",GreaterLess:"\u2277",GreaterSlantEqual:"\u2A7E",GreaterTilde:"\u2273",Gscr:"\u{1D4A2}",gscr:"\u210A",gsim:"\u2273",gsime:"\u2A8E",gsiml:"\u2A90",Gt:"\u226B",GT:">",gt:">",gtcc:"\u2AA7",gtcir:"\u2A7A",gtdot:"\u22D7",gtlPar:"\u2995",gtquest:"\u2A7C",gtrapprox:"\u2A86",gtrarr:"\u2978",gtrdot:"\u22D7",gtreqless:"\u22DB",gtreqqless:"\u2A8C",gtrless:"\u2277",gtrsim:"\u2273",gvertneqq:"\u2269\uFE00",gvnE:"\u2269\uFE00",Hacek:"\u02C7",hairsp:"\u200A",half:"\xBD",hamilt:"\u210B",HARDcy:"\u042A",hardcy:"\u044A",hArr:"\u21D4",harr:"\u2194",harrcir:"\u2948",harrw:"\u21AD",Hat:"^",hbar:"\u210F",Hcirc:"\u0124",hcirc:"\u0125",hearts:"\u2665",heartsuit:"\u2665",hellip:"\u2026",hercon:"\u22B9",Hfr:"\u210C",hfr:"\u{1D525}",HilbertSpace:"\u210B",hksearow:"\u2925",hkswarow:"\u2926",hoarr:"\u21FF",homtht:"\u223B",hookleftarrow:"\u21A9",hookrightarrow:"\u21AA",Hopf:"\u210D",hopf:"\u{1D559}",horbar:"\u2015",HorizontalLine:"\u2500",Hscr:"\u210B",hscr:"\u{1D4BD}",hslash:"\u210F",Hstrok:"\u0126",hstrok:"\u0127",HumpDownHump:"\u224E",HumpEqual:"\u224F",hybull:"\u2043",hyphen:"\u2010",Iacute:"\xCD",iacute:"\xED",ic:"\u2063",Icirc:"\xCE",icirc:"\xEE",Icy:"\u0418",icy:"\u0438",Idot:"\u0130",IEcy:"\u0415",iecy:"\u0435",iexcl:"\xA1",iff:"\u21D4",Ifr:"\u2111",ifr:"\u{1D526}",Igrave:"\xCC",igrave:"\xEC",ii:"\u2148",iiiint:"\u2A0C",iiint:"\u222D",iinfin:"\u29DC",iiota:"\u2129",IJlig:"\u0132",ijlig:"\u0133",Im:"\u2111",Imacr:"\u012A",imacr:"\u012B",image:"\u2111",ImaginaryI:"\u2148",imagline:"\u2110",imagpart:"\u2111",imath:"\u0131",imof:"\u22B7",imped:"\u01B5",Implies:"\u21D2",in:"\u2208",incare:"\u2105",infin:"\u221E",infintie:"\u29DD",inodot:"\u0131",Int:"\u222C",int:"\u222B",intcal:"\u22BA",integers:"\u2124",Integral:"\u222B",intercal:"\u22BA",Intersection:"\u22C2",intlarhk:"\u2A17",intprod:"\u2A3C",InvisibleComma:"\u2063",InvisibleTimes:"\u2062",IOcy:"\u0401",iocy:"\u0451",Iogon:"\u012E",iogon:"\u012F",Iopf:"\u{1D540}",iopf:"\u{1D55A}",Iota:"\u0399",iota:"\u03B9",iprod:"\u2A3C",iquest:"\xBF",Iscr:"\u2110",iscr:"\u{1D4BE}",isin:"\u2208",isindot:"\u22F5",isinE:"\u22F9",isins:"\u22F4",isinsv:"\u22F3",isinv:"\u2208",it:"\u2062",Itilde:"\u0128",itilde:"\u0129",Iukcy:"\u0406",iukcy:"\u0456",Iuml:"\xCF",iuml:"\xEF",Jcirc:"\u0134",jcirc:"\u0135",Jcy:"\u0419",jcy:"\u0439",Jfr:"\u{1D50D}",jfr:"\u{1D527}",jmath:"\u0237",Jopf:"\u{1D541}",jopf:"\u{1D55B}",Jscr:"\u{1D4A5}",jscr:"\u{1D4BF}",Jsercy:"\u0408",jsercy:"\u0458",Jukcy:"\u0404",jukcy:"\u0454",Kappa:"\u039A",kappa:"\u03BA",kappav:"\u03F0",Kcedil:"\u0136",kcedil:"\u0137",Kcy:"\u041A",kcy:"\u043A",Kfr:"\u{1D50E}",kfr:"\u{1D528}",kgreen:"\u0138",KHcy:"\u0425",khcy:"\u0445",KJcy:"\u040C",kjcy:"\u045C",Kopf:"\u{1D542}",kopf:"\u{1D55C}",Kscr:"\u{1D4A6}",kscr:"\u{1D4C0}",lAarr:"\u21DA",Lacute:"\u0139",lacute:"\u013A",laemptyv:"\u29B4",lagran:"\u2112",Lambda:"\u039B",lambda:"\u03BB",Lang:"\u27EA",lang:"\u27E8",langd:"\u2991",langle:"\u27E8",lap:"\u2A85",Laplacetrf:"\u2112",laquo:"\xAB",Larr:"\u219E",lArr:"\u21D0",larr:"\u2190",larrb:"\u21E4",larrbfs:"\u291F",larrfs:"\u291D",larrhk:"\u21A9",larrlp:"\u21AB",larrpl:"\u2939",larrsim:"\u2973",larrtl:"\u21A2",lat:"\u2AAB",lAtail:"\u291B",latail:"\u2919",late:"\u2AAD",lates:"\u2AAD\uFE00",lBarr:"\u290E",lbarr:"\u290C",lbbrk:"\u2772",lbrace:"{",lbrack:"[",lbrke:"\u298B",lbrksld:"\u298F",lbrkslu:"\u298D",Lcaron:"\u013D",lcaron:"\u013E",Lcedil:"\u013B",lcedil:"\u013C",lceil:"\u2308",lcub:"{",Lcy:"\u041B",lcy:"\u043B",ldca:"\u2936",ldquo:"\u201C",ldquor:"\u201E",ldrdhar:"\u2967",ldrushar:"\u294B",ldsh:"\u21B2",lE:"\u2266",le:"\u2264",LeftAngleBracket:"\u27E8",LeftArrow:"\u2190",Leftarrow:"\u21D0",leftarrow:"\u2190",LeftArrowBar:"\u21E4",LeftArrowRightArrow:"\u21C6",leftarrowtail:"\u21A2",LeftCeiling:"\u2308",LeftDoubleBracket:"\u27E6",LeftDownTeeVector:"\u2961",LeftDownVector:"\u21C3",LeftDownVectorBar:"\u2959",LeftFloor:"\u230A",leftharpoondown:"\u21BD",leftharpoonup:"\u21BC",leftleftarrows:"\u21C7",LeftRightArrow:"\u2194",Leftrightarrow:"\u21D4",leftrightarrow:"\u2194",leftrightarrows:"\u21C6",leftrightharpoons:"\u21CB",leftrightsquigarrow:"\u21AD",LeftRightVector:"\u294E",LeftTee:"\u22A3",LeftTeeArrow:"\u21A4",LeftTeeVector:"\u295A",leftthreetimes:"\u22CB",LeftTriangle:"\u22B2",LeftTriangleBar:"\u29CF",LeftTriangleEqual:"\u22B4",LeftUpDownVector:"\u2951",LeftUpTeeVector:"\u2960",LeftUpVector:"\u21BF",LeftUpVectorBar:"\u2958",LeftVector:"\u21BC",LeftVectorBar:"\u2952",lEg:"\u2A8B",leg:"\u22DA",leq:"\u2264",leqq:"\u2266",leqslant:"\u2A7D",les:"\u2A7D",lescc:"\u2AA8",lesdot:"\u2A7F",lesdoto:"\u2A81",lesdotor:"\u2A83",lesg:"\u22DA\uFE00",lesges:"\u2A93",lessapprox:"\u2A85",lessdot:"\u22D6",lesseqgtr:"\u22DA",lesseqqgtr:"\u2A8B",LessEqualGreater:"\u22DA",LessFullEqual:"\u2266",LessGreater:"\u2276",lessgtr:"\u2276",LessLess:"\u2AA1",lesssim:"\u2272",LessSlantEqual:"\u2A7D",LessTilde:"\u2272",lfisht:"\u297C",lfloor:"\u230A",Lfr:"\u{1D50F}",lfr:"\u{1D529}",lg:"\u2276",lgE:"\u2A91",lHar:"\u2962",lhard:"\u21BD",lharu:"\u21BC",lharul:"\u296A",lhblk:"\u2584",LJcy:"\u0409",ljcy:"\u0459",Ll:"\u22D8",ll:"\u226A",llarr:"\u21C7",llcorner:"\u231E",Lleftarrow:"\u21DA",llhard:"\u296B",lltri:"\u25FA",Lmidot:"\u013F",lmidot:"\u0140",lmoust:"\u23B0",lmoustache:"\u23B0",lnap:"\u2A89",lnapprox:"\u2A89",lnE:"\u2268",lne:"\u2A87",lneq:"\u2A87",lneqq:"\u2268",lnsim:"\u22E6",loang:"\u27EC",loarr:"\u21FD",lobrk:"\u27E6",LongLeftArrow:"\u27F5",Longleftarrow:"\u27F8",longleftarrow:"\u27F5",LongLeftRightArrow:"\u27F7",Longleftrightarrow:"\u27FA",longleftrightarrow:"\u27F7",longmapsto:"\u27FC",LongRightArrow:"\u27F6",Longrightarrow:"\u27F9",longrightarrow:"\u27F6",looparrowleft:"\u21AB",looparrowright:"\u21AC",lopar:"\u2985",Lopf:"\u{1D543}",lopf:"\u{1D55D}",loplus:"\u2A2D",lotimes:"\u2A34",lowast:"\u2217",lowbar:"_",LowerLeftArrow:"\u2199",LowerRightArrow:"\u2198",loz:"\u25CA",lozenge:"\u25CA",lozf:"\u29EB",lpar:"(",lparlt:"\u2993",lrarr:"\u21C6",lrcorner:"\u231F",lrhar:"\u21CB",lrhard:"\u296D",lrm:"\u200E",lrtri:"\u22BF",lsaquo:"\u2039",Lscr:"\u2112",lscr:"\u{1D4C1}",Lsh:"\u21B0",lsh:"\u21B0",lsim:"\u2272",lsime:"\u2A8D",lsimg:"\u2A8F",lsqb:"[",lsquo:"\u2018",lsquor:"\u201A",Lstrok:"\u0141",lstrok:"\u0142",Lt:"\u226A",LT:"<",lt:"<",ltcc:"\u2AA6",ltcir:"\u2A79",ltdot:"\u22D6",lthree:"\u22CB",ltimes:"\u22C9",ltlarr:"\u2976",ltquest:"\u2A7B",ltri:"\u25C3",ltrie:"\u22B4",ltrif:"\u25C2",ltrPar:"\u2996",lurdshar:"\u294A",luruhar:"\u2966",lvertneqq:"\u2268\uFE00",lvnE:"\u2268\uFE00",macr:"\xAF",male:"\u2642",malt:"\u2720",maltese:"\u2720",Map:"\u2905",map:"\u21A6",mapsto:"\u21A6",mapstodown:"\u21A7",mapstoleft:"\u21A4",mapstoup:"\u21A5",marker:"\u25AE",mcomma:"\u2A29",Mcy:"\u041C",mcy:"\u043C",mdash:"\u2014",mDDot:"\u223A",measuredangle:"\u2221",MediumSpace:"\u205F",Mellintrf:"\u2133",Mfr:"\u{1D510}",mfr:"\u{1D52A}",mho:"\u2127",micro:"\xB5",mid:"\u2223",midast:"*",midcir:"\u2AF0",middot:"\xB7",minus:"\u2212",minusb:"\u229F",minusd:"\u2238",minusdu:"\u2A2A",MinusPlus:"\u2213",mlcp:"\u2ADB",mldr:"\u2026",mnplus:"\u2213",models:"\u22A7",Mopf:"\u{1D544}",mopf:"\u{1D55E}",mp:"\u2213",Mscr:"\u2133",mscr:"\u{1D4C2}",mstpos:"\u223E",Mu:"\u039C",mu:"\u03BC",multimap:"\u22B8",mumap:"\u22B8",nabla:"\u2207",Nacute:"\u0143",nacute:"\u0144",nang:"\u2220\u20D2",nap:"\u2249",napE:"\u2A70\u0338",napid:"\u224B\u0338",napos:"\u0149",napprox:"\u2249",natur:"\u266E",natural:"\u266E",naturals:"\u2115",nbsp:"\xA0",nbump:"\u224E\u0338",nbumpe:"\u224F\u0338",ncap:"\u2A43",Ncaron:"\u0147",ncaron:"\u0148",Ncedil:"\u0145",ncedil:"\u0146",ncong:"\u2247",ncongdot:"\u2A6D\u0338",ncup:"\u2A42",Ncy:"\u041D",ncy:"\u043D",ndash:"\u2013",ne:"\u2260",nearhk:"\u2924",neArr:"\u21D7",nearr:"\u2197",nearrow:"\u2197",nedot:"\u2250\u0338",NegativeMediumSpace:"\u200B",NegativeThickSpace:"\u200B",NegativeThinSpace:"\u200B",NegativeVeryThinSpace:"\u200B",nequiv:"\u2262",nesear:"\u2928",nesim:"\u2242\u0338",NestedGreaterGreater:"\u226B",NestedLessLess:"\u226A",NewLine:`
`,nexist:"\u2204",nexists:"\u2204",Nfr:"\u{1D511}",nfr:"\u{1D52B}",ngE:"\u2267\u0338",nge:"\u2271",ngeq:"\u2271",ngeqq:"\u2267\u0338",ngeqslant:"\u2A7E\u0338",nges:"\u2A7E\u0338",nGg:"\u22D9\u0338",ngsim:"\u2275",nGt:"\u226B\u20D2",ngt:"\u226F",ngtr:"\u226F",nGtv:"\u226B\u0338",nhArr:"\u21CE",nharr:"\u21AE",nhpar:"\u2AF2",ni:"\u220B",nis:"\u22FC",nisd:"\u22FA",niv:"\u220B",NJcy:"\u040A",njcy:"\u045A",nlArr:"\u21CD",nlarr:"\u219A",nldr:"\u2025",nlE:"\u2266\u0338",nle:"\u2270",nLeftarrow:"\u21CD",nleftarrow:"\u219A",nLeftrightarrow:"\u21CE",nleftrightarrow:"\u21AE",nleq:"\u2270",nleqq:"\u2266\u0338",nleqslant:"\u2A7D\u0338",nles:"\u2A7D\u0338",nless:"\u226E",nLl:"\u22D8\u0338",nlsim:"\u2274",nLt:"\u226A\u20D2",nlt:"\u226E",nltri:"\u22EA",nltrie:"\u22EC",nLtv:"\u226A\u0338",nmid:"\u2224",NoBreak:"\u2060",NonBreakingSpace:"\xA0",Nopf:"\u2115",nopf:"\u{1D55F}",Not:"\u2AEC",not:"\xAC",NotCongruent:"\u2262",NotCupCap:"\u226D",NotDoubleVerticalBar:"\u2226",NotElement:"\u2209",NotEqual:"\u2260",NotEqualTilde:"\u2242\u0338",NotExists:"\u2204",NotGreater:"\u226F",NotGreaterEqual:"\u2271",NotGreaterFullEqual:"\u2267\u0338",NotGreaterGreater:"\u226B\u0338",NotGreaterLess:"\u2279",NotGreaterSlantEqual:"\u2A7E\u0338",NotGreaterTilde:"\u2275",NotHumpDownHump:"\u224E\u0338",NotHumpEqual:"\u224F\u0338",notin:"\u2209",notindot:"\u22F5\u0338",notinE:"\u22F9\u0338",notinva:"\u2209",notinvb:"\u22F7",notinvc:"\u22F6",NotLeftTriangle:"\u22EA",NotLeftTriangleBar:"\u29CF\u0338",NotLeftTriangleEqual:"\u22EC",NotLess:"\u226E",NotLessEqual:"\u2270",NotLessGreater:"\u2278",NotLessLess:"\u226A\u0338",NotLessSlantEqual:"\u2A7D\u0338",NotLessTilde:"\u2274",NotNestedGreaterGreater:"\u2AA2\u0338",NotNestedLessLess:"\u2AA1\u0338",notni:"\u220C",notniva:"\u220C",notnivb:"\u22FE",notnivc:"\u22FD",NotPrecedes:"\u2280",NotPrecedesEqual:"\u2AAF\u0338",NotPrecedesSlantEqual:"\u22E0",NotReverseElement:"\u220C",NotRightTriangle:"\u22EB",NotRightTriangleBar:"\u29D0\u0338",NotRightTriangleEqual:"\u22ED",NotSquareSubset:"\u228F\u0338",NotSquareSubsetEqual:"\u22E2",NotSquareSuperset:"\u2290\u0338",NotSquareSupersetEqual:"\u22E3",NotSubset:"\u2282\u20D2",NotSubsetEqual:"\u2288",NotSucceeds:"\u2281",NotSucceedsEqual:"\u2AB0\u0338",NotSucceedsSlantEqual:"\u22E1",NotSucceedsTilde:"\u227F\u0338",NotSuperset:"\u2283\u20D2",NotSupersetEqual:"\u2289",NotTilde:"\u2241",NotTildeEqual:"\u2244",NotTildeFullEqual:"\u2247",NotTildeTilde:"\u2249",NotVerticalBar:"\u2224",npar:"\u2226",nparallel:"\u2226",nparsl:"\u2AFD\u20E5",npart:"\u2202\u0338",npolint:"\u2A14",npr:"\u2280",nprcue:"\u22E0",npre:"\u2AAF\u0338",nprec:"\u2280",npreceq:"\u2AAF\u0338",nrArr:"\u21CF",nrarr:"\u219B",nrarrc:"\u2933\u0338",nrarrw:"\u219D\u0338",nRightarrow:"\u21CF",nrightarrow:"\u219B",nrtri:"\u22EB",nrtrie:"\u22ED",nsc:"\u2281",nsccue:"\u22E1",nsce:"\u2AB0\u0338",Nscr:"\u{1D4A9}",nscr:"\u{1D4C3}",nshortmid:"\u2224",nshortparallel:"\u2226",nsim:"\u2241",nsime:"\u2244",nsimeq:"\u2244",nsmid:"\u2224",nspar:"\u2226",nsqsube:"\u22E2",nsqsupe:"\u22E3",nsub:"\u2284",nsubE:"\u2AC5\u0338",nsube:"\u2288",nsubset:"\u2282\u20D2",nsubseteq:"\u2288",nsubseteqq:"\u2AC5\u0338",nsucc:"\u2281",nsucceq:"\u2AB0\u0338",nsup:"\u2285",nsupE:"\u2AC6\u0338",nsupe:"\u2289",nsupset:"\u2283\u20D2",nsupseteq:"\u2289",nsupseteqq:"\u2AC6\u0338",ntgl:"\u2279",Ntilde:"\xD1",ntilde:"\xF1",ntlg:"\u2278",ntriangleleft:"\u22EA",ntrianglelefteq:"\u22EC",ntriangleright:"\u22EB",ntrianglerighteq:"\u22ED",Nu:"\u039D",nu:"\u03BD",num:"#",numero:"\u2116",numsp:"\u2007",nvap:"\u224D\u20D2",nVDash:"\u22AF",nVdash:"\u22AE",nvDash:"\u22AD",nvdash:"\u22AC",nvge:"\u2265\u20D2",nvgt:">\u20D2",nvHarr:"\u2904",nvinfin:"\u29DE",nvlArr:"\u2902",nvle:"\u2264\u20D2",nvlt:"<\u20D2",nvltrie:"\u22B4\u20D2",nvrArr:"\u2903",nvrtrie:"\u22B5\u20D2",nvsim:"\u223C\u20D2",nwarhk:"\u2923",nwArr:"\u21D6",nwarr:"\u2196",nwarrow:"\u2196",nwnear:"\u2927",Oacute:"\xD3",oacute:"\xF3",oast:"\u229B",ocir:"\u229A",Ocirc:"\xD4",ocirc:"\xF4",Ocy:"\u041E",ocy:"\u043E",odash:"\u229D",Odblac:"\u0150",odblac:"\u0151",odiv:"\u2A38",odot:"\u2299",odsold:"\u29BC",OElig:"\u0152",oelig:"\u0153",ofcir:"\u29BF",Ofr:"\u{1D512}",ofr:"\u{1D52C}",ogon:"\u02DB",Ograve:"\xD2",ograve:"\xF2",ogt:"\u29C1",ohbar:"\u29B5",ohm:"\u03A9",oint:"\u222E",olarr:"\u21BA",olcir:"\u29BE",olcross:"\u29BB",oline:"\u203E",olt:"\u29C0",Omacr:"\u014C",omacr:"\u014D",Omega:"\u03A9",omega:"\u03C9",Omicron:"\u039F",omicron:"\u03BF",omid:"\u29B6",ominus:"\u2296",Oopf:"\u{1D546}",oopf:"\u{1D560}",opar:"\u29B7",OpenCurlyDoubleQuote:"\u201C",OpenCurlyQuote:"\u2018",operp:"\u29B9",oplus:"\u2295",Or:"\u2A54",or:"\u2228",orarr:"\u21BB",ord:"\u2A5D",order:"\u2134",orderof:"\u2134",ordf:"\xAA",ordm:"\xBA",origof:"\u22B6",oror:"\u2A56",orslope:"\u2A57",orv:"\u2A5B",oS:"\u24C8",Oscr:"\u{1D4AA}",oscr:"\u2134",Oslash:"\xD8",oslash:"\xF8",osol:"\u2298",Otilde:"\xD5",otilde:"\xF5",Otimes:"\u2A37",otimes:"\u2297",otimesas:"\u2A36",Ouml:"\xD6",ouml:"\xF6",ovbar:"\u233D",OverBar:"\u203E",OverBrace:"\u23DE",OverBracket:"\u23B4",OverParenthesis:"\u23DC",par:"\u2225",para:"\xB6",parallel:"\u2225",parsim:"\u2AF3",parsl:"\u2AFD",part:"\u2202",PartialD:"\u2202",Pcy:"\u041F",pcy:"\u043F",percnt:"%",period:".",permil:"\u2030",perp:"\u22A5",pertenk:"\u2031",Pfr:"\u{1D513}",pfr:"\u{1D52D}",Phi:"\u03A6",phi:"\u03C6",phiv:"\u03D5",phmmat:"\u2133",phone:"\u260E",Pi:"\u03A0",pi:"\u03C0",pitchfork:"\u22D4",piv:"\u03D6",planck:"\u210F",planckh:"\u210E",plankv:"\u210F",plus:"+",plusacir:"\u2A23",plusb:"\u229E",pluscir:"\u2A22",plusdo:"\u2214",plusdu:"\u2A25",pluse:"\u2A72",PlusMinus:"\xB1",plusmn:"\xB1",plussim:"\u2A26",plustwo:"\u2A27",pm:"\xB1",Poincareplane:"\u210C",pointint:"\u2A15",Popf:"\u2119",popf:"\u{1D561}",pound:"\xA3",Pr:"\u2ABB",pr:"\u227A",prap:"\u2AB7",prcue:"\u227C",prE:"\u2AB3",pre:"\u2AAF",prec:"\u227A",precapprox:"\u2AB7",preccurlyeq:"\u227C",Precedes:"\u227A",PrecedesEqual:"\u2AAF",PrecedesSlantEqual:"\u227C",PrecedesTilde:"\u227E",preceq:"\u2AAF",precnapprox:"\u2AB9",precneqq:"\u2AB5",precnsim:"\u22E8",precsim:"\u227E",Prime:"\u2033",prime:"\u2032",primes:"\u2119",prnap:"\u2AB9",prnE:"\u2AB5",prnsim:"\u22E8",prod:"\u220F",Product:"\u220F",profalar:"\u232E",profline:"\u2312",profsurf:"\u2313",prop:"\u221D",Proportion:"\u2237",Proportional:"\u221D",propto:"\u221D",prsim:"\u227E",prurel:"\u22B0",Pscr:"\u{1D4AB}",pscr:"\u{1D4C5}",Psi:"\u03A8",psi:"\u03C8",puncsp:"\u2008",Qfr:"\u{1D514}",qfr:"\u{1D52E}",qint:"\u2A0C",Qopf:"\u211A",qopf:"\u{1D562}",qprime:"\u2057",Qscr:"\u{1D4AC}",qscr:"\u{1D4C6}",quaternions:"\u210D",quatint:"\u2A16",quest:"?",questeq:"\u225F",QUOT:'"',quot:'"',rAarr:"\u21DB",race:"\u223D\u0331",Racute:"\u0154",racute:"\u0155",radic:"\u221A",raemptyv:"\u29B3",Rang:"\u27EB",rang:"\u27E9",rangd:"\u2992",range:"\u29A5",rangle:"\u27E9",raquo:"\xBB",Rarr:"\u21A0",rArr:"\u21D2",rarr:"\u2192",rarrap:"\u2975",rarrb:"\u21E5",rarrbfs:"\u2920",rarrc:"\u2933",rarrfs:"\u291E",rarrhk:"\u21AA",rarrlp:"\u21AC",rarrpl:"\u2945",rarrsim:"\u2974",Rarrtl:"\u2916",rarrtl:"\u21A3",rarrw:"\u219D",rAtail:"\u291C",ratail:"\u291A",ratio:"\u2236",rationals:"\u211A",RBarr:"\u2910",rBarr:"\u290F",rbarr:"\u290D",rbbrk:"\u2773",rbrace:"}",rbrack:"]",rbrke:"\u298C",rbrksld:"\u298E",rbrkslu:"\u2990",Rcaron:"\u0158",rcaron:"\u0159",Rcedil:"\u0156",rcedil:"\u0157",rceil:"\u2309",rcub:"}",Rcy:"\u0420",rcy:"\u0440",rdca:"\u2937",rdldhar:"\u2969",rdquo:"\u201D",rdquor:"\u201D",rdsh:"\u21B3",Re:"\u211C",real:"\u211C",realine:"\u211B",realpart:"\u211C",reals:"\u211D",rect:"\u25AD",REG:"\xAE",reg:"\xAE",ReverseElement:"\u220B",ReverseEquilibrium:"\u21CB",ReverseUpEquilibrium:"\u296F",rfisht:"\u297D",rfloor:"\u230B",Rfr:"\u211C",rfr:"\u{1D52F}",rHar:"\u2964",rhard:"\u21C1",rharu:"\u21C0",rharul:"\u296C",Rho:"\u03A1",rho:"\u03C1",rhov:"\u03F1",RightAngleBracket:"\u27E9",RightArrow:"\u2192",Rightarrow:"\u21D2",rightarrow:"\u2192",RightArrowBar:"\u21E5",RightArrowLeftArrow:"\u21C4",rightarrowtail:"\u21A3",RightCeiling:"\u2309",RightDoubleBracket:"\u27E7",RightDownTeeVector:"\u295D",RightDownVector:"\u21C2",RightDownVectorBar:"\u2955",RightFloor:"\u230B",rightharpoondown:"\u21C1",rightharpoonup:"\u21C0",rightleftarrows:"\u21C4",rightleftharpoons:"\u21CC",rightrightarrows:"\u21C9",rightsquigarrow:"\u219D",RightTee:"\u22A2",RightTeeArrow:"\u21A6",RightTeeVector:"\u295B",rightthreetimes:"\u22CC",RightTriangle:"\u22B3",RightTriangleBar:"\u29D0",RightTriangleEqual:"\u22B5",RightUpDownVector:"\u294F",RightUpTeeVector:"\u295C",RightUpVector:"\u21BE",RightUpVectorBar:"\u2954",RightVector:"\u21C0",RightVectorBar:"\u2953",ring:"\u02DA",risingdotseq:"\u2253",rlarr:"\u21C4",rlhar:"\u21CC",rlm:"\u200F",rmoust:"\u23B1",rmoustache:"\u23B1",rnmid:"\u2AEE",roang:"\u27ED",roarr:"\u21FE",robrk:"\u27E7",ropar:"\u2986",Ropf:"\u211D",ropf:"\u{1D563}",roplus:"\u2A2E",rotimes:"\u2A35",RoundImplies:"\u2970",rpar:")",rpargt:"\u2994",rppolint:"\u2A12",rrarr:"\u21C9",Rrightarrow:"\u21DB",rsaquo:"\u203A",Rscr:"\u211B",rscr:"\u{1D4C7}",Rsh:"\u21B1",rsh:"\u21B1",rsqb:"]",rsquo:"\u2019",rsquor:"\u2019",rthree:"\u22CC",rtimes:"\u22CA",rtri:"\u25B9",rtrie:"\u22B5",rtrif:"\u25B8",rtriltri:"\u29CE",RuleDelayed:"\u29F4",ruluhar:"\u2968",rx:"\u211E",Sacute:"\u015A",sacute:"\u015B",sbquo:"\u201A",Sc:"\u2ABC",sc:"\u227B",scap:"\u2AB8",Scaron:"\u0160",scaron:"\u0161",sccue:"\u227D",scE:"\u2AB4",sce:"\u2AB0",Scedil:"\u015E",scedil:"\u015F",Scirc:"\u015C",scirc:"\u015D",scnap:"\u2ABA",scnE:"\u2AB6",scnsim:"\u22E9",scpolint:"\u2A13",scsim:"\u227F",Scy:"\u0421",scy:"\u0441",sdot:"\u22C5",sdotb:"\u22A1",sdote:"\u2A66",searhk:"\u2925",seArr:"\u21D8",searr:"\u2198",searrow:"\u2198",sect:"\xA7",semi:";",seswar:"\u2929",setminus:"\u2216",setmn:"\u2216",sext:"\u2736",Sfr:"\u{1D516}",sfr:"\u{1D530}",sfrown:"\u2322",sharp:"\u266F",SHCHcy:"\u0429",shchcy:"\u0449",SHcy:"\u0428",shcy:"\u0448",ShortDownArrow:"\u2193",ShortLeftArrow:"\u2190",shortmid:"\u2223",shortparallel:"\u2225",ShortRightArrow:"\u2192",ShortUpArrow:"\u2191",shy:"\xAD",Sigma:"\u03A3",sigma:"\u03C3",sigmaf:"\u03C2",sigmav:"\u03C2",sim:"\u223C",simdot:"\u2A6A",sime:"\u2243",simeq:"\u2243",simg:"\u2A9E",simgE:"\u2AA0",siml:"\u2A9D",simlE:"\u2A9F",simne:"\u2246",simplus:"\u2A24",simrarr:"\u2972",slarr:"\u2190",SmallCircle:"\u2218",smallsetminus:"\u2216",smashp:"\u2A33",smeparsl:"\u29E4",smid:"\u2223",smile:"\u2323",smt:"\u2AAA",smte:"\u2AAC",smtes:"\u2AAC\uFE00",SOFTcy:"\u042C",softcy:"\u044C",sol:"/",solb:"\u29C4",solbar:"\u233F",Sopf:"\u{1D54A}",sopf:"\u{1D564}",spades:"\u2660",spadesuit:"\u2660",spar:"\u2225",sqcap:"\u2293",sqcaps:"\u2293\uFE00",sqcup:"\u2294",sqcups:"\u2294\uFE00",Sqrt:"\u221A",sqsub:"\u228F",sqsube:"\u2291",sqsubset:"\u228F",sqsubseteq:"\u2291",sqsup:"\u2290",sqsupe:"\u2292",sqsupset:"\u2290",sqsupseteq:"\u2292",squ:"\u25A1",Square:"\u25A1",square:"\u25A1",SquareIntersection:"\u2293",SquareSubset:"\u228F",SquareSubsetEqual:"\u2291",SquareSuperset:"\u2290",SquareSupersetEqual:"\u2292",SquareUnion:"\u2294",squarf:"\u25AA",squf:"\u25AA",srarr:"\u2192",Sscr:"\u{1D4AE}",sscr:"\u{1D4C8}",ssetmn:"\u2216",ssmile:"\u2323",sstarf:"\u22C6",Star:"\u22C6",star:"\u2606",starf:"\u2605",straightepsilon:"\u03F5",straightphi:"\u03D5",strns:"\xAF",Sub:"\u22D0",sub:"\u2282",subdot:"\u2ABD",subE:"\u2AC5",sube:"\u2286",subedot:"\u2AC3",submult:"\u2AC1",subnE:"\u2ACB",subne:"\u228A",subplus:"\u2ABF",subrarr:"\u2979",Subset:"\u22D0",subset:"\u2282",subseteq:"\u2286",subseteqq:"\u2AC5",SubsetEqual:"\u2286",subsetneq:"\u228A",subsetneqq:"\u2ACB",subsim:"\u2AC7",subsub:"\u2AD5",subsup:"\u2AD3",succ:"\u227B",succapprox:"\u2AB8",succcurlyeq:"\u227D",Succeeds:"\u227B",SucceedsEqual:"\u2AB0",SucceedsSlantEqual:"\u227D",SucceedsTilde:"\u227F",succeq:"\u2AB0",succnapprox:"\u2ABA",succneqq:"\u2AB6",succnsim:"\u22E9",succsim:"\u227F",SuchThat:"\u220B",Sum:"\u2211",sum:"\u2211",sung:"\u266A",Sup:"\u22D1",sup:"\u2283",sup1:"\xB9",sup2:"\xB2",sup3:"\xB3",supdot:"\u2ABE",supdsub:"\u2AD8",supE:"\u2AC6",supe:"\u2287",supedot:"\u2AC4",Superset:"\u2283",SupersetEqual:"\u2287",suphsol:"\u27C9",suphsub:"\u2AD7",suplarr:"\u297B",supmult:"\u2AC2",supnE:"\u2ACC",supne:"\u228B",supplus:"\u2AC0",Supset:"\u22D1",supset:"\u2283",supseteq:"\u2287",supseteqq:"\u2AC6",supsetneq:"\u228B",supsetneqq:"\u2ACC",supsim:"\u2AC8",supsub:"\u2AD4",supsup:"\u2AD6",swarhk:"\u2926",swArr:"\u21D9",swarr:"\u2199",swarrow:"\u2199",swnwar:"\u292A",szlig:"\xDF",Tab:"	",target:"\u2316",Tau:"\u03A4",tau:"\u03C4",tbrk:"\u23B4",Tcaron:"\u0164",tcaron:"\u0165",Tcedil:"\u0162",tcedil:"\u0163",Tcy:"\u0422",tcy:"\u0442",tdot:"\u20DB",telrec:"\u2315",Tfr:"\u{1D517}",tfr:"\u{1D531}",there4:"\u2234",Therefore:"\u2234",therefore:"\u2234",Theta:"\u0398",theta:"\u03B8",thetasym:"\u03D1",thetav:"\u03D1",thickapprox:"\u2248",thicksim:"\u223C",ThickSpace:"\u205F\u200A",thinsp:"\u2009",ThinSpace:"\u2009",thkap:"\u2248",thksim:"\u223C",THORN:"\xDE",thorn:"\xFE",Tilde:"\u223C",tilde:"\u02DC",TildeEqual:"\u2243",TildeFullEqual:"\u2245",TildeTilde:"\u2248",times:"\xD7",timesb:"\u22A0",timesbar:"\u2A31",timesd:"\u2A30",tint:"\u222D",toea:"\u2928",top:"\u22A4",topbot:"\u2336",topcir:"\u2AF1",Topf:"\u{1D54B}",topf:"\u{1D565}",topfork:"\u2ADA",tosa:"\u2929",tprime:"\u2034",TRADE:"\u2122",trade:"\u2122",triangle:"\u25B5",triangledown:"\u25BF",triangleleft:"\u25C3",trianglelefteq:"\u22B4",triangleq:"\u225C",triangleright:"\u25B9",trianglerighteq:"\u22B5",tridot:"\u25EC",trie:"\u225C",triminus:"\u2A3A",TripleDot:"\u20DB",triplus:"\u2A39",trisb:"\u29CD",tritime:"\u2A3B",trpezium:"\u23E2",Tscr:"\u{1D4AF}",tscr:"\u{1D4C9}",TScy:"\u0426",tscy:"\u0446",TSHcy:"\u040B",tshcy:"\u045B",Tstrok:"\u0166",tstrok:"\u0167",twixt:"\u226C",twoheadleftarrow:"\u219E",twoheadrightarrow:"\u21A0",Uacute:"\xDA",uacute:"\xFA",Uarr:"\u219F",uArr:"\u21D1",uarr:"\u2191",Uarrocir:"\u2949",Ubrcy:"\u040E",ubrcy:"\u045E",Ubreve:"\u016C",ubreve:"\u016D",Ucirc:"\xDB",ucirc:"\xFB",Ucy:"\u0423",ucy:"\u0443",udarr:"\u21C5",Udblac:"\u0170",udblac:"\u0171",udhar:"\u296E",ufisht:"\u297E",Ufr:"\u{1D518}",ufr:"\u{1D532}",Ugrave:"\xD9",ugrave:"\xF9",uHar:"\u2963",uharl:"\u21BF",uharr:"\u21BE",uhblk:"\u2580",ulcorn:"\u231C",ulcorner:"\u231C",ulcrop:"\u230F",ultri:"\u25F8",Umacr:"\u016A",umacr:"\u016B",uml:"\xA8",UnderBar:"_",UnderBrace:"\u23DF",UnderBracket:"\u23B5",UnderParenthesis:"\u23DD",Union:"\u22C3",UnionPlus:"\u228E",Uogon:"\u0172",uogon:"\u0173",Uopf:"\u{1D54C}",uopf:"\u{1D566}",UpArrow:"\u2191",Uparrow:"\u21D1",uparrow:"\u2191",UpArrowBar:"\u2912",UpArrowDownArrow:"\u21C5",UpDownArrow:"\u2195",Updownarrow:"\u21D5",updownarrow:"\u2195",UpEquilibrium:"\u296E",upharpoonleft:"\u21BF",upharpoonright:"\u21BE",uplus:"\u228E",UpperLeftArrow:"\u2196",UpperRightArrow:"\u2197",Upsi:"\u03D2",upsi:"\u03C5",upsih:"\u03D2",Upsilon:"\u03A5",upsilon:"\u03C5",UpTee:"\u22A5",UpTeeArrow:"\u21A5",upuparrows:"\u21C8",urcorn:"\u231D",urcorner:"\u231D",urcrop:"\u230E",Uring:"\u016E",uring:"\u016F",urtri:"\u25F9",Uscr:"\u{1D4B0}",uscr:"\u{1D4CA}",utdot:"\u22F0",Utilde:"\u0168",utilde:"\u0169",utri:"\u25B5",utrif:"\u25B4",uuarr:"\u21C8",Uuml:"\xDC",uuml:"\xFC",uwangle:"\u29A7",vangrt:"\u299C",varepsilon:"\u03F5",varkappa:"\u03F0",varnothing:"\u2205",varphi:"\u03D5",varpi:"\u03D6",varpropto:"\u221D",vArr:"\u21D5",varr:"\u2195",varrho:"\u03F1",varsigma:"\u03C2",varsubsetneq:"\u228A\uFE00",varsubsetneqq:"\u2ACB\uFE00",varsupsetneq:"\u228B\uFE00",varsupsetneqq:"\u2ACC\uFE00",vartheta:"\u03D1",vartriangleleft:"\u22B2",vartriangleright:"\u22B3",Vbar:"\u2AEB",vBar:"\u2AE8",vBarv:"\u2AE9",Vcy:"\u0412",vcy:"\u0432",VDash:"\u22AB",Vdash:"\u22A9",vDash:"\u22A8",vdash:"\u22A2",Vdashl:"\u2AE6",Vee:"\u22C1",vee:"\u2228",veebar:"\u22BB",veeeq:"\u225A",vellip:"\u22EE",Verbar:"\u2016",verbar:"|",Vert:"\u2016",vert:"|",VerticalBar:"\u2223",VerticalLine:"|",VerticalSeparator:"\u2758",VerticalTilde:"\u2240",VeryThinSpace:"\u200A",Vfr:"\u{1D519}",vfr:"\u{1D533}",vltri:"\u22B2",vnsub:"\u2282\u20D2",vnsup:"\u2283\u20D2",Vopf:"\u{1D54D}",vopf:"\u{1D567}",vprop:"\u221D",vrtri:"\u22B3",Vscr:"\u{1D4B1}",vscr:"\u{1D4CB}",vsubnE:"\u2ACB\uFE00",vsubne:"\u228A\uFE00",vsupnE:"\u2ACC\uFE00",vsupne:"\u228B\uFE00",Vvdash:"\u22AA",vzigzag:"\u299A",Wcirc:"\u0174",wcirc:"\u0175",wedbar:"\u2A5F",Wedge:"\u22C0",wedge:"\u2227",wedgeq:"\u2259",weierp:"\u2118",Wfr:"\u{1D51A}",wfr:"\u{1D534}",Wopf:"\u{1D54E}",wopf:"\u{1D568}",wp:"\u2118",wr:"\u2240",wreath:"\u2240",Wscr:"\u{1D4B2}",wscr:"\u{1D4CC}",xcap:"\u22C2",xcirc:"\u25EF",xcup:"\u22C3",xdtri:"\u25BD",Xfr:"\u{1D51B}",xfr:"\u{1D535}",xhArr:"\u27FA",xharr:"\u27F7",Xi:"\u039E",xi:"\u03BE",xlArr:"\u27F8",xlarr:"\u27F5",xmap:"\u27FC",xnis:"\u22FB",xodot:"\u2A00",Xopf:"\u{1D54F}",xopf:"\u{1D569}",xoplus:"\u2A01",xotime:"\u2A02",xrArr:"\u27F9",xrarr:"\u27F6",Xscr:"\u{1D4B3}",xscr:"\u{1D4CD}",xsqcup:"\u2A06",xuplus:"\u2A04",xutri:"\u25B3",xvee:"\u22C1",xwedge:"\u22C0",Yacute:"\xDD",yacute:"\xFD",YAcy:"\u042F",yacy:"\u044F",Ycirc:"\u0176",ycirc:"\u0177",Ycy:"\u042B",ycy:"\u044B",yen:"\xA5",Yfr:"\u{1D51C}",yfr:"\u{1D536}",YIcy:"\u0407",yicy:"\u0457",Yopf:"\u{1D550}",yopf:"\u{1D56A}",Yscr:"\u{1D4B4}",yscr:"\u{1D4CE}",YUcy:"\u042E",yucy:"\u044E",Yuml:"\u0178",yuml:"\xFF",Zacute:"\u0179",zacute:"\u017A",Zcaron:"\u017D",zcaron:"\u017E",Zcy:"\u0417",zcy:"\u0437",Zdot:"\u017B",zdot:"\u017C",zeetrf:"\u2128",ZeroWidthSpace:"\u200B",Zeta:"\u0396",zeta:"\u03B6",Zfr:"\u2128",zfr:"\u{1D537}",ZHcy:"\u0416",zhcy:"\u0436",zigrarr:"\u21DD",Zopf:"\u2124",zopf:"\u{1D56B}",Zscr:"\u{1D4B5}",zscr:"\u{1D4CF}",zwj:"\u200D",zwnj:"\u200C"});Zt.entityMap=Zt.HTML_ENTITIES});var Zo=K(In=>{"use strict";var xt=Qe(),P=mr(),Yo=Vt(),tc=xt.isHTMLEscapableRawTextElement,nc=xt.isHTMLMimeType,rc=xt.isHTMLRawTextElement,rn=xt.hasOwn,Ho=xt.NAMESPACE,Wo=Yo.ParseError,oc=Yo.DOMException,en=0,ze=1,vt=2,tn=3,wt=4,Et=5,nn=6,Tn=7;function Go(){}Go.prototype={parse:function(t,e,n){var r=this.domBuilder;r.startDocument(),Ko(e,e=Object.create(null)),ic(t,e,n,r,this.errorHandler),r.endDocument()}};var Dr=/&#?\w+;?/g;function ic(t,e,n,r,o){var i=nc(r.mimeType);t.indexOf(P.UNICODE_REPLACEMENT_CHARACTER)>=0&&o.warning("Unicode replacement character detected, source encoding issues?");function a($){if($>65535){$-=65536;var V=55296+($>>10),fe=56320+($&1023);return String.fromCharCode(V,fe)}else return String.fromCharCode($)}function s($){var V=$[$.length-1]===";"?$:$+";";if(!i&&V!==$)return o.error("EntityRef: expecting ;"),$;var fe=P.Reference.exec(V);if(!fe||fe[0].length!==V.length)return o.error("entity not matching Reference production: "+$),$;var me=V.slice(1,-1);return rn(n,me)?n[me]:me.charAt(0)==="#"?a(parseInt(me.substring(1).replace("x","0x"))):(o.error("entity not found:"+$),$)}function u($){if($>w){var V=t.substring(w,$).replace(Dr,s);b&&d(w),r.characters(V,0,$-w),w=$}}var c=0,m=0,y=/\r\n?|\n|$/g,b=r.locator;function d($,V){for(;$>=m&&(V=y.exec(t));)c=m,m=V.index+V[0].length,b.lineNumber++;b.columnNumber=$-c+1}for(var l=[{currentNSMap:e}],p=[],w=0;;){try{var v=t.indexOf("<",w);if(v<0){if(!i&&p.length>0)return o.fatalError("unclosed xml tag(s): "+p.join(", "));if(!t.substring(w).match(/^\s*$/)){var h=r.doc,g=h.createTextNode(t.substring(w));if(h.documentElement)return o.error("Extra content at the end of the document");h.appendChild(g),r.currentElement=g}return}if(v>w){var E=t.substring(w,v);!i&&p.length===0&&(E=E.replace(new RegExp(P.S_OPT.source,"g"),""),E&&o.error("Unexpected content outside root element: '"+E+"'")),u(v)}switch(t.charAt(v+1)){case"/":var N=t.indexOf(">",v+2),x=t.substring(v+2,N>0?N:void 0);if(!x)return o.fatalError("end tag name missing");var C=N>0&&P.reg("^",P.QName_group,P.S_OPT,"$").exec(x);if(!C)return o.fatalError('end tag name contains invalid characters: "'+x+'"');if(!r.currentElement&&!r.doc.documentElement)return;var D=p[p.length-1]||r.currentElement.tagName||r.doc.documentElement.tagName||"";if(D!==C[1]){var A=C[1].toLowerCase();if(!i||D.toLowerCase()!==A)return o.fatalError('Opening and ending tag mismatch: "'+D+'" != "'+x+'"')}var I=l.pop();p.pop();var S=I.localNSMap;if(r.endElement(I.uri,I.localName,D),S)for(var L in S)rn(S,L)&&r.endPrefixMapping(L);N++;break;case"?":b&&d(v),N=lc(t,v,r,o);break;case"!":b&&d(v),N=Xo(t,v,r,o,i);break;default:b&&d(v);var k=new Qo,T=l[l.length-1].currentNSMap,N=ac(t,v,k,T,s,o,i),_=k.length;if(k.closed||(i&&xt.isHTMLVoidElement(k.tagName)?k.closed=!0:p.push(k.tagName)),b&&_){for(var W=Vo(b,{}),ne=0;ne<_;ne++){var se=k[ne];d(se.offset),se.locator=Vo(b,{})}r.locator=W,zo(k,r,T)&&l.push(k),r.locator=b}else zo(k,r,T)&&l.push(k);i&&!k.closed?N=sc(t,N,k.tagName,s,r):N++}}catch($){if($ instanceof Wo)throw $;if($ instanceof oc)throw new Wo($.name+": "+$.message,r.locator,$);o.error("element parse error: "+$),N=-1}N>w?w=N:u(Math.max(v,w)+1)}}function Vo(t,e){return e.lineNumber=t.lineNumber,e.columnNumber=t.columnNumber,e}function ac(t,e,n,r,o,i,a){function s(d,l,p){if(rn(n.attributeNames,d))return i.fatalError("Attribute "+d+" redefined");if(!a&&l.indexOf("<")>=0)return i.fatalError("Unescaped '<' not allowed in attributes values");n.addValue(d,l.replace(/[\t\n\r]/g," ").replace(Dr,o),p)}for(var u,c,m=++e,y=en;;){var b=t.charAt(m);switch(b){case"=":if(y===ze)u=t.slice(e,m),y=tn;else if(y===vt)y=tn;else throw new Error("attribute equal must after attrName");break;case"'":case'"':if(y===tn||y===ze)if(y===ze&&(i.warning('attribute value must after "="'),u=t.slice(e,m)),e=m+1,m=t.indexOf(b,e),m>0)c=t.slice(e,m),s(u,c,e-1),y=Et;else throw new Error("attribute value no end '"+b+"' match");else if(y==wt)c=t.slice(e,m),s(u,c,e),i.warning('attribute "'+u+'" missed start quot('+b+")!!"),e=m+1,y=Et;else throw new Error('attribute value must after "="');break;case"/":switch(y){case en:n.setTagName(t.slice(e,m));case Et:case nn:case Tn:y=Tn,n.closed=!0;case wt:case ze:break;case vt:n.closed=!0;break;default:throw new Error("attribute invalid close char('/')")}break;case"":return i.error("unexpected end of input"),y==en&&n.setTagName(t.slice(e,m)),m;case">":switch(y){case en:n.setTagName(t.slice(e,m));case Et:case nn:case Tn:break;case wt:case ze:c=t.slice(e,m),c.slice(-1)==="/"&&(n.closed=!0,c=c.slice(0,-1));case vt:y===vt&&(c=u),y==wt?(i.warning('attribute "'+c+'" missed quot(")!'),s(u,c,e)):(a||i.warning('attribute "'+c+'" missed value!! "'+c+'" instead!!'),s(c,c,e));break;case tn:if(!a)return i.fatalError(`AttValue: ' or " expected`)}return m;case"\x80":b=" ";default:if(b<=" ")switch(y){case en:n.setTagName(t.slice(e,m)),y=nn;break;case ze:u=t.slice(e,m),y=vt;break;case wt:var c=t.slice(e,m);i.warning('attribute "'+c+'" missed quot(")!!'),s(u,c,e);case Et:y=nn;break}else switch(y){case vt:a||i.warning('attribute "'+u+'" missed value!! "'+u+'" instead2!!'),s(u,u,e),e=m,y=ze;break;case Et:i.warning('attribute space is required"'+u+'"!!');case nn:y=ze,e=m;break;case tn:y=wt,e=m;break;case Tn:throw new Error("elements closed character '/' and '>' must be connected to")}}m++}}function zo(t,e,n){for(var r=t.tagName,o=null,y=t.length;y--;){var i=t[y],a=i.qName,s=i.value,b=a.indexOf(":");if(b>0)var u=i.prefix=a.slice(0,b),c=a.slice(b+1),m=u==="xmlns"&&c;else c=a,u=null,m=a==="xmlns"&&"";i.localName=c,m!==!1&&(o==null&&(o=Object.create(null),Ko(n,n=Object.create(null))),n[m]=o[m]=s,i.uri=Ho.XMLNS,e.startPrefixMapping(m,s))}for(var y=t.length;y--;)i=t[y],i.prefix&&(i.prefix==="xml"&&(i.uri=Ho.XML),i.prefix!=="xmlns"&&(i.uri=n[i.prefix]));var b=r.indexOf(":");b>0?(u=t.prefix=r.slice(0,b),c=t.localName=r.slice(b+1)):(u=null,c=t.localName=r);var d=t.uri=n[u||""];if(e.startElement(d,c,r,t),t.closed){if(e.endElement(d,c,r),o)for(u in o)rn(o,u)&&e.endPrefixMapping(u)}else return t.currentNSMap=n,t.localNSMap=o,!0}function sc(t,e,n,r,o){var i=tc(n);if(i||rc(n)){var a=t.indexOf("</"+n+">",e),s=t.substring(e+1,a);return i&&(s=s.replace(Dr,r)),o.characters(s,0,s.length),a}return e+1}function Ko(t,e){for(var n in t)rn(t,n)&&(e[n]=t[n])}function Jo(t,e){var n=e;function r(m){return m=m||0,t.charAt(n+m)}function o(m){m=m||1,n+=m}function i(){for(var m=0;n<t.length;){var y=r();if(y!==" "&&y!==`
`&&y!=="	"&&y!=="\r")return m;m++,o()}return-1}function a(){return t.substring(n)}function s(m){return t.substring(n,n+m.length)===m}function u(m){return t.substring(n,n+m.length).toUpperCase()===m.toUpperCase()}function c(m){var y=P.reg("^",m),b=y.exec(a());return b?(o(b[0].length),b[0]):null}return{char:r,getIndex:function(){return n},getMatch:c,getSource:function(){return t},skip:o,skipBlanks:i,substringFromIndex:a,substringStartsWith:s,substringStartsWithCaseInsensitive:u}}function cc(t,e){function n(s,u){var c=P.PI.exec(s.substringFromIndex());return c?c[1].toLowerCase()==="xml"?u.fatalError("xml declaration is only allowed at the start of the document, but found at position "+s.getIndex()):(s.skip(c[0].length),c[0]):u.fatalError("processing instruction is not well-formed at position "+s.getIndex())}var r=t.getSource();if(t.char()==="["){t.skip(1);for(var o=t.getIndex();t.getIndex()<r.length;){if(t.skipBlanks(),t.char()==="]"){var i=r.substring(o,t.getIndex());return t.skip(1),i}var a=null;if(t.char()==="<"&&t.char(1)==="!")switch(t.char(2)){case"E":t.char(3)==="L"?a=t.getMatch(P.elementdecl):t.char(3)==="N"&&(a=t.getMatch(P.EntityDecl));break;case"A":a=t.getMatch(P.AttlistDecl);break;case"N":a=t.getMatch(P.NotationDecl);break;case"-":a=t.getMatch(P.Comment);break}else if(t.char()==="<"&&t.char(1)==="?")a=n(t,e);else if(t.char()==="%")a=t.getMatch(P.PEReference);else return e.fatalError("Error detected in Markup declaration");if(!a)return e.fatalError("Error in internal subset at position "+t.getIndex())}return e.fatalError("doctype internal subset is not well-formed, missing ]")}}function Xo(t,e,n,r,o){var i=Jo(t,e);switch(o?i.char(2).toUpperCase():i.char(2)){case"-":var a=i.getMatch(P.Comment);return a?(n.comment(a,P.COMMENT_START.length,a.length-P.COMMENT_START.length-P.COMMENT_END.length),i.getIndex()):r.fatalError("comment is not well-formed at position "+i.getIndex());case"[":var s=i.getMatch(P.CDSect);return s?!o&&!n.currentElement?r.fatalError("CDATA outside of element"):(n.startCDATA(),n.characters(s,P.CDATA_START.length,s.length-P.CDATA_START.length-P.CDATA_END.length),n.endCDATA(),i.getIndex()):r.fatalError("Invalid CDATA starting at position "+e);case"D":{if(n.doc&&n.doc.documentElement)return r.fatalError("Doctype not allowed inside or after documentElement at position "+i.getIndex());if(o?!i.substringStartsWithCaseInsensitive(P.DOCTYPE_DECL_START):!i.substringStartsWith(P.DOCTYPE_DECL_START))return r.fatalError("Expected "+P.DOCTYPE_DECL_START+" at position "+i.getIndex());if(i.skip(P.DOCTYPE_DECL_START.length),i.skipBlanks()<1)return r.fatalError("Expected whitespace after "+P.DOCTYPE_DECL_START+" at position "+i.getIndex());var u={name:void 0,publicId:void 0,systemId:void 0,internalSubset:void 0};if(u.name=i.getMatch(P.Name),!u.name)return r.fatalError("doctype name missing or contains unexpected characters at position "+i.getIndex());if(o&&u.name.toLowerCase()!=="html"&&r.warning("Unexpected DOCTYPE in HTML document at position "+i.getIndex()),i.skipBlanks(),i.substringStartsWith(P.PUBLIC)||i.substringStartsWith(P.SYSTEM)){var c=P.ExternalID_match.exec(i.substringFromIndex());if(!c)return r.fatalError("doctype external id is not well-formed at position "+i.getIndex());c.groups.SystemLiteralOnly!==void 0?u.systemId=c.groups.SystemLiteralOnly:(u.systemId=c.groups.SystemLiteral,u.publicId=c.groups.PubidLiteral),i.skip(c[0].length)}else if(o&&i.substringStartsWithCaseInsensitive(P.SYSTEM)){if(i.skip(P.SYSTEM.length),i.skipBlanks()<1)return r.fatalError("Expected whitespace after "+P.SYSTEM+" at position "+i.getIndex());if(u.systemId=i.getMatch(P.ABOUT_LEGACY_COMPAT_SystemLiteral),!u.systemId)return r.fatalError("Expected "+P.ABOUT_LEGACY_COMPAT+" in single or double quotes after "+P.SYSTEM+" at position "+i.getIndex())}return o&&u.systemId&&!P.ABOUT_LEGACY_COMPAT_SystemLiteral.test(u.systemId)&&r.warning("Unexpected doctype.systemId in HTML document at position "+i.getIndex()),o||(i.skipBlanks(),u.internalSubset=cc(i,r)),i.skipBlanks(),i.char()!==">"?r.fatalError("doctype not terminated with > at position "+i.getIndex()):(i.skip(1),n.startDTD(u.name,u.publicId,u.systemId,u.internalSubset),n.endDTD(),i.getIndex())}default:return r.fatalError('Not well-formed XML starting with "<!" at position '+e)}}function lc(t,e,n,r){var o=t.substring(e).match(P.PI);if(!o)return r.fatalError("Invalid processing instruction starting at position "+e);if(o[1].toLowerCase()==="xml"){if(e>0)return r.fatalError("processing instruction at position "+e+" is an xml declaration which is only at the start of the document");if(!P.XMLDecl.test(t.substring(e)))return r.fatalError("xml declaration is not well-formed")}return n.processingInstruction(o[1],o[2]),e+o[0].length}function Qo(){this.attributeNames=Object.create(null)}Qo.prototype={setTagName:function(t){if(!P.QName_exact.test(t))throw new Error("invalid tagName:"+t);this.tagName=t},addValue:function(t,e,n){if(!P.QName_exact.test(t))throw new Error("invalid attribute:"+t);this.attributeNames[t]=this.length,this[this.length++]={qName:t,value:e,offset:n}},length:0,getLocalName:function(t){return this[t].localName},getLocator:function(t){return this[t].locator},getQName:function(t){return this[t].qName},getURI:function(t){return this[t].uri},getValue:function(t){return this[t].value}};In.XMLReader=Go;In.parseUtils=Jo;In.parseDoctypeCommentOrCData=Xo});var ai=K(Ct=>{"use strict";var et=Qe(),uc=xr(),dc=Vt(),ei=jo(),pc=Zo(),fc=uc.DOMImplementation,mc=et.hasDefaultHTMLNamespace,gc=et.isHTMLMimeType,hc=et.isValidMimeType,ri=et.MIME_TYPE,Cr=et.NAMESPACE,ti=dc.ParseError,bc=pc.XMLReader;function oi(t){return t.replace(/\r[\n\u0085]/g,`
`).replace(/[\r\u0085\u2028\u2029]/g,`
`)}function ii(t){if(t=t||{},t.locator===void 0&&(t.locator=!0),this.assign=t.assign||et.assign,this.domHandler=t.domHandler||Bn,this.onError=t.onError||t.errorHandler,t.errorHandler&&typeof t.errorHandler!="function")throw new TypeError("errorHandler object is no longer supported, switch to onError!");t.errorHandler&&t.errorHandler("warning","The `errorHandler` option has been deprecated, use `onError` instead!",this),this.normalizeLineEndings=t.normalizeLineEndings||oi,this.locator=!!t.locator,this.xmlns=this.assign(Object.create(null),t.xmlns)}ii.prototype.parseFromString=function(t,e){if(!hc(e))throw new TypeError('DOMParser.parseFromString: the provided mimeType "'+e+'" is not valid.');var n=this.assign(Object.create(null),this.xmlns),r=ei.XML_ENTITIES,o=n[""]||null;mc(e)?(r=ei.HTML_ENTITIES,o=Cr.HTML):e===ri.XML_SVG_IMAGE&&(o=Cr.SVG),n[""]=o,n.xml=n.xml||Cr.XML;var i=new this.domHandler({mimeType:e,defaultNamespace:o,onError:this.onError}),a=this.locator?{}:void 0;this.locator&&i.setDocumentLocator(a);var s=new bc;s.errorHandler=i,s.domBuilder=i;var u=!et.isHTMLMimeType(e);return u&&typeof t!="string"&&s.errorHandler.fatalError("source is not a string"),s.parse(this.normalizeLineEndings(String(t)),n,r),i.doc.documentElement||s.errorHandler.fatalError("missing root element"),i.doc};function Bn(t){var e=t||{};this.mimeType=e.mimeType||ri.XML_APPLICATION,this.defaultNamespace=e.defaultNamespace||null,this.cdata=!1,this.currentElement=void 0,this.doc=void 0,this.locator=void 0,this.onError=e.onError}function Dt(t,e){e.lineNumber=t.lineNumber,e.columnNumber=t.columnNumber}Bn.prototype={startDocument:function(){var t=new fc;this.doc=gc(this.mimeType)?t.createHTMLDocument(!1):t.createDocument(this.defaultNamespace,"")},startElement:function(t,e,n,r){var o=this.doc,i=o.createElementNS(t,n||e),a=r.length;Nn(this,i),this.currentElement=i,this.locator&&Dt(this.locator,i);for(var s=0;s<a;s++){var t=r.getURI(s),u=r.getValue(s),n=r.getQName(s),c=o.createAttributeNS(t,n);this.locator&&Dt(r.getLocator(s),c),c.value=c.nodeValue=u,i.setAttributeNode(c)}},endElement:function(t,e,n){this.currentElement=this.currentElement.parentNode},startPrefixMapping:function(t,e){},endPrefixMapping:function(t){},processingInstruction:function(t,e){var n=this.doc.createProcessingInstruction(t,e);this.locator&&Dt(this.locator,n),Nn(this,n)},ignorableWhitespace:function(t,e,n){},characters:function(t,e,n){if(t=ni.apply(this,arguments),t){if(this.cdata)var r=this.doc.createCDATASection(t);else var r=this.doc.createTextNode(t);this.currentElement?this.currentElement.appendChild(r):/^\s*$/.test(t)&&this.doc.appendChild(r),this.locator&&Dt(this.locator,r)}},skippedEntity:function(t){},endDocument:function(){this.doc.normalize()},setDocumentLocator:function(t){t&&(t.lineNumber=0),this.locator=t},comment:function(t,e,n){t=ni.apply(this,arguments);var r=this.doc.createComment(t);this.locator&&Dt(this.locator,r),Nn(this,r)},startCDATA:function(){this.cdata=!0},endCDATA:function(){this.cdata=!1},startDTD:function(t,e,n,r){var o=this.doc.implementation;if(o&&o.createDocumentType){var i=o.createDocumentType(t,e,n,r);this.locator&&Dt(this.locator,i),Nn(this,i),this.doc.doctype=i}},reportError:function(t,e){if(typeof this.onError=="function")try{this.onError(t,e,this)}catch(n){throw new ti("Reporting "+t+' "'+e+'" caused '+n,this.locator)}else console.error("[xmldom "+t+"]	"+e,yc(this.locator))},warning:function(t){this.reportError("warning",t)},error:function(t){this.reportError("error",t)},fatalError:function(t){throw this.reportError("fatalError",t),new ti(t,this.locator)}};function yc(t){if(t)return`
@#[line:`+t.lineNumber+",col:"+t.columnNumber+"]"}function ni(t,e,n){return typeof t=="string"?t.substr(e,n):t.length>=e+n||e?new java.lang.String(t,e,n)+"":t}"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g,function(t){Bn.prototype[t]=function(){return null}});function Nn(t,e){t.currentElement?t.currentElement.appendChild(e):t.doc.appendChild(e)}function vc(t){if(t==="error")throw"onErrorStopParsing"}function wc(){throw"onWarningStopParsing"}Ct.__DOMHandler=Bn;Ct.DOMParser=ii;Ct.normalizeLineEndings=oi;Ct.onErrorStopParsing=vc;Ct.onWarningStopParsing=wc});var si=K(H=>{"use strict";var At=Qe();H.assign=At.assign;H.hasDefaultHTMLNamespace=At.hasDefaultHTMLNamespace;H.isHTMLMimeType=At.isHTMLMimeType;H.isValidMimeType=At.isValidMimeType;H.MIME_TYPE=At.MIME_TYPE;H.NAMESPACE=At.NAMESPACE;var Ln=Vt();H.DOMException=Ln.DOMException;H.DOMExceptionName=Ln.DOMExceptionName;H.ExceptionCode=Ln.ExceptionCode;H.ParseError=Ln.ParseError;var ae=xr();H.Attr=ae.Attr;H.CDATASection=ae.CDATASection;H.CharacterData=ae.CharacterData;H.Comment=ae.Comment;H.Document=ae.Document;H.DocumentFragment=ae.DocumentFragment;H.DocumentType=ae.DocumentType;H.DOMImplementation=ae.DOMImplementation;H.Element=ae.Element;H.Entity=ae.Entity;H.EntityReference=ae.EntityReference;H.LiveNodeList=ae.LiveNodeList;H.NamedNodeMap=ae.NamedNodeMap;H.Node=ae.Node;H.NodeList=ae.NodeList;H.Notation=ae.Notation;H.ProcessingInstruction=ae.ProcessingInstruction;H.Text=ae.Text;H.XMLSerializer=ae.XMLSerializer;var On=ai();H.DOMParser=On.DOMParser;H.normalizeLineEndings=On.normalizeLineEndings;H.onErrorStopParsing=On.onErrorStopParsing;H.onWarningStopParsing=On.onWarningStopParsing});var St=K((gd,pi)=>{"use strict";var{DOMParser:Ec,XMLSerializer:kt}=si(),li="http://schemas.microsoft.com/winfx/2006/xaml";function q(t,e){for(let n=0;n<t.childNodes.length;n++){let r=t.childNodes[n];if(r.nodeType===1&&r.localName===e)return r}return null}function Oe(t){if(!t)return null;for(let e=0;e<t.childNodes.length;e++)if(t.childNodes[e].nodeType===1)return t.childNodes[e];return null}function xc(t){return t.getAttributeNS(li,"Name")||t.getAttribute("x:Name")||null}function Dc(t){return t.getAttributeNS(li,"Key")||t.getAttribute("x:Key")||null}function Cc(t){let e=q(t,"VisualPropertiesStorage");if(e)return e;for(let n=0;n<t.childNodes.length;n++){let r=t.childNodes[n];if(!(r.nodeType!==1||!r.localName.includes("."))&&(e=q(r,"VisualPropertiesStorage"),e))return e}return null}function Ac(t){let e=Cc(t);if(!e)return{x:0,y:0};let n=0,r=0;for(let o=0;o<e.childNodes.length;o++){let i=e.childNodes[o];if(i.nodeType!==1)continue;let a=Dc(i);a==="ElementX"&&(n=parseFloat(i.textContent)||0),a==="ElementY"&&(r=parseFloat(i.textContent)||0)}return{x:n,y:r}}function tt(t){let e=q(t,"DirectiveStep.Action");if(e)return Oe(e);for(let n=0;n<t.childNodes.length;n++){let r=t.childNodes[n];if(r.nodeType===1&&!(r.localName.includes(".")||r.localName==="VisualPropertiesStorage"))return r}return null}function $n(t){let e=q(t,"DirectiveCondition.Condition");if(e)return Oe(e);for(let n=0;n<t.childNodes.length;n++){let r=t.childNodes[n];if(r.nodeType===1&&!(r.localName.includes(".")||r.localName==="VisualPropertiesStorage"))return r}return null}var kc={CustomCodeAction:"Execute Custom Code",EnableDirectivesAction:"Enable Post Directive",RaiseExceptionAction:"Raise Exception",SetDataFieldAction:"Set Data Field",CallMethodAction:"Invoke BO Method",CompleteMethodCallAction:"Complete Method Call",SendEmailAction:"Send E-mail",ActivityTrackingAction:"Activity Tracking",LogMessageAction:"Log Message",ShowMessageAction:"Show Message",AttachDataTagAction:"Attach Data Tag",RemoveDataTagAction:"Remove Data Tag",AttachHoldAction:"Attach Hold",RemoveHoldsAction:"Remove Holds",EnablePostDirectiveAction:"Enable Post Directive",InvokeFunctionAction:"Invoke Function",InvokeExternalMethodAction:"Invoke External Method"},Sc={CustomCodeCondition:"C# Condition",FieldCondition:"Field Condition"};function ci(t){if(!t)return null;let e=t.localName,n={};for(let m=0;m<t.attributes.length;m++){let y=t.attributes[m];y.name.startsWith("xmlns")||(n[y.name]=y.value)}let r=t.hasAttribute("Code")?t.getAttribute("Code"):null,o=null,i=Oe(t);i&&i.localName==="String"&&(o=i.textContent);let a=null,s=null;if(e==="SetBpmDataFieldAction"){let m=q(t,e+".Expression");if(m){let b=q(m,"ExpressionDefinition");b&&(a=b.getAttribute("Text"))}let y=q(t,e+".Field");if(y){let b=q(y,"ColumnInfo");b&&(s={tableName:b.getAttribute("TableName"),columnName:b.getAttribute("ColumnName")})}}let u=null;if(e==="InvokeEpicorFunctionAction2"||e==="InvokeEpicorFunctionAction"){u=[];for(let m of["InputParameters","OutputParameters"]){let y=q(t,e+"."+m);if(!y)continue;let b=q(y,"Array")||y;for(let d=0;d<b.childNodes.length;d++){let l=b.childNodes[d];if(l.nodeType!==1||l.localName!=="ParameterBinding2")continue;let p=q(l,"ParameterBinding2.BindingTarget"),w=p?q(p,"VariableBindingTarget"):null;u.push({paramName:l.getAttribute("ParameterName")||"",paramDirection:l.getAttribute("ParameterDirection")||"Input",variableName:w&&w.getAttribute("VariableName")||""})}}}let c=null;if(e==="ConditionBlock"){c=[];let y=q(t,"ConditionBlock.Items")||t;for(let b=0;b<y.childNodes.length;b++){let d=y.childNodes[b];if(d.nodeType!==1||d.localName!=="ConditionBlockItem")continue;let l=d.getAttribute("Operator")||"None",p=q(d,"ConditionBlockItem.Condition"),w=p?Oe(p):null;if(!w)continue;let v=w.localName,h={};for(let D=0;D<w.attributes.length;D++){let A=w.attributes[D];A.name.startsWith("xmlns")||(h[A.name]=A.value)}let g=null,E=q(w,v+".Expression");if(E){let D=q(E,"ExpressionDefinition");D&&(g=D.getAttribute("Text"))}let x=null,C=q(w,v+".Field");if(C){let D=q(C,"ColumnInfo");D&&(x={tableName:D.getAttribute("TableName"),columnName:D.getAttribute("ColumnName")})}c.push({localName:v,attrs:h,itemOperator:l,expressionText:g,fieldInfo:x})}}return{localName:e,attrs:n,code:r,message:o,conditions:c,actionExpressionText:a,actionFieldInfo:s,paramBindings:u,label:kc[e]||Sc[e]||e}}function Tc(t){for(let e=0;e<t.childNodes.length;e++){let n=t.childNodes[e];if(n.nodeType===1&&n.localName.endsWith(".StartNode"))return Oe(n)}for(let e=0;e<t.childNodes.length;e++){let n=t.childNodes[e];if(n.nodeType===1&&(n.localName==="DirectiveStep"||n.localName==="DirectiveCondition"))return n}return null}function Ue(t){if(!t)return null;let e=new Ec({onError:(u,c)=>{if(u==="fatalError")throw new Error(c)}}).parseFromString(t,"text/xml"),n=e.documentElement;if(!n)return null;let r=[],o=[],i=new Set;function a(u,c,m){if(!u||u.localName==="Null"||u.getAttribute("x:Null")!==null)return;let y=xc(u)||`_node${r.length}`;if(i.has(y)){c!==null&&o.push({from:c,to:y,label:m});return}i.add(y),c!==null&&o.push({from:c,to:y,label:m});let{x:b,y:d}=Ac(u);if(u.localName==="DirectiveCondition"){r.push({id:y,type:"condition",widget:ci($n(u)),x:b,y:d,_el:u});let l=q(u,"DirectiveCondition.True"),p=q(u,"DirectiveCondition.False"),w=l?Oe(l):null;w?a(w,y,"True"):o.push({from:y,to:null,label:"True"});let v=u.getAttribute("False"),h=p?Oe(p):null;h?a(h,y,"False"):(!v||v==="{x:Null}")&&o.push({from:y,to:null,label:"False"})}else if(u.localName==="DirectiveStep"){r.push({id:y,type:"step",widget:ci(tt(u)),x:b,y:d,_el:u});let l=q(u,"DirectiveStep.Next");l&&a(Oe(l),y,null)}}let s=Tc(n);return s&&a(s,null,null),{nodes:r,edges:o,startNodeId:r[0]?.id??null,doc:e,root:n}}var Ic=new Set(["CustomCodeAction","CustomCodeCondition"]);function ui(t){return!!t&&Ic.has(t.localName)}function di(t){if(!t)return!1;let e=String(t).trimStart().slice(0,400);return e.startsWith("<")&&/Directive(Step|Condition|Definition)/.test(e)}function Nc(t){if(!di(t))return null;let e;try{e=Ue(t)}catch{return null}if(!e||e.nodes.length===0)return null;let n=e.nodes.filter(r=>ui(r.widget)).map(r=>({id:r.id,type:r.type,label:r.widget.label,localName:r.widget.localName,code:r.widget.code||""}));return{nodeCount:e.nodes.length,codeNodes:n,onlyCustomCode:e.nodes.length===1&&n.length===1}}function Bc(t,e,n){let r=Ue(t);if(!r)throw new Error("Failed to parse directive XAML");let o=r.nodes.find(a=>a.id===e);if(!o)throw new Error(`Node "${e}" not found`);let i=o.type==="condition"?$n(o._el):tt(o._el);if(!i)throw new Error(`No widget element found in node "${e}"`);if(!i.hasAttribute("Code"))throw new Error(`Widget ${i.localName} has no Code attribute`);return i.setAttribute("Code",n),new kt().serializeToString(r.doc)}function Lc(t,e,n){let r=Ue(t);if(!r)throw new Error("Failed to parse directive XAML");let o=r.nodes.find(s=>s.id===e);if(!o||o.type!=="step")throw new Error(`Step node "${e}" not found`);let i=tt(o._el);if(!i||i.localName!=="RaiseExceptionAction")throw new Error(`Node "${e}" is not a RaiseExceptionAction`);let a=Oe(i);return a&&a.localName==="String"&&(a.textContent=n),new kt().serializeToString(r.doc)}function Oc(t,e,n){let r=Ue(t);if(!r)throw new Error("Failed to parse directive XAML");let o=r.nodes.find(c=>c.id===e);if(!o)throw new Error(`Node "${e}" not found`);let i=o.type==="condition"?$n(o._el):tt(o._el);if(!i||i.localName!=="ConditionBlock")throw new Error("Not a ConditionBlock node");let s=q(i,"ConditionBlock.Items")||i,u=[];for(let c=0;c<s.childNodes.length;c++){let m=s.childNodes[c];m.nodeType===1&&m.localName==="ConditionBlockItem"&&u.push(m)}for(let{index:c,conditionAttrs:m,expressionText:y,itemOperator:b,fieldInfo:d}of n){let l=u[c];if(!l)continue;b!==void 0&&l.setAttribute("Operator",b);let p=q(l,"ConditionBlockItem.Condition"),w=p?Oe(p):null;if(w){if(m)for(let[v,h]of Object.entries(m))w.setAttribute(v,h);if(y!==void 0){let v=q(w,w.localName+".Expression");if(v){let h=q(v,"ExpressionDefinition");h&&h.setAttribute("Text",y)}}if(d){let v=q(w,w.localName+".Field");if(v){let h=q(v,"ColumnInfo");h&&(d.tableName!==void 0&&h.setAttribute("TableName",d.tableName),d.columnName!==void 0&&h.setAttribute("ColumnName",d.columnName))}}}}return new kt().serializeToString(r.doc)}function $c(t,e,n){let r=Ue(t);if(!r)throw new Error("Failed to parse directive XAML");let o=r.nodes.find(a=>a.id===e);if(!o)throw new Error(`Node "${e}" not found`);let i=o.type==="condition"?$n(o._el):tt(o._el);if(!i)throw new Error(`No widget element found in node "${e}"`);for(let[a,s]of Object.entries(n))i.setAttribute(a,s);return new kt().serializeToString(r.doc)}function _c(t,e,n,r){let o=Ue(t);if(!o)throw new Error("Failed to parse directive XAML");let i=o.nodes.find(s=>s.id===e);if(!i)throw new Error(`Node "${e}" not found`);let a=tt(i._el);if(!a)throw new Error(`No action element found in node "${e}"`);for(let[s,u]of Object.entries(n))a.setAttribute(s,u);for(let{paramName:s,variableName:u}of r)for(let c of["InputParameters","OutputParameters"]){let m=q(a,a.localName+"."+c);if(!m)continue;let y=q(m,"Array")||m;for(let b=0;b<y.childNodes.length;b++){let d=y.childNodes[b];if(d.nodeType!==1||d.localName!=="ParameterBinding2"||d.getAttribute("ParameterName")!==s)continue;let l=q(d,"ParameterBinding2.BindingTarget"),p=l?q(l,"VariableBindingTarget"):null;p&&p.setAttribute("VariableName",u)}}return new kt().serializeToString(o.doc)}function Fc(t,e,n,r){let o=Ue(t);if(!o)throw new Error("Failed to parse directive XAML");let i=o.nodes.find(s=>s.id===e);if(!i)throw new Error(`Node "${e}" not found`);let a=tt(i._el);if(!a)throw new Error(`No action element found in node "${e}"`);if(n!==void 0){let s=q(a,a.localName+".Expression");if(s){let u=q(s,"ExpressionDefinition");u&&u.setAttribute("Text",n)}}if(r){let s=q(a,a.localName+".Field");if(s){let u=q(s,"ColumnInfo");u&&(r.tableName!==void 0&&u.setAttribute("TableName",r.tableName),r.columnName!==void 0&&u.setAttribute("ColumnName",r.columnName))}}return new kt().serializeToString(o.doc)}var Mc=new Set(["Id","ValidationState","IsNewRow","RowMod","BitFlag","SysRevID","SysRowID","Code"]);function Pc(t,e){let n=[];if(!t)return n.push(e+"(no widget)"),n;let r=Object.entries(t.attrs||{}).filter(([o])=>!o.startsWith("xmlns")&&!o.startsWith("x:")&&!Mc.has(o)).sort(([o],[i])=>o.localeCompare(i));for(let[o,i]of r)n.push(e+o+" = "+i);t.message!=null&&n.push(e+"Message = "+t.message),t.actionFieldInfo&&n.push(e+"Field = "+(t.actionFieldInfo.tableName||"")+"."+(t.actionFieldInfo.columnName||"")),t.actionExpressionText!=null&&n.push(e+"Expression = "+t.actionExpressionText);for(let o of t.paramBindings||[])n.push(e+"Param "+o.paramDirection+" "+o.paramName+" <-> "+o.variableName);if((t.conditions||[]).forEach((o,i)=>{let a=[];if(i>0&&a.push(o.itemOperator),a.push(o.localName),o.fieldInfo&&a.push((o.fieldInfo.tableName||"")+"."+(o.fieldInfo.columnName||"")),o.attrs&&o.attrs.Operator&&a.push(o.attrs.Operator),o.expressionText!=null&&a.push(o.expressionText),o.attrs&&o.attrs.Filter!==void 0&&a.push("["+o.attrs.Filter+"]"),n.push(e+"Condition "+(i+1)+": "+a.join(" ")),o.attrs&&o.attrs.Code)for(let s of String(o.attrs.Code).split(`
`))n.push(e+"  | "+s)}),t.code!=null){n.push(e+"Code:");for(let o of String(t.code).split(`
`))n.push(e+"  | "+o)}return n}function Rc(t){let e;try{e=Ue(t)}catch{return null}if(!e||e.nodes.length===0)return null;let n=new Map(e.nodes.map((i,a)=>[i.id,a+1])),r=i=>i==null?"(end)":"["+(n.get(i)??"?")+"]",o=[];return e.nodes.forEach((i,a)=>{o.push("["+(a+1)+"] "+(i.type==="condition"?"Condition":"Step")+": "+(i.widget?.label||i.widget?.localName||"(unknown)")),o.push(...Pc(i.widget,"    "));for(let s of e.edges.filter(u=>u.from===i.id))o.push("    "+(s.label?s.label+" -> ":"-> ")+r(s.to));o.push("")}),o.join(`
`)}pi.exports={parseDirective:Ue,summarizeFlow:Nc,looksLikeFlowXaml:di,isCustomCodeWidget:ui,setNodeCode:Bc,setRaiseExceptionMessage:Lc,setNodeAttrs:$c,setConditionChildren:Oc,setInvokeFunctionAction:_c,setActionField:Fc,directiveToCanonicalText:Rc}});var Tt=K((hd,hi)=>{"use strict";var{looksLikeFlowXaml:fi,summarizeFlow:mi,setNodeCode:Uc}=St();function Ar(t){let e=t==null?"":String(t);if(!e.trim())return{kind:"code",code:"",usings:"",flow:null};if(fi(e)){let r=mi(e);return r?{kind:"flow",xaml:e,xamlProp:null,envelope:null,code:"",usings:"",flow:r}:{kind:"code",code:e,usings:"",flow:null,unparsedFlow:!0}}let n=null;try{n=JSON.parse(e)}catch{}if(n&&typeof n=="object"){for(let[r,o]of Object.entries(n)){if(typeof o!="string"||!fi(o))continue;let i=mi(o);if(i)return{kind:"flow",xaml:o,xamlProp:r,envelope:n,code:typeof n.Code=="string"?n.Code:"",usings:typeof n.Usings=="string"?n.Usings:"",flow:i}}return{kind:"code",code:n.Code||"",usings:n.Usings||"",flow:null}}return{kind:"code",code:e,usings:"",flow:null}}function gi(t,e){if(t.kind!=="flow")throw new Error("Function body is not a widget flow");return t.xamlProp?JSON.stringify({...t.envelope,[t.xamlProp]:e}):e}function qc(t,e,n){let r=Ar(t);return gi(r,Uc(r.xaml,e,n))}function jc(t){let e=Ar(t);return e.unparsedFlow?"":e.kind!=="flow"?e.code||"":e.flow.codeNodes.map(n=>(e.flow.codeNodes.length>1?`// \u2500\u2500 ${n.label} (${n.id}) \u2500\u2500
`:"")+n.code).join(`

`)}function Hc(t){if(t.unparsedFlow)return"Unrecognised widget body";if(t.kind!=="flow")return"Code-based";if(t.flow.onlyCustomCode)return"Widget flow \u2014 custom code only";let e=t.flow.codeNodes.length;return`Widget flow \u2014 ${t.flow.nodeCount} widgets, ${e} with custom code`}hi.exports={describeBody:Ar,packFlowXaml:gi,setBodyNodeCode:qc,bodyCodeText:jc,bodyKindLabel:Hc}});var bi=K(we=>{"use strict";var Wc=we&&we.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),Vc=we&&we.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),zc=we&&we.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&Wc(n,e,r[o]);return Vc(n,e),n}})();Object.defineProperty(we,"__esModule",{value:!0});we.EfxTreeProvider=we.FunctionNode=we.LibraryNode=void 0;var G=zc(require("vscode")),{describeBody:Yc,bodyKindLabel:Gc}=Tt(),on=class extends G.TreeItem{constructor(e){super(e.LibraryID,G.TreeItemCollapsibleState.Collapsed),this.library=e;let n=[];e.Published?n.push("$(cloud) Promoted"):n.push("Unpromoted / Editable"),e.Disabled&&n.push("$(circle-slash) Disabled"),e.LockedBy&&n.push(`$(lock) ${e.LockedBy}`),e.OwnedByCompany&&n.push(e.OwnedByCompany),this.description=e.Description||"",this.tooltip=[e.LibraryID,e.Description||"",`Status: ${e.Published?"Promoted":"Unpromoted / Editable"}`,e.LockedBy?`Locked by: ${e.LockedBy}`:"Unlocked",e.Disabled?"DISABLED":"",`Company: ${e.OwnedByCompany||"System"}`].filter(Boolean).join(`
`),this.contextValue=e.Published?"library-promoted":"library-unpromoted",e.Published?this.iconPath=new G.ThemeIcon("cloud",new G.ThemeColor("charts.green")):e.Disabled?this.iconPath=new G.ThemeIcon("circle-slash",new G.ThemeColor("charts.red")):e.LockedBy?this.iconPath=new G.ThemeIcon("lock",new G.ThemeColor("charts.yellow")):this.iconPath=new G.ThemeIcon("package")}};we.LibraryNode=on;var _n=class extends G.TreeItem{constructor(e,n,r){super(n.FunctionID,G.TreeItemCollapsibleState.None),this.libraryId=e,this.func=n,this.signatures=r;let o=r.filter(u=>!u.Response).map(u=>u.ArgumentName),i=r.filter(u=>u.Response).map(u=>u.ArgumentName),a=Yc(n.Body),s=a.kind==="flow"&&!a.flow.onlyCustomCode;this.description=[n.Description||"",s?`${a.flow.nodeCount} widgets`:""].filter(Boolean).join(" \xB7 "),this.tooltip=[`${n.LibraryID}.${n.FunctionID}`,n.Description||"",Gc(a),o.length?`Request: ${o.join(", ")}`:"Request: (none)",`Response: ${i.join(", ")}`,n.Disabled?"DISABLED":"",n.Invalid?"INVALID":""].filter(Boolean).join(`
`),this.contextValue=s?"function-widgets":"function",this.iconPath=new G.ThemeIcon(n.Invalid?"warning":n.Disabled?"circle-slash":s?"type-hierarchy":"symbol-function"),this.command=s?{command:"efx.openFunctionWidgets",title:"Open Widget Graph",arguments:[{libraryId:this.libraryId,func:this.func}]}:{command:"efx.pullFunction",title:"Pull Function",arguments:[{libraryId:this.libraryId,func:this.func,signatures:this.signatures}]}}},Fn=class extends G.TreeItem{constructor(e,n){super(`Functions (${n})`,G.TreeItemCollapsibleState.Collapsed),this.libraryId=e,this.contextValue="function-group",this.iconPath=new G.ThemeIcon("symbol-function")}},nt=class extends G.TreeItem{constructor(e,n,r,o){super(`${r} (${o})`,G.TreeItemCollapsibleState.Collapsed),this.libraryId=e,this.kind=n,this.contextValue=`reference-group-${n}`;let i={tables:"database",services:"server",libraries:"library",assemblies:"package"};this.iconPath=new G.ThemeIcon(i[n]||"references")}},It=class extends G.TreeItem{constructor(e,n){let r="",o="",i="",a="references";e==="tables"?(r=n.TableID,o=n.Updatable?"Updatable":"Read-only",i=[n.TableID,`Updatable: ${n.Updatable?"Yes":"No"}`,`SysRowID: ${n.SysRowID||""}`].join(`
`),a=n.Updatable?"edit":"lock"):e==="services"?(r=n.ServiceID,o="Service",i=[n.ServiceID,`SysRowID: ${n.SysRowID||""}`].join(`
`),a="server"):e==="libraries"?(r=n.LibraryRef,o=n.Mode===1?"Read-only":n.Mode===2?"Hidden":"Normal",i=[n.LibraryRef,`Mode: ${n.Mode}`,`SysRowID: ${n.SysRowID||""}`].join(`
`),a="library"):e==="assemblies"&&(r=n.Assembly,o="Assembly",i=[n.Assembly,`SysRowID: ${n.SysRowID||""}`].join(`
`),a="package"),super(r||"(unknown)",G.TreeItemCollapsibleState.None),this.kind=e,this.row=n,this.description=o,this.tooltip=i,this.contextValue=`reference-item-${e}`,this.iconPath=new G.ThemeIcon(a)}};we.FunctionNode=_n;var kr=class{constructor(e){this.client=e,this._onDidChangeTreeData=new G.EventEmitter,this.onDidChangeTreeData=this._onDidChangeTreeData.event,this.libraries=[],this.libraryCache=new Map}setClient(e){this.client=e}async refresh(){if(!this.client){G.window.showWarningMessage("EFx: Configure connection first (gear icon)");return}try{this.libraries=await this.client.getLibraryList(),this.libraryCache.clear(),this._onDidChangeTreeData.fire(void 0),G.window.showInformationMessage(`EFx: Loaded ${this.libraries.length} libraries`)}catch(e){G.window.showErrorMessage(`EFx: Failed to load libraries: ${e.message}`)}}async getLibraryTableset(e){if(this.client){if(this.libraryCache.has(e))return this.libraryCache.get(e);try{let n=await this.client.getLibrary(e);return this.libraryCache.set(e,n),n}catch(n){G.window.showErrorMessage(`EFx: Failed to load ${e}: ${n.message}`);return}}}invalidateCache(e){this.libraryCache.delete(e)}getTreeItem(e){return e}async getChildren(e){if(!this.client)return[];if(!e)return this.libraries.sort((n,r)=>n.LibraryID.localeCompare(r.LibraryID)).map(n=>new on(n));if(e instanceof on){let n=await this.getLibraryTableset(e.library.LibraryID);if(!n)return[];let r=[],o=n.EfxFunction||[],i=n.EfxRefTable||[],a=n.EfxRefService||[],s=n.EfxRefLibrary||[],u=n.EfxRefAssembly||[];return o.length>0,o.length>0&&r.push(new Fn(e.library.LibraryID,o.length)),r.push(new nt(e.library.LibraryID,"tables","Tables",i.length)),r.push(new nt(e.library.LibraryID,"services","Services",a.length)),r.push(new nt(e.library.LibraryID,"libraries","Libraries",s.length)),r.push(new nt(e.library.LibraryID,"assemblies","Assemblies",u.length)),r}if(e instanceof Fn){let n=await this.getLibraryTableset(e.libraryId);return n?(n.EfxFunction||[]).sort((r,o)=>r.FunctionID.localeCompare(o.FunctionID)).map(r=>{let o=(n.EfxFunctionSignature||[]).filter(i=>i.FunctionID===r.FunctionID);return new _n(e.libraryId,r,o)}):[]}if(e instanceof nt){let n=await this.getLibraryTableset(e.libraryId);return n?e.kind==="tables"?(n.EfxRefTable||[]).sort((r,o)=>r.TableID.localeCompare(o.TableID)).map(r=>new It("tables",r)):e.kind==="services"?(n.EfxRefService||[]).sort((r,o)=>r.ServiceID.localeCompare(o.ServiceID)).map(r=>new It("services",r)):e.kind==="libraries"?(n.EfxRefLibrary||[]).sort((r,o)=>r.LibraryRef.localeCompare(o.LibraryRef)).map(r=>new It("libraries",r)):e.kind==="assemblies"?(n.EfxRefAssembly||[]).sort((r,o)=>r.Assembly.localeCompare(o.Assembly)).map(r=>new It("assemblies",r)):[]:[]}return[]}};we.EfxTreeProvider=kr});var yi=K($e=>{"use strict";var Kc=$e&&$e.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),Jc=$e&&$e.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),Xc=$e&&$e.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&Kc(n,e,r[o]);return Jc(n,e),n}})();Object.defineProperty($e,"__esModule",{value:!0});$e.ExecuteViewProvider=void 0;var Qc=Xc(require("vscode")),Sr=class{constructor(){this.view=null,this.loaded=!1,this.client=null,this.libraryId="",this.functionId="",this.signatures=[],this.companies=[],this.defaultCompany="",this.treeProvider=null,this.staging=!1}resolveWebviewView(e){this.view=e,e.webview.options={enableScripts:!0},e.webview.onDidReceiveMessage(async n=>{this.loaded&&(n.command==="execute"&&await this.execute(n.payload,n.company),n.command==="saveSignatures"&&await this.saveSignatures(n.signatures))}),e.onDidDispose(()=>{this.view=null}),e.webview.html=this.loaded?this.getHtml():this.getEmptyHtml()}async load(e,n,r,o,i,a,s,u=!1){this.client=e,this.libraryId=n,this.functionId=r,this.signatures=o,this.companies=Array.isArray(i)&&i.length>0?i:a?[a]:[],this.defaultCompany=a||this.companies[0]||"",this.treeProvider=s||null,this.staging=u,this.loaded=!0,await Qc.commands.executeCommand("efxExecuteView.focus"),this.view&&(this.view.webview.html=this.getHtml())}async execute(e,n){this.view.webview.postMessage({command:"executing"});try{let r=await this.client.executeFunction(this.libraryId,this.functionId,e,n||void 0,this.staging);this.view.webview.postMessage({command:"result",data:JSON.stringify(r,null,2),success:!0})}catch(r){this.view.webview.postMessage({command:"result",data:r.message,success:!1})}}async saveSignatures(e){this.view.webview.postMessage({command:"sigSaving"});try{let{saved:n,diagnostics:r,updatedSigs:o}=await this.client.saveSignatures(this.libraryId,this.functionId,e);if(!n){let a=(r||[]).map(s=>typeof s=="object"?s.Message||JSON.stringify(s):String(s));this.view.webview.postMessage({command:"sigError",error:a.join(`
`)||"Epicor rejected the signature change"});return}let i=this.signatures.filter(a=>a.FunctionID!==this.functionId);this.signatures=[...i,...o],this.treeProvider&&this.treeProvider.invalidateCache(this.libraryId),this.view.webview.postMessage({command:"sigSaved",signatures:o})}catch(n){this.view.webview.postMessage({command:"sigError",error:n.message})}}getHtml(){let e=this.signatures.filter(b=>!b.Response),n=this.signatures.filter(b=>b.Response),r={};for(let b of e)b.DataType.includes("Int")||b.DataType.includes("Decimal")||b.DataType.includes("Double")?r[b.ArgumentName]=0:b.DataType.includes("Boolean")?r[b.ArgumentName]=!1:b.DataType.includes("DataSet")||b.DataType.includes("DataTable")?r[b.ArgumentName]={}:r[b.ArgumentName]="";let o=e.map(b=>`<span class="param">${b.ArgumentName} <span class="type">${b.DataType.split(".").pop()}${b.Optional?"?":""}</span></span>`).join("")||'<span class="param none">No request parameters</span>',i=n.map(b=>`<span class="param">${b.ArgumentName} <span class="type">${b.DataType.split(".").pop()}</span></span>`).join(""),a=(this.companies||[]).map(b=>`<option value="${b}"${b===this.defaultCompany?" selected":""}>${b}</option>`).join(""),s=this.companies&&this.companies.length>0?`<div class="company-row">
        <label for="companySelect">Company</label>
        <select id="companySelect">${a}</select>
        <button class="btn-secondary" id="toggleSigBtn" onclick="toggleSigEditor()">\u2699 Edit Signatures</button>
    </div>`:`<div class="company-row">
        <button class="btn-secondary" id="toggleSigBtn" onclick="toggleSigEditor()">\u2699 Edit Signatures</button>
    </div>`,u=b=>({ArgumentName:b.ArgumentName,DataType:b.DataType||"System.String",Optional:!!b.Optional,Response:!!b.Response,Order:b.Order??0}),c=JSON.stringify(e.map(u)),m=JSON.stringify(n.map(u)),y=[["System.String","String"],["System.Int32","Int32"],["System.Int64","Int64"],["System.Decimal","Decimal"],["System.Double","Double"],["System.Boolean","Boolean"],["System.DateTime","DateTime"],["System.Data.DataSet","DataSet"],["System.Data.DataTable","DataTable"]].map(([b,d])=>`<option value="${b}">${d}</option>`).join("")+'<option value="__custom__">Custom\u2026</option>';return`<!DOCTYPE html>
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
                    <select id="newDataType">${y}</select>
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
</html>`}};$e.ExecuteViewProvider=Sr});var an=K(Se=>{"use strict";Object.defineProperty(Se,"__esModule",{value:!0});Se.BpmClient=void 0;var Zc={PRE:1,BASE:2,POST:3};Se.DIRECTIVE_TYPE=Zc;function vi(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\t/g,"&#x9;").replace(/\r\n/g,"&#xA;").replace(/\n/g,"&#xA;").replace(/\r/g,"&#xA;")}function wi(t){return t.replace(/&#xA;/gi,`
`).replace(/&#xD;/gi,"\r").replace(/&#x9;/gi,"	").replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")}Se.xmlDecode=wi;Se.xmlEncode=vi;function el(t){if(!t)return{code:"",hasCustomCode:!1};let e=t.indexOf("CustomCodeAction");if(e<0)return{code:"",hasCustomCode:!1};let n='Code="',r=t.indexOf(n,e);if(r<0)return{code:"",hasCustomCode:!1};let o=r+n.length,i=o;for(;i<t.length&&t[i]!=='"';){if(t[i]==="&"){let s=t.indexOf(";",i);if(s<0)break;i=s+1;continue}i++}let a=t.slice(o,i);return{code:wi(a),hasCustomCode:!0}}Se.extractBpmCode=el;function Ei(t,e){let n=t.indexOf("CustomCodeAction");if(n<0)throw new Error("No CustomCodeAction found in directive body");let r='Code="',o=t.indexOf(r,n);if(o<0)throw new Error("No Code= attribute found in CustomCodeAction");let i=o+r.length,a=i;for(;a<t.length&&t[a]!=='"';){if(t[a]==="&"){let s=t.indexOf(";",a);if(s<0)break;a=s+1;continue}a++}return t.slice(0,i)+vi(e)+t.slice(a)}Se.replaceBpmCode=Ei;function tl(t){return t?String(t).replace(/></g,`>
<`):""}Se.formatBpmBodyXaml=tl;function nl(t,e,n){let o=t.indexOf('"BpDirective":[');if(o<0)throw new Error("BpDirective array not found in raw tableset");let i=t.indexOf("[",o),a=`"DirectiveID":"${e}"`,s=i+1;for(;s<t.length;){let u=t.indexOf("{",s);if(u<0)break;let c=0,m=!1,y=!1,b=-1;for(let l=u;l<t.length;l++){let p=t[l];if(m){if(y){y=!1;continue}if(p==="\\"){y=!0;continue}p==='"'&&(m=!1);continue}if(p==='"'){m=!0;continue}if(p==="{")c++;else if(p==="}"&&(c--,c===0)){b=l;break}}if(b<0)throw new Error("Malformed BpDirective object in raw tableset");let d=t.slice(u,b+1);if(d.includes(a)){let l='"Body":"',p=d.indexOf(l);if(p<0)throw new Error("Body field not found in BpDirective row");let w=p+l.length,v=w,h=!1;for(;v<d.length;){let _=d[v];if(h){h=!1,v++;continue}if(_==="\\"){h=!0,v++;continue}if(_==='"')break;v++}if(v>=d.length)throw new Error("Body string value did not terminate");let g=v,E='"'+d.slice(w,g)+'"',x;try{x=JSON.parse(E)}catch(_){throw new Error("Failed to JSON-parse Body value: "+_.message)}let C=Ei(x,n),D=JSON.stringify(C).slice(1,-1),A=d.slice(0,w)+D+d.slice(g),I=t.slice(0,u)+d+","+A+t.slice(b+1),S='"BitFlag":0,"RowMod":""',L='"BitFlag":0,"RowMod":"U"',k=u+d.length+1,T=k+A.length,N=I.indexOf(S,k);if(N<0||N>T)throw new Error(`BitFlag/RowMod anchor not found for directive ${e}`);return I.slice(0,N)+L+I.slice(N+S.length)}s=b+1}throw new Error(`Directive ${e} not found in raw tableset`)}Se.updateRawBpmDirective=nl;var Tr=class{constructor(e){this._client=e}getBpmUrl(e){return`${this._client.config.serverUrl.replace(/\/$/,"")}/api/v2/odata/${this._client.config.company}/Ice.BO.BpMethodSvc/${e}`}async request(e,n){return this._client.request(e,n)}async requestRaw(e,n){return this._client.requestRaw(e,n)}async getBpmServices(){return(await this.request(this.getBpmUrl("GetBpmDirectiveServicesTS"),{})).returnObj?.BpDirectiveService||[]}async getBpmMethodsByService(e,n,r){let i=(await this.request(this.getBpmUrl("GetRowsEx"),{source:"BO",whereClauseBpMethod:`SystemCode = '${e}' and ObjectNS = '${n}' and BusinessObject = '${r}'`,whereClauseBpDirective:"",pageSize:500,absolutePage:1})).returnObj;return{methods:i?.BpMethod||[],directives:i?.BpDirective||[]}}async getBpmMethod(e,n){return(await this.request(this.getBpmUrl("GetByIDBpMethod"),{source:e,bpMethodCode:n})).returnObj}async getBpmMethodRaw(e,n){let r=await this.requestRaw(this.getBpmUrl("GetByIDBpMethod"),JSON.stringify({source:e,bpMethodCode:n})),o=r.match(/"returnObj"\s*:\s*(\{.*\})\s*\}$/s);return o?o[1]:r}async updateBpmRaw(e){let n=`{"ds":${e}}`,r=await this.requestRaw(this.getBpmUrl("Update"),n);try{return JSON.parse(r)}catch{return{}}}async getBpmRowsBySource(e){let r=(await this.request(this.getBpmUrl("GetRowsEx"),{source:e,whereClauseBpMethod:"",whereClauseBpDirective:"",pageSize:0,absolutePage:0})).returnObj;return{methods:r?.BpMethod||[],directives:r?.BpDirective||[]}}async getKineticDirective(e){let n=await this._client.requestGet(this.getBpmUrl("GetKineticDirective")+"?directiveId="+encodeURIComponent(e)),r=n?.returnObj??n;if(typeof r=="string")try{return JSON.parse(r)}catch{return null}return r&&typeof r=="object"?r:null}async validateCustomCode(e,n){let r=JSON.stringify({Code:e,IsCondition:!1});return(await this.request(this.getBpmUrl("ValidateCustomCode"),{codeSnippetWithScope:r,functionDefinition:JSON.stringify(n),isAsync:!1})).returnObj?.diagnostics||null}};Se.BpmClient=Tr;function rl(t,e){let n=t.SystemCode||"Erp",r=n.charAt(0).toUpperCase()+n.slice(1).toLowerCase(),o={INPUT:0,OUTPUT:1,"INPUT-OUTPUT":2};return{FunctionKind:0,Target:{kind:0,id:t.BpMethodCode,alias:t.BpMethodCode,productCode:{value:r},name:t.BusinessObject,method:t.Name,hasRootTransaction:t.HasRootTransaction},SupportsAdvancedFeatures:!0,SupportsDbAccessInCode:0,DebugMode:t.DebugMode||!1,Arguments:(e||[]).map(i=>({Name:i.BpArgumentName,Type:i.TypeInfo,TypeName:i.Type,Direction:o[i.Direction]??2,Kind:o[i.Direction]??2})),LocalVariables:[],CustomReferences:[{Name:"Assemblies",IsStandard:!1,IsEditable:!0,References:{}},{Name:"Externals",IsStandard:!1,IsEditable:!0,References:{}},{Name:"Standard",IsStandard:!0,IsEditable:!0,References:{}}],CustomUsings:""}}Se.buildFunctionDefinition=rl});var xi=K(Ee=>{"use strict";var ol=Ee&&Ee.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&il(n,e,r[o]);return al(n,e),n}})(),il=Ee&&Ee.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),al=Ee&&Ee.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e});Object.defineProperty(Ee,"__esModule",{value:!0});Ee.BpmTreeProvider=void 0;var Y=ol(require("vscode")),sl=an(),sn=class extends Y.TreeItem{constructor(e){let n=`${e.SystemCode}.${e.ServiceKind}.${e.ServiceName}`;super(n,Y.TreeItemCollapsibleState.Collapsed),this.svc=e,this.contextValue="bpm-service",this.iconPath=new Y.ThemeIcon("server"),this.tooltip=`${e.SystemCode} / ${e.ServiceKind} / ${e.ServiceName}`}},cn=class extends Y.TreeItem{constructor(e,n){super(e.Name,Y.TreeItemCollapsibleState.Collapsed),this.method=e,this.directives=n,this.contextValue="bpm-method";let r=[];e.HasPreProcessing&&r.push("Pre"),e.HasBaseProcessing&&r.push("Base"),e.HasPostProcessing&&r.push("Post"),e.Disabled&&r.push("Disabled"),e.HasOutdatedDirectives&&r.push("\u26A0 Outdated"),this.description=r.join(" \xB7 ")||"No directives",this.tooltip=[`${e.BpMethodCode}`,`Source: ${e.Source}`,r.length?`Flags: ${r.join(", ")}`:""].filter(Boolean).join(`
`),e.Disabled?this.iconPath=new Y.ThemeIcon("circle-slash",new Y.ThemeColor("charts.red")):e.HasOutdatedDirectives?this.iconPath=new Y.ThemeIcon("warning",new Y.ThemeColor("charts.yellow")):r.length>0?this.iconPath=new Y.ThemeIcon("symbol-event",new Y.ThemeColor("charts.blue")):this.iconPath=new Y.ThemeIcon("symbol-event")}},Mn=class extends Y.TreeItem{constructor(e){super(e.Name,Y.TreeItemCollapsibleState.None),this.directive=e;let n=e.DirectiveType===1?"Pre":e.DirectiveType===3?"Post":e.DirectiveType===2?"Base":`Type${e.DirectiveType}`,{hasCustomCode:r}=sl.extractBpmCode(e.Body);this.description=[n,e.IsEnabled?"":"Disabled",r?"":"No code",e.DirectiveGroup?`[${e.DirectiveGroup}]`:""].filter(Boolean).join(" \xB7 "),this.contextValue=r?"bpm-directive-code":"bpm-directive-nocode",r||(this.command={command:"efx.bpm.openWidgetPanel",title:"Open Widget Panel",arguments:[{directive:e}]}),this.tooltip=[e.Name,`Type: ${n}`,`Enabled: ${e.IsEnabled}`,`Group: ${e.DirectiveGroup||"(none)"}`,r?"Has custom C# code":"No custom code (widget/condition only)",e.CompilerDiagnostics?`Diagnostics: ${e.CompilerDiagnostics}`:""].filter(Boolean).join(`
`),e.IsEnabled?r?e.DirectiveType===1?this.iconPath=new Y.ThemeIcon("arrow-up",new Y.ThemeColor("charts.blue")):e.DirectiveType===3?this.iconPath=new Y.ThemeIcon("arrow-down",new Y.ThemeColor("charts.green")):this.iconPath=new Y.ThemeIcon("symbol-event"):this.iconPath=new Y.ThemeIcon("gear"):this.iconPath=new Y.ThemeIcon("circle-slash",new Y.ThemeColor("charts.red")),r&&(this.command={command:"efx.bpm.pullDirective",title:"Pull Directive Code",arguments:[{directive:e}]})}};Ee.BpmServiceNode=sn;Ee.BpmMethodNode=cn;Ee.BpmDirectiveNode=Mn;var Ir=class{constructor(e){this.bpmClient=e,this._onDidChangeTreeData=new Y.EventEmitter,this.onDidChangeTreeData=this._onDidChangeTreeData.event,this.services=[],this.methodCache=new Map}setClient(e){this.bpmClient=e}async refresh(){if(!this.bpmClient){Y.window.showWarningMessage("BPM: Configure EFx connection first");return}try{this.services=await this.bpmClient.getBpmServices(),this.methodCache.clear(),this._onDidChangeTreeData.fire(void 0),Y.window.showInformationMessage(`BPM: Loaded ${this.services.length} services`)}catch(e){Y.window.showErrorMessage(`BPM: Failed to load services: ${e.message}`)}}invalidateService(e,n,r){let o=`${e}.${n}.${r}`;this.methodCache.delete(o)}getTreeItem(e){return e}async getChildren(e){if(!this.bpmClient)return[];if(!e)return this.services.sort((n,r)=>{let o=`${n.SystemCode}.${n.ServiceKind}.${n.ServiceName}`,i=`${r.SystemCode}.${r.ServiceKind}.${r.ServiceName}`;return o.localeCompare(i)}).map(n=>new sn(n));if(e instanceof sn){let{SystemCode:n,ServiceKind:r,ServiceName:o}=e.svc,i=`${n}.${r}.${o}`,a=this.methodCache.get(i);if(!a)try{a=await this.bpmClient.getBpmMethodsByService(n,r,o),this.methodCache.set(i,a)}catch(c){return Y.window.showErrorMessage(`BPM: Failed to load methods: ${c.message}`),[]}let{methods:s,directives:u}=a;return s.sort((c,m)=>c.Name.localeCompare(m.Name)).map(c=>{let m=u.filter(y=>y.BpMethodCode===c.BpMethodCode);return new cn(c,m)})}if(e instanceof cn){let n=e.directives;return!n||n.length===0?[]:n.sort((r,o)=>r.DirectiveType!==o.DirectiveType?r.DirectiveType-o.DirectiveType:(r.Order||0)-(o.Order||0)).map(r=>new Mn(r))}return[]}};Ee.BpmTreeProvider=Ir});var Rn=K((Ed,Ci)=>{"use strict";var rt=require("vscode"),{parseDirective:cl,setNodeCode:Di,setRaiseExceptionMessage:ll,setNodeAttrs:ul,setConditionChildren:dl,setInvokeFunctionAction:pl,setActionField:fl}=St(),Pn=new Map;async function ml(t,e){let n=Pn.get(e.key);if(n){n.panel.reveal(rt.ViewColumn.One);return}let r;try{r=await e.loadXaml()}catch(a){rt.window.showErrorMessage(`Widget panel: could not load ${e.title} \u2014 ${a.message}`);return}let o=rt.window.createWebviewPanel("epicorWidgets",e.title,rt.ViewColumn.One,{enableScripts:!0,retainContextWhenHidden:!0}),i={panel:o,host:e,xaml:r,render:()=>{}};Pn.set(e.key,i),o.onDidDispose(()=>Pn.delete(e.key),null,t.subscriptions),i.render=()=>{let a=cl(i.xaml);if(!a||a.nodes.length===0){o.webview.html=hl("Could not parse the widget XAML, or no widget nodes were found.<br>This may be a pure C# implementation with no visual widgets.");return}let s={nodes:a.nodes.map(u=>({id:u.id,type:u.type,widget:u.widget?{localName:u.widget.localName,label:u.widget.label,code:u.widget.code,message:u.widget.message,attrs:u.widget.attrs,conditions:u.widget.conditions,paramBindings:u.widget.paramBindings,actionExpressionText:u.widget.actionExpressionText,actionFieldInfo:u.widget.actionFieldInfo}:null,x:u.x,y:u.y})),edges:a.edges};o.webview.html=bl(e.heading,e.badge||"",s)},i.render(),o.webview.onDidReceiveMessage(async a=>{a.type==="saveCode"?await Nt(i,()=>Di(i.xaml,a.nodeId,a.code)):a.type==="saveMessage"?await Nt(i,()=>ll(i.xaml,a.nodeId,a.message)):a.type==="saveAttrs"?await Nt(i,()=>ul(i.xaml,a.nodeId,a.attrs)):a.type==="saveConditions"?await Nt(i,()=>dl(i.xaml,a.nodeId,a.conditions)):a.type==="saveInvokeFunction"?await Nt(i,()=>pl(i.xaml,a.nodeId,a.attrs,a.paramBindings)):a.type==="saveActionField"?await Nt(i,()=>fl(i.xaml,a.nodeId,a.expressionText,a.fieldInfo)):a.type==="openCode"&&await rt.commands.executeCommand("efx.widget.openCode",{panelKey:e.key,meta:e.meta,title:e.title,nodeId:a.nodeId,label:a.label||"Custom Code",code:a.code||""})},null,t.subscriptions)}async function Nt(t,e){let{panel:n,host:r}=t;try{n.webview.postMessage({type:"saving"});let o=e();await r.saveXaml(o),t.xaml=o,n.webview.postMessage({type:"saved"}),rt.window.showInformationMessage(`${r.heading}: saved.`)}catch(o){n.webview.postMessage({type:"saveError",message:o.message}),rt.window.showErrorMessage(`Widget push failed: ${o.message}`)}}async function gl(t,e,n){let r=await t.loadXaml(),o=Di(r,e,n);await t.saveXaml(o);let i=Pn.get(t.key);return i&&(i.xaml=o,i.render()),o}function hl(t){return`<!DOCTYPE html><html><body style="color:#f87171;font-family:sans-serif;padding:24px;background:#1e1e1e;font-size:13px">${t}</body></html>`}function bl(t,e,n){let r=yl(),o=JSON.stringify(n),i=JSON.stringify(t),a=JSON.stringify(e);return`<!DOCTYPE html>
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
</body></html>`}function yl(){let t="",e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let n=0;n<32;n++)t+=e[Math.floor(Math.random()*e.length)];return t}Ci.exports={openWidgetPanel:ml,pushNodeCode:gl}});var Ti=K((xd,Si)=>{"use strict";var{openWidgetPanel:vl}=Rn();function Ai(t){return t===1?"Pre":t===3?"Post":t===2?"Base":`Type${t}`}function ki(t,e){let n=Ai(e.DirectiveType),r=e.Body||null;return{key:`bpm:${e.DirectiveID}`,title:`BPM: ${n} ${e.Name||e.DirectiveID}`,heading:e.Name||e.DirectiveID,badge:n,meta:{kind:"bpm",bpMethodCode:e.BpMethodCode,directiveId:e.DirectiveID,directiveType:e.DirectiveType,name:e.Name||e.DirectiveID},async loadXaml(){if(r)return r;let i=((await t.getBpmMethod("BO",e.BpMethodCode))?.BpDirective||[]).find(a=>a.DirectiveID===e.DirectiveID);if(!i)throw new Error(`Directive ${e.DirectiveID} not found on ${e.BpMethodCode}`);return r=i.Body,r},async saveXaml(o){let i=await t.getBpmMethodRaw("BO",e.BpMethodCode),a=El(i,e.DirectiveID,o),u=((await t.updateBpmRaw(a))?.returnObj?.BpMessageSvc||[]).filter(c=>c.Severity>1);if(u.length)throw new Error(u.map(c=>c.Message).join("; "));r=o,e.Body=o}}}function wl(t,e,n){return vl(t,ki(e,n))}function El(t,e,n){let r=t.indexOf('"BpDirective":[');if(r<0)throw new Error("BpDirective array not found in tableset");let o=`"DirectiveID":"${e}"`,i=t.indexOf("[",r)+1;for(;i<t.length;){let a=t.indexOf("{",i);if(a<0)break;let s=0,u=!1,c=!1,m=-1;for(let C=a;C<t.length;C++){let D=t[C];if(u){if(c){c=!1;continue}if(D==="\\"){c=!0;continue}D==='"'&&(u=!1);continue}if(D==='"'){u=!0;continue}if(D==="{")s++;else if(D==="}"&&(s--,!s)){m=C;break}}if(m<0)throw new Error("Malformed BpDirective object in tableset");let y=t.slice(a,m+1);if(!y.includes(o)){i=m+1;continue}let b='"Body":"',d=y.indexOf(b);if(d<0)throw new Error("Body field not found in directive row");let l=d+b.length,p=l,w=!1;for(;p<y.length;){let C=y[p];if(w){w=!1,p++;continue}if(C==="\\"){w=!0,p++;continue}if(C==='"')break;p++}let v=JSON.stringify(n).slice(1,-1),h=y.slice(0,l)+v+y.slice(p),g=t.slice(0,a)+y+","+h+t.slice(m+1),E='"BitFlag":0,"RowMod":""',x=g.indexOf(E,a+y.length+1);if(x<0)throw new Error(`RowMod anchor not found for directive ${e}`);return g.slice(0,x)+'"BitFlag":0,"RowMod":"U"'+g.slice(x+E.length)}throw new Error(`Directive ${e} not found in tableset`)}Si.exports={openBpmWidgetPanel:wl,createBpmHost:ki,typeLabelOf:Ai}});var Li=K((Dd,Bi)=>{"use strict";var{openWidgetPanel:xl}=Rn(),{describeBody:Ii,packFlowXaml:Dl}=Tt();function Ni(t,e,n,r){let o=r?Ii(r):null;async function i(){if(!o){let s=((await t.getLibrary(e))?.EfxFunction||[]).find(u=>u.FunctionID===n);if(!s)throw new Error(`Function ${e}.${n} not found on server`);o=Ii(s.Body)}if(o.kind!=="flow")throw new Error(`${e}.${n} has no widget flow \u2014 it is a code-based function`);return o}return{key:`efx:${e}.${n}`,title:`Function: ${e}.${n}`,heading:`${e}.${n}`,badge:"Function",meta:{kind:"efx",libraryId:e,functionId:n},async loadXaml(){return(await i()).xaml},async saveXaml(a){let s=await i();await t.saveFunctionBody(e,n,Dl(s,a)),o={...s,xaml:a}}}}function Cl(t,e,n,r,o){return xl(t,Ni(e,n,r,o))}Bi.exports={openEfxWidgetPanel:Cl,createEfxHost:Ni}});var Pi=K(Lt=>{"use strict";var ln=Lt&&Lt.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&(n[r[o]]=e[r[o]]);return n.default=e,n}})();Object.defineProperty(Lt,"__esModule",{value:!0});Lt.registerUpdateCommand=$l;Lt.checkForUpdatesOnStartup=_l;var Te=ln(require("vscode")),$i=ln(require("https")),Bt=ln(require("fs")),Al=ln(require("path")),kl=ln(require("os")),Sl="mbcpi",Tl="epicor-customcode-manager",Il="micah-bragg",Nl=`https://api.github.com/repos/${Sl}/${Tl}/releases/latest`,Oi="efx.updateSnoozedVersion";function Bl(t,e){let n=c=>String(c||"0").replace(/^v/,"").split(".").map(m=>parseInt(m)||0),[r,o,i]=n(t),[a,s,u]=n(e);return a!==r?a>r:s!==o?s>o:u>i}function _i(t,e=3){return new Promise((n,r)=>{let o=$i.get(t,{headers:{"User-Agent":"epicor-efx-manager-vscode"}},i=>{if((i.statusCode===301||i.statusCode===302)&&i.headers.location&&e>0)return n(_i(i.headers.location,e-1));if(i.statusCode!==200)return i.resume(),r(new Error(`GitHub API returned ${i.statusCode}`));let a="";i.on("data",s=>{a+=s}),i.on("end",()=>{try{n(JSON.parse(a))}catch{r(new Error("Failed to parse GitHub API response"))}})});o.on("error",r),o.setTimeout(1e4,()=>{o.destroy(),r(new Error("Update check timed out"))})})}function Fi(t,e,n=5){return new Promise((r,o)=>{let i=Bt.createWriteStream(e),a=$i.get(t,{headers:{"User-Agent":"epicor-efx-manager-vscode"}},s=>{if((s.statusCode===301||s.statusCode===302)&&s.headers.location&&n>0)return i.close(),Bt.unlink(e,()=>{}),r(Fi(s.headers.location,e,n-1));if(s.statusCode!==200)return i.close(),Bt.unlink(e,()=>{}),o(new Error(`Download failed: HTTP ${s.statusCode}`));s.pipe(i),i.on("finish",()=>i.close(r)),i.on("error",u=>{Bt.unlink(e,()=>{}),o(u)})});a.on("error",s=>{Bt.unlink(e,()=>{}),o(s)}),a.setTimeout(6e4,()=>{a.destroy(),o(new Error("Download timed out"))})})}async function Ll(){let t=await _i(Nl),e=(t.assets||[]).find(n=>n.name&&n.name.endsWith(".vsix"));if(!e)throw new Error("No .vsix asset found in latest GitHub release");return{version:(t.tag_name||"").replace(/^v/,""),tagName:t.tag_name||"",releaseNotes:t.body||"",downloadUrl:e.browser_download_url,assetName:e.name}}async function Ol(t){let e=Al.join(kl.tmpdir(),t.assetName);await Te.window.withProgress({location:Te.ProgressLocation.Notification,title:`EFx: Downloading v${t.version}...`,cancellable:!1},async()=>{await Fi(t.downloadUrl,e)});let n=Te.Uri.file(e);await Te.commands.executeCommand("workbench.extensions.installExtension",n),setTimeout(()=>{try{Bt.unlinkSync(e)}catch{}},5e3),await Te.window.showInformationMessage(`EFx Manager updated to v${t.version}. Reload window to activate?`,"Reload Now","Later")==="Reload Now"&&await Te.commands.executeCommand("workbench.action.reloadWindow")}async function Mi(t,e=!1){let r=Te.extensions.getExtension(`${Il}.epicor-efx-manager`)?.packageJSON?.version||"0.0.0",o;try{o=await Ll()}catch(s){e||Te.window.showWarningMessage(`EFx: Update check failed \u2014 ${s.message}`);return}if(!Bl(r,o.version)){e||Te.window.showInformationMessage(`EFx Manager is up to date (v${r})`);return}let i=t.globalState.get(Oi,"");if(e&&i===o.version)return;let a=await Te.window.showInformationMessage(`EFx Manager v${o.version} is available (you have v${r})`,"Update Now","Later");if(a==="Update Now")try{await Ol(o)}catch(s){Te.window.showErrorMessage(`EFx: Update failed \u2014 ${s.message}`)}else a==="Later"&&await t.globalState.update(Oi,o.version)}function $l(t){t.subscriptions.push(Te.commands.registerCommand("efx.checkForUpdates",async()=>{await Mi(t,!1)}))}function _l(t){setTimeout(()=>{Mi(t,!0).catch(()=>{})},5e3)}});var Nr=K(Un=>{"use strict";var Ri=require("https"),Ui=require("http");function qi(t){let e={layout:"layout",events:"events",dataviews:"dataviews",pages:"pages",rules:"rules",tools:"tools",classicLayout:"classicLayout",orphans:"orphans",properties:"properties"},n={};for(let[r,o]of Object.entries(t||{})){if(!o)continue;let i=r.replace(/\.jsonc?$/,"");if(e[i])try{n[e[i]]=JSON.parse(o)}catch{}}return n}var un=class{constructor(e){this.config=e}_getHeaders(){let n={"Content-Type":"application/json",Authorization:`Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64")}`};return this.config.apiKey&&(n["x-api-key"]=this.config.apiKey),n}_methodUrl(e){return`${this.config.serverUrl.replace(/\/$/,"")}/api/v2/odata/${this.config.company}/Ice.LIB.MetaFXSvc/${e}`}_call(e,n){return new Promise((r,o)=>{let i=this._methodUrl(e),a=new URL(i),s=a.protocol==="https:",u=s?Ri:Ui,c=JSON.stringify(n),m={hostname:a.hostname,port:a.port||(s?443:80),path:a.pathname+a.search,method:"POST",headers:{...this._getHeaders(),"Content-Length":Buffer.byteLength(c)},rejectUnauthorized:!1},y=u.request(m,b=>{let d="";b.on("data",l=>{d+=l}),b.on("end",()=>{if(b.statusCode>=200&&b.statusCode<300)try{r(d?JSON.parse(d):null)}catch{r(d)}else{let l=`HTTP ${b.statusCode}`;try{let p=JSON.parse(d);l=p.error?.message||p.ErrorMessage||JSON.stringify(p,null,2)}catch{l=d||l}console.error(`[MetaFX] ${e} failed ${b.statusCode}: body=`,d.slice(0,2e3)),console.error(`[MetaFX] ${e} request body was:`,c.slice(0,1e3)),o(new Error(l))}})});y.on("error",o),y.write(c),y.end()})}_get(e,n){return new Promise((r,o)=>{let i=this._methodUrl(e),a=new URL(i);a.searchParams.set("request",JSON.stringify(n));let s=a.protocol==="https:",u=s?Ri:Ui,c=this._getHeaders();delete c["Content-Type"];let m={hostname:a.hostname,port:a.port||(s?443:80),path:a.pathname+"?"+a.searchParams.toString(),method:"GET",headers:c,rejectUnauthorized:!1},y=u.request(m,b=>{let d="";b.on("data",l=>{d+=l}),b.on("end",()=>{if(b.statusCode>=200&&b.statusCode<300)try{r(d?JSON.parse(d):null)}catch{r(d)}else{let l=`HTTP ${b.statusCode}`;try{let p=JSON.parse(d);l=p.error?.message||p.ErrorMessage||d}catch{l=d||l}console.error(`[MetaFX] GET ${e} failed ${b.statusCode}:`,d.slice(0,1e3)),o(new Error(l))}})});y.on("error",o),y.end()})}async listApps(){let e=await this._call("GetApplications",{request:{Type:"view",SubType:"",SearchText:"",IncludeAllLayers:!0}});return Array.isArray(e?.returnObj)?e.returnObj:[]}async getLayers(e){let n=await this._call("GetLayers",{request:{ViewId:e,IncludeUnpublishedLayers:!0}}),r=n?.returnObj,o=i=>Array.isArray(i)&&i.length>0&&typeof i[0]=="object"&&i[0]!==null&&("LayerName"in i[0]||"LayerDescription"in i[0]||"TypeCode"in i[0]);if(Array.isArray(r))return r;if(r&&typeof r=="object"){let i=["Layers","layers","EpMetaFXLayerForApplicationList","LayerList","value","Value","data","Data","items","Items","Result","result","EpMetaFXLayerList","AppLayerList","LayerDescriptors"];for(let a of i)if(o(r[a]))return r[a];for(let[a,s]of Object.entries(r))if(o(s))return console.error("[MetaFX] GetLayers used layer-shaped fallback key:",a,"shape keys:",Object.keys(r)),s;for(let a of i)if(Array.isArray(r[a])&&r[a].length>0)return r[a];for(let[a,s]of Object.entries(r))if(Array.isArray(s)&&s.length>0)return console.error("[MetaFX] GetLayers used fallback key:",a,"shape keys:",Object.keys(r)),s;for(let a of i)if(Array.isArray(r[a]))return r[a]}return r!=null?console.error("[MetaFX] GetLayers returnObj (no array found):",JSON.stringify(r).slice(0,600)):console.error("[MetaFX] GetLayers result:",JSON.stringify(n).slice(0,600)),[]}async applicationExists(e){return(await this._call("ApplicationExists",{viewId:e}))?.returnObj===!0}async deleteApp(e){await this._call("DeleteApp",{viewId:e})}async exportApp(e){return(await this._call("ExportApp",{viewId:e}))?.returnObj||null}async getAppForLayer(e,n,r="Desktop"){console.log(`[MetaFX] getAppForLayer \u2192 viewId="${e}" layer="${n}"`);let o={id:e,properties:{deviceType:r||"Desktop",layers:[n],baseAppVersion:0,layerVersion:0,mode:"AppStudio",applicationType:"view",ignorePersonalization:!1,additionalContext:{doValidation:!0,menuId:"preview",inPreviewMode:!0},checkDuplicateIds:!1,debug:!1}};console.log("[MetaFX] getAppForLayer request:",JSON.stringify(o));try{let i=await this._get("GetApp",o),a=i?.returnObj;return a?(console.log("[MetaFX] getAppForLayer OK \u2014 top-level keys:",Object.keys(a)),a):(console.error("[MetaFX] getAppForLayer: empty returnObj. Full response:",JSON.stringify(i).slice(0,500)),null)}catch(i){throw console.error(`[MetaFX] getAppForLayer failed for layer="${n}":`,i.message),i}}async getApplicationInfo(e){return(await this.listApps()).find(r=>r.Id===e)||null}async getNewApplication(e,n,r){await this._call("GetNewApplication",{request:{Id:e,Type:n,SubType:r}})}_buildLayerInfo(e,n={},r=!0){let o=n.layerDescription||"";return{ViewId:e,LayerDescription:o,LayerName:o,TypeCode:n.typeCode||"KNTCCustLayer",WIP:r,IsNew:n.isNew||!1,Company:n.company||this.config.company||"",DeviceType:"Desktop",CGCCode:"",SystemFlag:!1,HasDraftContent:r,PublishParentLayers:!1,CommentText:n.comment||"",ParentLayers:null,UserName:null,Content:null,ChangedOn:new Date().toISOString().slice(0,10)+"T00:00:00",LayerUpdatedToPropDiffFormat:null,ProcessedInfo:null,LastUpdatedBy:""}}async saveApp(e,n,r={}){let o=qi(n),i=r.subType||o.layout?.viewType||"Dashboard";return(await this._call("SaveApp",{request:{id:e,viewType:i,...o,applicationType:"view",subApplicationType:i,uxAppVersion:0,commentText:r.comment||"",deviceType:"Desktop",layerInfo:this._buildLayerInfo(e,r,!0)}}))?.returnObj}async publishApp(e,n,r={}){let o=qi(n),i=r.subType||o.layout?.viewType||"Dashboard";return(await this._call("PublishApp",{request:{id:e,viewType:i,...o,applicationType:"view",subApplicationType:i,uxAppVersion:0,commentText:r.comment||"",deviceType:"Desktop",layerInfo:this._buildLayerInfo(e,r,!1)}}))?.returnObj}async exportLayers(e){return(await this._call("ExportLayers",{apps:e}))?.returnObj??null}async importLayers(e,n=!0){let r=await this._call("ImportLayers",{fileContent:{content:e,overwrite:n}});if(r&&typeof r=="object"){let o=r.error?.message||r.ErrorMessage||r.returnObj?.ErrorMessage||null;if(o)throw new Error(o)}return r}};Un.KineticMetaFXClient=un;Un.KineticLayerClient=un;Un.KineticAppClient=un});var Gi=K((kd,Yi)=>{"use strict";var{parseDirective:Fl,directiveToCanonicalText:Ml,looksLikeFlowXaml:Pl}=St(),{formatBpmBodyXaml:Rl}=an(),Ul={1:"Pre",2:"Base",3:"Post"};function Or(t){if(t&&typeof t=="object")return t;if(typeof t!="string")return null;let e=t.trim();if(!e.startsWith("{"))return null;try{return JSON.parse(e)}catch{return null}}function dn(t){if(!t||!String(t).trim())return"empty";let e=Or(t);return e&&(e.Nodes||e.Links||e.Version!==void 0)?"json":Pl(t)?"xaml":"other"}function jn(t){if(Array.isArray(t))return t.map(jn);if(t&&typeof t=="object"){if(Array.isArray(t.$values))return t.$values.map(jn);let e={};for(let n of Object.keys(t))e[n]=jn(t[n]);return e}return t}function qn(t){if(!t)return"";let e=String(t).split(",")[0];return e.slice(e.lastIndexOf(".")+1)}function Lr(t){return Array.isArray(t)?t.map(Lr):t&&typeof t=="object"?Object.keys(t).sort().reduce((e,n)=>(e[n]=Lr(t[n]),e),{}):t}var ot=t=>t&&typeof t=="object"?JSON.stringify(Lr(t)):String(t),ql=new Set(["$type","Id","Code","VisualProperties","ValidationState"]);function Br(t,e){let n=[];if(!t||typeof t!="object")return n;for(let r of Object.keys(t).sort()){if(ql.has(r)||r.startsWith("_"))continue;let o=t[r];o==null||o===""||n.push(e+r+" = "+ot(o))}return n}function ji(t,e){return String(t).replace(/\r\n/g,`
`).split(`
`).map(n=>e+"| "+n)}function Vi(t){let e=Or(t);if(!e)return null;let n=jn(e),r=Array.isArray(n.Nodes)?n.Nodes:[],o=n.Links||n,i=o.NextNodes||{},a=o.TrueNodes||{},s=o.FalseNodes||{},u=new Map(r.map(h=>[String(h.Id),h])),c=[],m=new Set,y=h=>{h!=null&&(h=String(h),!(m.has(h)||!u.has(h))&&(m.add(h),c.push(h),y(i[h]),y(a[h]),y(s[h])))};y(o.StartNodeId);for(let h of r)m.has(String(h.Id))||(m.add(String(h.Id)),c.push(String(h.Id)));let b=new Map(c.map((h,g)=>[h,g+1])),d=h=>h==null?"(end)":"["+(b.get(String(h))??"?")+"]",l=[],p=[],w=[],v={nodes:[],edges:[]};if(n.AdditionalUsings&&l.push("Usings = "+ot(n.AdditionalUsings)),n.AdditionalReferences&&(!Array.isArray(n.AdditionalReferences)||n.AdditionalReferences.length)&&l.push("References = "+ot(n.AdditionalReferences)),Array.isArray(n.Variables)&&n.Variables.length)for(let h of n.Variables)l.push("Variable "+(h.Name||"?")+" : "+ot(h.TypeData||h.Type||""));return l.length&&l.push(""),n.VisualProperties&&w.push("(directive) "+ot(n.VisualProperties)),c.forEach((h,g)=>{let E=u.get(h),x=g+1,C=qn(E.$type),D=C==="DirectiveCondition"||!!E.Condition,A=D?"Condition":qn(E.Action&&E.Action.$type)||C||"(unknown)",I="["+x+"] "+(D?"Condition":"Step")+": "+A+(E.DisplayName?'  "'+E.DisplayName+'"':""),S=l.length;if(l.push(I),D)(E.Condition&&E.Condition.Items||[]).forEach((T,N)=>{let _=T.Condition||{};l.push("    Condition "+(N+1)+": "+(N>0&&T.Operator!=null?T.Operator+" ":"")+qn(_.$type)),l.push(...Br(_,"        ")),_.Code&&(l.push(...ji(_.Code,"        ")),p.push("// ["+x+"] condition "+(N+1)+" "+qn(_.$type),String(_.Code),""))}),l.push(...Br(E.Condition,"    ").filter(T=>!T.trim().startsWith("Items ="))),l.push("    True -> "+d(a[h])),l.push("    False -> "+d(s[h]));else{let k=E.Action||{};l.push(...Br(k,"    ")),k.Code&&(l.push("    Code:",...ji(k.Code,"      ")),p.push("// ["+x+"] "+A+(E.DisplayName?' "'+E.DisplayName+'"':""),String(k.Code),"")),l.push("    -> "+d(i[h]))}let L=E.VisualProperties||{};v.nodes.push({n:x,kind:D?"condition":"step",widget:A,label:E.DisplayName||"",x:+L.ElementX||0,y:+L.ElementY||0,sig:l.slice(S+1).filter(k=>!/^\s*(True |False )?-> /.test(k)).join(`
`)}),D?(v.edges.push({from:x,to:b.get(String(a[h]))||null,label:"True"}),v.edges.push({from:x,to:b.get(String(s[h]))||null,label:"False"})):i[h]!=null&&v.edges.push({from:x,to:b.get(String(i[h]))||null,label:""}),l.push(""),w.push("["+x+"] "+A+"  "+ot(L))}),{text:l.join(`
`),code:p.join(`
`),layout:w.join(`
`),graph:v}}function jl(t){let e=Ml(t);if(e==null)return{text:Rl(t),code:"",layout:"",graph:null};let n=[],r=[],o={nodes:[],edges:[]};try{let i=Fl(t),a=new Map((i?.nodes||[]).map((s,u)=>[s.id,u+1]));for(let s of i?.edges||[])a.has(s.from)&&o.edges.push({from:a.get(s.from),to:s.to==null?null:a.get(s.to)||null,label:s.label||""});(i?.nodes||[]).forEach((s,u)=>{let c=s.widget||{},m=u+1,{attrs:y,...b}=c,d={};for(let l of Object.keys(y||{}).sort())!l.startsWith("x:")&&!l.startsWith("xmlns")&&l!=="Id"&&l!=="ValidationState"&&(d[l]=y[l]);o.nodes.push({n:m,kind:s.type==="condition"?"condition":"step",widget:s.type==="condition"?"Condition":c.localName||s.type,label:s._el&&s._el.getAttribute&&s._el.getAttribute("DisplayName")||"",x:+s.x||0,y:+s.y||0,sig:ot({...b,attrs:d})}),c.code!=null&&n.push("// ["+m+"] "+(c.localName||""),String(c.code),""),(c.conditions||[]).forEach((l,p)=>{l.attrs&&l.attrs.Code&&n.push("// ["+m+"] condition "+(p+1)+" "+l.localName,String(l.attrs.Code),"")}),r.push("["+m+"] "+(c.localName||s.type)+"  x="+s.x+" y="+s.y)})}catch{}return{text:e,code:n.join(`
`),layout:r.join(`
`),graph:o}}function zi(t){let e=dn(t);return e==="empty"?{format:e,text:"",code:"",layout:"",graph:null}:e==="json"?{format:e,...Vi(t)||{text:String(t),code:"",layout:"",graph:null}}:e==="xaml"?{format:e,...jl(t)}:{format:e,text:String(t),code:"",layout:"",graph:null}}function Hn(t){return[t.Source||"BO",t.BpMethodCode,t.DirectiveType,t.Name].join("|")}function Hi(t,e){let n=t._canon||zi(t.Body||"");return{key:Hn(t),Source:t.Source||"BO",BpMethodCode:t.BpMethodCode,DirectiveID:t.DirectiveID||"",Name:t.Name||"",DirectiveType:t.DirectiveType,IsEnabled:t.IsEnabled,Order:t.Order??t.Sequence??"",DirectiveGroup:t.DirectiveGroup||"",MethodDisabled:!!(e&&e.Disabled),format:n.format,origFormat:t._origFormat||n.format,normalized:!!t._normalized,text:n.text,code:n.code,layout:n.layout,graph:n.graph||null}}var Hl=[["Widgets","text"],["Code","code"]],Wl=["DirectiveType","IsEnabled","Order","DirectiveGroup","MethodDisabled"];function Wi(t,e){let n={},r=!1;for(let[o,i]of Hl){let a=(t[i]||"")===(e[i]||"");a||(r=!0),n[o]={same:a}}for(let o of Wl){let i=String(t[o]??""),a=String(e[o]??""),s=i===a;s||(r=!0),n[o]={a:i,b:a,same:s}}return n.Layout={same:(t.layout||"")===(e.layout||""),infoOnly:!0},n.Format={a:t.origFormat,b:e.origFormat,same:t.origFormat===e.origFormat,infoOnly:!0},n.hasDiff=r,n}function Vl(t,e,n,r){let o=h=>(h.Source||"BO")+"|"+h.BpMethodCode,i=new Map(t.map(h=>[o(h),h])),a=new Map(n.map(h=>[o(h),h])),s=new Map,u=new Map;for(let h of e){let g=Hi(h,i.get((h.Source||"BO")+"|"+h.BpMethodCode));s.set(g.key,g)}for(let h of r){let g=Hi(h,a.get((h.Source||"BO")+"|"+h.BpMethodCode));u.set(g.key,g)}let c=[],m=[...new Set([...s.keys(),...u.keys()])].sort();for(let h of m){let g=s.get(h)||null,E=u.get(h)||null;if(g&&E){let x=Wi(g,E);c.push({key:h,status:x.hasDiff?"diff":"match",a:g,b:E,fields:x,layoutDiff:!x.Layout.same})}else c.push({key:h,status:g?"only-a":"only-b",a:g,b:E,fields:null,layoutDiff:!1})}let y=c.filter(h=>h.status==="only-a"&&h.a.DirectiveID),b=c.filter(h=>h.status==="only-b"&&h.b.DirectiveID),d=new Set;for(let h of y){let g=b.find(E=>!d.has(E)&&E.b.DirectiveID===h.a.DirectiveID&&E.b.BpMethodCode===h.a.BpMethodCode&&E.b.Source===h.a.Source);g&&(d.add(g),h.b=g.b,h.status="renamed",h.fields=Wi(h.a,h.b),h.layoutDiff=!h.fields.Layout.same,h.renamedTo=g.b.Name)}let l=c.filter(h=>!d.has(h)),p=new Map;for(let h of l){let g=h.a||h.b,E=i.get(g.Source+"|"+g.BpMethodCode)||a.get(g.Source+"|"+g.BpMethodCode)||{},x=E.SystemCode||String(g.BpMethodCode).split(".")[0]||"Erp",C=E.BusinessObject||String(g.BpMethodCode).split(".").slice(-2,-1)[0]||g.BpMethodCode,D=g.Source+":"+x+":"+C;p.has(D)||p.set(D,{svcKey:D,source:g.Source,systemCode:x,businessObject:C,methods:new Map});let A=p.get(D);A.methods.has(g.BpMethodCode)||A.methods.set(g.BpMethodCode,{methodCode:g.BpMethodCode,methodName:E.Name||String(g.BpMethodCode).split(".").pop(),inA:i.has(g.Source+"|"+g.BpMethodCode),inB:a.has(g.Source+"|"+g.BpMethodCode),dirs:[]}),A.methods.get(g.BpMethodCode).dirs.push({...h,typeLabel:Ul[g.DirectiveType]||"Type"+g.DirectiveType})}let w={match:0,diff:0,"only-a":0,"only-b":0,renamed:0};for(let h of l)w[h.status]++;let v=[...p.values()].map(h=>{let g=[...h.methods.values()].map(C=>(C.dirs.sort((D,A)=>(D.a||D.b).DirectiveType-(A.a||A.b).DirectiveType||String((D.a||D.b).Order).localeCompare(String((A.a||A.b).Order))||(D.a||D.b).Name.localeCompare((A.a||A.b).Name)),C.status=C.dirs.some(D=>D.status!=="match")?"diff":"match",C)).sort((C,D)=>C.methodName.localeCompare(D.methodName)),E=g.reduce((C,D)=>C+D.dirs.filter(A=>A.status!=="match").length,0),x=g.reduce((C,D)=>C+D.dirs.length,0);return{svcKey:h.svcKey,source:h.source,systemCode:h.systemCode,businessObject:h.businessObject,status:E?"diff":"match",diffCount:E,dirCount:x,methods:g}}).sort((h,g)=>(h.status===g.status?0:h.status==="diff"?-1:1)||h.businessObject.localeCompare(g.businessObject));return{services:v,counts:w,total:l.length,serviceTotal:v.length}}function zl(t,e){let n=new Map(t.map(o=>[Hn(o),o])),r=[];for(let o of e){let i=n.get(Hn(o));if(!i)continue;let a=dn(i.Body),s=dn(o.Body);a!==s&&a!=="empty"&&s!=="empty"&&r.push({a:i,b:o})}return r}function Yl(t){let e=dn(t);if(e==="empty")return"";if(e==="json")return JSON.stringify(Or(t),null,2);let n=String(t).match(/<[^>]+>|[^<]+/g)||[],r=[],o=0,i=()=>"  ".repeat(Math.max(0,o));for(let a of n){if(!a.trim())continue;if(!a.startsWith("<")){r.push(i()+a.trim());continue}let s=a.startsWith("</"),u=a.endsWith("/>")||a.startsWith("<?")||a.startsWith("<!");if(s&&o--,a.length>120&&!s){let c=a.split(/\s+(?=[\w:.]+=")/);r.push(i()+c[0]);for(let m of c.slice(1))r.push(i()+"    "+m)}else r.push(i()+a);!s&&!u&&o++}return r.join(`
`)}Yi.exports={bodyFormat:dn,canonicalizeBody:zi,jsonToCanonical:Vi,buildBpmCompare:Vl,mixedFormatPairs:zl,directiveKey:Hn,prettyBody:Yl}});var ea=K((Sd,Zi)=>{"use strict";var Gl="KNTCCustLayer";function Ji(t){return!!t&&t.TypeCode===Gl&&!t.SystemFlag&&!!t.LayerName}function it(t){let e=[t.LayerName];return t.DeviceType&&t.DeviceType!=="Desktop"&&e.push(t.DeviceType),e.join(" \xB7 ")}function Kl(t){return t?{LayerName:t.LayerName,TypeCode:t.TypeCode,DeviceType:t.DeviceType||"Desktop",Company:t.Company||"",IsPublished:t.IsPublished,HasDraftContent:t.HasDraftContent,LastUpdated:t.LastUpdated||"",LastUpdatedBy:t.LastUpdatedBy||"",CGCCode:t.CGCCode||""}:null}function Jl(t,e,n){let r=b=>{let d=new Map;for(let l of b||[]){let p=(l.Layers||[]).filter(Ji).map(Kl);p.length&&d.set(l.Id,{app:l,layers:p})}return d},o=b=>b.Company||"",i=(b,d)=>{let l=[...b],p=[...d],w=[],v=E=>{for(let x=0;x<l.length;x++){let C=p.findIndex(D=>E(l[x],D));C<0||(w.push([l[x],p[C]]),l.splice(x--,1),p.splice(C,1))}};n&&v((E,x)=>it(E)===it(x)&&o(E)===o(x)),v((E,x)=>it(E)===it(x));for(let E of l)w.push([E,null]);for(let E of p)w.push([null,E]);let h=new Map;for(let[E,x]of w){let C=it(E||x);h.set(C,(h.get(C)||0)+1)}let g=new Set;return w.map(([E,x])=>{let C=E||x,D=it(C),A=h.get(D)>1?D+" \xB7 "+(o(C)||"all companies"):D,I=2,S=A;for(;g.has(A);)A=S+" #"+I++;return g.add(A),{key:A,lA:E,lB:x}})},a=r(t),s=r(e),u=[...new Set([...a.keys(),...s.keys()])].sort(),c={"only-a":0,"only-b":0,"layers-differ":0,"in-both":0},m=u.map(b=>{let d=a.get(b),l=s.get(b),p=(d||l).app,w=i(d?d.layers:[],l?l.layers:[]).map(({key:h,lA:g,lB:E})=>({key:h,lA:g,lB:E,status:g&&E?"in-both":g?"only-a":"only-b",updatedDiffers:!!(g&&E&&(g.LastUpdated!==E.LastUpdated||g.LastUpdatedBy!==E.LastUpdatedBy)),companyDiffers:!!(g&&E&&o(g)!==o(E)),publishDiffers:!!(g&&E&&g.IsPublished!==E.IsPublished)})).sort((h,g)=>h.key.localeCompare(g.key)),v=d?l?w.some(h=>h.status!=="in-both")?"layers-differ":"in-both":"only-a":"only-b";return c[v]++,{id:b,status:v,type:p.Type,subType:p.SubType,systemApp:!!p.SystemFlag,layerCount:w.length,layerDelta:w.filter(h=>h.status!=="in-both").length,updatedDelta:w.filter(h=>h.updatedDiffers).length,layers:w}}),y={"only-a":0,"only-b":1,"layers-differ":2,"in-both":3};return m.sort((b,d)=>y[b.status]-y[d.status]||b.id.localeCompare(d.id)),{apps:m,counts:c,total:m.length}}var Xi=t=>t&&typeof t=="object"&&!Array.isArray(t)&&typeof t.sourceTypeId=="string";function Ye(t,e=[]){if(Array.isArray(t)){for(let n of t)Ye(n,e);return e}if(!t||typeof t!="object")return e;if(Xi(t))return e.push(t),e;for(let n of Object.keys(t))Ye(t[n],e);return e}function Xl(t){let e=[];for(let n of Object.keys(t))n!=="sourceTypeId"&&Ye(t[n],e);return e}function Ql(t){let e=r=>{if(Array.isArray(r))return r.map(e);if(!r||typeof r!="object")return r;if(Xi(r))return{"@child":r.id};let o={};for(let i of Object.keys(r))o[i]=e(r[i]);return o},n={};for(let r of Object.keys(t))n[r]=e(t[r]);return n}function Qi(t){let e=t.model||{};return e.labelText||e.title||e.caption||e.text||e.headerText||t.id}function Wn(t,e,n,r){let o=e,i=2;for(;t.has(o);)o=e+" #"+i++;t.set(o,{key:o,label:n,value:r})}function Ki(t,e){let n=new Map,r=t?t[e]:void 0;if(e==="Layout"||e==="Pages"){let o=e==="Layout"?r?[r]:[]:r||[];for(let i of o){let a=e==="Layout"?"(layout)":i.name||i.guid||"?",s={};for(let c of Object.keys(i))c!=="components"&&(s[c]=i[c]);Wn(n,a+" / (page)",a,s);let u=c=>{Wn(n,a+" / "+(c.id||c.model?.guid||"?"),c.sourceTypeId+"  "+Qi(c),Ql(c));for(let m of Xl(c))u(m)};for(let c of Ye(i.components||[]))u(c)}return n}return Array.isArray(r)?(r.forEach((o,i)=>{let a=o&&(o.id??o.Id??o.name??o.Name);Wn(n,a!=null?String(a):"#"+i,a!=null?String(a):"#"+i,o)}),n):(r!=null&&Wn(n,"(value)",e,r),n)}function zn(t,e,n){if(Array.isArray(t))t.length||(n[e||"(root)"]="[]"),t.forEach((r,o)=>zn(r,e+"["+o+"]",n));else if(t&&typeof t=="object"){let r=Object.keys(t);r.length||(n[e||"(root)"]="{}");for(let o of r.sort())zn(t[o],e?e+"."+o:o,n)}else n[e||"(root)"]=JSON.stringify(t);return n}function $r(t){return Array.isArray(t)?t.map($r):t&&typeof t=="object"?Object.keys(t).sort().reduce((e,n)=>(e[n]=$r(t[n]),e),{}):t}var Vn=t=>JSON.stringify($r(t),null,2),Zl=["Layout","Pages","Events","DataViews","Rules","ToolBar","Orphans","Properties"],eu=300;function tu(t,e){let n=[...new Set([...Zl,...Object.keys(t||{}),...Object.keys(e||{})])],r=[];for(let o of n){let i=Ki(t,o),a=Ki(e,o);if(!i.size&&!a.size)continue;let s={added:0,removed:0,changed:0,same:0},u=[],c=[...new Set([...i.keys(),...a.keys()])];for(let m of c){let y=i.get(m),b=a.get(m);if(y&&b){let d=zn(y.value,"",{}),l=zn(b.value,"",{}),p=[];for(let v of[...new Set([...Object.keys(d),...Object.keys(l)])].sort())d[v]!==l[v]&&p.push({path:v,a:d[v]??null,b:l[v]??null});if(!p.length){s.same++;continue}s.changed++;let w=p.every(v=>v.path.includes("@child"));u.push({key:m,label:y.label,status:"changed",structural:w,fields:p.slice(0,eu),fieldCount:p.length,a:Vn(y.value),b:Vn(b.value)})}else y?(s.removed++,u.push({key:m,label:y.label,status:"only-a",fields:[],fieldCount:0,a:Vn(y.value),b:""})):(s.added++,u.push({key:m,label:b.label,status:"only-b",fields:[],fieldCount:0,a:"",b:Vn(b.value)}))}r.push({name:o,counts:s,items:u})}return r}var nu={expandedHeaderComponents:"header",extensionComponents:"ext"};function ru(t){let e=[];for(let r of Ye(t.components||[]))e.push([r,"body"]);let n=t.model||{};for(let r of Object.keys(n))if(r!=="gridModel")for(let o of Ye(n[r]))e.push([o,nu[r]||"body"]);return e}function ou(t){let e=t.model||{},n={};for(let r of["title","labelText","flexBasis","columns","orientation","readonly","required","disabled","isKeyField","hidden","enableSearch","enabledCaption","disabledCaption","status","comboBoxLabel","trueCaption","falseCaption","expanded","textHAlign","fullScreenButtonVisible"])e[r]!==void 0&&e[r]!==null&&typeof e[r]!="object"?n[r]=e[r]:r==="columns"&&Array.isArray(e[r])&&(n.navColumns=e[r].filter(o=>typeof o=="string"));return e.gridModel&&Array.isArray(e.gridModel.columns)&&(n.gridColumns=e.gridModel.columns.map(r=>r&&(r.title||r.caption||r.field)).filter(Boolean).slice(0,40)),Array.isArray(e.data)&&t.sourceTypeId==="metafx-tabstrip"&&(n.tabs=e.data.map(r=>({title:r.title||r.id,page:r.page||"",selected:!!r.selected}))),Array.isArray(e.data)&&t.sourceTypeId==="erp-radio-button"&&(n.options=e.data.map(r=>r&&(r.text||r.label||r.Val||r.value)).filter(Boolean).slice(0,8)),n}function _r(t,e,n){let r=t.model||{};return{key:e+" / "+(t.id||r.guid||"?"),id:t.id||"",type:t.sourceTypeId,slot:n||"body",label:Qi(t),binding:r.epBinding||"",props:ou(t),children:ru(t).map(([o,i])=>_r(o,e,i))}}function iu(t){if(!t)return[];let e=[];t.Layout&&e.push({key:"(layout)",caption:t.Layout.caption||"(layout)",roots:Ye(t.Layout.components||[]).map(n=>_r(n,"(layout)","body"))});for(let n of t.Pages||[]){let r=n.name||n.guid||"?";e.push({key:r,caption:n.caption||r,roots:Ye(n.components||[]).map(o=>_r(o,r,"body"))})}return e}Zi.exports={buildLayerApps:Jl,diffAppSections:tu,buildWireframe:iu,isCustomLayer:Ji,layerKey:it}});var ta=K((Td,au)=>{au.exports=`// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
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
          \${s.source === 'DB' ? '<span class="list-delta">DATA</span>' : ''}
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
      <span>\${svc.source === 'DB' ? 'Data directives' : 'Method directives'}</span>
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
`});var sa=K(aa=>{"use strict";var he=require("vscode"),{EpicorClient:Fr}=ir(),{BpmClient:na}=an(),xe=Gi(),Yn=ea(),su=ta(),{directiveToCanonicalText:cu}=St(),{describeBody:ia}=Tt(),{KineticMetaFXClient:lu}=Nr();function uu(t){let e=ia(t);return e.kind!=="flow"?{code:e.code,usings:e.usings,isFlow:!1}:{code:cu(e.xaml)||e.xaml,usings:e.usings,isFlow:!0}}function ra(t){let e=t.EfxFunction||[],n=t.EfxFunctionSignature||[],r=t.EfxLibrary||[],o={};for(let c of n){let m=`${c.LibraryID}|${c.FunctionID}`;o[m]||(o[m]={inputs:[],outputs:[]});let y={name:c.ArgumentName,type:c.DataType,order:c.Order};(c.Response?o[m].outputs:o[m].inputs).push(y)}for(let c of Object.keys(o))o[c].inputs.sort((m,y)=>m.order-y.order),o[c].outputs.sort((m,y)=>m.order-y.order);let i={},a=(c,m,y)=>{(i[c]=i[c]||{})[m]=(i[c]||{})[m]||[],i[c][m].push(y)};for(let c of t.EfxRefLibrary||[])a(c.LibraryID,"libs",c.LibraryRef);for(let c of t.EfxRefAssembly||[])a(c.LibraryID,"assemblies",c.Assembly);for(let c of t.EfxRefService||[])a(c.LibraryID,"services",c.ServiceID);for(let c of t.EfxRefTable||[])a(c.LibraryID,"tables",`${c.TableID} (${c.Updatable?"rw":"ro"})`);let s={};for(let c of r)s[c.LibraryID]=c;let u={};for(let c of e){let{code:m,usings:y,isFlow:b}=uu(c.Body);u[c.LibraryID]||(u[c.LibraryID]={}),u[c.LibraryID][c.FunctionID]={...c,_code:m,_usings:y,_isFlow:b,_sig:o[`${c.LibraryID}|${c.FunctionID}`]||{inputs:[],outputs:[]}}}return{fnMap:u,refMap:i,libDetail:s}}function du(t,e){let n={},r=!1;for(let[s,u]of[["_code","Code"],["_usings","Usings"]]){let c=t[s]||"",m=e[s]||"",y=c===m;y||(r=!0),n[u]={a:c,b:m,same:y}}for(let s of["Description","Kind","RequireTransaction","SingleRowMode","Private","Disabled"]){let u=String(t[s]??""),c=String(e[s]??""),m=u===c;m||(r=!0),n[s]={a:u,b:c,same:m}}let o=s=>(s||[]).map(u=>`${u.name}: ${u.type}`).join(", "),i=t._sig||{},a=e._sig||{};for(let[s,u]of[["Inputs","inputs"],["Outputs","outputs"]]){let c=o(i[u]),m=o(a[u]),y=c===m;y||(r=!0),n[s]={a:c,b:m,same:y,params_a:i[u]||[],params_b:a[u]||[]}}return n.hasDiff=r,n}var pu=["DirectDBAccess","AllowCustomCodeFunctions","AllowCustomCodeWidgets","Frozen","Disabled"],fu=["Description","Owner","Revision","EpicorVersion","Mode","Notes","Package","PackageVersion","Publisher","LockedBy","LockedOn","DebugMode","DumpSources","AdvTracing"];function mu(t,e,n,r){let o={},i=!1;for(let a of["libs","assemblies","services","tables"]){let s=[...t[a]||[]].sort().join(`
`),u=[...e[a]||[]].sort().join(`
`),c=s===u;c||(i=!0),o[a]={a:s,b:u,same:c}}for(let a of pu){let s=String((n||{})[a]??""),u=String((r||{})[a]??""),c=s===u;c||(i=!0),o[a]={a:s,b:u,same:c}}for(let a of fu){let s=String((n||{})[a]??""),u=String((r||{})[a]??"");o[a]={a:s,b:u,same:s===u,infoOnly:!0}}return o.hasDiff=i,o}function Gn(t){return t?{FunctionID:t.FunctionID||"",Description:t.Description||"",Kind:t.Kind,RequireTransaction:t.RequireTransaction,SingleRowMode:t.SingleRowMode,Private:t.Private,Disabled:t.Disabled,_code:t._code||"",_usings:t._usings||"",_sig:t._sig||{inputs:[],outputs:[]}}:null}function gu(t,e,n,r,o,i,a,s){let u=[...new Set([...t.map(m=>m.LibraryID),...e.map(m=>m.LibraryID),...Object.keys(n),...Object.keys(r)])].sort(),c=[];for(let m of u){let y=m in n||m in a,b=m in r||m in s,d=n[m]||{},l=r[m]||{},p=[...new Set([...Object.keys(d),...Object.keys(l)])].sort(),w=[];for(let g of p){let E=d[g],x=l[g];if(!E)w.push({fnID:g,status:"only-b",fa:null,fb:Gn(x)});else if(!x)w.push({fnID:g,status:"only-a",fa:Gn(E),fb:null});else{let C=du(E,x);w.push({fnID:g,status:C.hasDiff?"diff":"match",fa:Gn(E),fb:Gn(x),fields:C})}}let v=mu(o[m]||{},i[m]||{},a[m],s[m]),h;y?b?w.some(g=>g.status!=="match")||v.hasDiff?h="diff":h="match":h="only-a":h="only-b",c.push({libID:m,status:h,inA:y,inB:b,libDiff:v,fnDiffs:w})}return c}function Mr(t){return Array.isArray(t)?t.map(Mr):t&&typeof t=="object"?Object.keys(t).sort().reduce((e,n)=>(e[n]=Mr(t[n]),e),{}):t}function oa(t){if(!t||!t.trim())return t||"";try{return JSON.stringify(Mr(JSON.parse(t)),null,2)}catch{return t}}var pn=class t{constructor(e,n){this.panel=e,this.context=n,this.disposed=!1,e.webview.onDidReceiveMessage(async r=>{try{switch(r.command){case"ready":this._postProfiles();break;case"runCompare":await this._runFunctionsCompare(r);break;case"runBpmCompare":await this._runBpmCompare(r);break;case"runLayersCompare":await this._runLayersCompare(r);break;case"fetchLayerList":await this._fetchLayerList(r);break;case"fetchLayerContent":await this._fetchLayerContent(r);break;case"openNativeDiff":await this._openNativeDiff(r);break;case"openBpmRaw":await this._openBpmRaw(r);break;case"applyFunction":await this._applyFunction(r);break}}catch(o){this._post({command:"error",message:o.message})}}),e.onDidDispose(()=>{this.disposed=!0,t.panels.delete(t.KEY)}),e.webview.html=this.getHtml()}static show(e){let n=t.panels.get(t.KEY);if(n&&!n.disposed){n.panel.reveal();return}let r=he.window.createWebviewPanel("efxCompare","Compare",he.ViewColumn.Two,{enableScripts:!0,retainContextWhenHidden:!0});t.panels.set(t.KEY,new t(r,e))}_post(e){this.disposed||this.panel.webview.postMessage(e)}_postProfiles(){let e=he.workspace.getConfiguration().get("efx.profiles")||[],n=he.workspace.getConfiguration().get("efx.activeProfile")||"",r=he.workspace.getConfiguration().get("efx.activeCompany")||"";this._post({command:"profiles",data:e.map(o=>({name:o.name,companies:o.companies||[]})),activeProfile:n,activeCompany:r})}async _secrets(e){let n=await this.context.secrets.get(`efx.profile.${e}.password`)||"",r=await this.context.secrets.get(`efx.profile.${e}.apiKey`)||"";if(!n)throw new Error(`No password stored for profile "${e}" \u2014 open Manage Profiles and re-enter it.`);return{password:n,apiKey:r}}async _efxClient(e,n){let o=(he.workspace.getConfiguration().get("efx.profiles")||[]).find(s=>s.name===e);if(!o)throw new Error(`Profile "${e}" not found`);let{password:i,apiKey:a}=await this._secrets(e);return new Fr({serverUrl:o.serverUrl,company:n,username:o.username,password:i,apiKey:a})}async _metafxClient(e,n){let o=(he.workspace.getConfiguration().get("efx.profiles")||[]).find(s=>s.name===e);if(!o)throw new Error(`Profile "${e}" not found`);let{password:i,apiKey:a}=await this._secrets(e);return new lu({serverUrl:o.serverUrl,company:n,username:o.username,password:i,apiKey:a})}async _runFunctionsCompare({profileA:e,companyA:n,profileB:r,companyB:o}){this._post({command:"status",text:"Building clients\u2026"}),this._post({command:"compareStarted"});try{let[i,a]=await Promise.all([this._efxClient(e,n),this._efxClient(r,o)]);this._post({command:"status",text:"Fetching library lists\u2026"});let[s,u]=await Promise.all([i.getLibraryList(),a.getLibraryList()]),c=[...new Set([...s.map(C=>C.LibraryID),...u.map(C=>C.LibraryID)])];this._post({command:"status",text:`Fetching ${c.length} libraries from both environments\u2026`});let[m,y]=await Promise.all([i.request(i.getDesignerUrl("GetLibraries"),{libraryIds:c}),a.request(a.getDesignerUrl("GetLibraries"),{libraryIds:c})]);this._post({command:"status",text:"Computing diff\u2026"});for(let[C,D]of[[m,e],[y,r]])if(!C||typeof C!="object")throw new Error(`Unexpected GetLibraries response from ${D} \u2014 expected JSON, got ${typeof C}.`);let b=m.returnObj||m,d=y.returnObj||y,{fnMap:l,refMap:p,libDetail:w}=ra(b),{fnMap:v,refMap:h,libDetail:g}=ra(d),E=gu(s,u,l,v,p,h,w,g),x={match:0,diff:0,"only-a":0,"only-b":0};for(let C of E)x[C.status]=(x[C.status]||0)+1;this._post({command:"functionsReady",data:{meta:{env_a_name:e,env_b_name:r,counts:x,total:E.length},libraries:E}})}catch(i){this._post({command:"error",tab:"functions",message:i.message})}}async _runBpmCompare({profileA:e,companyA:n,profileB:r,companyB:o}){this._post({command:"status",text:"Fetching BPM services\u2026"});try{let[i,a]=await Promise.all([this._efxClient(e,n),this._efxClient(r,o)]),s=new na(i),u=new na(a),c=[],m=async(p,w)=>{let v=await p.getBpmServices(),h=6,g=new Array(v.length),E=0,x=async()=>{for(;E<v.length;){let I=E++,{SystemCode:S,ServiceKind:L,ServiceName:k}=v[I];g[I]=await p.getBpmMethodsByService(S,L,k)}};await Promise.all(Array.from({length:Math.min(h,v.length)},x));let C=[],D=[];for(let I of g){for(let S of I.methods)C.push({...S,Source:S.Source||"BO"});for(let S of I.directives)D.push({...S,Source:S.Source||"BO"})}try{let I=await p.getBpmRowsBySource("DB");for(let S of I.methods)C.push({...S,Source:"DB"});for(let S of I.directives)D.push({...S,Source:"DB"})}catch(I){c.push(`${w}: data directives not loaded \u2014 ${I.message}`)}let A=new Set;return{methods:C,directives:D.filter(I=>{let S=I.DirectiveID||xe.directiveKey(I);return A.has(S)?!1:(A.add(S),!0)})}};this._post({command:"status",text:"Fetching BPM directives from both environments\u2026"});let[y,b]=await Promise.all([m(s,e),m(u,r)]),d=xe.mixedFormatPairs(y.directives,b.directives);if(d.length){this._post({command:"status",text:`Normalizing ${d.length} directive(s) stored in different formats\u2026`});let p=0,w=0,v=async()=>{for(;p<d.length;){let{a:h,b:g}=d[p++];try{let[E,x]=await Promise.all([s.getKineticDirective(h.DirectiveID),u.getKineticDirective(g.DirectiveID)]),C=E&&xe.jsonToCanonical(E),D=x&&xe.jsonToCanonical(x);if(!C||!D){w++;continue}h._origFormat=xe.bodyFormat(h.Body),g._origFormat=xe.bodyFormat(g.Body),h._canon={format:"json",...C},g._canon={format:"json",...D},h._normalized=g._normalized=!0}catch{w++}}};await Promise.all(Array.from({length:Math.min(6,d.length)},v)),w&&c.push(`${w} directive pair(s) stored as XAML vs JSON could not be normalized \u2014 they compare as raw text and will show as different.`)}this._post({command:"status",text:"Computing BPM diff\u2026"});let l=xe.buildBpmCompare(y.methods,y.directives,b.methods,b.directives);this._bpmRawA=new Map(y.directives.map(p=>[xe.directiveKey(p),p.Body||""])),this._bpmRawB=new Map(b.directives.map(p=>[xe.directiveKey(p),p.Body||""])),l.warnings=c,this._post({command:"bpmReady",data:l})}catch(i){this._post({command:"error",tab:"bpm",message:i.message})}}async _runLayersCompare({profileA:e,companyA:n,profileB:r,companyB:o}){this._post({command:"status",text:"Fetching app list\u2026"});try{let[i,a]=await Promise.all([this._metafxClient(e,n),this._metafxClient(r,o)]),[s,u]=await Promise.all([i.listApps(),a.listApps()]),c=Yn.buildLayerApps(s,u,n===o);this._post({command:"layersReady",data:c})}catch(i){this._post({command:"error",tab:"layers",message:i.message})}}async _fetchLayerList({appId:e,profileA:n,companyA:r,profileB:o,companyB:i}){this._post({command:"layerListLoading",appId:e});try{let[a,s]=await Promise.all([this._metafxClient(n,r),this._metafxClient(o,i)]),[u,c]=await Promise.all([a.getLayers(e).then(m=>({layers:m})).catch(m=>(console.error("[layers A]",m.message),{layers:[],error:m.message})),s.getLayers(e).then(m=>({layers:m})).catch(m=>(console.error("[layers B]",m.message),{layers:[],error:m.message}))]);this._post({command:"status",text:`Layers for ${e}: ${n}=${u.error?"ERROR":u.layers.length}, ${o}=${c.error?"ERROR":c.layers.length}`}),this._post({command:"layerListReady",appId:e,layersA:u.layers,layersB:c.layers,errorA:u.error||null,errorB:c.error||null})}catch(a){this._post({command:"layerListError",appId:e,message:a.message})}}async _fetchLayerContent({appId:e,layerKey:n,layerA:r,layerB:o,profileA:i,companyA:a,profileB:s,companyB:u}){this._post({command:"layerContentLoading",appId:e,layerKey:n});try{let[c,m]=await Promise.all([this._metafxClient(i,a),this._metafxClient(s,u)]),y=(h,g,E)=>{let x=g&&(g.LayerName||g.LayerDescription);return x?h.getAppForLayer(e,x,g.DeviceType).then(C=>({raw:C})).catch(C=>(console.error(`[comparePanel] getAppForLayer ${E} failed:`,C.message),{raw:null,error:C.message})):Promise.resolve({raw:null})},[b,d]=await Promise.all([y(c,r,"A"),y(m,o,"B")]);if(b.error&&d.error)throw new Error(`Could not load layer content from either environment \u2014 ${b.error} / ${d.error}`);if(b.error||d.error){this._post({command:"layerContentError",appId:e,layerKey:n,message:`${b.error?i:s} failed: ${b.error||d.error}`});return}let l=h=>h?JSON.stringify(h,null,2):"",p=oa(l(b.raw)),w=oa(l(d.raw)),v=Yn.diffAppSections(b.raw,d.raw);(!b.raw||!d.raw)&&(v=v.map(h=>({...h,items:[]}))),this._post({command:"layerSectionsReady",appId:e,layerKey:n,sections:v,wireA:Yn.buildWireframe(b.raw),wireB:Yn.buildWireframe(d.raw)}),this._post({command:"layerContentReady",appId:e,layerKey:n,normA:p,normB:w,same:p===w})}catch(c){console.error("[comparePanel] _fetchLayerContent error:",c.message),this._post({command:"layerContentError",appId:e,layerKey:n,message:c.message})}}async _applyFunction({libraryId:e,functionId:n,direction:r,profileA:o,companyA:i,profileB:a,companyB:s}){let u=r==="aToB"?o:a,c=r==="aToB"?i:s,m=r==="aToB"?a:o,y=r==="aToB"?s:i,b=`${e}.${n}`;if(await he.window.showWarningMessage(`Apply ${b} from ${u} -> ${m}?`,{modal:!0},"Apply")!=="Apply"){this._post({command:"applyFnCancelled",libraryId:e,functionId:n});return}this._post({command:"applyFnStarted",libraryId:e,functionId:n});let l=!1,p=null;try{let[w,v]=await Promise.all([this._efxClient(u,c),this._efxClient(m,y)]);p=v,this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Reading ${b} from ${u}\u2026`});let h=await w.getLibrary(e),g=h?.EfxFunction?.find(_=>_.FunctionID===n);if(!g)throw new Error(`${b} not found on ${u}`);if(ia(g.Body).kind==="flow")throw new Error(`${b} is a widget-based function \u2014 apply only supports code-based functions.`);let{code:E,usings:x}=Fr.extractCode(g.Body);this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Checking ${m}\u2026`});let C=await p.getLibrary(e),D=C?.EfxLibrary?.[0];if(!D)throw new Error(`Library ${e} does not exist on ${m} \u2014 create it there first.`);if(!C.EfxFunction?.some(_=>_.FunctionID===n))throw new Error(`${b} does not exist on ${m} \u2014 this applies changes to existing functions, it cannot create new ones.`);if(D.Frozen===!0){if(!D.Published)throw new Error(`${e} is locked/frozen on ${m}. Unfreeze it in Epicor first.`);if(await he.window.showWarningMessage(`${e} is promoted to production on ${m}. Demote it, apply ${n}, then re-promote?`,{modal:!0},"Demote, Apply, Re-promote")!=="Demote, Apply, Re-promote"){this._post({command:"applyFnCancelled",libraryId:e,functionId:n});return}this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Demoting ${e} on ${m}\u2026`}),await p.demoteFromProduction(e),l=!0}this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Applying to ${m}\u2026`});let A=await p.validateFunctionViaWrapper(e,n,E,x,"Utilities","ApplyChangesWithDiagnostics");if(!A.saved){let _=(A.diagnostics||A.errors||[]).map(W=>typeof W=="object"&&W!==null?[W.Code,W.Message].filter(Boolean).join(": "):String(W));throw new Error(_[0]||A.outMsg||A.outResult||"Apply rejected by Epicor")}this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Verifying on ${m}\u2026`});let I=await p.getLibrary(e),S=I?.EfxFunction?.find(_=>_.FunctionID===n);if(!S)throw new Error(`Verification failed: ${b} not found on ${m} after apply.`);let L=Fr.extractCode(S.Body).code,k=_=>String(_||"").replace(/\r\n/g,`
`).trimEnd();if(k(L)!==k(E))throw new Error(`Apply reported success, but ${m} code does not match ${u}.`);let T=_=>JSON.stringify((_?.EfxFunctionSignature||[]).filter(W=>W.FunctionID===n).map(W=>[W.ArgumentName,W.DataType,!!W.Response,!!W.Optional]).sort()),N=T(h)!==T(I);this._post({command:"applyFnDone",libraryId:e,functionId:n}),N?he.window.showWarningMessage(`Applied ${b} to ${m} \u2014 but signatures still differ. Code only; edit parameters via Execute -> Edit Signatures.`):he.window.showInformationMessage(`Verified ${b} on ${m} \u2014 code matches ${u}`)}catch(w){this._post({command:"applyFnError",libraryId:e,functionId:n,message:w.message})}finally{if(l&&p)try{this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:`Re-promoting ${e}\u2026`}),await p.promoteToProduction(e),this._post({command:"applyFnStatus",libraryId:e,functionId:n,text:""})}catch(w){he.window.showErrorMessage(`${e} on ${m} could NOT be re-promoted and is still demoted \u2014 promote it manually. (${w.message})`)}}}async _openBpmRaw({keyA:e,keyB:n,name:r,labelA:o,labelB:i}){let a=e&&this._bpmRawA&&this._bpmRawA.get(e)||"",s=n&&this._bpmRawB&&this._bpmRawB.get(n)||"",u=xe.bodyFormat(a),c=xe.bodyFormat(s),m=b=>b==="json"?"json":b==="xaml"?"xml":null,y=m(u)&&(m(u)===m(c)||c==="empty")?m(u):u==="empty"&&m(c)?m(c):"txt";await this._openNativeDiff({diffId:"raw::"+(e||n),fileName:String(r||"directive").replace(/[^a-zA-Z0-9._-]/g,"_")+"."+y,labelA:o,labelB:i,contentA:xe.prettyBody(a),contentB:xe.prettyBody(s)})}async _openNativeDiff({diffId:e,fileName:n,labelA:r,labelB:o,contentA:i,contentB:a}){let s=require("os"),u=require("path"),c=require("fs"),m=require("crypto"),y=i||"",b=a||"",d=(n||"diff").replace(/[^a-zA-Z0-9._-]/g,"_"),l=m.createHash("sha1").update(`${e||""}::${n||""}`).digest("hex").slice(0,12),p=(g,E)=>{let x=String(g||"").replace(/[^a-zA-Z0-9._-]/g,"_")||E,C=u.join(s.tmpdir(),"efx-compare",l,x);return c.mkdirSync(C,{recursive:!0}),C},w=u.join(p(r,"A"),d),v=u.join(p(o,"B"),d);c.writeFileSync(w,y,"utf8"),c.writeFileSync(v,b,"utf8");let h=`${n}: ${r||"A"} vs ${o||"B"}`;await he.commands.executeCommand("vscode.diff",he.Uri.file(w),he.Uri.file(v),h)}getHtml(){return`<!DOCTYPE html>
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
      <select id="bpmSource" onchange="bpmApply()"><option value="">All sources</option><option value="BO">Method directives</option><option value="DB">Data directives</option></select>
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
${su}
</script>
</body>
</html>`}};pn.KEY="efxCompare";pn.panels=new Map;aa.ComparePanel=pn});var fa=K((Nd,pa)=>{"use strict";var ce=require("vscode"),{bodyCodeText:hu}=Tt(),Ot=null,ca=300,la=200;function bu(){Ot=null}function Pr(t){return`${t.config.serverUrl}|${t.config.company}`}function yu(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}async function vu(t){let e=await t.getLibraryList(),n=[...new Set(e.map(a=>a.LibraryID))].sort();if(!n.length)return{key:Pr(t),loadedAt:Date.now(),fns:[],libCount:0};let r=await t.request(t.getDesignerUrl("GetLibraries"),{libraryIds:n});if(!r||typeof r!="object")throw new Error(`Unexpected GetLibraries response \u2014 expected JSON, got ${typeof r}.`);let o=r.returnObj||r,i=[];for(let a of o.EfxFunction||[]){let s=hu(a.Body);s&&i.push({libraryId:a.LibraryID,functionId:a.FunctionID,description:a.Description||"",lines:String(s||"").replace(/\r\n/g,`
`).replace(/\r/g,`
`).split(`
`)})}return i.sort((a,s)=>a.libraryId.localeCompare(s.libraryId)||a.functionId.localeCompare(s.functionId)),{key:Pr(t),loadedAt:Date.now(),fns:i,libCount:n.length}}async function ua(t,e){let n=Pr(t);return!e&&Ot&&Ot.key===n||(Ot=await ce.window.withProgress({location:ce.ProgressLocation.Notification,title:"EFx: Indexing function library\u2026"},()=>vu(t))),Ot}function wu(t,e){let n=e.regex?t:yu(t);return e.word&&(n=`\\b${n}\\b`),new RegExp(n,e.caseSensitive?"g":"gi")}function da(t,e){t.lastIndex=0;let n=t.exec(e);return n&&n[0].length>0?n:null}function Eu(t,e,n){let r=t.length-t.replace(/^\s+/,"").length,o=t.slice(r),i=e-r;if(o.length>la){let a=Math.max(0,i-30);o=(a>0?"\u2026":"")+o.slice(a,a+la),i=i-a+(a>0?1:0)}return{text:o,start:i,end:i+n}}function xu(t,e,n,r){let o=wu(e,n),i=[],a=0;for(let s of t.fns)if(!(r&&s.libraryId!==r)){da(o,s.functionId)&&(a++,i.length<ca&&i.push({fn:s,line:0,col:0,len:0,kind:"name"}));for(let u=0;u<s.lines.length;u++){let c=da(o,s.lines[u]);c&&(a++,i.length<ca&&i.push({fn:s,line:u+1,col:c.index,len:c[0].length,kind:"code"}))}}return{hits:i,total:a}}function Du(t,e){let n=t.hits.map(r=>r.kind==="name"?{label:`$(symbol-function) ${r.fn.functionId}`,description:`${r.fn.libraryId} \u2014 function name`,detail:r.fn.description||void 0,alwaysShow:!0,hit:r}:{label:Eu(r.fn.lines[r.line-1],r.col,r.len).text||"(blank line)",description:`${r.fn.libraryId}.${r.fn.functionId}:${r.line}`,alwaysShow:!0,hit:r});return t.total>t.hits.length&&n.push({label:`$(ellipsis) ${t.total-t.hits.length} more matches not shown`,description:`narrow the search \u2014 showing the first ${t.hits.length} of ${t.total}`,alwaysShow:!0}),n.length||n.push({label:"$(search-stop) No matches",description:`searched ${e.fns.length} functions`,alwaysShow:!0}),n}function Cu(t){let e=Math.min(t.lineCount,12);for(let n=0;n<e;n++){let r=t.lineAt(n).text;if(/^\/\/\s*(-{10,}|─{10,})/.test(r))return n+2;if(!r.startsWith("//")&&r.trim()!=="")break}return 0}function Au(t,e){if(e.kind!=="code")return 0;let n=e.fn.lines[e.line-1],r=Cu(t)+e.line-1;if(r<t.lineCount&&t.lineAt(r).text===n)return r;for(let o=0;o<t.lineCount;o++)if(t.lineAt(o).text===n)return o;return Math.min(Math.max(r,0),Math.max(t.lineCount-1,0))}async function ku(t){let{libraryId:e,functionId:n}=t.fn;await ce.commands.executeCommand("efx.pullFunction",{libraryId:e,func:{FunctionID:n},signatures:[]});let r=ce.window.activeTextEditor;if(!r||!r.document.fileName.endsWith(`${n}.cs`))return;let o=Au(r.document,t),i=r.document.lineAt(o).text.length,a=t.kind==="code"?Math.min(t.col,i):0,s=t.kind==="code"?Math.min(t.col+t.len,i):0,u=new ce.Range(o,a,o,s);r.selection=new ce.Selection(u.start,u.end),r.revealRange(u,ce.TextEditorRevealType.InCenter)}var Ge={case:{iconPath:new ce.ThemeIcon("case-sensitive"),tooltip:"Toggle Match Case"},word:{iconPath:new ce.ThemeIcon("whole-word"),tooltip:"Toggle Match Whole Word"},regex:{iconPath:new ce.ThemeIcon("regex"),tooltip:"Toggle Use Regular Expression"},reload:{iconPath:new ce.ThemeIcon("refresh"),tooltip:"Re-index the function library"}};function Su(t){let e=Math.round((Date.now()-t)/1e3);if(e<60)return"just now";let n=Math.round(e/60);return n<60?`${n}m ago`:`${Math.round(n/60)}h ago`}async function Tu(t,e={}){if(!t){ce.window.showWarningMessage("EFx: Configure connection first (gear icon)");return}let n;try{n=await ua(t,!1)}catch(b){ce.window.showErrorMessage(`EFx Find: could not index the library: ${b.message}`);return}let r=e.libraryId||null,o={caseSensitive:!1,word:!1,regex:!1},i=ce.window.createQuickPick();i.buttons=[Ge.case,Ge.word,Ge.regex,Ge.reload],i.matchOnDescription=!1,i.matchOnDetail=!1,i.ignoreFocusOut=!1;let a=b=>o[b]?"on":"off",s=b=>{let d=r?`in ${r}`:"in all libraries";i.title=`Find in Functions \u2014 ${d}  \xB7  Aa ${a("case")}  \xB7  ab ${a("word")}  \xB7  .* ${a("regex")}${b?`  \xB7  ${b}`:""}`},u=()=>{let b=r?n.fns.filter(d=>d.libraryId===r).length:n.fns.length;i.placeholder=`Search ${b} function${b===1?"":"s"} \xB7 ${t.config.company} \xB7 indexed ${Su(n.loadedAt)}`},c=()=>{let b=i.value;if(!b){i.items=[],s();return}try{let d=xu(n,b,o,r);i.items=Du(d,n),s(`${d.total} match${d.total===1?"":"es"}`)}catch(d){i.items=[{label:"$(error) Invalid regular expression",description:d.message,alwaysShow:!0}],s()}};i.onDidChangeValue(c),i.onDidTriggerButton(async b=>{if(b===Ge.reload){i.busy=!0;try{n=await ua(t,!0)}catch(d){ce.window.showErrorMessage(`EFx Find: re-index failed: ${d.message}`)}i.busy=!1,u()}else b===Ge.case?o.caseSensitive=!o.caseSensitive:b===Ge.word?o.word=!o.word:b===Ge.regex&&(o.regex=!o.regex);c()}),i.onDidAccept(async()=>{let b=i.selectedItems[0];if(!(!b||!b.hit)){i.hide();try{await ku(b.hit)}catch(d){ce.window.showErrorMessage(`EFx Find: could not open ${b.hit.fn.functionId}: ${d.message}`)}}}),i.onDidHide(()=>i.dispose());let m=ce.window.activeTextEditor?.selection,y=m&&!m.isEmpty&&m.isSingleLine?ce.window.activeTextEditor.document.getText(m).trim():"";y&&(i.value=y),u(),c(),i.show()}pa.exports={openFunctionSearch:Tu,clearSearchCache:bu}});var Iu=exports&&exports.__createBinding||(Object.create?(function(t,e,n,r){r===void 0&&(r=n);var o=Object.getOwnPropertyDescriptor(e,n);(!o||("get"in o?!e.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,o)}):(function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]})),Nu=exports&&exports.__setModuleDefault||(Object.create?(function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}):function(t,e){t.default=e}),Vr=exports&&exports.__importStar||(function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r[r.length]=o);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),o=0;o<r.length;o++)r[o]!=="default"&&Iu(n,e,r[o]);return Nu(n,e),n}})();Object.defineProperty(exports,"__esModule",{value:!0});exports.activate=zu;exports.deactivate=od;var f=Vr(require("vscode")),X=Vr(require("path")),re=Vr(require("fs")),Ke=ir(),Bu=bi(),Lu=yi(),qe=an(),Rr=xi(),{openBpmWidgetPanel:Ou,createBpmHost:$u,typeLabelOf:_u}=Ti(),{openEfxWidgetPanel:ma,createEfxHost:wa}=Li(),{pushNodeCode:Ea}=Rn(),$t=Tt(),ga=Pi(),Fu=Nr(),{ComparePanel:Mu}=sa(),{openFunctionSearch:ha,clearSearchCache:Jn}=fa(),fn=new Map,pe=new Map,Hr=new Set,B=null,J=null,xa=null,U,Je,Zn=null,er=null,Ur=null;function Z(t){return String(t||"").toLowerCase()}function Wr(t){return JSON.stringify(String(t))}function Mt(t,e,n,r){let o=0,i=!1,a=!1;for(let s=e;s<t.length;s++){let u=t[s];if(i){a?a=!1:u==="\\"?a=!0:u==='"'&&(i=!1);continue}if(u==='"'){i=!0;continue}if(u===n)o++;else if(u===r&&(o--,o===0))return s}return-1}function Pu(t,e,n){let o=t.indexOf('"EfxFunction"');if(o<0)throw new Error("EfxFunction array not found in raw tableset");let i=t.indexOf("[",o);if(i<0)throw new Error("EfxFunction array start not found in raw tableset");let a=Mt(t,i,"[","]");if(a<0)throw new Error("EfxFunction array end not found in raw tableset");let s='"LibraryID":'+Wr(e),u='"FunctionID":'+Wr(n),c=i+1;for(;c<a;){let m=t.indexOf("{",c);if(m<0||m>a)break;let y=Mt(t,m,"{","}");if(y<0||y>a)throw new Error("Malformed EfxFunction row object in raw tableset");let b=t.slice(m,y+1);if(b.includes(s)&&b.includes(u))return{start:m,end:y+1,row:b};c=y+1}throw new Error(`EfxFunction row not found in raw tableset for ${e}.${n}`)}function zr(t,e,n){let r='"'+e+'":',o=t.indexOf(r);if(o<0)throw new Error(`${e} property not found in target EfxFunction row`);let i=o+r.length;for(;/\s/.test(t[i]||"");)i++;if(t[i]!=='"')throw new Error(`${e} is not a JSON string in target EfxFunction row`);let a=i+1,s=!1;for(;a<t.length;a++){let u=t[a];if(s){s=!1;continue}if(u==="\\"){s=!0;continue}if(u==='"')break}if(a>=t.length)throw new Error(`${e} string did not terminate in target EfxFunction row`);return t.slice(0,i)+n+t.slice(a+1)}function Ru(t,e,n){let r=Pu(t,e,n),o=zr(r.row,"RowMod",JSON.stringify("D"));if(o===r.row)throw new Error(`Target EfxFunction row did not change for ${e}.${n}`);let i=t.slice(0,r.start)+o+t.slice(r.end);return JSON.parse(i),i}function Kn(t,e,n){let r=`"${e}":[`,o=t.indexOf(r);if(o===-1)throw new Error(`Array "${e}" not found in raw tableset`);let i=t.indexOf("[",o),a=Mt(t,i,"[","]");if(a<0)throw new Error(`Could not find end of "${e}" array`);let u=t.substring(i+1,a).trim().length>0?",":"";return t.substring(0,a)+u+n+t.substring(a)}function Uu(t,e){let r=t.indexOf('"EfxRefTable"');if(r<0)throw new Error("EfxRefTable array not found in raw tableset");let o=t.indexOf("[",r);if(o<0)throw new Error("EfxRefTable array start not found in raw tableset");let i=Mt(t,o,"[","]");if(i<0)throw new Error("EfxRefTable array end not found in raw tableset");let a='"TableID":'+Wr(e),s=o+1;for(;s<i;){let u=t.indexOf("{",s);if(u<0||u>i)break;let c=Mt(t,u,"{","}");if(c<0||c>i)throw new Error("Malformed EfxRefTable row object in raw tableset");let m=t.slice(u,c+1);if(m.includes(a))return{start:u,end:c+1,row:m};s=c+1}throw new Error(`EfxRefTable row not found in raw tableset for ${e}`)}function qu(t,e){let n=t.indexOf('"EfxLibrary":[');if(n<0)throw new Error("EfxLibrary array not found in raw tableset");let r=t.indexOf("[",n),o=t.indexOf("{",r);if(o<0)throw new Error("No EfxLibrary row found in raw tableset");let i=Mt(t,o,"{","}"),a=t.slice(o,i+1),s=zr(a,"RowMod",JSON.stringify(e));return t.slice(0,o)+s+t.slice(i+1)}function ju(t,e,n){let r='"'+e+'":',o=t.indexOf(r);if(o<0)throw new Error(`${e} not found in object`);let i=o+r.length;for(;/\s/.test(t[i]||"");)i++;let a=t.startsWith("true",i),s=t.startsWith("false",i);if(!a&&!s)throw new Error(`${e} is not a boolean in object`);let u=i+(a?4:5);return t.slice(0,i)+String(n)+t.slice(u)}function Hu(t,e,n){let r=Uu(t,e),o=ju(r.row,"Updatable",n);o=zr(o,"RowMod",JSON.stringify("U"));let i=t.slice(0,r.start)+o+t.slice(r.end);return i=qu(i,"U"),JSON.parse(i),i}async function ba(t){let e=Z(t),n=f.workspace.textDocuments.find(r=>r.uri&&Z(r.uri.fsPath)===e);if(n&&n.isDirty){Hr.add(e);try{if(!await n.save())throw new Error(`Could not save ${t}`)}finally{Hr.delete(e)}}}function ya(t){return t===1?f.DiagnosticSeverity.Warning:t===0?f.DiagnosticSeverity.Hint:f.DiagnosticSeverity.Error}function Wu(t){return mn(t).content}function mn(t){let e=t.split(/\r?\n/);if(!/^\/\/ (EFx Function|BPM Directive):/.test(e[0]||""))return{content:t,lineOffset:0};let n=c=>c.startsWith("// \u2500\u2500\u2500\u2500\u2500")||c.startsWith("// -----"),r=-1;for(let c=0;c<e.length;c++){if(n(e[c])){r=c;break}if(!e[c].startsWith("//")&&e[c].trim()!=="")break}if(r<0)return{content:t,lineOffset:0};let o=e[r],i=o.indexOf("// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),a=o.indexOf("// --------------------------------------------------"),s="";i>=0?s=o.slice(i+40).trimStart():a>=0&&(s=o.slice(a+53).trimStart());let u=e.slice(r+1);return s?{content:[s,...u].join(`
`),lineOffset:r}:{content:u.join(`
`),lineOffset:r+1}}function _t(t){return String(t||"").replace(/\r\n/g,`
`).replace(/\r/g,`
`)}function Vu(t){return!t||t.length===0?"":t.map((e,n)=>{let r=e.ErrorLevel!==void 0?`Level ${e.ErrorLevel}`:"Error",o=e.ErrorType?` (${e.ErrorType})`:"",i=e.TableName?`
Table: ${e.TableName}`:"",a=e.ErrorText||e.Message||JSON.stringify(e);return`${n+1}. ${r}${o}${i}
${a}`}).join(`

`)}function zu(t){xa=t,U=new Bu.EfxTreeProvider(null),Zn=f.window.createTreeView("efxLibraries",{treeDataProvider:U}),t.subscriptions.push(Zn),Je=new Rr.BpmTreeProvider(null),er=f.window.createTreeView("bpmMethods",{treeDataProvider:Je}),t.subscriptions.push(er),Ur=new Lu.ExecuteViewProvider,t.subscriptions.push(f.window.registerWebviewViewProvider("efxExecuteView",Ur,{webviewOptions:{retainContextWhenHidden:!0}})),rd(t).then(()=>nr()),ga.registerUpdateCommand(t),ga.checkForUpdatesOnStartup(t);let e=async()=>{await Da(t)};t.subscriptions.push(f.commands.registerCommand("efx.manageProfiles",e)),t.subscriptions.push(f.commands.registerCommand("efx.configureConnection",e)),t.subscriptions.push(f.commands.registerCommand("efx.switchProfile",async()=>{await Zu(t)})),t.subscriptions.push(f.commands.registerCommand("efx.switchCompany",async()=>{await ed(t)})),t.subscriptions.push(f.commands.registerCommand("efx.changeStorageLocation",async()=>{await f.workspace.getConfiguration("efx").update("storageLocation","",f.ConfigurationTarget.Global);let d=await Sa();d&&f.window.showInformationMessage(`EFx: Storage location changed to ${d}`)})),t.subscriptions.push(f.commands.registerCommand("efx.refreshLibraries",async()=>{if(!B){f.window.showWarningMessage("EFx: Configure connection first");return}Jn(),await U.refresh()})),t.subscriptions.push(f.commands.registerCommand("efx.pullFunction",async d=>{if(!B||!d)return;let l=d.libraryId,p=d.func.FunctionID;await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Pulling ${p}...`},async()=>{try{U.invalidateCache(l);let w=await U.getLibraryTableset(l);if(!w)return;fn.set(l,w);let v=w.EfxFunction.find(L=>L.FunctionID===p);if(!v){f.window.showErrorMessage(`Function ${p} not found`);return}let h=$t.describeBody(v.Body);if(h.unparsedFlow){f.window.showErrorMessage(`EFx: ${p} has a widget body this extension can't read. Run "EFx: DEV: Dump Function Bodies" for ${l} and share the output \u2014 pulling it as C# would corrupt the function.`);return}if(h.kind==="flow"&&!h.flow.onlyCustomCode){await ma(t,B,l,p,v.Body);return}let g=h.kind==="flow"?h.flow.codeNodes[0].id:null,E=g?h.flow.codeNodes[0].code:h.code,x=h.usings,C=await qr();if(!C){f.window.showWarningMessage("EFx: Storage location not set \u2014 pull cancelled.");return}let D=X.join(C,l);re.mkdirSync(D,{recursive:!0});let A=X.join(D,`${p}.cs`),I=[`// EFx Function: ${l}.${p}`,`// Pulled: ${new Date().toISOString()}`,x?`// Usings: ${x}`:"",g?`// Widget: ${g}`:"","// --------------------------------------------------",""].filter(L=>L!=="").join(`
`);re.writeFileSync(A,I.replace(/\s*$/,"")+`

`+E,"utf-8"),pe.set(Z(A),{libraryId:l,functionId:p,widgetNodeId:g});let S=await f.workspace.openTextDocument(A);await f.window.showTextDocument(S,f.ViewColumn.One),f.window.showInformationMessage(`EFx: Pulled ${l}.${p}`)}catch(w){f.window.showErrorMessage(`EFx Pull failed: ${w.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.pullLibrary",async d=>{if(!B||!d?.library)return;let l=d.library.LibraryID,p=await qr();if(!p){f.window.showWarningMessage("EFx: Storage location not set \u2014 pull cancelled.");return}let w=X.join(p,l),v="// --------------------------------------------------",h=S=>{let L=String(S).replace(/\r\n/g,`
`),k=L.indexOf(v);return(k>=0?L.slice(L.indexOf(`
`,k)+1):L).trim()},g=[],E=[];try{await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Pulling ${l}...`},async()=>{U.invalidateCache(l);let S=await U.getLibraryTableset(l);if(!S)throw new Error(`Library ${l} not found`);fn.set(l,S);let{directiveToCanonicalText:L}=St(),k=new Date().toISOString();for(let T of S.EfxFunction||[]){let N=T.FunctionID,_=$t.describeBody(T.Body);if(_.unparsedFlow){E.push(`${N} (widget body this extension can't read)`);continue}if(_.kind==="flow"&&!_.flow.onlyCustomCode){let V=[`// EFx Function: ${l}.${N}`,`// Pulled: ${k}`,"// Widget flow \u2014 read-only view; edit in the widget panel",v,""].join(`
`);g.push({functionId:N,file:`${N}.widgets.txt`,pushable:!1,content:V+`
`+(L(_.xaml)||_.xaml)});continue}let W=_.kind==="flow"?_.flow.codeNodes[0].id:null,ne=W?_.flow.codeNodes[0].code:_.code,se=_.usings,$=[`// EFx Function: ${l}.${N}`,`// Pulled: ${k}`,se?`// Usings: ${se}`:"",W?`// Widget: ${W}`:"",v,""].filter(V=>V!=="").join(`
`);g.push({functionId:N,file:`${N}.cs`,pushable:!0,widgetNodeId:W,content:$.replace(/\s*$/,"")+`

`+ne})}})}catch(S){f.window.showErrorMessage(`EFx Pull failed: ${S.message}`);return}let x=new Set(f.workspace.textDocuments.filter(S=>S.isDirty).map(S=>Z(S.uri.fsPath))),C=g.filter(S=>x.has(Z(X.join(w,S.file))));g=g.filter(S=>!C.includes(S));for(let S of C)E.push(`${S.functionId} (open with unsaved changes)`);let D=g.filter(S=>{let L=X.join(w,S.file);if(!re.existsSync(L))return!1;try{return h(re.readFileSync(L,"utf-8"))!==h(S.content)}catch{return!1}});if(D.length){let S=await f.window.showWarningMessage(`${D.length} local file(s) in ${l} differ from Epicor (unpushed edits?): ${D.map(L=>L.functionId).join(", ")}`,{modal:!0},"Overwrite","Keep Local Copies");if(!S)return;if(S==="Keep Local Copies"){g=g.filter(L=>!D.includes(L));for(let L of D)E.push(`${L.functionId} (kept local copy)`)}}re.mkdirSync(w,{recursive:!0});for(let S of g){let L=X.join(w,S.file);re.writeFileSync(L,S.content,"utf-8"),S.pushable&&pe.set(Z(L),{libraryId:l,functionId:S.functionId,widgetNodeId:S.widgetNodeId})}let A=`EFx: Pulled ${g.length} function(s) from ${l}`+(E.length?` \u2014 skipped ${E.length}: ${E.join("; ")}`:""),I=await(E.length?f.window.showWarningMessage:f.window.showInformationMessage)(A,"Reveal in Finder","Copy Path");I==="Reveal in Finder"?await f.commands.executeCommand("revealFileInOS",f.Uri.file(w)):I==="Copy Path"&&await f.env.clipboard.writeText(w)})),t.subscriptions.push(f.commands.registerCommand("efx.pushFunction",async(d,l=!1)=>{if(!B)return;let p,w,v;if(d){p=d.libraryId,w=d.func.FunctionID;let h=await qr();if(!h){f.window.showWarningMessage("EFx: Storage location not set \u2014 push cancelled.");return}v=X.join(h,p,`${w}.cs`)}else{let h=f.window.activeTextEditor;if(!h){f.window.showWarningMessage("EFx: No active file to push");return}v=h.document.uri.fsPath;let g=await Ft(v);if(!g){f.window.showWarningMessage("EFx: This file is not a pulled EFx function");return}if(g.isWidgetCode){await jr(v,g);return}p=g.libraryId,w=g.functionId}if(!v||!re.existsSync(v)){f.window.showErrorMessage("EFx: File not found. Pull the function first.");return}!l&&await f.window.showWarningMessage(`Push ${w} to ${p}?`,{modal:!0},"Push")!=="Push"||await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Pushing ${w}...`},async()=>{try{await ba(v);let h=U.libraryCache.get(p)||await B.getLibrary(p),g=h.EfxLibrary&&h.EfxLibrary[0];if(!g)throw new Error(`Library ${p} not found on server`);if(g.Frozen===!0){let ne=g.Published?`${p} is promoted to production \u2014 demote it first (right-click the library \u2192 Demote from Production).`:`${p} is locked/frozen in Epicor. Unfreeze it before editing.`;throw new Error(ne)}let E=mn(re.readFileSync(v,"utf-8")),x=E.content,C=E.lineOffset,D=h.EfxFunction.find(ne=>ne.FunctionID===w);if(!D)throw new Error(`Function ${w} not found on server`);let A=$t.describeBody(D.Body);if(A.unparsedFlow)throw new Error(`${w} has a widget body this extension can't read \u2014 refusing to overwrite it with C#.`);if(A.kind==="flow"){let se=(await Ft(v))?.widgetNodeId||(A.flow.codeNodes.length===1?A.flow.codeNodes[0].id:null);if(!se)throw new Error(`${w} has ${A.flow.codeNodes.length} custom-code widgets \u2014 edit them from the widget graph.`);let $=wa(B,p,w,D.Body);await Ea($,se,x);let fe=(await B.getLibrary(p)).EfxFunction.find(Pt=>Pt.FunctionID===w),me=$t.describeBody(fe?.Body).flow?.codeNodes.find(Pt=>Pt.id===se);if(!me||_t(me.code)!==_t(x))throw new Error("EFx Push verification failed: server widget code does not match editor text.");r.set(f.Uri.file(v),[]),f.window.showInformationMessage(`EFx: Verified save of ${p}.${w} (widget ${se})`),U.invalidateCache(p),Jn();return}let I=Ke.EpicorClient.extractCode(D.Body),S=await B.validateFunctionViaWrapper(p,w,x,I.usings,"Utilities","ApplyChangesWithDiagnostics"),L=f.Uri.file(v);if(!S.saved){let ne=S.diagnostics||S.errors||[];if(ne.length>0){let se=ne.map($=>{if(typeof $=="object"&&$!==null){let V=Math.max(0,($.Line??1)-1)+C,fe=Math.max(0,($.Column??1)-1),me=[$.Code,$.Message].filter(Boolean).join(": ")||String($);return new f.Diagnostic(new f.Range(V,fe,V,fe+1),me,f.DiagnosticSeverity.Error)}return new f.Diagnostic(new f.Range(0,0,0,1),String($),f.DiagnosticSeverity.Error)});r.set(L,se)}throw new Error(S.errors?.[0]||S.outMsg||S.outResult||"Wrapper save failed")}let T=(await B.getLibrary(p)).EfxFunction.find(ne=>ne.FunctionID===w);if(!T)throw new Error(`Verification failed: ${p}.${w} not found after save`);let N=Ke.EpicorClient.extractCode(T.Body).code;if(_t(N)!==_t(x))throw new Error("EFx Push verification failed: wrapper returned success, but server Body does not match editor text.");r.set(L,[]),f.window.showInformationMessage(`EFx: Verified save of ${p}.${w}`);let W=fn.get(p)?.EfxFunction?.find(ne=>ne.FunctionID===w);W&&S.newBody&&(W.Body=S.newBody),U.invalidateCache(p),Jn()}catch(h){console.error("EFx Push failed:",h),f.window.showErrorMessage(`EFx Push failed: ${h.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.regenerateLibrary",async d=>{if(!B){f.window.showWarningMessage("EFx: Configure connection first");return}let l;if(d?.library?.LibraryID)l=d.library.LibraryID;else if(d?.libraryId)l=d.libraryId;else{let p=f.window.activeTextEditor;if(p){let w=pe.get(Z(p.document.uri.fsPath));w&&!w.isBpm&&(l=w.libraryId)}}l||(l=await f.window.showInputBox({prompt:"Library ID to regenerate / validate",placeHolder:"e.g. PimberlyFuncts"})),l&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Validating ${l}...`},async()=>{try{let w=(await B.regenerateLibrary(l)).errors||[];if(w.length===0){f.window.showInformationMessage(`EFx: ${l} validated with no reported errors`);return}let v=Vu(w),h=await f.workspace.openTextDocument({language:"markdown",content:`# EFx Validation Errors: ${l}

\`\`\`text
${v}
\`\`\`
`});await f.window.showTextDocument(h,f.ViewColumn.Two),f.window.showWarningMessage(`EFx: ${l} has ${w.length} validation error(s)`)}catch(p){f.window.showErrorMessage(`EFx Validate failed: ${p.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.executeFunction",async d=>{if(!B||!d)return;let l=gn(),p=l?l.companies||[]:[],w=st()||p[0]||"",v=(U.libraries||[]).find(g=>g.LibraryID===d.libraryId),h=v?!v.Published:!1;await Ur.load(B,d.libraryId,d.func.FunctionID,d.signatures,p,w,U,h)})),t.subscriptions.push(f.commands.registerCommand("efx.demoteLibrary",async d=>{if(!(!B||!d||await f.window.showWarningMessage(`Demote ${d.library.LibraryID} from production?`,{modal:!0},"Demote")!=="Demote"))try{await B.demoteFromProduction(d.library.LibraryID),f.window.showInformationMessage(`EFx: Demoted ${d.library.LibraryID}`),await U.refresh()}catch(p){f.window.showErrorMessage(`EFx Demote failed: ${p.message}`)}})),t.subscriptions.push(f.commands.registerCommand("efx.promoteLibrary",async d=>{if(!(!B||!d||await f.window.showWarningMessage(`Promote ${d.library.LibraryID} to production?`,{modal:!0},"Promote")!=="Promote"))try{await B.promoteToProduction(d.library.LibraryID),f.window.showInformationMessage(`EFx: Promoted ${d.library.LibraryID}`),await U.refresh()}catch(p){f.window.showErrorMessage(`EFx Promote failed: ${p.message}`)}})),t.subscriptions.push(f.commands.registerCommand("efx.newFunction",async d=>{if(!B){f.window.showWarningMessage("EFx: Configure connection first");return}let l;if(d&&d.library?l=d.library.LibraryID:d&&d.libraryId?l=d.libraryId:l=await f.window.showInputBox({prompt:"Library ID to add the function to",placeHolder:"e.g. PaintLineFuncts"}),!l)return;let p=await f.window.showInputBox({prompt:"New Function ID",placeHolder:"e.g. MyNewFunction",validateInput:A=>!A||A.trim().length===0?"Function ID is required":/\s/.test(A)?"Function ID cannot contain spaces":null});if(!p)return;let w=await f.window.showInputBox({prompt:"Description (optional)",placeHolder:"Short description of the function"}),v=["string","int","decimal","bool","DateTime","System.Data.DataSet","System.Data.DataTable","Custom\u2026"];async function h(A){let I=[];for(;;){let S=await f.window.showInputBox({prompt:`${A} param name (leave blank to finish)`,placeHolder:"e.g. partNum",ignoreFocusOut:!0});if(!S)break;let L=await f.window.showQuickPick(v.map(T=>({label:T})),{placeHolder:`Data type for "${S}"`,ignoreFocusOut:!0});if(!L)break;let k=L.label;if(k==="Custom\u2026"){let T=await f.window.showInputBox({prompt:"Enter full .NET type name",placeHolder:"e.g. Erp.Tablesets.SalesOrderTableset",ignoreFocusOut:!0});if(!T)break;k=T}I.push({ArgumentName:S,DataType:k})}return I}let E=(await f.window.showQuickPick([{label:"Skip \u2014 add later",value:!1},{label:"Add request params now",value:!0}],{placeHolder:"Add request parameters?",ignoreFocusOut:!0}))?.value?await h("Request"):[],C=(await f.window.showQuickPick([{label:"Skip \u2014 add later",value:!1},{label:"Add response params now",value:!0}],{placeHolder:"Add response parameters?",ignoreFocusOut:!0}))?.value?await h("Response"):[],D=[...E.map((A,I)=>({...A,Response:!1,Order:I})),...C.map((A,I)=>({...A,Response:!0,Order:I}))];await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Creating ${p}...`},async()=>{try{let A=await B.getLibraryRaw(l),I=JSON.stringify({Code:`// New function\r
`,Usings:""}),L=JSON.stringify({LibraryID:l,FunctionID:p,Description:w||null,Kind:2,RequireTransaction:!1,SingleRowMode:!1,Private:!1,Disabled:!1,Invalid:!1,Thumbnail:null,Body:I,Notes:null,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",BitFlag:0,RowMod:"A"}),k=A.indexOf('"EfxFunction":[');if(k===-1){f.window.showErrorMessage("EFx: Could not find EfxFunction array in tableset");return}let T=A.indexOf("[",k),N=0,_=-1;for(let $=T;$<A.length;$++){let V=A[$];if(V==='"'){for($++;$<A.length;){if(A[$]==="\\")$++;else if(A[$]==='"')break;$++}continue}if(V==="["&&N++,V==="]"&&(N--,N===0)){_=$;break}}if(_===-1){f.window.showErrorMessage("EFx: Could not parse EfxFunction array");return}let ne=A.substring(T+1,_).trim().length>0?",":"";A=A.substring(0,_)+ne+L+A.substring(_);let se=await B.applyChangesRaw(A);if(se.diagnostics&&se.diagnostics.length>0){let $=se.diagnostics.join(`
`);f.window.showWarningMessage(`EFx: ${p} created with diagnostics:
${$}`)}else f.window.showInformationMessage(`EFx: Created ${l}.${p} \u2713`);if(D.length>0){let $=!1,V=null;for(let fe=0;fe<4;fe++){fe>0&&await new Promise(me=>setTimeout(me,800*fe));try{await B.saveSignatures(l,p,D),$=!0;break}catch(me){V=me}}$?f.window.showInformationMessage(`EFx: Saved ${D.length} parameter(s) for ${p} \u2713`):f.window.showWarningMessage(`EFx: Function created but signatures failed: ${V?.message}. Add them via \u2699 Edit Signatures in the Execute panel.`)}U.invalidateCache(l),await U.refresh()}catch(A){f.window.showErrorMessage(`EFx: Create function failed: ${A.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.deleteFunction",async d=>{if(!B){f.window.showWarningMessage("EFx: Configure connection first");return}if(!d){f.window.showWarningMessage("EFx: Delete must be invoked from a function in the tree.");return}let l=d.libraryId,p=d.func&&d.func.FunctionID;if(!l||!p){f.window.showErrorMessage("EFx: Could not determine library/function from selection.");return}await f.window.showWarningMessage(`Delete function "${p}" from library "${l}"? This cannot be undone.`,{modal:!0},"Delete")==="Delete"&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Deleting ${p}...`},async()=>{try{let v=await B.getLibrary(l),h=v&&v.EfxLibrary&&v.EfxLibrary[0];if(!h)throw new Error(`Library ${l} not found on server`);if(h.Frozen===!0){let A=h.Published?`${l} is promoted to production \u2014 demote it first (right-click the library \u2192 Demote from Production).`:`${l} is locked/frozen in Epicor. Unfreeze it before deleting functions.`;throw new Error(A)}let g=await B.getLibraryRaw(l),E=Ru(g,l,p),C=(await B.applyChangesRaw(E)).diagnostics||[];if(C.some(A=>typeof A=="object"?(A.Severity??2)>=2:/\berror\b/i.test(String(A)))){let A=C.map(I=>typeof I=="object"?I.ErrorText||JSON.stringify(I):String(I)).join(`
`);throw new Error(`Server rejected delete:
${A}`)}fn.delete(l);for(let[A,I]of pe.entries())I&&I.libraryId===l&&I.functionId===p&&pe.delete(A);U.invalidateCache(l),await U.refresh(),f.window.showInformationMessage(`EFx: Deleted ${l}.${p} \u2713 (local .cs file, if any, was left in place)`)}catch(v){f.window.showErrorMessage(`EFx: Delete function failed: ${v.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.newLibrary",async()=>{if(!B){f.window.showWarningMessage("EFx: Configure connection first");return}let d=await f.window.showInputBox({prompt:"New Library ID",placeHolder:"e.g. MyNewLibrary",validateInput:p=>!p||p.trim().length===0?"Library ID is required":/\s/.test(p)?"Library ID cannot contain spaces":null});if(!d)return;let l=await f.window.showInputBox({prompt:"Description (optional)",placeHolder:"Short description of the library"});await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Creating library ${d}...`},async()=>{try{let p=await B.getDefaultsRaw();p=p.replace(/"LibraryID":"@library"/g,`"LibraryID":"${d}"`),p=p.replace(/"OriginalID":"@library"/,`"OriginalID":"${d}"`),p=p.replace(/"FunctionID":"@function"/,'"FunctionID":"__placeholder__"'),l&&(p=p.replace(/"Description":null/,`"Description":"${l}"`)),p=p.replace(/("OriginalID":"[^"]*"[^}]*"RowMod":")(")/,"$1A$2"),p=p.replace('"AllowCustomCodeFunctions":false','"AllowCustomCodeFunctions":true'),p=p.replace('"DirectDBAccess":0','"DirectDBAccess":2');let w=p.indexOf('"EfxFunction":[');if(w!==-1){let h=p.indexOf("[",w),g=0,E=-1;for(let x=h;x<p.length;x++){let C=p[x];if(C==='"'){for(x++;x<p.length;){if(p[x]==="\\")x++;else if(p[x]==='"')break;x++}continue}if(C==="["&&g++,C==="]"&&(g--,g===0)){E=x;break}}E!==-1&&(p=p.substring(0,h)+"[]"+p.substring(E+1))}let v=await B.applyChangesRaw(p);if(v.diagnostics&&v.diagnostics.length>0){let h=v.diagnostics.join(`
`);f.window.showWarningMessage(`EFx: Library ${d} created with diagnostics:
${h}`)}else f.window.showInformationMessage(`EFx: Created library ${d} \u2713`);await U.refresh()}catch(p){f.window.showErrorMessage(`EFx: Create library failed: ${p.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.addTable",async d=>{if(!B||!d)return;let l=d.libraryId,p=["ERP.Part","ERP.PartBin","ERP.PartCost","ERP.PartPlant","ERP.PartUOM","ERP.PartWhse","ERP.PartCOO","ERP.PartPC","ERP.PartRev","ERP.Customer","ERP.CustCnt","ERP.ShipTo","ERP.OrderHed","ERP.OrderDtl","ERP.OrderRel","ERP.QuoteHed","ERP.QuoteDtl","ERP.JobHead","ERP.JobAsmbl","ERP.JobMtl","ERP.JobOper","ERP.ShipHead","ERP.ShipDtl","ERP.PurchaseOrder","ERP.PODetail","ERP.PORel","ERP.Vendor","ERP.VendPart","ERP.PriceLst","ERP.PriceLstParts","ERP.LaborDtl","ERP.LaborHed","ERP.PlantWhse","ERP.PartTran","ERP.Country","ERP.Currency","ERP.UD01","ERP.UD02","ERP.UD03","ERP.UD04","ERP.UD05","ERP.UD06","ERP.UD07","ERP.UD08","ERP.UD09","ERP.UD10","ICE.UD11","ICE.UD12","ICE.UD13","ICE.UD14","ICE.UD15","ICE.UD16","ICE.UD17","ICE.UD18","ICE.UD19","ICE.UD20"].sort(),w=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...p.map(E=>({label:E,manual:!1}))],v=await f.window.showQuickPick(w,{placeHolder:"Select a table or enter manually (format: ERP.Part)",matchOnDescription:!0});if(!v)return;let h;if(v.manual?h=await f.window.showInputBox({prompt:"Table ID",placeHolder:"e.g. ERP.PartBin or ICE.UD11",validateInput:E=>!E||!E.includes(".")?"Format must be NAMESPACE.TableName":null}):h=v.label,!h)return;let g=await f.window.showQuickPick([{label:"Read-only",value:!1},{label:"Updatable",value:!0}],{placeHolder:"Read-only or Updatable?"});g&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Adding table ${h}...`},async()=>{try{let E=await B.getLibraryRaw(l),x=JSON.stringify({LibraryID:l,TableID:h,Updatable:g.value,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",RowMod:"A"});E=Kn(E,"EfxRefTable",x);let C=await B.applyChangesRaw(E);C.diagnostics&&C.diagnostics.length>0?f.window.showWarningMessage(`EFx: Table added with diagnostics: ${C.diagnostics.join(", ")}`):f.window.showInformationMessage(`EFx: Added table ${h} to ${l} \u2713`),U.invalidateCache(l),U._onDidChangeTreeData.fire(void 0)}catch(E){f.window.showErrorMessage(`EFx: Add table failed: ${E.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.setTableUpdatable",async d=>{if(!B){f.window.showWarningMessage("EFx: Configure connection first");return}if(!d||!d.row){f.window.showWarningMessage("EFx: Must be invoked from a table in the tree.");return}let l=d.row.LibraryID,p=d.row.TableID,w=d.row.Updatable;if(!l||!p){f.window.showErrorMessage("EFx: Could not determine library/table from selection.");return}let v=await f.window.showQuickPick([{label:"$(lock) Read-only",value:!1,description:w===!1?"current":""},{label:"$(edit) Updatable",value:!0,description:w===!0?"current":""}],{placeHolder:`${p} \u2014 choose access mode`});!v||v.value===w||await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Updating ${p}...`},async()=>{try{let h=await B.getLibraryRaw(l),g=Hu(h,p,v.value),x=(await B.applyChangesRaw(g)).diagnostics||[];if(x.some(D=>typeof D=="object"?(D.Severity??2)>=2:/\berror\b/i.test(String(D)))){let D=x.map(A=>typeof A=="object"?A.ErrorText||JSON.stringify(A):String(A)).join(`
`);throw new Error(`Server rejected update:
${D}`)}U.invalidateCache(l),U._onDidChangeTreeData.fire(void 0),f.window.showInformationMessage(`EFx: ${p} set to ${v.value?"Updatable":"Read-only"} \u2713`)}catch(h){f.window.showErrorMessage(`EFx: Set updatable failed: ${h.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.addService",async d=>{if(!B||!d)return;let l=d.libraryId,p=["ERP:BO:Part","ERP:BO:PartBin","ERP:BO:PartWhse","ERP:BO:PartCost","ERP:BO:PartTran","ERP:BO:Customer","ERP:BO:ShipTo","ERP:BO:SalesOrder","ERP:BO:QuoteMgr","ERP:BO:JobEntry","ERP:BO:JobStatus","ERP:BO:CustShip","ERP:BO:SubShipD","ERP:BO:PurchaseOrder","ERP:BO:Receipt","ERP:BO:Vendor","ERP:BO:LaborDtl","ERP:BO:PriceLst","ERP:BO:Currency","ERP:BO:Country","ERP:BO:Inventory","ICE:BO:UD11","ICE:BO:UD12","ICE:BO:UD13","ICE:BO:UD14","ICE:BO:UD15","ICE:BO:UD16","ICE:BO:UD17","ICE:BO:UD18","ICE:BO:UD19","ICE:BO:UD20","ICE:LIB:EfxLibraryDesigner"].sort(),w=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...p.map(g=>({label:g,manual:!1}))],v=await f.window.showQuickPick(w,{placeHolder:"Select a service or enter manually (format: ERP:BO:Part)"});if(!v)return;let h;v.manual?h=await f.window.showInputBox({prompt:"Service ID",placeHolder:"e.g. ERP:BO:Part or ICE:BO:UD11",validateInput:g=>!g||g.split(":").length<3?"Format must be NAMESPACE:TYPE:Name":null}):h=v.label,h&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Adding service ${h}...`},async()=>{try{let g=await B.getLibraryRaw(l),E=JSON.stringify({LibraryID:l,ServiceID:h,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",RowMod:"A"});g=Kn(g,"EfxRefService",E);let x=await B.applyChangesRaw(g);x.diagnostics&&x.diagnostics.length>0?f.window.showWarningMessage(`EFx: Service added with diagnostics: ${x.diagnostics.join(", ")}`):f.window.showInformationMessage(`EFx: Added service ${h} to ${l} \u2713`),U.invalidateCache(l),U._onDidChangeTreeData.fire(void 0)}catch(g){f.window.showErrorMessage(`EFx: Add service failed: ${g.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.addAssembly",async d=>{if(!B||!d)return;let l=d.libraryId,p=["Newtonsoft.Json.dll","Ice.Contracts.BO.DynamicQuery.dll","Ice.Contracts.BO.BAQDesigner.dll","Erp.Contracts.BO.Part.dll","Erp.Contracts.BO.JobEntry.dll","Erp.Contracts.BO.SalesOrder.dll","Erp.Contracts.BO.QuoteMgr.dll","Erp.Contracts.BO.CustShip.dll","Erp.Contracts.BO.PurchaseOrder.dll","Erp.Contracts.BO.LaborDtl.dll","Erp.Contracts.BO.Inventory.dll","Erp.Contracts.BO.Customer.dll","Erp.Contracts.BO.Vendor.dll","Ice.Contracts.BO.UD11.dll","Ice.Contracts.BO.UD15.dll","System.Net.Http.dll","System.Xml.dll","System.Linq.dll"].sort(),w=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...p.map(g=>({label:g,manual:!1}))],v=await f.window.showQuickPick(w,{placeHolder:"Select an assembly or enter manually (include .dll)"});if(!v)return;let h;v.manual?h=await f.window.showInputBox({prompt:"Assembly filename",placeHolder:"e.g. Newtonsoft.Json.dll",validateInput:g=>!g||!g.toLowerCase().endsWith(".dll")?"Must end in .dll":null}):h=v.label,h&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Adding assembly ${h}...`},async()=>{try{let g=await B.getLibraryRaw(l),E=JSON.stringify({LibraryID:l,Assembly:h,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",RowMod:"A"});g=Kn(g,"EfxRefAssembly",E);let x=await B.applyChangesRaw(g);x.diagnostics&&x.diagnostics.length>0?f.window.showWarningMessage(`EFx: Assembly added with diagnostics: ${x.diagnostics.join(", ")}`):f.window.showInformationMessage(`EFx: Added assembly ${h} to ${l} \u2713`),U.invalidateCache(l),U._onDidChangeTreeData.fire(void 0)}catch(g){f.window.showErrorMessage(`EFx: Add assembly failed: ${g.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.addLibraryRef",async d=>{if(!B||!d)return;let l=d.libraryId,w=(U.libraries||[]).map(x=>x.LibraryID).filter(x=>x!==l).sort(),v=[{label:"$(edit) Enter manually...",alwaysShow:!0,manual:!0},...w.map(x=>({label:x,manual:!1}))],h=await f.window.showQuickPick(v,{placeHolder:w.length>0?"Select a library to reference":"Enter library ID (refresh tree first to get suggestions)"});if(!h)return;let g;if(h.manual?g=await f.window.showInputBox({prompt:"Library ID to reference",placeHolder:"e.g. LogFuncts",validateInput:x=>!x||x.trim().length===0?"Library ID is required":null}):g=h.label,!g)return;let E=await f.window.showQuickPick([{label:"Normal (0)",value:0,description:"Standard reference"},{label:"Read-only (1)",value:1,description:"Cannot call mutating functions"},{label:"Hidden (2)",value:2,description:"Not visible in designer"}],{placeHolder:"Reference mode"});E&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Adding library ref ${g}...`},async()=>{try{let x=await B.getLibraryRaw(l),C=JSON.stringify({LibraryID:l,LibraryRef:g,Mode:E.value,SysRevID:0,SysRowID:"00000000-0000-0000-0000-000000000000",RowMod:"A"});x=Kn(x,"EfxRefLibrary",C);let D=await B.applyChangesRaw(x);D.diagnostics&&D.diagnostics.length>0?f.window.showWarningMessage(`EFx: Library ref added with diagnostics: ${D.diagnostics.join(", ")}`):f.window.showInformationMessage(`EFx: Added library ref ${g} to ${l} \u2713`),U.invalidateCache(l),U._onDidChangeTreeData.fire(void 0)}catch(x){f.window.showErrorMessage(`EFx: Add library ref failed: ${x.message}`)}})}));let n=f.languages.createDiagnosticCollection("epicor-bpm");t.subscriptions.push(n);let r=f.languages.createDiagnosticCollection("epicor-efx");t.subscriptions.push(r);let o=new Map;function i(d){return o.has(d)||o.set(d,{status:"idle",timer:null}),o.get(d)}function a(d,l){let p=i(d);if(p.status==="running"||p.status==="dirty"){p.timer&&(clearTimeout(p.timer),p.timer=null),p.status="dirty";return}p.timer&&clearTimeout(p.timer),p.timer=setTimeout(()=>{p.timer=null,p.status="running",s(d,l)},500)}async function s(d,l){if(o.get(d))try{if(!J||!l.isBpm||!l.functionDefinition)return;let w=f.workspace.textDocuments.find(C=>Z(C.uri.fsPath)===Z(d)),v=mn(w?w.getText():re.readFileSync(d,"utf-8")),h=v.content,g=v.lineOffset,E=await J.validateCustomCode(h,l.functionDefinition),x=f.Uri.file(d);if(!E||E.length===0)n.set(x,[]);else{let C=E.map(D=>{let A=Math.max(0,(D.Span?.start?.line??1)-1),I=Math.max(A,(D.Span?.end?.line??A+1)-1),S=A+g,L=I+g,k=Math.max(0,D.Span?.start?.column??0),T=Math.max(0,D.Span?.end?.column??k+1),N=new f.Range(S,k,L,T),_=ya(D.Severity),W=`${D.Code}: ${D.Message}`;return new f.Diagnostic(N,W,_)});n.set(x,C)}}catch{}finally{let w=o.get(d);if(!w)return;let v=w.status==="dirty";w.status="idle",v&&(w.status="running",s(d,l))}}t.subscriptions.push(f.workspace.onDidOpenTextDocument(async d=>{let l=d.uri.fsPath;if(!l.endsWith(".cs")||pe.has(Z(l)))return;let p=f.workspace.getConfiguration("efx").get("storageLocation");!p||!l.startsWith(String(p))||await Ft(l)})),t.subscriptions.push(f.workspace.onDidChangeTextDocument(d=>{let l=d.document.uri.fsPath,p=pe.get(Z(l));p&&p.isBpm&&p.functionDefinition&&a(l,p),p&&!p.isBpm&&!p.widgetNodeId&&!p.isWidgetCode&&B&&m(l,p)})),t.subscriptions.push(f.workspace.onDidSaveTextDocument(async d=>{let l=Z(d.uri.fsPath);if(Hr.has(l))return;let p=await Ft(d.uri.fsPath);if(p?.isWidgetCode){await jr(d.uri.fsPath,p);return}!p||p.isBpm||!B||!gn()?.autoPush||await f.commands.executeCommand("efx.pushFunction",null,!0)})),t.subscriptions.push(f.workspace.onDidCloseTextDocument(d=>{let l=d.uri.fsPath,p=pe.get(Z(l));if(p&&p.isBpm){n.delete(d.uri);let w=o.get(l);w?.timer&&clearTimeout(w.timer),o.delete(l)}if(p&&!p.isBpm){r.delete(d.uri);let w=u.get(l);w?.timer&&clearTimeout(w.timer),u.delete(l)}if(p&&!d.isDirty&&gn()?.autoClean)try{re.unlinkSync(l),pe.delete(Z(l))}catch{}}));let u=new Map;function c(d){return u.has(d)||u.set(d,{status:"idle",timer:null}),u.get(d)}function m(d,l){let p=c(d);if(p.status==="running"||p.status==="dirty"){p.timer&&(clearTimeout(p.timer),p.timer=null),p.status="dirty";return}p.timer&&clearTimeout(p.timer),p.timer=setTimeout(()=>{p.timer=null,p.status="running",y(d,l)},1500)}async function y(d,l){if(u.get(d))try{if(!B||!l.libraryId||!l.functionId||l.widgetNodeId||l.isWidgetCode)return;let w=f.workspace.textDocuments.find(L=>Z(L.uri.fsPath)===Z(d)),v=mn(w?w.getText():re.readFileSync(d,"utf-8")),h=v.content,g=v.lineOffset,E=fn.get(l.libraryId),x=E?.EfxFunction?.find(L=>L.FunctionID===l.functionId);if(x){let L=Ke.EpicorClient.extractCode(x.Body).code;if(_t(L)===_t(h)){r.set(f.Uri.file(d),[]);return}}let C=x?Ke.EpicorClient.extractCode(x.Body).usings:"",{diagnostics:D,saved:A,newBody:I}=await B.validateFunctionViaWrapper(l.libraryId,l.functionId,h,C,"Utilities","ApplyChangesWithDiagnostics",E);A&&E&&x&&(x.Body=I);let S=f.Uri.file(d);if(!D||D.length===0)r.set(S,[]);else{let L=D.map(k=>{if(typeof k=="object"&&k!==null){let N=Number.isInteger(k.Line)?k.Line:void 0,_=Number.isInteger(k.Column)?k.Column-1:void 0,W=Math.max(0,(k.Span?.start?.line??N??1)-1),ne=Math.max(W,(k.Span?.end?.line??N??W+1)-1),se=W+g,$=ne+g,V=Math.max(0,k.Span?.start?.column??_??0),fe=Math.max(0,k.Span?.end?.column??V+1),me=ya(k.Severity),Pt=[k.Code,k.Message].filter(Boolean).join(": ");return new f.Diagnostic(new f.Range(se,V,$,fe),Pt||String(k),me)}let T=String(k).match(/\((\d+),(\d+)\).*?(error|warning|info)\s+(CS\w+)?:?\s*(.*)/i);if(T){let N=Math.max(0,parseInt(T[1])-1)+g,_=Math.max(0,parseInt(T[2])-1),W=T[3].toLowerCase();return new f.Diagnostic(new f.Range(N,_,N,_+1),`${T[4]?T[4]+": ":""}${T[5]}`,W==="warning"?f.DiagnosticSeverity.Warning:W==="info"?f.DiagnosticSeverity.Information:f.DiagnosticSeverity.Error)}return new f.Diagnostic(new f.Range(0,0,0,1),String(k),f.DiagnosticSeverity.Error)});r.set(S,L)}}catch{}finally{let w=u.get(d);if(!w)return;let v=w.status==="dirty";w.status="idle",v&&(w.status="running",y(d,l))}}t.subscriptions.push(f.commands.registerCommand("efx.bpm.refresh",async()=>{if(!J){f.window.showWarningMessage("BPM: Configure connection first");return}await Je.refresh()})),t.subscriptions.push(f.commands.registerCommand("efx.bpm.openWidgetPanel",async d=>{if(!J){f.window.showWarningMessage("BPM: Configure connection first");return}let l;if((d?.directive||d instanceof Rr.BpmDirectiveNode)&&(l=d.directive),!l){f.window.showWarningMessage("BPM: Select a directive");return}Ou(t,J,l)})),t.subscriptions.push(f.commands.registerCommand("efx.openFunctionWidgets",async d=>{if(!B){f.window.showWarningMessage("EFx: Configure connection first");return}let l=d?.libraryId,p=d?.func?.FunctionID||d?.functionId;if(!l||!p){f.window.showWarningMessage("EFx: Select a function");return}try{await ma(t,B,l,p,d?.func?.Body)}catch(w){f.window.showErrorMessage(`EFx: Could not open widget graph \u2014 ${w.message}`)}})),t.subscriptions.push(f.commands.registerCommand("efx.widget.openCode",async d=>{let l=d?.meta;if(!l||!d.nodeId)return;let p=await Qn();if(!p){f.window.showWarningMessage("EFx: Storage location not set \u2014 cannot open widget code.");return}let w=A=>String(A||"").replace(/[^a-zA-Z0-9_\-. ]/g,"_"),v=l.kind==="bpm",h=v?X.join(p,"Widgets","BPM",w(l.bpMethodCode),w(l.name)):X.join(p,"Widgets",w(l.libraryId),w(l.functionId));re.mkdirSync(h,{recursive:!0});let g=X.join(h,`${w(d.nodeId)}.cs`),E=null;if(v&&J)try{let A=await J.getBpmMethod("BO",l.bpMethodCode),I=A?.BpMethod?.[0];I&&(E=qe.buildFunctionDefinition(I,A?.BpArgument||[]))}catch{}let x=(v?[`// BPM Directive: ${l.name}`,`// Method: ${l.bpMethodCode}`,`// Type: ${_u(l.directiveType)}`,`// DirectiveID: ${l.directiveId}`]:[`// EFx Function: ${l.libraryId}.${l.functionId}`]).concat([`// Widget Code: ${d.nodeId} (${d.label})`,`// Pulled: ${new Date().toISOString()}`,"// Saving this file pushes the code back into this widget.","// --------------------------------------------------",""]);f.workspace.textDocuments.find(A=>Z(A.uri.fsPath)===Z(g)&&A.isDirty)||re.writeFileSync(g,x.join(`
`)+`
`+(d.code||""),"utf-8"),pe.set(Z(g),{isWidgetCode:!0,nodeId:d.nodeId,widgetMeta:l,isBpm:v,libraryId:v?"__BPM__":l.libraryId,functionId:v?l.directiveId:l.functionId,bpmMethodCode:l.bpMethodCode,directiveId:l.directiveId,directiveType:l.directiveType,functionDefinition:E});let D=await f.workspace.openTextDocument(g);await f.window.showTextDocument(D,f.ViewColumn.One),f.window.showInformationMessage(`Widget "${d.label}" opened \u2014 save to push it back to Epicor.`),E&&a(g,pe.get(Z(g)))})),t.subscriptions.push(f.commands.registerCommand("efx.bpm.pullDirective",async d=>{if(!J){f.window.showWarningMessage("BPM: Configure connection first");return}let l;if(d&&d.directive)l=d.directive;else if(d instanceof Rr.BpmDirectiveNode)l=d.directive;else{f.window.showWarningMessage("BPM: Select a directive to pull");return}let{code:p,hasCustomCode:w}=qe.extractBpmCode(l.Body);if(!w){f.window.showWarningMessage(`BPM: "${l.Name}" has no custom C# code \u2014 it uses widget actions only`);return}await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Pulling BPM: ${l.Name}...`},async()=>{try{let v=l.DirectiveType===1?"Pre":l.DirectiveType===3?"Post":l.DirectiveType===2?"Base":`Type${l.DirectiveType}`,h=await Qn();if(!h){f.window.showWarningMessage("BPM: Storage location not set \u2014 pull cancelled.");return}let g=X.join(h,"BPM",l.BpMethodCode);re.mkdirSync(g,{recursive:!0});let E=l.Name.replace(/[^a-zA-Z0-9_\-. ]/g,"_"),x=X.join(g,`${v}_${E}.cs`),C=[`// BPM Directive: ${l.Name}`,`// Method: ${l.BpMethodCode}`,`// Type: ${v}`,`// Enabled: ${l.IsEnabled}`,`// Group: ${l.DirectiveGroup||"(none)"}`,`// DirectiveID: ${l.DirectiveID}`,`// Pulled: ${new Date().toISOString()}`,"// --------------------------------------------------",""].join(`
`);re.writeFileSync(x,C+p,"utf-8");let D=await J.getBpmMethod("BO",l.BpMethodCode),A=D?.BpMethod?.[0],I=D?.BpArgument||[],S=A?qe.buildFunctionDefinition(A,I):null;pe.set(Z(x),{libraryId:"__BPM__",functionId:l.DirectiveID,bpmMethodCode:l.BpMethodCode,directiveId:l.DirectiveID,directiveType:l.DirectiveType,isBpm:!0,functionDefinition:S});let L=await f.workspace.openTextDocument(x);if(await f.window.showTextDocument(L,f.ViewColumn.One),f.window.showInformationMessage(`BPM: Pulled ${v} directive "${l.Name}"`),S){let k=pe.get(Z(x));a(x,k)}}catch(v){f.window.showErrorMessage(`BPM Pull failed: ${v.message}`)}})})),t.subscriptions.push(f.commands.registerCommand("efx.bpm.pushDirective",async d=>{if(!J){f.window.showWarningMessage("BPM: Configure connection first");return}let l,p;if(d&&d.directive){let v=d.directive,h=v.DirectiveType===1?"Pre":v.DirectiveType===3?"Post":v.DirectiveType===2?"Base":`Type${v.DirectiveType}`,g=v.Name.replace(/[^a-zA-Z0-9_\-. ]/g,"_"),E=await Qn();if(!E){f.window.showWarningMessage("BPM: Storage location not set \u2014 push cancelled.");return}l=X.join(E,"BPM",v.BpMethodCode,`${h}_${g}.cs`),p=await Ft(l)}else{let v=f.window.activeTextEditor;if(!v){f.window.showWarningMessage("BPM: No active file to push");return}l=v.document.uri.fsPath,p=await Ft(l)}if(p?.isWidgetCode){await jr(l,p);return}if(!p||!p.isBpm){f.window.showWarningMessage("BPM: This file is not a pulled BPM directive. Pull it first.");return}if(!l||!re.existsSync(l)){f.window.showErrorMessage("BPM: File not found. Pull the directive first.");return}await f.window.showWarningMessage(`Push BPM directive to ${p.bpmMethodCode}?`,{modal:!0},"Push")==="Push"&&await f.window.withProgress({location:f.ProgressLocation.Notification,title:"Pushing BPM directive..."},async()=>{try{await ba(l);let v=re.readFileSync(l,"utf-8");v=Wu(v);let h=await J.getBpmMethodRaw("BO",p.bpmMethodCode),g=qe.updateRawBpmDirective(h,p.directiveId,v);JSON.parse(`{"ds":${g}}`),await J.updateBpmRaw(g),f.window.showInformationMessage(`BPM: Pushed directive to ${p.bpmMethodCode} \u2713`),p.functionDefinition&&a(l,p);let E=p.bpmMethodCode.split(".");E.length>=3&&Je.invalidateService(E[0].toUpperCase(),E[1],E[2])}catch(v){f.window.showErrorMessage(`BPM Push failed: ${v.message}`)}})}));async function b(d){let l=Fe();if(l.length<1)return f.window.showWarningMessage("EFx: No profiles configured. Add profiles via Manage Profiles first."),null;let p=await f.window.showQuickPick(l.map(g=>({label:g.name,description:g.serverUrl,profile:g})),{placeHolder:d,ignoreFocusOut:!0});if(!p)return null;let w;if(p.profile.companies.length===1?w=p.profile.companies[0]:w=await f.window.showQuickPick(p.profile.companies,{placeHolder:`Company on ${p.profile.name}`,ignoreFocusOut:!0}),!w)return null;let v=await t.secrets.get(oe(p.profile.name,"password"));if(!v)return f.window.showErrorMessage(`EFx: No password stored for "${p.profile.name}".`),null;let h=await t.secrets.get(oe(p.profile.name,"apiKey"))||"";return new Fu.KineticMetaFXClient({serverUrl:p.profile.serverUrl,company:w,username:p.profile.username,password:v,apiKey:h})}t.subscriptions.push(f.commands.registerCommand("efx.dev.dumpFunctionBody",async()=>{if(!B){f.window.showErrorMessage("EFx: Not connected \u2014 configure a profile first.");return}let d=await f.window.showInputBox({prompt:"Library ID to dump",ignoreFocusOut:!0});if(!d)return;let l=f.window.createOutputChannel("EFx Function Body Dump");l.show(!0),l.appendLine(`Fetching ${d}...`);try{let w=(await B.getLibrary(d.trim()))?.EfxFunction||[];l.appendLine(`Got ${w.length} function(s)
`);for(let v of w){let h=$t.describeBody(v.Body);if(l.appendLine("=".repeat(70)),l.appendLine(`${v.FunctionID}  Kind=${v.Kind}  \u2192 ${$t.bodyKindLabel(h)}`),h.kind==="flow"){l.appendLine(`  envelope property: ${h.xamlProp||"(raw XAML)"}`);for(let g of h.flow.codeNodes)l.appendLine(`  code widget ${g.id} (${g.label}), ${g.code.split(`
`).length} lines`)}l.appendLine("  --- raw Body ---"),l.appendLine(v.Body||"(empty)"),l.appendLine("")}}catch(p){l.appendLine(`ERROR: ${p.message}`)}})),t.subscriptions.push(f.commands.registerCommand("efx.dev.dumpBpmXaml",async()=>{if(!J){f.window.showErrorMessage("EFx: Not connected \u2014 configure a profile first.");return}let d=await f.window.showInputBox({prompt:"BPM method code",value:"Erp.BO.Labor.Update",ignoreFocusOut:!0});if(!d)return;let l=f.window.createOutputChannel("EFx Widget XAML Dump");l.show(!0),l.appendLine(`Fetching ${d}...`);try{let w=(await J.getBpmMethod("BO",d.trim()))?.BpDirective||[];l.appendLine(`Got ${w.length} directive(s)
`);for(let v of w){let h=v.DirectiveType===1?"Pre":v.DirectiveType===3?"Post":"Base";if(l.appendLine("=".repeat(70)),l.appendLine(`[${h}] "${v.Name}"  enabled=${v.IsEnabled}  group=${v.DirectiveGroup||"(none)"}`),!v.Body){l.appendLine("  (no body)");continue}let g=[...new Set([...v.Body.matchAll(/<(\w+Action)\b/g)].map(C=>C[1]))];l.appendLine(`  Action elements: ${g.join(", ")||"(none found)"}`);let E=0,x=0;for(;;){let C=v.Body.indexOf("CustomCodeAction",E);if(C<0)break;let D='Code="',A=v.Body.indexOf(D,C);if(A<0){E=C+1;continue}let I=A+D.length,S=I;for(;S<v.Body.length&&v.Body[S]!=='"';){if(v.Body[S]==="&"){let T=v.Body.indexOf(";",S);if(T<0)break;S=T+1;continue}S++}let L=v.Body.slice(I,S),k=qe.xmlDecode(L);l.appendLine(`
  --- CustomCodeAction[${x++}] ---`),l.appendLine(k),E=S+1}x===0&&(l.appendLine(`
  No CustomCodeAction found \u2014 full XAML body:`),l.appendLine(v.Body))}}catch(p){l.appendLine(`ERROR: ${p.message}`)}})),t.subscriptions.push(f.commands.registerCommand("efx.compareLibraries",()=>{Mu.show(t)})),t.subscriptions.push(f.commands.registerCommand("efx.searchFunctions",async()=>{await ha(B,{})})),t.subscriptions.push(f.commands.registerCommand("efx.searchInLibrary",async d=>{await ha(B,{libraryId:d?.library?.LibraryID||d?.libraryId})}))}var at={ignoreFocusOut:!0};function Fe(){let e=f.workspace.getConfiguration("efx").get("profiles");return Array.isArray(e)?e:[]}async function Yr(t){await f.workspace.getConfiguration("efx").update("profiles",t,f.ConfigurationTarget.Global)}function _e(){return f.workspace.getConfiguration("efx").get("activeProfile")||""}async function Gr(t){await f.workspace.getConfiguration("efx").update("activeProfile",t,f.ConfigurationTarget.Global)}function st(){return f.workspace.getConfiguration("efx").get("activeCompany")||""}async function tr(t){await f.workspace.getConfiguration("efx").update("activeCompany",t,f.ConfigurationTarget.Global)}function gn(){let t=_e();return t&&Fe().find(e=>e.name===t)||null}function oe(t,e){return`efx.profile.${t}.${e}`}function nr(){let t=_e(),e=st(),n=t&&e?`${t} / ${e}`:t||"";Zn&&(Zn.description=n),er&&(er.description=n)}async function Da(t){let e=Fe(),n=_e(),r=[];r.push({label:"$(add) New Profile\u2026",description:"Create a new Epicor environment profile",action:"new"});for(let i of e){let a=i.name===n;r.push({label:`${a?"$(check) ":"$(blank) "}${i.name}`,description:i.serverUrl||"",detail:`${i.username||"(no user)"} \u2022 ${(i.companies||[]).join(", ")||"no companies"}`,action:"use",profileName:i.name})}e.length>0&&(r.push({label:"$(edit) Edit Profile\u2026",action:"edit"}),r.push({label:"$(trash) Delete Profile\u2026",action:"delete"}));let o=await f.window.showQuickPick(r,{placeHolder:e.length===0?"No profiles yet \u2014 create your first one":`Select a profile to activate, or manage profiles (${e.length} configured)`,ignoreFocusOut:!0});if(o){if(o.action==="new")await Yu(t);else if(o.action==="use")await rr(t,o.profileName);else if(o.action==="edit"){let i=await va("Select profile to edit");i&&await Ku(t,i)}else if(o.action==="delete"){let i=await va("Select profile to delete");i&&await Ju(t,i)}}}async function va(t){let e=Fe();if(e.length===0)return f.window.showInformationMessage("EFx: No profiles configured."),null;let n=await f.window.showQuickPick(e.map(r=>({label:r.name,description:r.serverUrl||"",detail:r.username||"",profileName:r.name})),{placeHolder:t,ignoreFocusOut:!0});return n?n.profileName:null}async function Yu(t){let e={name:"",serverUrl:"",username:"",companies:[]};if(!await Ca(t,e,!0))return;let r=Fe();if(r.some(o=>o.name===e.name)){f.window.showErrorMessage(`EFx: Profile "${e.name}" already exists.`);return}r.push(e),await Yr(r),r.length===1||await Gu(e.name)?await rr(t,e.name):f.window.showInformationMessage(`EFx: Profile "${e.name}" saved.`)}async function Gu(t){let e=await f.window.showQuickPick([{label:"Activate now",value:!0},{label:"Save only",value:!1}],{placeHolder:`Activate profile "${t}"?`,ignoreFocusOut:!0});return e?e.value:!1}async function Ku(t,e){let n=Fe(),r=n.findIndex(s=>s.name===e);if(r<0)return;let o=JSON.parse(JSON.stringify(n[r])),i=o.name;if(await Ca(t,o,!1)){if(o.name!==i){let s=await t.secrets.get(oe(i,"password")),u=await t.secrets.get(oe(i,"apiKey"));s&&await t.secrets.store(oe(o.name,"password"),s),u&&await t.secrets.store(oe(o.name,"apiKey"),u),await t.secrets.delete(oe(i,"password")),await t.secrets.delete(oe(i,"apiKey")),_e()===i&&await Gr(o.name)}n[r]=o,await Yr(n),_e()===o.name?await rr(t,o.name):f.window.showInformationMessage(`EFx: Profile "${o.name}" updated.`)}}async function Ju(t,e){if(await f.window.showWarningMessage(`Delete profile "${e}"? This will remove its stored credentials.`,{modal:!0},"Delete")!=="Delete")return;let r=Fe().filter(o=>o.name!==e);await Yr(r),await t.secrets.delete(oe(e,"password")),await t.secrets.delete(oe(e,"apiKey")),_e()===e&&(await Gr(""),await tr(""),B=null,J=null,U.setClient(null),Je.setClient(null),nr()),f.window.showInformationMessage(`EFx: Profile "${e}" deleted.`)}async function Ca(t,e,n){let r=await f.window.showInputBox({...at,prompt:n?"Profile name (e.g. Dev, Prod, Pilot)":"Profile name",value:e.name,validateInput:d=>!d||!d.trim()?"Name is required":/^[A-Za-z0-9_\-. ]+$/.test(d)?null:"Use letters, numbers, space, dash, dot, underscore"});if(r===void 0)return!1;e.name=r.trim();let o=await f.window.showInputBox({...at,prompt:"Epicor Server URL",value:e.serverUrl,placeHolder:"https://your-epicor-server/your-app",validateInput:d=>!d||!d.trim()?"Server URL is required":null});if(o===void 0)return!1;e.serverUrl=o.trim();let i=await f.window.showInputBox({...at,prompt:"Username",value:e.username,validateInput:d=>!d||!d.trim()?"Username is required":null});if(i===void 0)return!1;e.username=i.trim();let a=n?null:await t.secrets.get(oe(e.name,"password")),s=n;if(!n){let d=await f.window.showQuickPick([{label:"Keep existing password",value:!1},{label:"Change password",value:!0}],{placeHolder:"Password",ignoreFocusOut:!0});if(!d)return!1;s=d.value}if(s){let d=await f.window.showInputBox({...at,prompt:`Password for ${e.username}`,password:!0,validateInput:l=>l?null:"Password is required"});if(d===void 0)return!1;await t.secrets.store(oe(e.name,"password"),d),a=d}let u=n?"":await t.secrets.get(oe(e.name,"apiKey"))||"",c=n;if(!n){let d=await f.window.showQuickPick([{label:"Keep existing API key",value:!1},{label:"Change API key",value:!0},{label:"Clear API key",value:"clear"}],{placeHolder:"API Key",ignoreFocusOut:!0});if(!d)return!1;d.value==="clear"?(await t.secrets.delete(oe(e.name,"apiKey")),u="",c=!1):c=d.value===!0}if(c){let d=await f.window.showInputBox({...at,prompt:"API Key (leave blank if not required)",password:!0,value:""});if(d===void 0)return!1;await t.secrets.store(oe(e.name,"apiKey"),d||""),u=d||""}let m=await Xu(t,e,a,u);if(m===void 0)return!1;e.companies=m;let y=await f.window.showQuickPick([{label:"No \u2014 push manually",value:!1},{label:"Yes \u2014 auto-push on file save",value:!0}],{placeHolder:"Auto-push changes to Epicor when you save a .cs file?",ignoreFocusOut:!0});if(y===void 0)return!1;e.autoPush=y.value;let b=await f.window.showQuickPick([{label:"No \u2014 keep the local file after closing",value:!1},{label:"Yes \u2014 delete the local file when its tab is closed (only if fully saved)",value:!0}],{placeHolder:"Delete the local .cs file automatically when you close it?",ignoreFocusOut:!0});return b===void 0?!1:(e.autoClean=b.value,!0)}async function Xu(t,e,n,r){let o=!e.companies||e.companies.length===0,i;if(o)i="fetch";else{let a=[],s=_e()===e.name,u=st();s&&e.companies.length>1&&a.push({label:"$(arrow-right) Switch active company",description:`currently ${u||"(none)"}`,value:"switch"}),a.push({label:"$(check) Keep current selection",description:(e.companies||[]).join(", "),value:"keep"}),a.push({label:"$(refresh) Re-fetch from server",description:"Discover companies again via UserFile",value:"fetch"}),a.push({label:"$(list-selection) Pick from current list",description:"Multi-select among already saved companies",value:"pick"}),a.push({label:"$(edit) Enter manually",description:"Comma-separated list",value:"manual"});let c=await f.window.showQuickPick(a,{placeHolder:"Companies",ignoreFocusOut:!0});if(!c)return;if(i=c.value,i==="keep")return e.companies;if(i==="switch"){let m=await f.window.showQuickPick(e.companies.map(y=>({label:`${y===u?"$(check) ":"$(blank) "}${y}`,company:y})),{placeHolder:`Active company (profile: ${e.name})`,ignoreFocusOut:!0});return m?(m.company!==u&&await ka(t,m.company),e.companies):void 0}}if(i==="fetch"){let a=await Qu(e,n,r);return a===void 0?void 0:a}return i==="pick"?await Aa(e.companies,e.companies):await Xn(e.companies)}async function Qu(t,e,n){if(!e)return f.window.showWarningMessage("EFx: Cannot fetch companies \u2014 no password available. Falling back to manual entry."),await Xn(t.companies);let r=t.companies&&t.companies[0]||"",o=await f.window.showInputBox({...at,prompt:"Default company (used to authenticate the discovery call)",placeHolder:"your default company code",value:r,validateInput:c=>!c||!c.trim()?"Default company is required":null});if(o===void 0)return;let i=o.trim(),a;try{a=await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Fetching companies for ${t.username}...`},async()=>await new Ke.EpicorClient({serverUrl:t.serverUrl,company:i,username:t.username,password:e,apiKey:n||""}).getUserCompanies())}catch(c){return await f.window.showErrorMessage(`EFx: Could not fetch companies \u2014 ${c.message}`,{modal:!1},"Enter Manually","Cancel")!=="Enter Manually"?void 0:await Xn([i])}if(!a||a.length===0)return await f.window.showWarningMessage(`EFx: Server returned no companies for user "${t.username}". Enter manually?`,"Enter Manually","Cancel")!=="Enter Manually"?void 0:await Xn([i]);let s=Array.from(new Set([i,...a]));return await Aa(s,s)}async function Aa(t,e){let n=new Set(e||[]),r=t.map(i=>({label:i,picked:n.has(i)})),o=await f.window.showQuickPick(r,{canPickMany:!0,placeHolder:"Select companies to include in this profile",ignoreFocusOut:!0});if(o){if(o.length===0){f.window.showWarningMessage("EFx: At least one company is required.");return}return o.map(i=>i.label)}}async function Xn(t){let e=await f.window.showInputBox({...at,prompt:"Companies (comma-separated)",value:(t||[]).join(", "),validateInput:n=>!n||!n.trim()||n.split(",").map(o=>o.trim()).filter(Boolean).length===0?"At least one company is required":null});if(e!==void 0)return e.split(",").map(n=>n.trim()).filter(Boolean)}async function rr(t,e){let n=Fe().find(a=>a.name===e);if(!n){f.window.showErrorMessage(`EFx: Profile "${e}" not found.`);return}let r=await t.secrets.get(oe(e,"password"));if(!r){f.window.showErrorMessage(`EFx: No password stored for "${e}". Edit the profile to set one.`);return}let o=await t.secrets.get(oe(e,"apiKey"))||"",i=st();n.companies.includes(i)||(i=n.companies[0]),await Gr(e),await tr(i),B=new Ke.EpicorClient({serverUrl:n.serverUrl,company:i,username:n.username,password:r,apiKey:o}),U.setClient(B),J=new qe.BpmClient(B),Je.setClient(J),await U.refresh(),nr(),f.window.showInformationMessage(`EFx: Active profile "${e}" (company ${i})`)}async function Zu(t){let e=Fe();if(e.length===0){await f.window.showInformationMessage("EFx: No profiles configured. Create one?","Create Profile")==="Create Profile"&&await Da(t);return}let n=_e(),r=await f.window.showQuickPick(e.map(o=>({label:`${o.name===n?"$(check) ":"$(blank) "}${o.name}`,description:o.serverUrl||"",profileName:o.name})),{placeHolder:"Switch to profile",ignoreFocusOut:!0});r&&await rr(t,r.profileName)}async function ed(t){let e=gn();if(!e){f.window.showWarningMessage("EFx: No active profile. Manage Profiles first.");return}if(!e.companies||e.companies.length===0){f.window.showWarningMessage(`EFx: Profile "${e.name}" has no companies configured. Edit the profile to add some.`);return}if(e.companies.length===1){f.window.showInformationMessage(`EFx: Only one company in profile "${e.name}" (${e.companies[0]}).`);return}let n=st(),r=await f.window.showQuickPick(e.companies.map(o=>({label:`${o===n?"$(check) ":"$(blank) "}${o}`,company:o})),{placeHolder:`Active company (profile: ${e.name})`,ignoreFocusOut:!0});r&&r.company!==n&&await ka(t,r.company)}async function ka(t,e){let n=gn();if(!n)return;if(!n.companies.includes(e)){f.window.showErrorMessage(`EFx: "${e}" is not in profile "${n.name}".`);return}let r=await t.secrets.get(oe(n.name,"password"));if(!r){f.window.showErrorMessage(`EFx: No password stored for "${n.name}".`);return}let o=await t.secrets.get(oe(n.name,"apiKey"))||"";await tr(e),B=new Ke.EpicorClient({serverUrl:n.serverUrl,company:e,username:n.username,password:r,apiKey:o}),U.setClient(B),J=new qe.BpmClient(B),Je.setClient(J),await U.refresh(),nr(),f.window.showInformationMessage(`EFx: Active company \u2192 ${e}`)}async function Sa(){let t=f.workspace.getConfiguration("efx"),e=t.get("storageLocation");if(e&&String(e).trim())return String(e).trim();let n=await f.window.showQuickPick([{label:"Use default location (VS Code internal storage)",value:"default"},{label:"Choose a folder...",value:"custom"}],{placeHolder:"EFx: Where should pulled functions and BPM directives be stored?",ignoreFocusOut:!0});if(!n)return null;let r;if(n.value==="default")r=X.join(xa.globalStorageUri.fsPath,"EpicorExtension");else{let o=await f.window.showOpenDialog({canSelectFolders:!0,canSelectFiles:!1,canSelectMany:!1,openLabel:"Select EFx Storage Folder"});if(!o||o.length===0)return null;r=X.join(o[0].fsPath,"EpicorExtension")}return re.mkdirSync(r,{recursive:!0}),await t.update("storageLocation",r,f.ConfigurationTarget.Global),f.window.showInformationMessage(`EFx: Storage location set to ${r}`),r}async function Qn(){let t=await Sa();if(!t)return null;let n=(_e()||"Default").replace(/[^a-zA-Z0-9_\-. ]/g,"_");return X.join(t,n)}async function qr(){let t=await Qn();return t?X.join(t,"Libraries"):null}function td(t){let e;try{e=re.readFileSync(t,"utf-8")}catch{return{}}let n={};for(let r of e.split(/\r?\n/).slice(0,12)){let o=r.match(/^\/\/\s*([A-Za-z ]+):\s*(.*)$/);o&&(n[o[1].trim()]=o[2].trim())}return n}function nd(t){return t?t.kind==="bpm"?J?$u(J,{DirectiveID:t.directiveId,BpMethodCode:t.bpMethodCode,Name:t.name,DirectiveType:t.directiveType}):null:B?wa(B,t.libraryId,t.functionId):null:null}async function jr(t,e){let n=nd(e.widgetMeta);if(!n){f.window.showWarningMessage("EFx: Configure connection first");return}let{content:r}=mn(re.readFileSync(t,"utf-8"));await f.window.withProgress({location:f.ProgressLocation.Notification,title:`Pushing widget ${e.nodeId}...`},async()=>{try{await Ea(n,e.nodeId,r),f.window.showInformationMessage(`${n.heading}: widget "${e.nodeId}" saved.`),e.widgetMeta.kind==="efx"&&(U.invalidateCache(e.widgetMeta.libraryId),Jn())}catch(o){f.window.showErrorMessage(`Widget push failed: ${o.message}`)}})}async function Ft(t){let e=Z(t),n=pe.get(e);if(n)return n;if(!t.endsWith(".cs")||!re.existsSync(t))return null;let r=td(t),o=r["Widget Code"]?String(r["Widget Code"]).split(" (")[0].trim():null;if(r["BPM Directive"]&&r.Method&&r.DirectiveID){if(!J)return null;let i=r.Method,a=r.DirectiveID,u={Pre:1,Post:3,Base:2}[r.Type]??parseInt(String(r.Type).replace("Type",""),10);try{let c=await J.getBpmMethod("BO",i),m=c?.BpMethod?.[0],y=c?.BpArgument||[],b=m?qe.buildFunctionDefinition(m,y):null,d={libraryId:"__BPM__",functionId:a,bpmMethodCode:i,directiveId:a,directiveType:u,isBpm:!0,functionDefinition:b};return o&&(d.isWidgetCode=!0,d.nodeId=o,d.widgetMeta={kind:"bpm",bpMethodCode,directiveId:a,directiveType:u,name:r["BPM Directive"]}),pe.set(e,d),d}catch{return null}}if(r["EFx Function"]){if(o){let c=String(r["EFx Function"]).indexOf("."),m=c>0?String(r["EFx Function"]).slice(0,c):X.basename(X.dirname(X.dirname(t))),y=c>0?String(r["EFx Function"]).slice(c+1):X.basename(X.dirname(t)),b={libraryId:m,functionId:y,isWidgetCode:!0,nodeId:o,widgetMeta:{kind:"efx",libraryId:m,functionId:y}};return pe.set(e,b),b}let i=X.basename(t,".cs"),a=X.basename(X.dirname(t)),s=r.Widget?String(r.Widget).split(" (")[0].trim():null,u={libraryId:a,functionId:i,widgetNodeId:s};return pe.set(e,u),u}return null}async function rd(t){let e=_e();if(!e)return;let n=Fe().find(a=>a.name===e);if(!n)return;let r=await t.secrets.get(oe(e,"password"));if(!r)return;let o=await t.secrets.get(oe(e,"apiKey"))||"",i=st();n.companies.includes(i)||(i=n.companies[0]||""),i&&(i!==st()&&await tr(i),B=new Ke.EpicorClient({serverUrl:n.serverUrl,company:i,username:n.username,password:r,apiKey:o}),U.setClient(B),J=new qe.BpmClient(B),Je.setClient(J))}function od(){}
