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
 * @fileoverview Generating Ch for logic blocks.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

goog.provide('Blockly.Ch.logic');

goog.require('Blockly.Ch');

Blockly.Ch['controls_if'] = function(block) {
  // If/elseif/else condition.
  var n = 0;
  var argument = Blockly.Ch.valueToCode(block, 'IF' + n,
      Blockly.Ch.ORDER_NONE) || 'false';
  var branch = Blockly.Ch.statementToCode(block, 'DO' + n);
  var code = 'if ('+argument+') {\n' + 
             branch + 
             '}\n';
  for (n = 1; n <= block.elseifCount_; n++) {
    argument = Blockly.Ch.valueToCode(block, 'IF' + n,
        Blockly.Ch.ORDER_NONE) || 'false';
    branch = Blockly.Ch.statementToCode(block, 'DO' + n);
    code += ' else if (' + argument + ') {\n' + 
               branch + 
            '}\n';
  }
  if (block.elseCount_) {
    branch = Blockly.Ch.statementToCode(block, 'ELSE');
    code += ' else {\n' + 
               branch + 
            ' }\n';
  }
  return code + '\n';
};

Blockly.Ch['logic_compare'] = function(block) {
  // Comparison operator.
  var OPERATORS = {
    'EQ': '==',
    'NEQ': '!=',
    'LT': '<',
    'LTE': '<=',
    'GT': '>',
    'GTE': '>='
  };
  var operator = OPERATORS[block.getFieldValue('OP')];
  var order = (operator == '==' || operator == '!=') ?
      Blockly.Ch.ORDER_EQUALITY : Blockly.Ch.ORDER_RELATIONAL;
  var argument0 = Blockly.Ch.valueToCode(block, 'A', order) || '0';
  var argument1 = Blockly.Ch.valueToCode(block, 'B', order) || '0';
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Ch['logic_operation'] = function(block) {
  // Operations 'and', 'or'.
  var operator = (block.getFieldValue('OP') == 'AND') ? '&&' : '||';
  var order = (operator == '&&') ? Blockly.Ch.ORDER_LOGICAL_AND :
      Blockly.Ch.ORDER_LOGICAL_OR;
  var argument0 = Blockly.Ch.valueToCode(block, 'A', order);
  var argument1 = Blockly.Ch.valueToCode(block, 'B', order);
  if (!argument0 && !argument1) {
    // If there are no arguments, then the return value is false.
    argument0 = 'false';
    argument1 = 'false';
  } else {
    // Single missing arguments have no effect on the return value.
    var defaultArgument = (operator == '&&') ? 'true' : 'false';
    if (!argument0) {
      argument0 = defaultArgument;
    }
    if (!argument1) {
      argument1 = defaultArgument;
    }
  }
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Ch['logic_negate'] = function(block) {
  // Negation.
  var order = Blockly.Ch.ORDER_LOGICAL_NOT;
  var argument0 = Blockly.Ch.valueToCode(block, 'BOOL', order) ||
      'true';
  var code = '!' + argument0;
  return [code, order];
};

Blockly.Ch['logic_boolean'] = function(block) {
  // Boolean values true and false.
  var code = (block.getFieldValue('BOOL') == 'TRUE') ? 'true' : 'false';
  return [code, Blockly.Ch.ORDER_ATOMIC];
};

Blockly.Ch['logic_null'] = function(block) {
  // Null data type.
  return ['null', Blockly.Ch.ORDER_ATOMIC];
};

Blockly.Ch['logic_ternary'] = function(block) {
  // Ternary operator.
  var value_if = Blockly.Ch.valueToCode(block, 'IF',
      Blockly.Ch.ORDER_CONDITIONAL) || 'false';
  var value_then = Blockly.Ch.valueToCode(block, 'THEN',
      Blockly.Ch.ORDER_CONDITIONAL) || 'null';
  var value_else = Blockly.Ch.valueToCode(block, 'ELSE',
      Blockly.Ch.ORDER_CONDITIONAL) || 'null';
  var code = value_if + ' ? ' + value_then + ' : ' + value_else;
  return [code, Blockly.Ch.ORDER_CONDITIONAL];
};

