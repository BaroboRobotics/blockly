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
 * @fileoverview Helper functions for generating Ch for blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Ch');

goog.require('Blockly.Generator');


/**
 * Ch code generator.
 * @type {!Blockly.Generator}
 */
Blockly.Ch = new Blockly.Generator('Ch');

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 * @private
 */
Blockly.Ch.addReservedWords(
    'Blockly,' +  // In case JS is evaled in the current window.
    // https://developer.mozilla.org/en/Ch/Reference/Reserved_Words
    'auto,const,double,float,int,short,struct,unsigned,'+
    'break,continue,else,for,long,signed,switch,void,'+
    'case,default,enum,goto,register,sizeof,typedef,volatile,'+
    'char,do,extern,if,return,static,union,while,'
);
/**
 * Order of operation ENUMs.
 * https://developer.mozilla.org/en/Ch/Reference/Operators/Operator_Precedence
 */
Blockly.Ch.ORDER_ATOMIC = 0;         // 0 "" ...
Blockly.Ch.ORDER_MEMBER = 1;         // . []
Blockly.Ch.ORDER_NEW = 1;            // new
Blockly.Ch.ORDER_FUNCTION_CALL = 2;  // ()
Blockly.Ch.ORDER_INCREMENT = 3;      // ++
Blockly.Ch.ORDER_DECREMENT = 3;      // --
Blockly.Ch.ORDER_LOGICAL_NOT = 4;    // !
Blockly.Ch.ORDER_BITWISE_NOT = 4;    // ~
Blockly.Ch.ORDER_UNARY_PLUS = 4;     // +
Blockly.Ch.ORDER_UNARY_NEGATION = 4; // -
Blockly.Ch.ORDER_TYPEOF = 4;         // typeof
Blockly.Ch.ORDER_VOID = 4;           // void
Blockly.Ch.ORDER_DELETE = 4;         // delete
Blockly.Ch.ORDER_MULTIPLICATION = 5; // *
Blockly.Ch.ORDER_DIVISION = 5;       // /
Blockly.Ch.ORDER_MODULUS = 5;        // %
Blockly.Ch.ORDER_ADDITION = 6;       // +
Blockly.Ch.ORDER_SUBTRACTION = 6;    // -
Blockly.Ch.ORDER_BITWISE_SHIFT = 7;  // << >> >>>
Blockly.Ch.ORDER_RELATIONAL = 8;     // < <= > >=
Blockly.Ch.ORDER_IN = 8;             // in
Blockly.Ch.ORDER_INSTANCEOF = 8;     // instanceof
Blockly.Ch.ORDER_EQUALITY = 9;       // == != === !==
Blockly.Ch.ORDER_BITWISE_AND = 10;   // &
Blockly.Ch.ORDER_BITWISE_XOR = 11;   // ^
Blockly.Ch.ORDER_BITWISE_OR = 12;    // |
Blockly.Ch.ORDER_LOGICAL_AND = 13;   // &&
Blockly.Ch.ORDER_LOGICAL_OR = 14;    // ||
Blockly.Ch.ORDER_CONDITIONAL = 15;   // ?:
Blockly.Ch.ORDER_ASSIGNMENT = 16;    // = += -= *= /= %= <<= >>= ...
Blockly.Ch.ORDER_COMMA = 17;         // ,
Blockly.Ch.ORDER_NONE = 99;          // (...)

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
Blockly.Ch.init = function(workspace) {
  // Create a dictionary of definitions to be printed before the code.
  Blockly.Ch.definitions_ = Object.create(null);
  // Create a dictionary mapping desired function names in definitions_
  // to actual function names (to avoid collisions with user functions).
  Blockly.Ch.functionNames_ = Object.create(null);

  if (!Blockly.Ch.variableDB_) {
    Blockly.Ch.variableDB_ =
        new Blockly.Names(Blockly.Ch.RESERVED_WORDS_);
  } else {
    Blockly.Ch.variableDB_.reset();
  }

  var defvars = [];
  var variables = Blockly.Variables.allVariablesTypes(workspace);
  for (var i = 0; i < variables.length; i++) {
    var outputType = variables[i];
    var type = 'int';
    if (outputType[1] == 'Linkbot') {
      type = 'CLinkbotI';
      defvars[i] = 'double '+Blockly.Ch.variableDB_.getName(outputType[0],
        Blockly.Variables.NAME_TYPE)+'_wheelDiameter = 3.5;\n' + 
        'double '+Blockly.Ch.variableDB_.getName(outputType[0],
        Blockly.Variables.NAME_TYPE)+'_trackWidth = 3.7;\n';
    } else if (outputType[1] == 'Number') {
      type = 'double';
    }
    defvars[i] += type + ' ' + 
        Blockly.Ch.variableDB_.getName(outputType[0],
        Blockly.Variables.NAME_TYPE) + ';';
  }

  Blockly.Ch.definitions_['variables'] = defvars.join('\n');
};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Blockly.Ch.finish = function(code) {
  // Convert the definitions dictionary into a list.
  var definitions = [];
  for (var name in Blockly.Ch.definitions_) {
    definitions.push(Blockly.Ch.definitions_[name]);
  }
  // Clean up temporary data.
  delete Blockly.Ch.definitions_;
  delete Blockly.Ch.functionNames_;
  Blockly.Ch.variableDB_.reset();
  return definitions.join('\n\n') + '\n\n\n' + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.  A trailing semicolon is needed to make this legal.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Blockly.Ch.scrubNakedValue = function(line) {
  return line + ';\n';
};

/**
 * Encode a string as a properly escaped Ch string, complete with
 * quotes.
 * @param {string} string Text to encode.
 * @return {string} Ch string.
 * @private
 */
Blockly.Ch.quote_ = function(string) {
  // TODO: This is a quick hack.  Replace with goog.string.quote
  string = string.replace(/\\/g, '\\\\')
                 .replace(/\n/g, '\\\n')
                 .replace(/'/g, '\\\'');
  return '\'' + string + '\'';
};

/**
 * Common tasks for generating Ch from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Blockly.Block} block The current block.
 * @param {string} code The Ch code created for this block.
 * @return {string} Ch code with comments and subsequent blocks added.
 * @private
 */
Blockly.Ch.scrub_ = function(block, code) {
  var commentCode = '';
  // Only collect comments for blocks that aren't inline.
  if (!block.outputConnection || !block.outputConnection.targetConnection) {
    // Collect comment for this block.
    var comment = block.getCommentText();
    if (comment) {
      commentCode += Blockly.Ch.prefixLines(comment, '// ') + '\n';
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (var x = 0; x < block.inputList.length; x++) {
      if (block.inputList[x].type == Blockly.INPUT_VALUE) {
        var childBlock = block.inputList[x].connection.targetBlock();
        if (childBlock) {
          var comment = Blockly.Ch.allNestedComments(childBlock);
          if (comment) {
            commentCode += Blockly.Ch.prefixLines(comment, '// ');
          }
        }
      }
    }
  }
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = Blockly.Ch.blockToCode(nextBlock);
  return commentCode + code + nextCode;
};
