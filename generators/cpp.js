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
 * @fileoverview Helper functions for generating Cpp for blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Cpp');

goog.require('Blockly.Generator');


/**
 * Cpp code generator.
 * @type {!Blockly.Generator}
 */
Blockly.Cpp = new Blockly.Generator('Cpp');

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 * @private
 */
Blockly.Cpp.addReservedWords(
    'Blockly,' +  // In case JS is evaled in the current window.
    // https://developer.mozilla.org/en/Cpp/Reference/Reserved_Words
    'auto,const,double,float,int,short,struct,unsigned,'+
    'break,continue,else,for,long,signed,switch,void,'+
    'case,default,enum,goto,register,sizeof,typedef,volatile,'+
    'char,do,extern,if,return,static,union,while,'
);
/**
 * Order of operation ENUMs.
 * https://developer.mozilla.org/en/Cpp/Reference/Operators/Operator_Precedence
 */
Blockly.Cpp.ORDER_ATOMIC = 0;         // 0 "" ...
Blockly.Cpp.ORDER_MEMBER = 1;         // . []
Blockly.Cpp.ORDER_NEW = 1;            // new
Blockly.Cpp.ORDER_FUNCTION_CALL = 2;  // ()
Blockly.Cpp.ORDER_INCREMENT = 3;      // ++
Blockly.Cpp.ORDER_DECREMENT = 3;      // --
Blockly.Cpp.ORDER_LOGICAL_NOT = 4;    // !
Blockly.Cpp.ORDER_BITWISE_NOT = 4;    // ~
Blockly.Cpp.ORDER_UNARY_PLUS = 4;     // +
Blockly.Cpp.ORDER_UNARY_NEGATION = 4; // -
Blockly.Cpp.ORDER_TYPEOF = 4;         // typeof
Blockly.Cpp.ORDER_VOID = 4;           // void
Blockly.Cpp.ORDER_DELETE = 4;         // delete
Blockly.Cpp.ORDER_MULTIPLICATION = 5; // *
Blockly.Cpp.ORDER_DIVISION = 5;       // /
Blockly.Cpp.ORDER_MODULUS = 5;        // %
Blockly.Cpp.ORDER_ADDITION = 6;       // +
Blockly.Cpp.ORDER_SUBTRACTION = 6;    // -
Blockly.Cpp.ORDER_BITWISE_SHIFT = 7;  // << >> >>>
Blockly.Cpp.ORDER_RELATIONAL = 8;     // < <= > >=
Blockly.Cpp.ORDER_IN = 8;             // in
Blockly.Cpp.ORDER_INSTANCEOF = 8;     // instanceof
Blockly.Cpp.ORDER_EQUALITY = 9;       // == != === !==
Blockly.Cpp.ORDER_BITWISE_AND = 10;   // &
Blockly.Cpp.ORDER_BITWISE_XOR = 11;   // ^
Blockly.Cpp.ORDER_BITWISE_OR = 12;    // |
Blockly.Cpp.ORDER_LOGICAL_AND = 13;   // &&
Blockly.Cpp.ORDER_LOGICAL_OR = 14;    // ||
Blockly.Cpp.ORDER_CONDITIONAL = 15;   // ?:
Blockly.Cpp.ORDER_ASSIGNMENT = 16;    // = += -= *= /= %= <<= >>= ...
Blockly.Cpp.ORDER_COMMA = 17;         // ,
Blockly.Cpp.ORDER_NONE = 99;          // (...)

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
Blockly.Cpp.init = function(workspace) {
  // Create a dictionary of definitions to be printed before the code.
  Blockly.Cpp.definitions_ = Object.create(null);
  // Create a dictionary mapping desired function names in definitions_
  // to actual function names (to avoid collisions with user functions).
  Blockly.Cpp.functionNames_ = Object.create(null);

  if (!Blockly.Cpp.variableDB_) {
    Blockly.Cpp.variableDB_ =
        new Blockly.Names(Blockly.Cpp.RESERVED_WORDS_);
  } else {
    Blockly.Cpp.variableDB_.reset();
  }

  var defvars = [];
  var variables = Blockly.Variables.allVariablesTypes(workspace);
  for (var i = 0; i < variables.length; i++) {
    var outputType = variables[i];
    var type = 'int';
    if (outputType[1] == 'Linkbot') {
      type = 'CLinkbot';
      defvars[i] = 'double '+Blockly.Cpp.variableDB_.getName(outputType[0],
        Blockly.Variables.NAME_TYPE)+'_wheelDiameter = 3.5;\n' + 
        'double '+Blockly.Cpp.variableDB_.getName(outputType[0],
        Blockly.Variables.NAME_TYPE)+'_trackWidth = 3.7;\n';
    } else if (outputType[1] == 'Number') {
      type = 'double';
    }
    defvars[i] += type + ' ' + 
        Blockly.Cpp.variableDB_.getName(outputType[0],
        Blockly.Variables.NAME_TYPE) + ';';
  }

  Blockly.Cpp.definitions_['variables'] = defvars.join('\n');
};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Blockly.Cpp.finish = function(code) {
  // Convert the definitions dictionary into a list.
  var definitions = [];
  for (var name in Blockly.Cpp.definitions_) {
    definitions.push(Blockly.Cpp.definitions_[name]);
  }
  console.log('Definitions: ' + definitions);
  // Clean up temporary data.
  delete Blockly.Cpp.definitions_;
  delete Blockly.Cpp.functionNames_;
  Blockly.Cpp.variableDB_.reset();
  return definitions.join('\n\n') + '\n\n\n' + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.  A trailing semicolon is needed to make this legal.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Blockly.Cpp.scrubNakedValue = function(line) {
  return line + ';\n';
};

/**
 * Encode a string as a properly escaped Cpp string, complete with
 * quotes.
 * @param {string} string Text to encode.
 * @return {string} Cpp string.
 * @private
 */
Blockly.Cpp.quote_ = function(string) {
  // TODO: This is a quick hack.  Replace with goog.string.quote
  string = string.replace(/\\/g, '\\\\')
                 .replace(/\n/g, '\\\n')
                 .replace(/'/g, '\\\'');
  return '\'' + string + '\'';
};

/**
 * Common tasks for generating Cpp from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Blockly.Block} block The current block.
 * @param {string} code The Cpp code created for this block.
 * @return {string} Cpp code with comments and subsequent blocks added.
 * @private
 */
Blockly.Cpp.scrub_ = function(block, code) {
  var commentCode = '';
  // Only collect comments for blocks that aren't inline.
  if (!block.outputConnection || !block.outputConnection.targetConnection) {
    // Collect comment for this block.
    var comment = block.getCommentText();
    if (comment) {
      commentCode += Blockly.Cpp.prefixLines(comment, '// ') + '\n';
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (var x = 0; x < block.inputList.length; x++) {
      if (block.inputList[x].type == Blockly.INPUT_VALUE) {
        var childBlock = block.inputList[x].connection.targetBlock();
        if (childBlock) {
          var comment = Blockly.Cpp.allNestedComments(childBlock);
          if (comment) {
            commentCode += Blockly.Cpp.prefixLines(comment, '// ');
          }
        }
      }
    }
  }
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = Blockly.Cpp.blockToCode(nextBlock);
  return commentCode + code + nextCode;
};
