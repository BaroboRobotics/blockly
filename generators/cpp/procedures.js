/**
 * @license
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Cpp for procedure blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Cpp.procedures');

goog.require('Blockly.Cpp');


Blockly.Cpp['procedures_defreturn'] = function(block) {
  // Define a procedure with a return value.
  var funcName = Blockly.Cpp.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var branch = Blockly.Cpp.statementToCode(block, 'STACK');
  if (Blockly.Cpp.STATEMENT_PREFIX) {
    branch = Blockly.Cpp.prefixLines(
        Blockly.Cpp.STATEMENT_PREFIX.replace(/%1/g,
        '\'' + block.id + '\''), Blockly.Cpp.INDENT) + branch;
  }
  if (Blockly.Cpp.INFINITE_LOOP_TRAP) {
    branch = Blockly.Cpp.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + block.id + '\'') + branch;
  }
  var returnValue = Blockly.Cpp.valueToCode(block, 'RETURN',
      Blockly.Cpp.ORDER_NONE) || '';
  if (returnValue) {
    returnValue = 
        '.then( function() { \n' + 
        '   funcResolve('+returnValue+');\n' + 
        '   return Promise.reject("return");\n' + 
        '})\n';
  }
  var args = [];
  for (var x = 0; x < block.arguments_.length; x++) {
    args[x] = Blockly.Cpp.variableDB_.getName(block.arguments_[x],
        Blockly.Variables.NAME_TYPE);
  }
  var code = 'function ' + funcName + '(' + args.join(', ') + ') {\n' +
      '    return new Promise( function(funcResolve, funcReject) {\n' + 
      '        Promise.resolve()\n' + 
      '        '+ branch + returnValue + 
      '        .catch( function(reason) {\n' +
      '            if(reason == "break" || reason == "return") {} \n' +
      '            else {return Promise.reject(reason);}\n' + 
      '        } );\n' +
      '    });\n' + 
      '}\n';
  code = Blockly.Cpp.scrub_(block, code);
  Blockly.Cpp.definitions_[funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Blockly.Cpp['procedures_defnoreturn'] =
    Blockly.Cpp['procedures_defreturn'];

Blockly.Cpp['procedures_callreturn'] = function(block) {
  // Call a procedure with a return value.
  var funcName = Blockly.Cpp.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var x = 0; x < block.arguments_.length; x++) {
    args[x] = Blockly.Cpp.valueToCode(block, 'ARG' + x,
        Blockly.Cpp.ORDER_COMMA) || 'null';
  }
  var code = funcName + '(' + args.join(', ') + ')';
  return [code, Blockly.Cpp.ORDER_FUNCTION_CALL];
};

Blockly.Cpp['procedures_callnoreturn'] = function(block) {
  // Call a procedure with no return value.
  var funcName = Blockly.Cpp.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var x = 0; x < block.arguments_.length; x++) {
    args[x] = Blockly.Cpp.valueToCode(block, 'ARG' + x,
        Blockly.Cpp.ORDER_COMMA) || 'null';
  }
  var code = '.then( function() {\n' + 
             '    return '+funcName+'(' + args.join(', ') + ');\n' +
             '})\n';
  return code;
};

Blockly.Cpp['procedures_ifreturn'] = function(block) {
  // Conditionally return value from a procedure.
  var condition = Blockly.Cpp.valueToCode(block, 'CONDITION',
      Blockly.Cpp.ORDER_NONE) || 'false';
  var code;
  code = '.then( function() { \n' + 
         '    if (' + condition + ') {\n';
  if (block.hasReturnValue_) {
    var value = Blockly.Cpp.valueToCode(block, 'VALUE',
        Blockly.Cpp.ORDER_NONE) || 'null';
    code += '        funcResolve('+value+');\n' + 
            '        return Promise.reject("return");\n';
  } else {
    code += '        return Promise.reject("return");\n';
  }
  code += '    } else {\n' + 
          '        return Promise.resolve();\n' + 
          '    }\n})\n';
  return code;
};
