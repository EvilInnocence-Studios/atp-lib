import { PoserNode } from '../core/poser-node.js';
import { PoserReader } from '../core/poser-reader.js';

export type Cr2IssueSeverity = 'error' | 'warning';

export interface Cr2ValidationIssue {
  code: string;
  severity: Cr2IssueSeverity;
  message: string;
  path?: string;
}

export interface Cr2ValidationResult {
  valid: boolean;
  issues: Cr2ValidationIssue[];
  errors: Cr2ValidationIssue[];
  warnings: Cr2ValidationIssue[];
}

const PROHIBITED_ACTOR_PROPS = ['hasGeom', 'rotateOrder', 'sphere'];
const PROHIBITED_CHANNEL_TYPES = ['scale scaleX', 'scale scaleY', 'scale scaleZ', 'scale xScale', 'scale yScale', 'scale zScale'];

/**
 * Validates a Poser CR2 AST (PoserNode) or raw CR2 text string against Poser CR2 structural,
 * syntactic, and rigging invariants.
 */
export function validateCr2(input: PoserNode | string): Cr2ValidationResult {
  const issues: Cr2ValidationIssue[] = [];

  const addError = (code: string, message: string, path?: string) => {
    issues.push({ code, severity: 'error', message, path });
  };

  const addWarning = (code: string, message: string, path?: string) => {
    issues.push({ code, severity: 'warning', message, path });
  };

  let root: PoserNode;

  if (typeof input === 'string') {
    // Check lexical brace balance on raw text
    let openBraces = 0;
    let closeBraces = 0;
    const lines = input.split(/\r?\n/);
    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (trimmed === '{') openBraces++;
      else if (trimmed === '}') closeBraces++;
    }
    if (openBraces !== closeBraces || openBraces === 0) {
      addError(
        'C1.2_UNBALANCED_BRACES',
        `Unbalanced braces in CR2 string: ${openBraces} opening '{' vs ${closeBraces} closing '}'.`,
        'root'
      );
    }
    root = PoserReader.parseString(input);
  } else {
    root = input;
  }

  if (!root.hasChildrenBlock || root.children.length === 0) {
    addError('C1.2_EMPTY_ROOT', 'Root CR2 node has no children block or is empty.', 'root');
    return buildResult(issues);
  }

  // 1. Check version block (first child)
  const firstChild = root.children[0];
  if (!firstChild || firstChild.name.trim() !== 'version') {
    addError(
      'C2.1_MISSING_VERSION',
      `First child of root must be 'version', found '${firstChild?.name ?? 'none'}'.`,
      'root/version'
    );
  } else {
    const numChild = firstChild.children.find((c) => /^number\s+\S+/.test(c.name.trim()));
    if (!firstChild.hasChildrenBlock || !numChild) {
      addError(
        'C2.1_INVALID_VERSION_NUMBER',
        `The 'version' block must contain a 'number <ver>' property.`,
        'root/version'
      );
    }
  }

  // 2. Analyze Root-Level Two-Pass Structure (figureResFile & actors)
  const figResIndices: number[] = [];
  for (let i = 0; i < root.children.length; i++) {
    const childName = root.children[i].name.trim();
    if (childName.startsWith('figureResFile')) {
      figResIndices.push(i);
      const arg = childName.slice('figureResFile'.length).trim();
      if (!arg.startsWith('"') || !arg.endsWith('"')) {
        addError(
          'C1.4_UNQUOTED_RUNTIME_PATH',
          `figureResFile path must be enclosed in double quotes: '${childName}'.`,
          `root/${childName}`
        );
      }
    } else if (childName.startsWith('morphBinaryFile')) {
      const arg = childName.slice('morphBinaryFile'.length).trim();
      if (!arg.startsWith('"') || !arg.endsWith('"')) {
        addError(
          'C1.4_UNQUOTED_RUNTIME_PATH',
          `morphBinaryFile path must be enclosed in double quotes: '${childName}'.`,
          `root/${childName}`
        );
      }
    }
  }

  if (figResIndices.length < 2) {
    addError(
      'C2.2_MISSING_TWO_PASS_FIGURERESFILE',
      `Valid Poser CR2 files require two 'figureResFile' declarations at root level (Pass 1 before actor stubs, Pass 2 before full actors); found ${figResIndices.length}.`,
      'root'
    );
  } else {
    const pass1Res = root.children[figResIndices[0]].name.trim();
    const pass2Res = root.children[figResIndices[1]].name.trim();
    if (pass1Res !== pass2Res) {
      addError(
        'C2.4_MISMATCHED_FIGURERESFILE',
        `Pass 1 '${pass1Res}' does not match Pass 2 '${pass2Res}'.`,
        'root'
      );
    }
  }

  // Partition actors into Pass 1 (stubs) and Pass 2 (full definitions)
  const pass1Actors: PoserNode[] = [];
  const pass2Actors: PoserNode[] = [];
  const secondFigResIdx = figResIndices.length >= 2 ? figResIndices[1] : -1;

  for (let i = 0; i < root.children.length; i++) {
    const c = root.children[i];
    const trimmed = c.name.trim();
    if (trimmed.startsWith('actor ')) {
      if (secondFigResIdx !== -1 && i < secondFigResIdx) {
        pass1Actors.push(c);
      } else {
        pass2Actors.push(c);
      }
    }
  }

  if (pass1Actors.length === 0) {
    addError(
      'C2.3_MISSING_ACTOR_STUBS',
      'Missing Pass 1 actor geometry stubs before second figureResFile declaration.',
      'root'
    );
  }

  if (pass2Actors.length === 0) {
    addError(
      'C2.5_MISSING_FULL_ACTORS',
      'Missing Pass 2 full actor definitions.',
      'root'
    );
  }

  // Check fileNumber consistency across actors
  const fileNumbers = new Set<string>();
  const extractActorId = (header: string): { boneName: string; fileNum: string | null } => {
    const raw = header.trim().replace(/^actor\s+/, '').trim();
    const colonIdx = raw.lastIndexOf(':');
    if (colonIdx === -1) {
      return { boneName: raw, fileNum: null };
    }
    return {
      boneName: raw.slice(0, colonIdx),
      fileNum: raw.slice(colonIdx + 1),
    };
  };

  // Validate Pass 1 Stubs
  const stubNames: string[] = [];
  for (const stub of pass1Actors) {
    const { boneName, fileNum } = extractActorId(stub.name);
    stubNames.push(stub.name.trim());
    if (!fileNum) {
      addError('C1.3_MISSING_ACTOR_SUFFIX', `Actor stub '${stub.name}' is missing ':<fileNumber>' suffix.`, `root/${stub.name}`);
    } else {
      fileNumbers.add(fileNum);
    }

    // Stubs must only contain storageOffset and geomHandlerGeom (or be empty)
    for (const child of stub.children) {
      const cn = child.name.trim();
      if (!cn.startsWith('storageOffset ') && !cn.startsWith('geomHandlerGeom ')) {
        addError(
          'C3.1_INVALID_STUB_CONTENT',
          `Pass 1 actor stub '${stub.name}' contains non-stub property '${cn}' (only 'storageOffset' and 'geomHandlerGeom' allowed).`,
          `root/${stub.name}/${cn}`
        );
      }
    }
    void boneName;
  }

  // Validate Pass 2 Full Actors
  const fullActorNames: string[] = [];
  const fullActorMap = new Map<string, PoserNode>();
  for (const actor of pass2Actors) {
    const { boneName, fileNum } = extractActorId(actor.name);
    const fullHeader = actor.name.trim();
    const refName = fullHeader.replace(/^actor\s+/, '').trim();
    fullActorNames.push(fullHeader);
    fullActorMap.set(refName, actor);

    if (!fileNum) {
      addError('C1.3_MISSING_ACTOR_SUFFIX', `Actor '${actor.name}' is missing ':<fileNumber>' suffix.`, `root/${actor.name}`);
    } else {
      fileNumbers.add(fileNum);
    }

    const actorPath = `root/${fullHeader}`;

    // Check prohibited properties in Pass 2 actors (storageOffset, geomHandlerGeom, geomCustom, hasGeom, rotateOrder, sphere)
    for (const child of actor.children) {
      const cn = child.name.trim();
      const propKey = cn.split(/\s+/)[0];

      if (propKey === 'geomCustom') {
        addError(
          'C3.3_GEOMCUSTOM_IN_FIGURE_ACTOR',
          `Actor '${fullHeader}' contains 'geomCustom'; figure actors backed by figureResFile must use Pass 1 'geomHandlerGeom' stubs instead.`,
          `${actorPath}/geomCustom`
        );
      }
      if (propKey === 'storageOffset' || propKey === 'geomHandlerGeom') {
        addError(
          'C3.3_STUB_PROPS_IN_FULL_ACTOR',
          `Pass 2 full actor '${fullHeader}' contains Pass 1 stub directive '${propKey}'.`,
          `${actorPath}/${propKey}`
        );
      }
      if (PROHIBITED_ACTOR_PROPS.includes(propKey)) {
        addError(
          'C3.7_PROHIBITED_ACTOR_PROPERTY',
          `Actor '${fullHeader}' contains invalid CR2 actor property '${propKey}'.`,
          `${actorPath}/${propKey}`
        );
      }
    }

    // Check required pre-channel & post-channel properties in Pass 2 actor
    const hasName = actor.children.some((c) => /^name\s+.+/.test(c.name.trim()));
    const hasOnOff = actor.children.some((c) => c.name.trim() === 'on' || c.name.trim() === 'off');
    const hasBend = actor.children.some((c) => /^bend\s+[01]$/.test(c.name.trim()));
    const parentNode = actor.children.find((c) => /^parent\s+\S+/.test(c.name.trim()));
    const channelsNode = actor.children.find((c) => c.name.trim() === 'channels');
    const endPointNode = actor.children.find((c) => /^endPoint\s+/.test(c.name.trim()));
    const originNode = actor.children.find((c) => /^origin\s+/.test(c.name.trim()));
    const orientationNode = actor.children.find((c) => /^orientation\s+/.test(c.name.trim()));

    if (!hasName || !hasOnOff || !hasBend) {
      addError(
        'C3.4_MISSING_ACTOR_HEADER_PROPS',
        `Actor '${fullHeader}' is missing required header attributes ('name', 'on'/'off', 'bend').`,
        actorPath
      );
    }

    if (!parentNode) {
      addError('C3.4_MISSING_PARENT', `Actor '${fullHeader}' is missing 'parent' declaration.`, actorPath);
    } else {
      const parentVal = parentNode.name.trim().replace(/^parent\s+/, '').trim();
      if (boneName === 'BODY') {
        if (parentVal !== 'UNIVERSE') {
          addError(
            'C3.4_INVALID_BODY_PARENT',
            `Root actor '${fullHeader}' must have 'parent UNIVERSE', found 'parent ${parentVal}'.`,
            `${actorPath}/parent`
          );
        }
      } else if (parentVal.startsWith('NONE')) {
        addError(
          'C3.4_INVALID_PARENT_NONE',
          `Actor '${fullHeader}' has invalid parent '${parentVal}'.`,
          `${actorPath}/parent`
        );
      }
    }

    if (!endPointNode || !originNode || !orientationNode) {
      addError(
        'C3.6_MISSING_SPATIAL_VECTORS',
        `Actor '${fullHeader}' is missing 'endPoint', 'origin', or 'orientation'.`,
        actorPath
      );
    }

    const hasDisplayMode = actor.children.some((c) => /^displayMode\s+/.test(c.name.trim()));
    const hasSmoothPolys = actor.children.some((c) => /^smoothPolys\s+/.test(c.name.trim()));
    if (!hasDisplayMode || !hasSmoothPolys) {
      addError(
        'C3.6_MISSING_ACTOR_FOOTER_PROPS',
        `Actor '${fullHeader}' is missing required post-channel rendering attributes (e.g. 'displayMode', 'smoothPolys').`,
        actorPath
      );
    }

    // Validate Channels
    if (!channelsNode || !channelsNode.hasChildrenBlock) {
      addError('C3.5_MISSING_CHANNELS', `Actor '${fullHeader}' is missing 'channels' block.`, actorPath);
    } else {
      validateActorChannels(channelsNode, boneName, actorPath, addError, addWarning);
    }
  }

  // Verify Pass 1 stubs match Pass 2 actors
  if (pass1Actors.length > 0 && pass2Actors.length > 0) {
    if (
      stubNames.length !== fullActorNames.length ||
      !stubNames.every((name, idx) => name === fullActorNames[idx])
    ) {
      addError(
        'C2.5_STUB_ACTOR_MISMATCH',
        `Pass 1 actor stubs (${stubNames.length}) do not match Pass 2 full actors (${fullActorNames.length}) in count or order.`,
        'root'
      );
    }
  }

  if (fileNumbers.size > 1) {
    addError(
      'C1.3_INCONSISTENT_FILE_NUMBERS',
      `Multiple inconsistent actor file numbers found: ${Array.from(fileNumbers).join(', ')}.`,
      'root'
    );
  }

  // 3. Check root-level misplaced materials or invalid doc block
  for (const child of root.children) {
    const cn = child.name.trim();
    if (cn.startsWith('material ')) {
      addError(
        'C5.6_MATERIAL_AT_ROOT',
        `Material '${cn}' is placed at the root level; in CR2 files, all materials must be inside the 'figure' block.`,
        `root/${cn}`
      );
    }
    if (cn === 'doc') {
      const hasAddTree = child.children.some((c) => c.name.trim() === 'addTree');
      if (hasAddTree) {
        addError(
          'C2.7_INVALID_DOC_ADDTREE',
          `Root 'doc' block contains invalid directive 'addTree'.`,
          'root/doc'
        );
      }
    }
  }

  // 4. Validate Figure Block
  const figureNode = root.children.find((c) => c.name.trim() === 'figure');
  if (!figureNode || !figureNode.hasChildrenBlock) {
    addError('C2.6_MISSING_FIGURE', `CR2 file is missing the 'figure' block.`, 'root');
  } else {
    validateFigureBlock(figureNode, fullActorMap, addError, addWarning);
  }

  // 5. Check Footer (setGeomHandlerOffset)
  const lastChild = root.children[root.children.length - 1];
  if (!lastChild || !lastChild.name.trim().startsWith('setGeomHandlerOffset')) {
    addError(
      'C2.7_MISSING_GEOM_HANDLER_OFFSET',
      `CR2 root block should end with 'setGeomHandlerOffset 0 <y> 0', found '${lastChild?.name ?? 'none'}'.`,
      'root'
    );
  }

  return buildResult(issues);
}

function validateActorChannels(
  channelsNode: PoserNode,
  boneName: string,
  actorPath: string,
  addError: (code: string, message: string, path?: string) => void,
  addWarning: (code: string, message: string, path?: string) => void
): void {
  const chPath = `${actorPath}/channels`;
  const children = channelsNode.children;

  // Check groups block
  const groupsNode = children.find((c) => c.name.trim() === 'groups');
  if (!groupsNode || !groupsNode.hasChildrenBlock) {
    addError('C4.4_MISSING_GROUPS', `Channels in '${boneName}' is missing 'groups' block.`, chPath);
  } else if (groupsNode.children.length === 0) {
    addError('C4.4_EMPTY_GROUPS', `The 'groups' block in '${boneName}' is empty (missing 'groupNode Transform' / 'Other').`, `${chPath}/groups`);
  }

  let firstOffsetAIdx = -1;
  let firstRotateIdx = -1;
  let lastRotateIdx = -1;
  let firstOffsetBIdx = -1;
  let hasJointOrTwist = false;

  for (let i = 0; i < children.length; i++) {
    const ch = children[i];
    const chHeader = ch.name.trim();
    if (chHeader === 'groups' || chHeader.startsWith('weightMap')) continue;

    const currentPath = `${chPath}/${chHeader}`;

    // Check prohibited scale channel declarations
    if (PROHIBITED_CHANNEL_TYPES.some((bad) => chHeader === bad || chHeader.startsWith(bad + ' '))) {
      addError(
        'C4.2_INVALID_SCALE_CHANNEL_TYPE',
        `Channel '${chHeader}' in '${boneName}' uses invalid per-axis scale syntax; must be 'scaleX xScale', 'scaleY yScale', 'scaleZ zScale' (or 'propagatingScale*').`,
        currentPath
      );
    }

    const chType = chHeader.split(/\s+/)[0];
    if (chType === 'xOffsetA' || chType === 'yOffsetA' || chType === 'zOffsetA') {
      if (firstOffsetAIdx === -1) firstOffsetAIdx = i;
    } else if (chType === 'rotateX' || chType === 'rotateY' || chType === 'rotateZ') {
      if (firstRotateIdx === -1) firstRotateIdx = i;
      lastRotateIdx = i;
    } else if (chType === 'xOffsetB' || chType === 'yOffsetB' || chType === 'zOffsetB') {
      if (firstOffsetBIdx === -1) firstOffsetBIdx = i;
    } else if (
      chType.startsWith('joint') ||
      chType.startsWith('twist') ||
      chType.startsWith('smoothScale')
    ) {
      hasJointOrTwist = true;
    }

    // Validate keys block inside every channel
    const keysNode = ch.children.find((c) => c.name.trim() === 'keys');
    if (!keysNode) {
      addError('C4.1_MISSING_KEYS', `Channel '${chHeader}' in '${boneName}' is missing 'keys' block.`, currentPath);
    } else if (!keysNode.hasChildrenBlock) {
      addError(
        'C4.1_BARE_KEYS_NODE',
        `Channel '${chHeader}' in '${boneName}' has a bare 'keys' line without '{ static ... k 0 ... }' block.`,
        `${currentPath}/keys`
      );
    }

    // Check interpStyleLocked
    const hasInterp = ch.children.some((c) => /^interpStyleLocked\s+[01]$/.test(c.name.trim()));
    if (!hasInterp) {
      addError(
        'C4.1_MISSING_INTERP_STYLE_LOCKED',
        `Channel '${chHeader}' in '${boneName}' is missing 'interpStyleLocked 0'.`,
        currentPath
      );
    }

    // Check valueOpDeltaAdd if present
    const opIdx = ch.children.findIndex((c) => c.name.trim() === 'valueOpDeltaAdd');
    if (opIdx !== -1) {
      const keysIdx = ch.children.findIndex((c) => c.name.trim() === 'keys');
      if (keysIdx !== -1 && opIdx < keysIdx) {
        addError(
          'C4.3_ERC_BEFORE_KEYS',
          `In channel '${chHeader}' of '${boneName}', 'valueOpDeltaAdd' must appear after 'keys' and 'interpStyleLocked'.`,
          currentPath
        );
      }
      // Check _SELF_ vs Figure (either as sub-nodes of valueOpDeltaAdd or as following sibling lines)
      const opNode = ch.children[opIdx];
      const firstArg =
        opNode.children.length > 0
          ? opNode.children[0].name.trim()
          : ch.children[opIdx + 1]?.name.trim() ?? '';
      if (firstArg === '_SELF_') {
        addWarning(
          'C4.3_ERC_SELF_SYNTAX',
          `Channel '${chHeader}' in '${boneName}' uses '_SELF_' in valueOpDeltaAdd instead of 'Figure'.`,
          currentPath
        );
      }
    }
  }

  // Check OffsetA / Rotate / OffsetB bracketing
  if (firstRotateIdx !== -1) {
    if (firstOffsetAIdx === -1 || firstOffsetBIdx === -1) {
      addError(
        'C4.6_MISSING_OFFSET_CHANNELS',
        `Actor '${boneName}' has rotation channels but is missing '*OffsetA' and/or '*OffsetB' joint origin offset channels.`,
        chPath
      );
    } else if (firstOffsetAIdx > firstRotateIdx || firstOffsetBIdx < lastRotateIdx) {
      addError(
        'C4.6_INVALID_OFFSET_ORDER',
        `In actor '${boneName}', '*OffsetA' channels must precede rotation channels and '*OffsetB' channels must follow rotation channels.`,
        chPath
      );
    }
  }

  // Non-BODY, non-hip bones that have geometry or children should have joint/twist channels
  if (boneName !== 'BODY' && boneName !== 'hip' && !hasJointOrTwist) {
    addError(
      'C4.8_MISSING_JOINT_DEFORMERS',
      `Bone actor '${boneName}' is missing Poser joint deformation channels ('jointX/Y/Z', 'twistX/Y/Z', 'smoothScaleX/Y/Z').`,
      chPath
    );
  }
}

function validateFigureBlock(
  figureNode: PoserNode,
  fullActorMap: Map<string, PoserNode>,
  addError: (code: string, message: string, path?: string) => void,
  addWarning: (code: string, message: string, path?: string) => void
): void {
  const figPath = 'root/figure';
  const children = figureNode.children;

  const hasName = children.some((c) => /^name\s+.+/.test(c.name.trim()));
  const rootNode = children.find((c) => /^root\s+\S+/.test(c.name.trim()));
  const hasDefaultPick = children.some((c) => /^defaultPick\s+\S+/.test(c.name.trim()));
  const hasAllowsBending = children.some((c) => /^allowsBending\s+[01]$/.test(c.name.trim()));

  if (!hasName || !rootNode) {
    addError('C5.1_MISSING_FIGURE_ROOT', `The 'figure' block must declare 'name' and 'root BODY:<id>'.`, figPath);
  }

  if (!hasDefaultPick || !hasAllowsBending) {
    addError(
      'C5.3_MISSING_FIGURE_FLAGS',
      `The 'figure' block is missing required directives ('defaultPick', 'allowsBending').`,
      figPath
    );
  }

  let validAddChildCount = 0;
  let validWeldCount = 0;

  for (let i = 0; i < children.length; i++) {
    const line = children[i].name.trim();

    // Check prohibited single-line addChild / addChildNodes / weldNodes
    if (line.startsWith('addChildNodes ') || /\S+\s+addChild\s+\S+/.test(line)) {
      addError(
        'C5.2_INVALID_ADDCHILD_SYNTAX',
        `Invalid single-line hierarchy syntax '${line}' in 'figure'; Poser requires two-line 'addChild <child>\\n\\t<parent>'.`,
        `${figPath}/${line}`
      );
    } else if (line.startsWith('addChild ')) {
      const childRef = line.replace(/^addChild\s+/, '').trim();
      const nextLine = children[i + 1]?.name.trim() ?? '';
      if (!nextLine || nextLine.startsWith('addChild') || nextLine.startsWith('defaultPick') || nextLine.startsWith('weld')) {
        addError(
          'C5.2_MISSING_ADDCHILD_PARENT_LINE',
          `'addChild ${childRef}' in 'figure' is missing its following '<parentBone>:<id>' line.`,
          `${figPath}/${line}`
        );
      } else {
        validAddChildCount++;
        if (fullActorMap.size > 0 && !fullActorMap.has(childRef)) {
          addWarning('C5.2_UNKNOWN_CHILD_ACTOR', `'addChild' references unknown actor '${childRef}'.`, figPath);
        }
        if (fullActorMap.size > 0 && !fullActorMap.has(nextLine)) {
          addWarning('C5.2_UNKNOWN_PARENT_ACTOR', `'addChild' parent line references unknown actor '${nextLine}'.`, figPath);
        }
        i++; // advance past parent line
      }
    }

    if (line.startsWith('weldNodes ')) {
      addError(
        'C5.4_INVALID_WELD_SYNTAX',
        `Invalid 'weldNodes' syntax '${line}' in 'figure'; Poser requires two-line 'weld <child>\\n\\t<parent>'.`,
        `${figPath}/${line}`
      );
    } else if (line.startsWith('weld ')) {
      const nextLine = children[i + 1]?.name.trim() ?? '';
      if (
        !nextLine ||
        nextLine.startsWith('weld') ||
        nextLine.startsWith('allowsBending') ||
        nextLine.startsWith('material ') ||
        !nextLine.includes(':')
      ) {
        addError(
          'C5.4_MISSING_WELD_PARENT_LINE',
          `'${line}' in 'figure' is missing its following '<parentBone>:<id>' line.`,
          `${figPath}/${line}`
        );
      } else {
        validWeldCount++;
        i++; // advance past parent line
      }
    }

    if (line.startsWith('figureResFile') || line.startsWith('runLoop')) {
      addError(
        'C5.5_PROHIBITED_FIGURE_DIRECTIVE',
        `Directive '${line}' is not valid inside the 'figure' block.`,
        `${figPath}/${line}`
      );
    }
  }

  if (fullActorMap.size > 1 && validAddChildCount === 0) {
    addError('C5.2_NO_VALID_ADDCHILD', `The 'figure' block contains no valid two-line 'addChild' hierarchy links.`, figPath);
  }

  if (fullActorMap.size > 2 && validWeldCount === 0) {
    addError('C5.4_MISSING_WELDS', `The 'figure' block contains no 'weld' statements.`, figPath);
  }

  // Validate materials inside figure
  const materials = children.filter((c) => c.name.trim().startsWith('material '));
  if (materials.length === 0) {
    addError(
      'C5.6_MISSING_MATERIALS_IN_FIGURE',
      `The 'figure' block contains no 'material' blocks (all CR2 materials must reside inside 'figure').`,
      figPath
    );
  } else {
    for (const mat of materials) {
      validateMaterialBlock(mat, `${figPath}/${mat.name.trim()}`, addError);
    }
  }
}

function validateMaterialBlock(
  matNode: PoserNode,
  matPath: string,
  addError: (code: string, message: string, path?: string) => void
): void {
  for (let i = 0; i < matNode.children.length; i++) {
    const line = matNode.children[i].name.trim();
    if (line.startsWith('nsExponent ')) {
      addError(
        'C6.1_LOWERCASE_NSEXPONENT',
        `Material '${matNode.name.trim()}' uses lowercase 'nsExponent'; Poser requires 'NsExponent'.`,
        `${matPath}/nsExponent`
      );
    }
    if (line.startsWith('specularMap ')) {
      addError(
        'C6.2_INVALID_SPECULARMAP_KEYWORD',
        `Material '${matNode.name.trim()}' uses non-existent Poser legacy keyword 'specularMap' (use 'shaderTree' nodeInput 'Highlight_Color').`,
        `${matPath}/specularMap`
      );
    }
    if (
      line.startsWith('textureMap ') ||
      line.startsWith('bumpMap ') ||
      line.startsWith('transparencyMap ') ||
      line.startsWith('reflectionMap ')
    ) {
      const parts = line.split(/\s+/);
      const mapKeyword = parts[0];
      const rest = line.slice(mapKeyword.length).trim();
      if (rest !== 'NO_MAP') {
        if (!rest.startsWith('"')) {
          addError(
            'C1.4_UNQUOTED_MAP_PATH',
            `Map '${mapKeyword}' in '${matNode.name.trim()}' must be quoted or 'NO_MAP': '${line}'.`,
            `${matPath}/${mapKeyword}`
          );
        }
        // Check if '0 0' was placed inline on the same line after closing quote
        const closingQuoteIdx = rest.indexOf('"', 1);
        if (closingQuoteIdx !== -1) {
          const afterQuote = rest.slice(closingQuoteIdx + 1).trim();
          if (afterQuote.length > 0) {
            addError(
              'C6.2_INLINE_MAP_FLAGS',
              `Map '${mapKeyword}' in '${matNode.name.trim()}' places '${afterQuote}' inline on the same line; Poser requires '0 0' on the following line.`,
              `${matPath}/${mapKeyword}`
            );
          }
        }
      }
    }
  }
}

function buildResult(issues: Cr2ValidationIssue[]): Cr2ValidationResult {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings,
  };
}
