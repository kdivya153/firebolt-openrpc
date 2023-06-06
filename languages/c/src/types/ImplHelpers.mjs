import { getModuleName, getPropertyGetterSignature, getFireboltStringType, getSdkNameSpace, capitalize } from './NativeHelpers.mjs'

const getObjectHandleManagementImpl = (varName, jsonDataName) => {

  let result = `${varName}Handle ${varName}Handle_Create(void)
{
    WPEFramework::Core::ProxyType<${jsonDataName}>* type = new WPEFramework::Core::ProxyType<${jsonDataName}>();
    *type = WPEFramework::Core::ProxyType<${jsonDataName}>::Create();
    return (static_cast<${varName}Handle>(type));
}
void ${varName}Handle_Addref(${varName}Handle handle)
{
    ASSERT(handle != NULL);
    WPEFramework::Core::ProxyType<${jsonDataName}>* var = static_cast<WPEFramework::Core::ProxyType<${jsonDataName}>*>(handle);
    ASSERT(var->IsValid());
    var->AddRef();
}
void ${varName}Handle_Release(${varName}Handle handle)
{
    ASSERT(handle != NULL);
    WPEFramework::Core::ProxyType<${jsonDataName}>* var = static_cast<WPEFramework::Core::ProxyType<${jsonDataName}>*>(handle);
    var->Release();
    if (var->IsValid() != true) {
        delete var;
    }
}
bool ${varName}Handle_IsValid(${varName}Handle handle)
{
    ASSERT(handle != NULL);
    WPEFramework::Core::ProxyType<${jsonDataName}>* var = static_cast<WPEFramework::Core::ProxyType<${jsonDataName}>*>(handle);
    ASSERT(var->IsValid());
    return var->IsValid();
}
`
  return result
}

const getPropertyAccessorsImpl = (objName, modulePropertyType, subPropertyType, subPropertyName, accessorPropertyType, json = {}, options = {readonly:false, optional:false}) => {
  let result = ''
  result += `${accessorPropertyType} ${objName}_Get_${subPropertyName}(${objName}Handle handle)
{
    ASSERT(handle != NULL);
    WPEFramework::Core::ProxyType<${modulePropertyType}>* var = static_cast<WPEFramework::Core::ProxyType<${modulePropertyType}>*>(handle);
    ASSERT(var->IsValid());
` + '\n'
  if ((json.type === 'object') && (accessorPropertyType !== 'char*')) {
    result += `    WPEFramework::Core::ProxyType<${subPropertyType}>* element = new WPEFramework::Core::ProxyType<${subPropertyType}>();
    *element = WPEFramework::Core::ProxyType<${subPropertyType}>::Create();
    *(*element) = (*var)->${subPropertyName};
    return (static_cast<${accessorPropertyType}>(element));` + '\n'
  }
  else {
    if ((typeof json.const === 'string') || (json.type === 'string' && !json.enum) || (accessorPropertyType === 'char*')) {
      result += `    return (const_cast<${accessorPropertyType}>((*var)->${subPropertyName}.Value().c_str()));` + '\n'
    }
    else {
      result += `    return (static_cast<${accessorPropertyType}>((*var)->${subPropertyName}.Value()));` + '\n'
    }
  }
  result += `}` + '\n'

  if (!options.readonly) {
    let type = (accessorPropertyType === getFireboltStringType()) ? 'char*' : accessorPropertyType
    result += `void ${objName}_Set_${subPropertyName}(${objName}Handle handle, ${type} value)\n{
    ASSERT(handle != NULL);
    WPEFramework::Core::ProxyType<${modulePropertyType}>* var = static_cast<WPEFramework::Core::ProxyType<${modulePropertyType}>*>(handle);
    ASSERT(var->IsValid());
` + '\n'

    if (json.type === 'object' && (accessorPropertyType !== 'char*')) {
      result += `    WPEFramework::Core::ProxyType<${subPropertyType}>* object = static_cast<WPEFramework::Core::ProxyType<${subPropertyType}>*>(value);
    (*var)->${subPropertyName} = *(*object);` + '\n'
    }
    else {
      result += `    (*var)->${subPropertyName} = value;` + '\n'
    }
    result += `}` + '\n'
  }

  if (options.optional === true) {
    result += `bool ${objName}_Has_${subPropertyName}(${objName}Handle handle)\n{
    ASSERT(handle != NULL);
    WPEFramework::Core::ProxyType<${modulePropertyType}>* var = static_cast<WPEFramework::Core::ProxyType<${modulePropertyType}>*>(handle);
    ASSERT(var->IsValid());

    return ((*var)->${subPropertyName}.IsSet());
}` + '\n'
    result += `void ${objName}_Clear_${subPropertyName}(${objName}Handle handle)\n{
    ASSERT(handle != NULL);
    WPEFramework::Core::ProxyType<${modulePropertyType}>* var = static_cast<WPEFramework::Core::ProxyType<${modulePropertyType}>*>(handle);
    ASSERT(var->IsValid());
    ((*var)->${subPropertyName}.Clear());
}` + '\n'
  }

  return result
}
const getArrayAccessorsImpl = (objName, modulePropertyType, objHandleType, subPropertyType, subPropertyName, accessorPropertyType, json = {}) => {

  let propertyName
  if (subPropertyName) {
     propertyName = '(*var)->' + `${subPropertyName}`
     objName = objName + '_' + subPropertyName
  }
  else {
     propertyName = '(*(*var))'
  }

  let result = `uint32_t ${objName}Array_Size(${objHandleType} handle) {
    ASSERT(handle != NULL);
    WPEFramework::Core::ProxyType<${modulePropertyType}>* var = static_cast<WPEFramework::Core::ProxyType<${modulePropertyType}>*>(handle);
    ASSERT(var->IsValid());

    return (${propertyName}.Length());
}` + '\n'

  result += `${accessorPropertyType} ${objName}Array_Get(${objHandleType} handle, uint32_t index)
{
    ASSERT(handle != NULL);
    WPEFramework::Core::ProxyType<${modulePropertyType}>* var = static_cast<WPEFramework::Core::ProxyType<${modulePropertyType}>*>(handle);
    ASSERT(var->IsValid());` + '\n'

  if ((json.type === 'object') || (json.type === 'array')) {
    result += `WPEFramework::Core::ProxyType<${subPropertyType}>* object = new WPEFramework::Core::ProxyType<${subPropertyType}>();
    *object = WPEFramework::Core::ProxyType<${subPropertyType}>::Create();
    *(*object) = ${propertyName}.Get(index);

    return (static_cast<${accessorPropertyType}>(object));` + '\n'
  }
  else {
    if ((typeof json.const === 'string') || (json.type === 'string' && !json.enum)) {
      result += `    return (const_cast<${accessorPropertyType}>(${propertyName}.Get(index).Value().c_str()));` + '\n'
    }
    else {
      result += `    return (static_cast<${accessorPropertyType}>(${propertyName}.Get(index)));` + '\n'
    }
  }
  result += `}` + '\n'

  let type = (accessorPropertyType === getFireboltStringType()) ? 'char*' : accessorPropertyType
  result += `void ${objName}Array_Add(${objHandleType} handle, ${type} value)
{
    ASSERT(handle != NULL);
    WPEFramework::Core::ProxyType<${modulePropertyType}>* var = static_cast<WPEFramework::Core::ProxyType<${modulePropertyType}>*>(handle);
    ASSERT(var->IsValid());` + '\n'

  if ((json.type === 'object') || (json.type === 'array')) {
   result += `    ${subPropertyType}& element = *(*(static_cast<WPEFramework::Core::ProxyType<${subPropertyType}>*>(value)));` + '\n'
  }
  else {
    result += `    ${subPropertyType} element(value);` + '\n'
  }
  result += `
    ${propertyName}.Add(element);
}` + '\n'

  result += `void ${objName}Array_Clear(${objHandleType} handle)
{
    ASSERT(handle != NULL);
    WPEFramework::Core::ProxyType<${modulePropertyType}>* var = static_cast<WPEFramework::Core::ProxyType<${modulePropertyType}>*>(handle);
    ASSERT(var->IsValid());

    ${propertyName}.Clear();
}` + '\n'

  return result
}

const getMapAccessorsImpl = (objName, containerType, subPropertyType, accessorPropertyType, json = {}, options = {readonly:false, optional:false}) => {
  let result = `uint32_t ${objName}_KeysCount(${objName}Handle handle)
{
    ASSERT(handle != NULL);
    WPEFramework::Core::ProxyType<${containerType}>* var = static_cast<WPEFramework::Core::ProxyType<${containerType}>*>(handle);
    ASSERT(var->IsValid());
    ${containerType}::Iterator elements = (*var)->Variants();
    uint32_t count = 0;
    while (elements.Next()) {
        count++;
    }
    return (count);
}`  + '\n'
  result += `void ${objName}_AddKey(${objName}Handle handle, char* key, ${accessorPropertyType} value)
{
    ASSERT(handle != NULL);
    WPEFramework::Core::ProxyType<${containerType}>* var = static_cast<WPEFramework::Core::ProxyType<${containerType}>*>(handle);
    ASSERT(var->IsValid());
` + '\n'
    let elementContainer = subPropertyType
    if (containerType.includes('VariantContainer')) {
      elementContainer = 'WPEFramework::Core::JSON::Variant'
    }
    if ((json.type === 'object') || (json.type === 'array' && json.items)) {
      if (containerType.includes('VariantContainer')) {
        result += `    ${subPropertyType}& container = *(*(static_cast<WPEFramework::Core::ProxyType<${subPropertyType}>*>(value)));` + '\n'
        result += `    string containerStr;` + '\n'
        result += `    element.ToString(containerStr);` + '\n'
        result += `    WPEFramework::Core::JSON::VariantContainer containerVariant(containerStr);` + '\n'
        result += `    WPEFramework::Core::JSON::Variant element = containerVariant;` + '\n'
      }
      else {
        result += `    ${subPropertyType}& element = *(*(static_cast<WPEFramework::Core::ProxyType<${subPropertyType}>*>(value)));` + '\n'
      }
    } else {
      result += `    ${elementContainer} element(value);` + '\n'
    }
    result += `    (*var)->Set(const_cast<const char*>(key), element);
}` + '\n'

  result += `void ${objName}_RemoveKey(${objName}Handle handle, char* key)
{
    ASSERT(handle != NULL);
    WPEFramework::Core::ProxyType<${containerType}>* var = static_cast<WPEFramework::Core::ProxyType<${containerType}>*>(handle);
    ASSERT(var->IsValid());

    (*var)->Remove(key);
}` + '\n'

    result += `${accessorPropertyType} ${objName}_FindKey(${objName}Handle handle, char* key)
{
    ASSERT(handle != NULL);
    WPEFramework::Core::ProxyType<${containerType}>* var = static_cast<WPEFramework::Core::ProxyType<${containerType}>*>(handle);
    ASSERT(var->IsValid());` + '\n'
    if ((json.type === 'object') || (json.type === 'array') ||
        ((json.type === 'string' || (typeof json.const === 'string')) && !json.enum)) {
        result += `    ${accessorPropertyType} status = nullptr;` + '\n'
    }
    else if (json.type === 'boolean') {
        result += `    ${accessorPropertyType} status = false;` + '\n'
    }
    else {
        result += `    ${accessorPropertyType} status = 0;` + '\n'
    }

    result += `
    if ((*var)->HasLabel(key) == true) {`
    if (json.type === 'object') {
      result += `
        string objectStr;
        (*var)->Get(key).Object().ToString(objectStr);
	       ${subPropertyType} objectMap;
        objectMap.FromString(objectStr);

        WPEFramework::Core::ProxyType<${subPropertyType}>* element = new WPEFramework::Core::ProxyType<${subPropertyType}>();
        *element = WPEFramework::Core::ProxyType<${subPropertyType}>::Create();
        *(*element) = objectMap;

        status = (static_cast<${accessorPropertyType}>(element));` + '\n'
    }
    else if (json.type === 'array' && json.items) {
      result += `
        WPEFramework::Core::ProxyType<${subPropertyType}>* element = new WPEFramework::Core::ProxyType<${subPropertyType}>();
        *element = WPEFramework::Core::ProxyType<${subPropertyType}>::Create();
        *(*element) = (*var)->Get(key).Array();
        status = (static_cast<${accessorPropertyType}>(element));` + '\n'
    }
    else {
      if (json.type === 'string' || (typeof json.const === 'string')) {
        if (json.enum) {
          result += `
        status = (const_cast<${accessorPropertyType}>((*var)->Get(key).));` + '\n'
        }
        else {
          result += `
        status = (const_cast<${accessorPropertyType}>((*var)->Get(key).String().c_str()));` + '\n'
        }
      }
      else if (json.type === 'boolean') {
        result += `
        status = (static_cast<${accessorPropertyType}>((*var)->Get(key).Boolean()));` + '\n'
	            }
      else if (json.type === 'number') {
        result += `
        status = (static_cast<${accessorPropertyType}>((*var)->Get(key).Float()));` + '\n'
      }
      else if (json.type === 'integer') {
        result += `
        status = (static_cast<${accessorPropertyType}>((*var)->Get(key).Number()));` + '\n'
      }
    }
  result += `    }
    return status;
}`

  return result
}

/*
paramList = [{name='', nativeType='', jsonType='', required=boolean}]
*/
function getPropertyParams(paramList) {
  let impl = `    JsonObject jsonParameters;\n`
  paramList.forEach(param => {
    impl += `\n`
    const jsonType = paramList.jsonType
    if (jsonType.length) {
      if (param.required) {
        if (param.nativeType.includes('FireboltTypes_StringHandle')) {
          impl += `${indents}    WPEFramework::Core::JSON::Variant ${capitalize(param.name)} = *(static_cast<${jsonType}*>(${param.name}));\n`
        }
        else {
          impl += `${indents}    WPEFramework::Core::JSON::Variant ${capitalize(param.name)} = ${param.name};\n`
        }
        impl += `${indents}    jsonParameters.Set(_T("${param.name}"), ${capitalize(param.name)});\n`
      }
      else {
        impl += `${indents}    if (${param.name} != nullptr) {\n`
        if (param.nativeType.includes('char*')) {
          impl += `${indents}        WPEFramework::Core::JSON::Variant ${capitalize(param.name)} = ${param.name};\n`
        } else {

          impl += `${indents}        WPEFramework::Core::JSON::Variant ${capitalize(param.name)} = *(${param.name});\n`
        }
        impl += `${indents}        jsonParameters.Set(_T("${param.name}"), ${capitalize(param.name)});\n`
        impl += `${indents}    }\n`
      }
    }
  })

  return impl
}

/*
paramList = [{name='', nativeType='', jsonType='', required=boolean}]
*/

function getPropertyGetterImpl(property, module, propType, container, paramList = []) {
    
  let methodName = getModuleName(module).toLowerCase() + '.' + property.name
  let impl = ''

  let signature = getPropertyGetterSignature(property, module, propType)
  //impl += `${description(property.name, property.summary)}\n`
  impl += `${signature}\n{\n`
  impl += `    const string method = _T("${methodName}");` + '\n'

  if (container.length) {
    impl += `    ${container} jsonResult;\n`
  }
  if (paramList.length > 0) {
    impl += getPropertyParams(paramList)
    impl += `\n    uint32_t status = ${getSdkNameSpace()}::Properties::Get(method, jsonParameters, jsonResult);`
  } else {
    impl += `\n    uint32_t status = ${getSdkNameSpace()}::Properties::Get(method, jsonResult);`
  }

  impl += `\n    if (status == FireboltSDKErrorNone) {\n`
  if (container.length) {
    impl += `        if (${property.result.name || property.name} != nullptr) {\n`

    if (((propType === 'char*') || (propType === 'FireboltTypes_StringHandle'))) {
      impl += `            ${container}* strResult = new ${container}(jsonResult);` + '\n'
      impl += `            *${property.result.name || property.name} = static_cast<${getFireboltStringType()}>(strResult);` + '\n'
    } else if (propType.includes('Handle')) {
      impl += `            WPEFramework::Core::ProxyType<${container}>* resultPtr = new WPEFramework::Core::ProxyType<${container}>();\n`
      impl += `            *resultPtr = WPEFramework::Core::ProxyType<${container}>::Create();\n`
      impl += `            *(*resultPtr) = jsonResult;\n`
      impl += `            *${property.result.name || property.name} = static_cast<${propType}>(resultPtr);\n`
    } else {
      impl += `            *${property.result.name || property.name} = jsonResult.Value();\n`
    }
    impl += `        }\n`
  }
  impl += '    }' + '\n'
  impl += '    return status;' + '\n'

  impl += `}`


  return impl
}


export {
    getArrayAccessorsImpl,
    getMapAccessorsImpl,
    getObjectHandleManagementImpl,
    getPropertyAccessorsImpl,
    getPropertyGetterImpl
}
