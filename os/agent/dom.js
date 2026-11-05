
/**
 * Lumina Agent DOM Simplifier
 * Extracts a simplified representation of the DOM for the AI Agent.
 */
(() => {
    window.LuminaAgentMap = new Map();

    function isInteractive(element) {
        const tag = element.tagName.toLowerCase();
        const type = element.getAttribute('type');
        const role = element.getAttribute('role');

        if (['a', 'button', 'select', 'textarea'].includes(tag)) return true;
        if (tag === 'input' && type !== 'hidden') return true;
        if (element.onclick || element.onmousedown || element.hasAttribute('onclick')) return true;
        if (role && ['button', 'link', 'checkbox', 'menuitem', 'tab', 'combobox'].includes(role)) return true;

        // Check if cursor is pointer (common for interactive elements)
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.cursor === 'pointer') return true;

        return false;
    }

    function isVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && element.offsetWidth > 0 && element.offsetHeight > 0;
    }

    function getElementLabel(element) {
        return element.innerText || element.getAttribute('aria-label') || element.getAttribute('placeholder') || element.getAttribute('name') || element.getAttribute('title') || '';
    }

    function traverse(node, depth = 0) {
        if (!node || depth > 20) return null; // Avoid infinite loops/too deep
        if (node.nodeType !== Node.ELEMENT_NODE) return null;

        if (!isVisible(node)) return null;

        const interactive = isInteractive(node);
        const label = getElementLabel(node).trim();

        // If not interactive and no text, maybe skip unless children have something
        // But for structure we might keep it.

        let struct = {
            tag: node.tagName.toLowerCase(),
            id: null,
            text: label.substring(0, 50), // Truncate
            children: []
        };

        if (interactive) {
            // Assign a unique ID for the agent to use
            let luminaId = node.getAttribute('data-lumina-id');
            if (!luminaId) {
                luminaId = Math.random().toString(36).substring(2, 7);
                node.setAttribute('data-lumina-id', luminaId);
                // Also outline it for debugging/visualization
                // node.style.outline = '2px solid red'; 
            }
            struct.id = luminaId;
            struct.interactive = true;
            window.LuminaAgentMap.set(luminaId, node);
        }

        for (const child of node.children) {
            const childStruct = traverse(child, depth + 1);
            if (childStruct) {
                struct.children.push(childStruct);
            }
        }

        // Optimization: Collapse non-interactive nodes that just wrap text or single children
        if (!interactive && struct.children.length === 0 && !struct.text) return null;
        if (!interactive && struct.children.length === 1 && !struct.text) return struct.children[0];

        return struct;
    }

    function simplifyDOM() {
        window.LuminaAgentMap.clear();
        return traverse(document.body);
    }

    // Convert to a string format the LLM can digest
    function domToString(node, indent = 0) {
        if (!node) return '';
        const spaces = ' '.repeat(indent);
        let str = '';
        if (node.interactive) {
            str += `${spaces}[${node.id}] <${node.tag}> ${node.text}\n`;
        } else if (node.text) {
            str += `${spaces}<${node.tag}> ${node.text}\n`;
        }

        if (node.children) {
            for (const child of node.children) {
                str += domToString(child, indent + 2);
            }
        }

        return str;
    }

    window.LuminaInspector = {
        getSnapshot: () => {
            const tree = simplifyDOM();
            return domToString(tree);
        }
    };

    console.log("Lumina Agent DOM Inspector Loaded");
})();
